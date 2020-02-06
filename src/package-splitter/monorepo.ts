import path from 'path';
import snakeCase from 'snake-case';
import fse from 'fs-extra';
import tempy from 'tempy';
import requirePackageName from 'require-package-name';

import { Package } from './package';
import { fileWalkerWithIgnore } from './util/file-walker';
import {
  isFilenamePackageJson,
  DEFAULT_IGNORE_GLOBS,
  isJsFile,
  doFs,
  fileExistsWithType,
} from './util/fs';
import { ImportPathResolver, PackageInfo, PackageMap, PackageTree } from './types';
import { getImportModifications, findAllImports, isBuiltinNodeModule } from './imports';
import { PackageJson } from 'type-fest';
import { updatePackageJsonVersionsAndGetPackagesToPublish } from './versioning';
import { publishPackage } from './npm';

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

// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface Monorepo extends MonorepoProps {}

export class Monorepo {
  /** The package at the root of the monorepo. */
  rootPackage: Package;

  constructor(opts: MonorepoProps) {
    Object.assign(this, opts);

    this.rootDir = path.resolve(this.rootDir);
    this.srcDir = path.resolve(this.rootDir, this.srcDir);
    if (this.buildDir) this.buildDir = path.resolve(this.rootDir, this.buildDir);
    this.publishDir = path.resolve(this.rootDir, this.publishDir);

    this.rootPackage = new Package({ monorepo: this, relativePath: '.' });
  }

  async validateConfig(): Promise<void> {
    const results = await Promise.all(
      [
        [this.rootDir, 'Root'],
        [this.srcDir, 'Source'],
        [this.buildDir, 'Build'],
      ].map(async ([dirPath, name]) =>
        (await fileExistsWithType(this.rootDir, true))
          ? undefined
          : `${name} directory does not exist: ${dirPath}`,
      ),
    );
    const errors = results.filter((msg): msg is string => !!msg);
    if (errors.length > 0) throw new Error(errors.join('\n'));
  }

  getPackageNamePrefix(): string {
    return this.packageNamePrefix || '';
  }

  getImportPathResolver(): ImportPathResolver {
    return this.importPathResolver || (importPath => importPath);
  }

  getIgnoreGitignored(): boolean {
    const { ignoreGitignored = true } = this;
    return ignoreGitignored;
  }

  getIgnoreGlobs(): string[] {
    return [...this.ignoreGlobs, ...DEFAULT_IGNORE_GLOBS];
  }

  getBuildDir(): string {
    return this.buildDir || this.srcDir;
  }

  getBuildDirFromRoot(): string {
    return path.relative(this.rootDir, this.getBuildDir());
  }

  getSrcDirFromRoot(): string {
    return path.relative(this.rootDir, this.srcDir);
  }

  /** Prepares all packages in the monorepo for publishing and saves files to `publishDir`, then publishes. */
  async publish(publishPkg = publishPackage): Promise<void> {
    const tempDir = tempy.directory();

    const { packageMap, packageTree } = await this.getAllPackages();

    const [packagePathsToPublish] = await Promise.all([
      updatePackageJsonVersionsAndGetPackagesToPublish(this, packageMap),
      this.copyBuildFiles(packageMap, tempDir),
    ]);

    // Check if any packages were not found in the build directory
    const missingPackages = Object.values(packageMap).filter(pkg => !pkg.isFoundInBuildDir);
    if (missingPackages.length > 0) {
      throw new Error(
        [
          `The following packages were not found in the build directory: ${missingPackages
            .map(pkg => pkg.packageJson.name)
            .join(', ')}`,
          'Check that the `buildDir` parameter is set correctly and that the file structure of `buildDir` matches `sourceDir`.',
        ].join('\n'),
      );
    }

    await this.writePackageJsonFiles(packageTree, {}, tempDir);

    // Move completed temporary directory to the final publish path
    const publishDir = path.resolve(this.publishDir);
    await fse.remove(publishDir);
    await fse.move(tempDir, publishDir);

    console.log(`Built files saved to: ${publishDir}`);

    // Publish packages to npm
    for (const relativePath of packagePathsToPublish) {
      const { pkg } = packageMap[relativePath];
      await publishPkg(path.join(publishDir, pkg.getPathRelativeToSrc()));
    }
  }

