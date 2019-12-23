import { PackageJson } from 'type-fest';
import pick from 'lodash/pick';
import path from 'path';
import fs from 'mz/fs';
import fse from 'fs-extra';
import snakeCase from 'snake-case';
import chalk from 'chalk';
import requirePackageName from 'require-package-name';
import tempy from 'tempy';

import { Monorepo } from './monorepo';
import { cache, ClassMethodCache } from './util/class-method-cache';
import {
  readPackageJsonFromDir,
  readdirWithStats,
  isJsFile,
  fileExistsWithType,
  doFs,
} from './util/fs';
import { fileWalkerWithIgnore } from './util/file-walker';
import { isBuiltinNodeModule, getImportModifications, findAllImports } from './imports';

export type PackageDependencies = Required<
  Pick<PackageJson, 'dependencies' | 'optionalDependencies' | 'peerDependencies'>
>;

export interface PackageProps {
  /** Monorepo this package belongs to. */
  monorepo: Monorepo;
  /** Path to directory containing package.json relative to the monorepo's `rootDir`. */
  relativePath: string;
}

export interface Package extends PackageProps {}

export class Package {
  _cache: ClassMethodCache<Package> = {};

  constructor(opts: PackageProps) {
    Object.assign(this, opts);

    // Check in case someone tries instantiating a Package directly instead of using
    // `monorepo.getPackageAtPath()`
    if (this.monorepo._cache.getPackageAtPath?.[this.relativePath]) {
      throw new Error(`Monorepo already has package at path: ${this.relativePath}`);
    }
  }

  isRootPackage(): boolean {
    return this.monorepo.rootPackage === this;
  }

  getAbsolutePath(): string {
    return path.join(this.monorepo.rootDir, this.relativePath);
  }

  getPathRelativeToSrc(): string {
    return path.relative(this.monorepo.srcDir, path.join(this.monorepo.rootDir, this.relativePath));
  }

  getBuildPath(): string {
    return this.monorepo.buildDir
      ? path.join(this.monorepo.buildDir, this.getPathRelativeToSrc())
      : this.getAbsolutePath();
  }

  getPublishPath(): string {
    return path.join(this.monorepo.publishDir, this.getPathRelativeToSrc());
  }

  /** Returns the generated name of the package based on the path of the package. */
  getGeneratedName(): string {
    return (
      this.monorepo.getPackageNamePrefix() +
      path
        .relative(this.monorepo.srcDir, path.join(this.monorepo.rootDir, this.relativePath))
        .split(path.sep)
        .join('-')
    );
  }

  /** Returns the name of the package. */
  async getName(): Promise<string> {
    const partialPackageJson = await this.getPartialPackageJson();
    if (partialPackageJson.name) return partialPackageJson.name;
    return this.getGeneratedName();
  }

  /** Returns the full `package.json` based on the package's partial one and parent ones. */
  @cache
  async getFullPackageJson(): Promise<PackageJson> {
    if (this.isRootPackage()) {
      return this.getPartialPackageJson();
    }

    return {
      ...(await this.getPackageJsonWithoutDeps()),
      bin: await this.getBinaries(),
      ...(await this.getDependencies()),
    };
  }

  /**
   * Returns the full `package.json` but with only the partial dependencies and binaries
   * (to avoid parsing every JS file to find all used dependencies and binary files).
   */
  @cache
  async getPackageJsonWithoutDeps(): Promise<PackageJson> {
    if (this.isRootPackage()) {
      return this.getPartialPackageJson();
    }

    const parent = await this.getParent();
    const parentPackageJson = await parent.getPackageJsonWithoutDeps();
    const parentProperties = pick(parentPackageJson, [
      'version',
      'bugs',
      'license',
      'licenses',
      'author',
      'contributors',
      'maintainers',
      'repository',
      'os',
      'cpu',
      'browser',
      'engines',
      // TODO: What are the implications of copying this to modules?
      'resolutions',
    ]);

    const partialPackageJson = await this.getPartialPackageJson();
    const name = this.getGeneratedName();

    // Pay attention to order of properties
    return {
      ...parentProperties,
      name,
      ...partialPackageJson,
    };
  }

  /** Returns the map of binary names to the path of their files. */
  async getBinaries(): Promise<{ [binary: string]: string }> {
    const generatedBinaries = await this.getGeneratedBinaries();
    const partialPackageJson = await this.getPartialPackageJson();
    const name = await this.getName();
    const partialBinaries =
      typeof partialPackageJson.bin === 'string'
        ? { [name]: partialPackageJson.bin }
        : partialPackageJson.bin || {};

    const binaries = {
      ...generatedBinaries,
      ...partialBinaries,
    };
    for (const filePath of Object.values(binaries)) {
      const owner = await this.monorepo.getPackageFileBelongsTo(
        path.resolve(this.getAbsolutePath(), filePath),
      );
      if (owner !== this) throw new Error(`Binary not owned by package: ${filePath}`);
    }
    return binaries;
  }

