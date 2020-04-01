import path from 'path';
import fse from 'fs-extra';

import { runCommand } from '..';
import { exec } from '../exec';

jest.mock('../exec', () => ({
  ...require.requireActual('../exec'),
  exec: jest.fn(async () => {}),
}));
const execMock = exec as jest.Mock;

jest.mock('fs-extra', () => ({
  ...require.requireActual('fs-extra'),
  writeFile: jest.fn(async () => {}),
}));
const writeFileMock = fse.writeFile as jest.Mock;

const jsonParseOptional = (str: string) => {
  try {
    return JSON.parse(str);
  } catch {
    return undefined;
  }
};

const assertFileHasLines = (filePath: string, lines: string[]) => {
  expect(writeFileMock).toBeCalledWith(filePath, expect.any(String));

  const fileLines = new Set(
    writeFileMock.mock.calls.find(([callPath]) => callPath === filePath)[1].split('\n'),
  );
  for (const line of lines) {
    expect(fileLines).toContain(line);
  }
};

describe('empty project', () => {
  const emptyProjectDir = path.join(__dirname, '..', '__fixtures__', 'empty-project');

  beforeAll(async () =>
    runCommand({
      dir: emptyProjectDir,
      command: 'lint',
    }),
  );

  it('installs inferred dependencies', () => {
    expect(execMock).toBeCalledWith({
      cmd: 'npm',
      args: ['install', '-D', 'prettier', 'eslint', 'eslint-plugin-prettier'],
      cwd: emptyProjectDir,
    });
  });

  it('runs eslint', () => {
    expect(execMock).toBeCalledWith({
      cmd: 'eslint',
      args: ['--ext', 'js,jsx,ts,tsx', './'],
      cwd: emptyProjectDir,
    });
  });

  it('creates config files', () => {
    const calls = writeFileMock.mock.calls.map(([filePath, contents]) => ({
      path: filePath,
      contents: jsonParseOptional(contents),
    }));
    expect(calls).toContainEqual({
      path: path.join(emptyProjectDir, '.eslintrc.json'),
      contents: {
        extends: ['eslint:recommended', 'plugin:prettier/recommended'],
        rules: {},
      },
    });
    expect(calls).toContainEqual({
      path: path.join(emptyProjectDir, '.prettierrc'),
      contents: {
        printWidth: 100,
        singleQuote: true,
        trailingComma: 'es5',
      },
    });
  });

  it('creates ignore files', () => {
    assertFileHasLines(path.join(emptyProjectDir, '.gitignore'), [
      'node_modules/',
      '/dist/',
      '/.eslintrc.json',
      '/.eslintignore',
    ]);

    assertFileHasLines(path.join(emptyProjectDir, '.eslintignore'), [
      '**/node_modules/**',
      'dist/**',
      '.eslintrc.json',
      '.eslintignore',
    ]);
  });
});
