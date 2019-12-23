import path from 'path';

import { pathsFromTo, fileWalker } from '../file-walker';

const rootDir = path.join(__dirname, '..', '__fixtures__', 'file-walker');
const dir = path.join('a', 'b');

describe('fileWalker', () => {
  it('should walk all files', async () => {
    const onDir = jest.fn((_state, dirPath) => dirPath);
    await fileWalker({
      rootDir,
      dir,
      state: '',
      onDir,
    });
    expect(new Set(onDir.mock.calls)).toEqual(
      new Set([
        ['', 'a/b', []],
        ['a/b', 'a/b/c', ['x.txt']],
        ['a/b', 'a/b/d', ['y.txt']],
        ['a/b/d', 'a/b/d/e', ['.gitignore', 'z.txt']],
      ]),
    );
  });

  it('should not enter directories denied by shouldEnterDir', async () => {
    const onDir = jest.fn((_state, dirPath) => dirPath);
    await fileWalker({
      rootDir,
      dir,
      state: '',
      shouldEnterDir: (_state, dir) => dir !== 'a/b/d',
      onDir,
    });
    expect(new Set(onDir.mock.calls)).toEqual(
      new Set([
        ['', 'a/b', []],
        ['a/b', 'a/b/c', ['x.txt']],
      ]),
    );
  });
});

describe('pathsFromTo', () => {
  it('should return all paths between from and to', () => {
    expect([...pathsFromTo('/a/b', '/a/b/c/d/e')]).toEqual(['/a/b', '/a/b/c', '/a/b/c/d']);
  });
});