  /**
   * Returns a generated map of binary names to the path of their files
   * based on the files in the package's `/bin` directory.
   */
  @cache
  async getGeneratedBinaries(): Promise<{ [binary: string]: string }> {
    const binaryDir = path.join(this.getBuildPath(), 'bin');
    if (!(await fileExistsWithType(binaryDir, true))) return {};
    const files = await readdirWithStats(binaryDir);
    return Object.assign(
      {},
      ...files
        .filter(({ name, stats }) => stats.isFile() && isJsFile(name))
        .map(({ name }) => ({
          [snakeCase(path.parse(name).name)]: path.relative(
            this.getBuildPath(),
            path.join(binaryDir, name),
          ),
        })),
    );
  }

  /** Returns the `package.json` dependency properties with the package's dependencies. */
  async getDependencies(): Promise<PackageDependencies> {
    const partialPackageJson = await this.getPartialPackageJson();
    const usedDeps = await this.getUsedDepsWithVersions();
    return {
      dependencies: {
        ...usedDeps.dependencies,
        ...partialPackageJson.dependencies,
      },
      optionalDependencies: {
        ...usedDeps.optionalDependencies,
        ...partialPackageJson.optionalDependencies,
      },
      peerDependencies: {
        ...usedDeps.peerDependencies,
        ...partialPackageJson.peerDependencies,
      },
    };
  }

  /**
   * Returns a `package.json.dependencies` style map where dependencies are found from the package's
   * source files and versions are found from the package's and ancestors' `package.json` files.
   */
  async getUsedDepsWithVersions(): Promise<PackageDependencies> {
    const usedDeps = await this.getUsedDependencies();
    const resolved: PackageDependencies = {
      dependencies: Object.assign(
        {},
        ...(await Promise.all(
          [...usedDeps]
            .filter<Package>((dep): dep is Package => typeof dep !== 'string')
            .map(async dep => {
              const packageJson = await dep.getFullPackageJson();
              return { [await dep.getName()]: packageJson.version || '' };
            }),
        )),
      ),
      optionalDependencies: {},
      peerDependencies: {},
    };

    const remainingDeps = new Set(
      [...usedDeps].filter<string>((dep): dep is string => typeof dep === 'string'),
    );
    let ancestor: Package = this;
    while (ancestor && remainingDeps.size > 0) {
      const packageJson = await ancestor.getPartialPackageJson();
      const deps = Object.entries(resolved)
        .map(([key, resolvedDeps]) => ({
          resolvedDeps,
          packageDeps: packageJson[key],
        }))
        .filter<{ resolvedDeps: PackageJson.Dependency; packageDeps: PackageJson.Dependency }>(
          (
            deps,
          ): deps is {
            resolvedDeps: PackageJson.Dependency;
            packageDeps: PackageJson.Dependency;
          } => !!deps.packageDeps,
        );

      for (const dep of [...remainingDeps]) {
        for (const { resolvedDeps, packageDeps } of deps) {
          if (!packageDeps.hasOwnProperty(dep)) continue;
          resolvedDeps[dep] = packageDeps[dep];
          remainingDeps.delete(dep);
          break;
        }
      }

      if (ancestor === this.monorepo.rootPackage) break;
      ancestor = await ancestor.getParent();
    }
    if (remainingDeps.size > 0) {
      console.error(
        chalk.red('Could not find dependencies in package.json files:', [...remainingDeps]),
      );
      throw new Error();
    }
    return resolved;
  }

  /**
   * Returns a set of dependency names and `Package` objects found from the current package's
   * source files.
   */
  @cache
  async getUsedDependencies(): Promise<Set<string | Package>> {
    const importPathResolver = this.monorepo.getImportPathResolver();
    const depPackages = new Set<string | Package>();

    // TODO: Deduplicate this logic with prepare()
    await fileWalkerWithIgnore<void>({
      dir: this.getBuildPath(),
      rootDir: this.monorepo.rootDir,
      ignoreGlobs: this.monorepo.ignoreGlobs,
      ignoreGitignored: this.monorepo.ignoreGitignored,
      state: undefined,
      onDir: async (_state, dirPath, filenames) => {
        for (const filename of filenames) {
          if (!isJsFile(filename)) continue;

          const dirPathAbsolute = path.join(this.monorepo.rootDir, dirPath);
          const filePath = path.join(dirPathAbsolute, filename);
          const contents = await doFs(fs.readFile)(filePath, 'utf8');
          const imports = findAllImports(filename, contents, importPathResolver);

          for (const { path: importPath } of imports) {
            if (isBuiltinNodeModule(importPath)) continue;

            // TODO: Check if the relative import resolves to node_modules
            const isLocalImport = importPath.startsWith('.') || importPath.startsWith('/');
            if (isLocalImport) {
              const importPathAbsolute = path.join(dirPathAbsolute, importPath);
              const ownerPackage = await this.monorepo.getPackageFileBelongsTo(importPathAbsolute);
              if (ownerPackage === this.monorepo.rootPackage) {
                throw new Error(
                  `Package depends on file outside of any package: ${importPathAbsolute}`,
                );
              }
              if (ownerPackage !== this) {
                depPackages.add(ownerPackage);
              }
            } else {
              const packageName = requirePackageName(importPath);
              depPackages.add(packageName);
            }
          }
        }
      },
    });

    return depPackages;
  }