  /** Returns all packages in the monorepo (not including the root package). */
  async getAllPackages(): Promise<{ packageMap: PackageMap; packageTree: PackageTree }> {
    const rootPackageInfo: PackageInfo = {
      pkg: this.rootPackage,
      packageJson: await this.rootPackage.getPartialPackageJson(),
      deps: new Set(),
      publishDirName: '',
      isFoundInBuildDir: false,
    };
    const packageMap: PackageMap = {};
    const packageTree: PackageTree = {
      info: rootPackageInfo,
      children: [],
    };
    await fileWalkerWithIgnore({
      rootDir: this.rootDir,
      dir: this.getSrcDirFromRoot(),
      ignoreGlobs: this.getIgnoreGlobs(),
      // `false` to match the `buildDir` traversal
      // TODO: Should this be configurable?
      ignoreGitignored: false,
      // ignoreGitignored: this.getIgnoreGitignored(),
      state: packageTree,
      onDir: async (parent, dirPathFromRoot, filenames) => {
        if (!filenames.some(isFilenamePackageJson)) return parent;

        const pkg = new Package({ monorepo: this, relativePath: dirPathFromRoot });
        const partialPackageJson = await pkg.getPartialPackageJson();
        const packageInfo: PackageInfo = {
          pkg,
          // TODO: Maybe we should save the full package.json files to disk since having too many
          //       or too large ones could cause memory issues...
          packageJson: await pkg.getPackageJsonWithoutDeps(
            parent.info.packageJson,
            partialPackageJson,
          ),
          deps: new Set(),
          publishDirName: pkg
            .getName(partialPackageJson)
            .replace('@', '')
            .replace('/', '__'),
          isFoundInBuildDir: false,
        };
        const packagePathFromSrc = path.relative(
          this.srcDir,
          path.join(this.rootDir, dirPathFromRoot),
        );
        packageMap[packagePathFromSrc] = packageInfo;
        const newPackageTree: PackageTree = {
          info: packageInfo,
          parent,
          children: [],
        };
        parent.children.push(newPackageTree);
        return newPackageTree;
      },
    });
    return { packageMap, packageTree };
  }

  /** Copy build files, modify local imports to other packages and collect dependencies. */
  async copyBuildFiles(packageMap: PackageMap, tempDir: string) {
    const copiedFiles = new Set<string>();
    await fileWalkerWithIgnore<PackageInfo | undefined>({
      rootDir: this.rootDir,
      dir: this.getBuildDirFromRoot(),
      ignoreGlobs: this.getIgnoreGlobs(),
      // Build directories are typically gitignored
      // TODO: Should this be configurable?
      ignoreGitignored: false,
      state: undefined,
      onDir: async (parent, dirPathFromRoot, filenames) => {
        const dirPathAbsolute = path.join(this.rootDir, dirPathFromRoot);
        const dirPathFromSrc = path.relative(this.getBuildDir(), dirPathAbsolute);
        const packageInfo = packageMap.hasOwnProperty(dirPathFromSrc)
          ? packageMap[dirPathFromSrc]
          : parent;

        if (!packageInfo || packageInfo.packageJson.private) return packageInfo;

        packageInfo.isFoundInBuildDir = true;

        const binaryDirAbsolute = path.join(packageInfo.pkg.getBuildPath(), 'bin');
        const generatedBinaries: { [name: string]: string } | undefined =
          dirPathAbsolute === binaryDirAbsolute ? {} : undefined;

        // Copy source maps last since they'll likely be modified and won't need copying
        filenames.sort((a, b) => +a.endsWith('.map') - +b.endsWith('.map'));

        for (const filename of filenames) {
          const filePathAbsolute = path.join(dirPathAbsolute, filename);
          const filePathFromPackage = path.relative(
            packageInfo.pkg.getBuildPath(),
            path.join(dirPathFromRoot, filename),
          );

          const copyFile = async () => {
            if (copiedFiles.has(filePathAbsolute)) return;

            const outputPathAbsolute = path.join(
              tempDir,
              packageInfo.publishDirName,
              filePathFromPackage,
            );
            await doFs(fse.ensureDir)(path.dirname(outputPathAbsolute));
            await doFs(fse.copyFile)(filePathAbsolute, outputPathAbsolute);
            copiedFiles.add(filePathAbsolute);
          };

          // Copy file as-is if we do not need to search it for dependencies
          if (!isJsFile(filename)) {
            await copyFile();
            continue;
          }

          if (generatedBinaries) {
            const binaryName = snakeCase(path.parse(filename).name);
            const pathFromPackageToBinary = path.relative(
              packageInfo.pkg.getBuildPath(),
              path.join(dirPathFromRoot, filename),
            );
            generatedBinaries[binaryName] = pathFromPackageToBinary;
          }

          // Get dependencies from file and get modifications to dependencies in file
          // TODO: Some files may be huge, can we stream these operations?
          const contents = await doFs(fse.readFile)(filePathAbsolute, 'utf8');
          const imports = findAllImports(filePathAbsolute, contents, this.getImportPathResolver());
          const modifiedFiles = await getImportModifications(
            filePathAbsolute,
            contents,
            imports,
            async (importPath: string) => {
              if (isBuiltinNodeModule(importPath)) return undefined;

              // TODO: Check if the relative import resolves to node_modules
              const isLocalImport = importPath.startsWith('.') || importPath.startsWith('/');
              if (isLocalImport) {
                const importPathAbsolute = path.join(this.rootDir, dirPathFromRoot, importPath);
                const importPathFromBuildDir = path.relative(
                  this.getBuildDir(),
                  importPathAbsolute,
                );
                const owner = this.getPackageFileBelongsTo(packageMap, importPathFromBuildDir);
                if (!owner) {
                  throw new Error(
                    `File '${filePathAbsolute}' depends on file outside of any package: ${importPathAbsolute}`,
                  );
                }

                if (owner !== packageInfo) {
                  if (owner.packageJson.private) {
                    throw new Error(
                      `File '${filePathAbsolute}' depends on file from private package: ${owner.packageJson.name}`,
                    );
                  }
                  packageInfo.deps.add(owner);
                  return owner.pkg.getName(owner.packageJson);
                }
              } else {
                const packageName = requirePackageName(importPath);
                packageInfo.deps.add(packageName);
                return packageName;
              }
              return undefined;
            },
          );

          // Copy file as-is if there are no modifications
          if (!modifiedFiles) {
            await copyFile();
            continue;
          }

          // Write modified files
          for (const [modifiedFilePathRelativeToOriginal, contents] of Object.entries(
            modifiedFiles,
          )) {
            const modifiedFileOutputPathAbsolute = path.join(
              tempDir,
              packageInfo.pkg.getPathRelativeToSrc(),
              filePathFromPackage,
              '..',
              modifiedFilePathRelativeToOriginal,
            );
            copiedFiles.add(modifiedFileOutputPathAbsolute);
            await doFs(fse.ensureDir)(path.dirname(modifiedFileOutputPathAbsolute));
            await doFs(fse.writeFile)(modifiedFileOutputPathAbsolute, contents);
          }
        }

        if (generatedBinaries) {
          const explicitBinaries = packageInfo.pkg.getBinaryMap(packageInfo.packageJson);
          packageInfo.packageJson.bin = {
            ...generatedBinaries,
            ...explicitBinaries,
          };
        }

        return packageInfo;
      },
    });
  }

