import path from 'path';

import { Package } from './package';
import { fileWalkerWithIgnore } from './util/file-walker';
import { cache, ClassMethodCache } from './util/class-method-cache';
import { fileExistsWithType } from './util/fs';
import { ImportPathResolver } from './types';

export interface MonorepoProps {
  /** Path to the monorepo root (where the monorepo's `package.json` is). */
  rootDir: string;
  /** Directory containing source files. This is used to find `package.json` files for packages. */
  srcDir: string;
  /**
   * Directory where your files which have already been built are.
   * Relative imports in these files crossing package boundaries will be modified to import
   * from packages.
   *
   * File structure should match the structure in `srcDir` because `package.json` files will be
   * copied from `srcDir` to the equivalent location in `buildDir`.
   *
   * If there is no build process in your app then use `undefined`.
   * This will treat `srcDir` as the `buildDir`.
   */
  buildDir?: string;
  /** Directory to copy package files which are ready for publishing to. */
  publishDir: string;
  /**
   * List of globs matching files and directories to ignore when searching files.
   * Uses gitignore style globs.
   */
  ignoreGlobs: string[];
  /** Ignore files and directories ignored by `.gitignore` files when searching for packages. */
  ignoreGitignored?: boolean;
  /** String to prefix generated package names with. */
  packageNamePrefix?: string;
  /** Custom resolver for import paths. */
  importPathResolver?: ImportPathResolver;
}

export interface Monorepo extends MonorepoProps {}

export class Monorepo {
  _cache: ClassMethodCache<Monorepo> = {};

  /** The package at the root of the monorepo. */
  rootPackage: Package;

  constructor(opts: MonorepoProps) {
    Object.assign(this, opts);

    this.rootDir = path.resolve(this.rootDir);
    this.srcDir = path.resolve(this.rootDir, this.srcDir);
    if (this.buildDir) this.buildDir = path.resolve(this.rootDir, this.buildDir);
    this.publishDir = path.resolve(this.rootDir, this.publishDir);

    this.rootPackage = this.getPackageAtPath('.');
  }

  getPackageNamePrefix(): string {
    return this.packageNamePrefix || '';
  }

  getImportPathResolver(): ImportPathResolver {
    return this.importPathResolver || (importPath => importPath);
  }

  /** Returns the package at the given path relative to the root. */
  @cache
  getPackageAtPath(relativePath: string): Package {
    return new Package({ monorepo: this, relativePath });
  }

  /** Prepares all packages in the monorepo for publishing and saves files to `publishDir`. */
  async prepare(): Promise<void> {
    const packages = await this.getAllPackages();
    await Promise.all(packages.map(async pack => pack.prepare()));
  }

  /** Returns all packages in the monorepo (not including the root package). */
  @cache
  async getAllPackages(): Promise<Package[]> {
    // Clear the cache since we will be refilling it (not adding deleted packages)
    this._cache.getPackageAtPath = {};
    const packagePaths = await this._findPackagePaths();
    for (const packageRelativePath of Object.keys(packagePaths)) {
      // Fill the cache object `this._cache.getPackageAtPath`
      this.getPackageAtPath(packageRelativePath);
    }
    const packages = this._cache.getPackageAtPath;

    // Optimization: Fill the `getParent` cache of packages since we already know them all
    for (const [packageRelativePath, parentPath] of Object.entries(packagePaths)) {
      packages[packageRelativePath]._cache.getParent = Promise.resolve(
        packages[parentPath] || this.rootPackage,
      );
    }
    return Object.values(packages);
  }

  /**
   * Returns a map where keys are package paths and values are paths to parent packages.
   * Returned paths are relative to the root.
   */
  private async _findPackagePaths(): Promise<{ [relativePackagePath: string]: string }> {
    const packagePaths: { [relativePackagePath: string]: string } = {};
    const rootToSrcRelative = path.relative(this.rootDir, this.srcDir);
    await fileWalkerWithIgnore({
      rootDir: this.rootDir,
      dir: rootToSrcRelative,
      /** Path of parent package relative to root. */
      state: '.',
      ignoreGlobs: this.ignoreGlobs,
      ignoreGitignored: this.ignoreGitignored,
      onDir: (state, dirPath, filenames) => {
        const hasPackageJson = filenames.includes('package.json');
        // Update the cache since we've discovered this information
        if (!this._cache.dirIsPackage) this._cache.dirIsPackage = {};
        this._cache.dirIsPackage[path.join(this.rootDir, dirPath)] = Promise.resolve(
          hasPackageJson,
        );
        if (!hasPackageJson || dirPath === state) return state;
        packagePaths[dirPath] = state;
        return dirPath;
      },
    });
    return packagePaths;
  }

  /** Returns the package that a file or folder belongs to. */
  @cache
  async getPackageFileBelongsTo(filePath: string): Promise<Package> {
    if (filePath.length <= this.rootDir.length) return this.rootPackage;

    const relativeFilePath = path.relative(this.rootDir, filePath);

    const isAllPackageDirsKnown = !!this._cache.getAllPackages;
    if (
      !!this._cache.getPackageAtPath?.[relativeFilePath] ||
      (!isAllPackageDirsKnown && (await this.dirIsPackage(filePath)))
    ) {
      return this.getPackageAtPath(relativeFilePath);
    }

    return this.getPackageFileBelongsTo(path.join(filePath, '..'));
  }

  @cache
  async dirIsPackage(dirPath: string): Promise<boolean> {
    return fileExistsWithType(path.join(dirPath, 'package.json'), false);
  }
}
