import path from 'path';
import fs from 'mz/fs';
import { PackageJson } from 'type-fest';
import pLimit from 'p-limit';

const globalFsLimit = pLimit(4);

/**
 * Limits the number of concurrent file system operations.
 *
 * All FS calls should be wrapped in this.
 */
export const doFs = <F extends (...args: unknown[]) => Promise<unknown>>(fsFunc: F): F =>
  ((...args: Parameters<F>) => globalFsLimit(() => fsFunc(...args))) as any;

export const DEFAULT_IGNORE_GLOBS = ['node_modules', '.git'];

export const JS_EXTENSIONS = new Set(['ts', 'tsx', 'js', 'jsx', 'mjs', 'node']);
export const isJsFile = (filename: string) =>
  JS_EXTENSIONS.has(path.extname(filename).substring(1)) && !filename.endsWith('.d.ts');

export const readPackageJson = async (packageJsonPath: string): Promise<PackageJson> => {
  if (!(await doFs(fs.exists)(packageJsonPath))) {
    throw new Error(`Cannot find: ${packageJsonPath}`);
  }
  const contents = await doFs(fs.readFile)(packageJsonPath, 'utf8');
  try {
    return JSON.parse(contents);
  } catch (err) {
    throw new Error(`Failed to parse ${packageJsonPath}: ${err}`);
  }
};

export const readPackageJsonFromDir = async (dir: string) => {
  const packageJsonPath = path.join(dir, 'package.json');
  return readPackageJson(packageJsonPath);
};

export const readdirWithStats = async (dirPath: string) => {
  const filenames = await doFs(fs.readdir)(dirPath);
  return await Promise.all(
    filenames.map(async filename => {
      const stats = await doFs(fs.stat)(path.join(dirPath, filename));
      return { name: filename, stats };
    }),
  );
};

export const fileExistsWithType = async (filePath: string, isDir: boolean) => {
  try {
    const stats = await doFs(fs.stat)(filePath);
    return stats.isDirectory() === isDir;
  } catch {
    return false;
  }
};

// TODO: pnpm accepts YAML package.json files, other logic will need to prioritize package.json
//       files over package.yaml files...
const packageJsonFilenames = ['package.json'];
export const isFilenamePackageJson = (filename: string) => packageJsonFilenames.includes(filename);
