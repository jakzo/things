import { PackageJson } from 'type-fest';
import pick from 'lodash/pick';
import path from 'path';

import { Monorepo } from './monorepo';
import { readPackageJsonFromDir } from './util/fs';

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
  constructor(opts: PackageProps) {
    Object.assign(this, opts);
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
  getName(partialPackageJson: PackageJson): string {
    if (partialPackageJson.name) return partialPackageJson.name;
    return this.getGeneratedName();
  }

  /**
   * Returns the full `package.json` but with only the partial dependencies and binaries
   * (to avoid parsing every JS file to find all used dependencies and binary files).
   */
  async getPackageJsonWithoutDeps(
    parentPackageJson: PackageJson,
    partialPackageJson: PackageJson,
  ): Promise<PackageJson> {
    const parentProperties = pick(parentPackageJson, [
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
      'type',
      'publishConfig',
      // TODO: What are the implications of copying this to modules?
      'resolutions',
    ]);

    const name = this.getGeneratedName();

    // Pay attention to order of properties
    return {
      ...parentProperties,
      name,
      ...partialPackageJson,
    };
  }

  /** Returns a map of binary names to the path of their files for a package JSON. */
  getBinaryMap(packageJson: PackageJson): { [binary: string]: string } {
    const binaryMap =
      typeof packageJson.bin === 'string'
        ? { [this.getName(packageJson)]: packageJson.bin }
        : packageJson.bin || {};
    return binaryMap;
  }

  /** Returns the `package.json` for the package without any modifications. */
  async getPartialPackageJson(): Promise<PackageJson> {
    return readPackageJsonFromDir(this.getAbsolutePath());
  }
}
