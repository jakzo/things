import { Linter } from 'eslint';

import { Tool, ToolDef, ToolCommand, ConfigFileGetter } from '../types';
import { keys } from 'ts-transformer-keys';
import { exec } from '../exec';
import { gitignoreToGlob } from '../glob';

interface EslintConfigSpecialProps {
  explicitConfig?: boolean;
  fileExtensions?: string[];
  filePaths?: string[];
}

/**
 * Partial ESLint config.
 * This will be extended with inferred parser, plugins and rules based on package dependencies.
 *
 * To use this config as-is with extending or modifying, set `explicitConfig: true`.
 */
export interface EslintConfig extends Linter.Config, EslintConfigSpecialProps {}

const eslintConfigSpecialKeys = new Set<string>(keys<EslintConfigSpecialProps>());

const getConfigFiles: ConfigFileGetter<EslintConfig> = (config, gitignoredGlobs) => [
  {
    path: '.eslintrc.json',
    contents: JSON.stringify(
      Object.assign(
        {},
        ...Object.entries(config).map(([key, value]) =>
          eslintConfigSpecialKeys.has(key) ? undefined : { [key]: value },
        ),
      ),
      null,
      2,
    ),
  },
  {
    path: '.eslintignore',
    contents: [
      '# DO NOT MODIFY - this file is generated',
      '',
      ...gitignoreToGlob([...gitignoredGlobs]),
      '',
    ].join('\n'),
  },
];

const getInferredConfig = (config: EslintConfig, dependencies: Set<string>): EslintConfig => {
  if (config.explicitConfig) return config;

  const inferredParser = dependencies.has('typescript') ? '@typescript-eslint/parser' : undefined;
  const finalParser = config.parser || inferredParser;

  const inferredExtends = [
    ...(dependencies.has('typescript')
      ? ['plugin:@typescript-eslint/recommended']
      : ['eslint:recommended']),
    ...(dependencies.has('prettier')
      ? [
          'plugin:prettier/recommended',
          ...(dependencies.has('typescript') ? ['prettier/@typescript-eslint'] : []),
        ]
      : []),
    ...(dependencies.has('react') ? ['plugin:react/recommended'] : []),
  ];
  const finalExtends = [...(config.extends || []), ...inferredExtends];

  const inferredRules = {
    ...(finalExtends.some(value => /^plugin:react\//.test(value)) &&
      finalExtends.some(value => /^plugin:@typescript-eslint\//.test(value)) && {
        'react/prop-types': 'off' as const,
      }),
  };
  const finalRules = { ...inferredRules, ...config.rules };

  return {
    ...config,
    parser: finalParser,
    extends: finalExtends,
    rules: finalRules,
  };
};

const pluginNameToPackageName = (pluginName: string, prefix = 'eslint-plugin') => {
  if (pluginName.startsWith('@')) {
    const idx = pluginName.indexOf('/');
    if (idx === -1) return `${pluginName}/${prefix}`;
    return `${pluginName.substring(0, idx + 1)}${prefix}-${pluginName.substring(idx + 1)}`;
  }
  return `${prefix}-${pluginName}`;
};

const getRequiredDependencies = (config: EslintConfig) => [
  ...new Set([
    'eslint',
    ...(config.parser ? [config.parser] : []),
    ...(config.plugins || []).map(name => pluginNameToPackageName(name)),
    ...(typeof config.extends === 'string' ? [config.extends] : config.extends || [])
      .map(value => {
        const isBuiltin = value.startsWith('eslint:');
        const isPath = ['.', '/', '\\'].includes(value[0]);
        if (isBuiltin || isPath) return undefined;
        const pluginName = value.match(/^plugin:(@[^\/]+(?:\/[^\/]+)?|[^\/]+)\//)?.[1];
        if (pluginName) return pluginNameToPackageName(pluginName);
        const configName = value.match(/^(@[^\/]+(?:\/[^\/]+)?|[^\/]+)/)?.[1];
        if (configName) return pluginNameToPackageName(configName, 'eslint-config');
        return undefined;
      })
      .filter((packageName): packageName is string => !!packageName),
  ]),
];

const eslintCommandLint: ToolCommand<EslintConfig> = async (config, cwd) => {
  const { fileExtensions = ['js', 'jsx', 'ts', 'tsx'], filePaths = ['./'] } = config;
  await exec({ cmd: 'eslint', args: ['--ext', fileExtensions.join(','), ...filePaths], cwd });
};

const eslintDef: ToolDef<EslintConfig> = {
  name: 'eslint',
  commands: {
    default: eslintCommandLint,
  },
};

export const eslint: Tool<EslintConfig> = config => dependencies => {
  const finalConfig = getInferredConfig(config, dependencies);
  return {
    toolDef: eslintDef,
    requiredDependencies: getRequiredDependencies(finalConfig),
    config: finalConfig,
    getConfigFiles,
  };
};