  /** Returns the package a file belongs to. */
  getPackageFileBelongsTo(
    packages: { [relativePath: string]: PackageInfo },
    importPathRelativeToSrcDir: string,
  ): PackageInfo | undefined {
    let importPath = importPathRelativeToSrcDir;
    while (importPath.length > 0) {
      if (packages.hasOwnProperty(importPath)) return packages[importPath];
      const lastDirIdx = importPath.lastIndexOf(path.sep);
      importPath = importPath.substring(0, lastDirIdx === -1 ? 0 : lastDirIdx);
    }
    return undefined;
  }

  /** Adds dependency versions then writes built package.json files to the publish directory. */
  async writePackageJsonFiles(
    treeNode: PackageTree,
    ancestorDepVersions: { [name: string]: string },
    tempDir: string,
  ) {
    const { packageJson, deps } = treeNode.info;

    if (!packageJson.dependencies) packageJson.dependencies = {};

    // In reverse order of priority (for the `Object.assign` below)
    const dependencyFields = [
      packageJson.optionalDependencies,
      packageJson.peerDependencies,
      packageJson.dependencies,
    ].filter((depMap): depMap is PackageJson.Dependency => !!depMap);

    // Add dependencies found from imports to package dependencies
    const existingDeps = Object.assign({}, ...dependencyFields);
    for (const dep of deps) {
      const depName = typeof dep === 'string' ? dep : dep.packageJson.name;
      if (!depName) throw new Error('Dependency package missing name');
      if (!existingDeps.hasOwnProperty(depName)) {
        packageJson.dependencies[depName] =
          typeof dep === 'string' ? (null as any) : dep.packageJson.version;
      }
    }

    for (const depVersionMap of dependencyFields) {
      for (const [name, version] of Object.entries(depVersionMap)) {
        if (typeof version === 'string') continue;

        const foundVersion = ancestorDepVersions[name];
        if (!foundVersion) {
          // TODO: Resolve version from node_modules or package-lock.json
          throw new Error(`Dependency version for ${name} not found in any parent package.json`);
        }

        depVersionMap[name] = foundVersion;
      }
    }

    if (!treeNode.info.pkg.isRootPackage()) {
      const outputPathAbsolute = path.join(tempDir, treeNode.info.publishDirName, 'package.json');
      await doFs(fse.writeJson)(outputPathAbsolute, packageJson, { spaces: 2 });
    }

    const newDepVersions = Object.assign({}, ancestorDepVersions, ...dependencyFields);
    await Promise.all(
      treeNode.children.map(async child =>
        this.writePackageJsonFiles(child, newDepVersions, tempDir),
      ),
    );
  }
}
