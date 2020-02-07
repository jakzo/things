// TODO: Make the logic in this file configurable

import semver, { ReleaseType } from 'semver';
import * as git from 'isomorphic-git';
import simpleGit from 'simple-git/promise';
import chalk from 'chalk';
import fs from 'fs';
import path from 'path';

import { PackageMap, PackageInfo } from './types';
import { Monorepo } from './monorepo';
import { getCurrentPackageVersion } from './npm';

interface Commit {
  message: string;
  files: string[];
}

const DEFAULT_VERSION = '0.0.1';

export const getCommits = async () => {};

export const getReleaseTypeFromConventionalCommit = (message: string): ReleaseType =>
  /^release(\([^)]+\))?: MAJOR\b/.test(message)
    ? 'major'
    : /^feat(\([^)]+\))?:/.test(message)
    ? 'minor'
    : 'patch';

const releaseTypeIsGreater = (a: ReleaseType, b: ReleaseType) =>
  semver.gt(semver.inc(DEFAULT_VERSION, a)!, semver.inc(DEFAULT_VERSION, b)!);

export const updatePackageJsonVersionsAndGetPackagesToPublish = async (
  monorepo: Monorepo,
  packageMap: PackageMap,
): Promise<string[]> => {
  // Get commits
  const tags = await git.listTags({ fs, dir: monorepo.rootDir });
  const lastPublishTag = tags.reduce<string | undefined>(
    (last, tag) => (!last || (semver.valid(tag) && semver.gt(tag, last)) ? tag : last),
    undefined,
  );
  // TODO: Add the "log all commits between HEAD and a tag" functionality to isomorphic git
  const logs = await simpleGit(monorepo.rootDir).log({ to: lastPublishTag });
  const commitsSinceLastPublish: Commit[] = await Promise.all(
    logs.all.map(async ({ message, hash }) => ({
      message,
      files: await git.listFiles({ fs, dir: monorepo.rootDir, ref: hash }),
    })),
  );

  // List packages to publish
  const packageReleaseTypes: { [pathFromSrcToPackage: string]: ReleaseType } = {};
  for (const commit of commitsSinceLastPublish) {
    const commitReleaseType = getReleaseTypeFromConventionalCommit(commit.message);
    const affectedPackages = commit.files.reduce((affectedPackages, filePath) => {
      const filePathRelativeToSrc = path.relative(monorepo.getSrcDirFromRoot(), filePath);
      const info = monorepo.getPackageFileBelongsTo(packageMap, filePathRelativeToSrc);
      if (info) affectedPackages.add(info.pkg.getPathRelativeToSrc());
      return affectedPackages;
    }, new Set<string>());
    for (const pathFromSrcToPackage of affectedPackages) {
      const existingReleaseType = packageReleaseTypes[pathFromSrcToPackage];
      if (!existingReleaseType || releaseTypeIsGreater(commitReleaseType, existingReleaseType)) {
        packageReleaseTypes[pathFromSrcToPackage] = commitReleaseType;
        // Also publish packages where a dependency has changed
        let parent: PackageInfo | undefined = packageMap[pathFromSrcToPackage];
        while (parent && parent.pkg !== monorepo.rootPackage) {
          const parentPathRelativeToSrc = parent.pkg.getPathRelativeToSrc();
          if (
            !packageReleaseTypes[parentPathRelativeToSrc] ||
            releaseTypeIsGreater(commitReleaseType, packageReleaseTypes[parentPathRelativeToSrc])
          ) {
            packageReleaseTypes[parentPathRelativeToSrc] = commitReleaseType;
          }
          parent = parent.parent;
        }
      }
    }
  }

  // Bump versions of packages
  for (const [pathFromSrcToPackage, releaseType] of Object.entries(packageReleaseTypes)) {
    const { packageJson } = packageMap[pathFromSrcToPackage];
    const explicitVersion = packageJson.version;
    if (explicitVersion) continue;

    const currentVersion = await getCurrentPackageVersion(packageJson.name!);
    if (!currentVersion) {
      console.warn(chalk.yellow('Current version for package not found:', packageJson.name!));
    }
    const newVersion = currentVersion ? semver.inc(currentVersion, releaseType) : DEFAULT_VERSION;
    if (newVersion) packageJson.version = newVersion;
  }

  return Object.keys(packageReleaseTypes);
};
