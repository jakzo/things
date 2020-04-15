import path from 'path';
import * as tsNode from 'ts-node';
import chalk from 'chalk';
import { assertType } from 'typescript-is';
import { keys } from 'ts-transformer-keys';
import fse from 'fs-extra';

import {
  ProjectConfig,
  ProjectConfigSpecialProps,
  ProjectConfigInitialized,
  ProjectConfigModule,
  ToolConfigGetter,
  GeneratedConfigFile,
} from './types';
import { PackageJson } from 'type-fest';
import { json } from '../file-utils';
import { exec } from './exec';
import { eslint, prettier } from './tools';

const MAX_DEP_RETRIES = 5;

const defaultConfig: ProjectConfig = {
  gitignored: [
    '/dist/',
    '/coverage/',
    'node_modules/',
    '.cache/',
    '.jest/',
    '*.log',
    '*.tsbuildinfo',
  ],
  format: [prettier({})],
  lint: [eslint({})],
};

const assertTypeProjectConfig = (value: any) => {
  try {
    return assertType<ProjectConfig>(value);
  } catch (err) {
    throw new Error(`Config shape is not correct: ${err.message}`);
  }
};

const assertTypeProjectConfigInitialized = (value: any) => {
  try {
    // TODO: Restore when bugs are fixed
    // return assertType<ProjectConfigInitialized>(value);
    return value as ProjectConfigInitialized;
  } catch (err) {
    throw new Error(`Config shape is not correct: ${err.message}`);
  }
};

export const createConfigFiles = async (dir: string, files: GeneratedConfigFile[]) => {
  for (const { path: filePath, contents } of files) {
    await fse.writeFile(path.resolve(dir, filePath), contents);
  }
};

const getPackageManager = async () => {
  if (await fse.pathExists('yarn.lock')) return 'yarn';
  return 'npm';
};

const addDependencies = async (deps: string[], cwd?: string) => {
  console.log(
    chalk.blue(
      `Installing missing dependencies: ${deps
        .map(dep => chalk.blueBright(dep))
        .join(chalk.white(', '))}`,
    ),
  );
  const packageManager = await getPackageManager();
  if (packageManager === 'npm') {
    await exec({ cmd: 'npm', args: ['install', '-D', ...deps], cwd });
  } else if (packageManager === 'yarn') {
    await exec({ cmd: 'yarn', args: ['add', '-D', ...deps], cwd });
  } else {
    throw new Error(`Unsupported package manager: ${packageManager}`);
  }
};

export const projectConfigSpecialKeys = new Set(keys<ProjectConfigSpecialProps>());
export const isProjectConfigSpecialKey = (key: string): key is keyof ProjectConfigSpecialProps =>
  projectConfigSpecialKeys.has(key as any);

export const isTsNodeRegistered = () => !!process[tsNode.REGISTER_INSTANCE];

export const enableTsRequire = () => {
  if (isTsNodeRegistered()) return;
  tsNode.register();
};

export const readConfigModule = (dir: string, configRequireName: string): ProjectConfigModule => {
  try {
    return require(path.resolve(dir, configRequireName));
  } catch {
    return { default: {} };
  }
};

export const getConfigModulePath = (dir: string, configRequireName: string) => {
  try {
    return path.relative(dir, require.resolve(path.resolve(dir, configRequireName)));
  } catch {
    return undefined;
  }
};

export const readConfig = async (dir: string, configRequireName = 'config') => {
  enableTsRequire();
  const configModulePath = getConfigModulePath(dir, configRequireName);
  const configModule = readConfigModule(dir, configRequireName);
  const unverifiedConfig = await configModule.default;
  const rawConfig = assertTypeProjectConfig(unverifiedConfig);

  const rawConfigWithDefaults = {
    ...defaultConfig,
    ...rawConfig,
  } as ProjectConfig;

  const result = await json
    .readFile(path.join(dir, 'package.json'))
    .catch(() => ({ value: undefined }));
  const packageJson: PackageJson = result.value || {};
  const deps = new Set(
    Object.keys({
      ...packageJson.dependencies,
      ...packageJson.devDependencies,
      ...packageJson.peerDependencies,
      ...packageJson.optionalDependencies,
    }),
  );
  const addedDeps: string[] = [];
  const gitignoreGlobs = new Set(rawConfigWithDefaults.gitignored);

  for (let i = 0; i < MAX_DEP_RETRIES; i++) {
    let isDepsOrGlobsModified = false;
    const configFiles: GeneratedConfigFile[] = [];
    const initializedConfig = Object.assign(
      {},
      ...Object.entries(rawConfigWithDefaults).map(([key, value]) => ({
        [key]: isProjectConfigSpecialKey(key)
          ? (value as string[])
          : (value as ToolConfigGetter<any>[]).map(toolConfigGetter => {
              const toolConfig = toolConfigGetter(deps);
              for (const dep of toolConfig.requiredDependencies) {
                if (!deps.has(dep)) {
                  isDepsOrGlobsModified = true;
                  deps.add(dep);
                  addedDeps.push(dep);
                }
              }
              const toolConfigFiles = toolConfig.getConfigFiles(toolConfig.config, gitignoreGlobs);
              configFiles.push(...toolConfigFiles);
              for (const { path: filePath } of toolConfigFiles) {
                const glob = `/${path.relative(dir, path.resolve(dir, filePath))}`;
                if (!gitignoreGlobs.has(glob)) {
                  isDepsOrGlobsModified = true;
                  gitignoreGlobs.add(glob);
                }
              }
              return toolConfig;
            }),
      })),
    );
    const config = assertTypeProjectConfigInitialized(initializedConfig);
    if (!isDepsOrGlobsModified) {
      configFiles.push({
        path: '.gitignore',
        contents: [
          '# DO NOT MODIFY',
          configModulePath
            ? `# This file is generated based on the file at: ${configModulePath}`
            : '# This file is generated',
          '',
          ...gitignoreGlobs,
          '',
        ].join('\n'),
      });
      await Promise.all([
        createConfigFiles(dir, configFiles),
        addedDeps.length > 0 ? addDependencies(addedDeps, dir) : undefined,
      ]);
      return assertTypeProjectConfigInitialized(config);
    }
  }

  throw new Error('Infinite loop detected while generating tool dependencies');
};

export const readConfigWithLogging = async (dir: string, configRequireName?: string) => {
  try {
    return readConfig(dir, configRequireName);
  } catch (err) {
    console.log(chalk.red(`Error reading config file in ${dir}`));
    throw err;
  }
};

export const getCommands = (config: ProjectConfig | ProjectConfigInitialized) =>
  Object.keys(config).filter(key => !isProjectConfigSpecialKey(key));
