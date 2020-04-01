import Prettier from 'prettier';

import { Tool, ToolDef, ToolCommand, ConfigFileGetter } from '../types';
import { keys } from 'ts-transformer-keys';
import { exec } from '../exec';

interface PrettierConfigSpecialProps {
  explicitConfig?: boolean;
  globPattern?: string;
  fix?: boolean;
}

/**
 * Partial Prettier config.
 *
 * To use this config as-is with extending or modifying, set `explicitConfig: true`.
 */
export interface PrettierConfig
  extends Partial<Prettier.ParserOptions>,
    PrettierConfigSpecialProps {}

const prettierConfigSpecialKeys = new Set<string>(keys<PrettierConfigSpecialProps>());

const getConfigFiles: ConfigFileGetter<PrettierConfig> = (config, gitignoredGlobs) => [
  {
    path: '.prettierrc',
    contents: JSON.stringify(
      Object.assign(
        {},
        ...Object.entries(config).map(([key, value]) =>
          prettierConfigSpecialKeys.has(key) ? undefined : { [key]: value },
        ),
      ),
      null,
      2,
    ),
  },
  {
    path: '.prettierignore',
    contents: ['# DO NOT MODIFY - this file is generated', '', ...gitignoredGlobs, ''].join('\n'),
  },
];

const getInferredConfig = (config: PrettierConfig): PrettierConfig => {
  if (config.explicitConfig) return config;

  return {
    printWidth: 100,
    singleQuote: true,
    trailingComma: 'es5',
    ...config,
  };
};

const prettierCommandFormat: ToolCommand<PrettierConfig> = async (config, cwd) => {
  const { globPattern = '**/*.{ts,tsx,js,jsx,json,md}', fix = false } = config;
  await exec({ cmd: 'prettier', args: ['--check', globPattern, ...(fix ? ['--write'] : [])], cwd });
};

const prettierDef: ToolDef<PrettierConfig> = {
  name: 'prettier',
  commands: {
    default: prettierCommandFormat,
  },
};

export const prettier: Tool<PrettierConfig> = config => () => ({
  toolDef: prettierDef,
  requiredDependencies: ['prettier'],
  config: getInferredConfig(config),
  getConfigFiles,
});
