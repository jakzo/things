import fs from 'mz/fs';
import path from 'path';
import parseGitignore from 'parse-gitignore';
import ignore, { Ignore } from 'ignore';

import { MaybePromise } from '../../util-types';
import { fileExistsWithType, doFs } from './fs';

export interface FileWalkerCommonOpts<S> {
  /**
   * If `ignoreGitignored` is set,
   * all `.gitignore` files between the `rootDir` and `dir` are read.
   */
  rootDir: string;
  /** Must be relative to `rootDir`. */
  dir: string;
  /** State passed to `onDir`. The state returned by `onDir` will be used for child directories. */
  state: S;
  /** `dirPathFromRoot` is relative to the initial `dir`. */
  shouldEnterDir?: (state: S, dirPathFromRoot: string) => boolean;
}

export interface FileWalkerOpts<S> extends FileWalkerCommonOpts<S> {
  /** `dirPathFromRoot` is relative to the initial `dir`. */
  onDir: (state: S, dirPathFromRoot: string, filenames: string[]) => MaybePromise<S>;
}

/**
 * Recursive file walker designed for our use-case of searching for nested package.json files
 * while keeping track of the parent package.
 */
export const fileWalker = async <S>({
  rootDir,
  dir,
  state,
  shouldEnterDir = () => true,
  onDir,
}: FileWalkerOpts<S>) => {
  const resolvedDir = path.join(rootDir, dir);
  const dirItems = await doFs(fs.readdir)(resolvedDir);
  const itemsWithStats = await Promise.all(
    dirItems.map(async name => {
      const itemPath = path.join(resolvedDir, name);
      const stats = await doFs(fs.stat)(itemPath);
      return { name, stats };
    }),
  );
  const filenames = itemsWithStats.filter(({ stats }) => stats.isFile()).map(({ name }) => name);
  const newState = await onDir(state, dir, filenames);
  const dirPaths = itemsWithStats
    .filter(({ stats }) => stats.isDirectory())
    .map(({ name }) => path.join(dir, name));
  await Promise.all(
    dirPaths.map(async dirPathFromRoot => {
      if (!shouldEnterDir(state, dirPathFromRoot)) return;
      await fileWalker({
        rootDir,
        dir: dirPathFromRoot,
        state: newState,
        shouldEnterDir,
        onDir,
      });
    }),
  );
};

export const addGitignored = async (dir: string, initialIgnored = ignore()) => {
  const contents = await doFs(fs.readFile)(path.join(dir, '.gitignore'), 'utf8');
  const rules = parseGitignore(contents);
  return ignore()
    .add(initialIgnored)
    .add(rules);
};

/** Includes `from` but doesn't include `to`. */
export function* pathsFromTo(from: string, to: string) {
  let curPath = from;
  const partsAfter = to
    .substring(from.length)
    .split(path.sep)
    .slice(1);
  for (const part of partsAfter) {
    yield curPath;
    curPath += path.sep + part;
  }
}

export const initGitignored = async (
  rootDir: string,
  targetDir: string,
  initialIgnored = ignore(),
) => {
  let ignored = initialIgnored;
  for (const dir of pathsFromTo(rootDir, targetDir)) {
    const gitignorePath = path.join(dir, '.gitignore');
    if (!(await fileExistsWithType(gitignorePath, false))) continue;
    ignored = await addGitignored(dir, ignored);
  }
  return ignored;
};

export interface FileWalkerWithIgnoreOpts<S> extends FileWalkerCommonOpts<S> {
  /** Glob of files and directories to ignore. */
  ignoreGlobs?: string[];
  /** Ignore files listed in `.gitignore` files. */
  ignoreGitignored?: boolean;
  /** `dirPathFromRoot` is relative to `rootDir`. */
  onDir: (
    state: S,
    dirPathFromRoot: string,
    filenames: string[],
    ignored: Ignore,
  ) => MaybePromise<S>;
}

/** `fileWalker` but accepts a list of globs to ignore. */
export const fileWalkerWithIgnore = async <S>({
  dir,
  state,
  onDir,
  shouldEnterDir = () => true,
  ignoreGlobs = [],
  ignoreGitignored = false,
  rootDir,
}: FileWalkerWithIgnoreOpts<S>) => {
  const initialIgnored =
    ignoreGitignored && rootDir ? await initGitignored(rootDir, path.join(rootDir, dir)) : ignore();
  await fileWalker({
    rootDir,
    dir,
    state: {
      ignored: initialIgnored.add(ignoreGlobs),
      state,
    },
    shouldEnterDir: (state, dirPathFromRoot) =>
      !state.ignored.ignores(dirPathFromRoot) && shouldEnterDir(state.state, dirPathFromRoot),
    async onDir(state, dirPathFromRoot, filenames) {
      const newIgnored =
        ignoreGitignored && filenames.includes('.gitignore')
          ? await addGitignored(path.join(rootDir, dirPathFromRoot), state.ignored)
          : state.ignored;
      return {
        ignored: newIgnored,
        state: await onDir(state.state, dirPathFromRoot, newIgnored.filter(filenames), newIgnored),
      };
    },
  });
};