  /** Returns the `package.json` for the package without any modifications. */
  @cache
  async getPartialPackageJson(): Promise<PackageJson> {
    return readPackageJsonFromDir(this.getAbsolutePath());
  }

  /**
   * Returns the parent package.
   * If there are no parent packages, it returns the root package.
   */
  @cache
  async getParent(): Promise<Package> {
    let parentRelativeSrcDir = this.relativePath;
    while (!parentRelativeSrcDir.startsWith('.')) {
      parentRelativeSrcDir = path.join(parentRelativeSrcDir, '..');
      const parentPackagePath = path.join(this.monorepo.rootDir, parentRelativeSrcDir);
      if (await this.monorepo.dirIsPackage(parentPackagePath)) {
        return this.monorepo.getPackageAtPath(parentRelativeSrcDir);
      }
    }
    return this.monorepo.rootPackage;
  }

  /** Prepares the package for publishing and saves files to the monorepo's `publishDir`. */
  async prepare(): Promise<void> {
    // Copy built files to temporary publish path
    // Also collect imported dependencies at the same time
    const tempDir = tempy.directory();
    const depPackages = new Set<string | Package>();
    const writtenFiles = new Set<string>();
    await fileWalkerWithIgnore({
      rootDir: this.monorepo.rootDir,
      dir: this.getBuildPath(),
      ignoreGlobs: this.monorepo.ignoreGlobs,
      ignoreGitignored: false, // TODO: should this be configurable?
      state: tempDir,
      onDir: async (state, dirPath, filenames) => {
        const publishPath = path.join(state, path.dirname(dirPath));
        const dirPathAbsolute = path.join(this.monorepo.rootDir, dirPath);
        for (const filename of filenames) {
          const fileBuildPath = path.join(dirPathAbsolute, filename);
          const fileDestPath = path.join(publishPath, filename);

          const copyFile = async () => {
            if (
              // Do not overwrite modified source maps with the original
              !writtenFiles.has(fileDestPath)
            ) {
              await doFs(fse.copy)(fileBuildPath, fileDestPath);
            }
          };

          if (isJsFile(filename)) {
            const importReplacer = async (importPath: string) => {
              if (isBuiltinNodeModule(importPath)) return undefined;

              // TODO: Check if the relative import resolves to node_modules
              const isLocalImport = importPath.startsWith('.') || importPath.startsWith('/');
              if (isLocalImport) {
                const importPathAbsolute = path.join(dirPathAbsolute, importPath);
                const ownerPackage = await this.monorepo.getPackageFileBelongsTo(
                  importPathAbsolute,
                );
                if (ownerPackage === this.monorepo.rootPackage) {
                  throw new Error(
                    `Package depends on file outside of any package: ${importPathAbsolute}`,
                  );
                }
                if (ownerPackage !== this) {
                  depPackages.add(ownerPackage);
                  return await ownerPackage.getName();
                }
              } else {
                const packageName = requirePackageName(importPath);
                depPackages.add(packageName);
                return packageName;
              }
              return undefined;
            };

            const contents = await doFs(fs.readFile)(fileBuildPath, 'utf8');
            const imports = findAllImports(
              fileBuildPath,
              contents,
              this.monorepo.getImportPathResolver(),
            );
            const modifiedFiles = await getImportModifications(
              fileBuildPath,
              contents,
              imports,
              importReplacer,
            );

            this._cache.getUsedDependencies = Promise.resolve(depPackages);

            if (modifiedFiles) {
              for (const [relativeFilePath, contents] of Object.entries(modifiedFiles)) {
                const filePath = path.join(publishPath, relativeFilePath);
                writtenFiles.add(filePath);
                await doFs(fs.writeFile)(filePath, contents);
              }
            } else {
              await copyFile();
            }
          } else {
            await copyFile();
          }
        }
        return publishPath;
      },
    });
    await doFs(fse.remove)(this.getPublishPath());
    await doFs(fs.rename)(tempDir, this.getPublishPath());

    // Build and write package.json to publish path
    const packageJson = await this.getFullPackageJson();
    const packageJsonPath = path.join(this.getPublishPath(), 'package.json');
    await doFs(fse.ensureFile)(packageJsonPath);
    await doFs(fs.writeFile)(packageJsonPath, JSON.stringify(packageJson, null, 2));
  }
}
