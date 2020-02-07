import { PackageJson } from 'type-fest';

import { Package } from './package';

export type ImportPathResolver = (importPath: string) => string;

export interface PackageInfo {
  pkg: Package;
  packageJson: PackageJson;
  deps: Set<PackageInfo | string>;
  publishDirName: string;
  isFoundInBuildDir: boolean;
  parent?: PackageInfo;
  children: PackageInfo[];
}

export interface PackageMap {
  [pathFromRootToPackage: string]: PackageInfo;
}

export interface PackageTree {
  info: PackageInfo;
  parent?: PackageTree;
  children: PackageTree[];
}

export type PackageTransformer = (packageMap: PackageMap) => Promise<void>;
