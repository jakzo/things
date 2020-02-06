import chalk from 'chalk';
import path from 'path';

import { runCmd } from './cmd';
import { fileExistsWithType, readdirWithStats, readPackageJsonFromDir } from './fs';

export const runCommandInPackages = async (
  outputDir: string,
  command: string,
  packageNames?: string[],
) => {
  const filteredPackages = new Map(packageNames?.map(name => [name, false]));
  const publishDir = path.resolve(outputDir);
  if (!(await fileExistsWithType(publishDir, true))) {
    throw new Error(`Package directory does not exist: ${publishDir}`);
  }

  const packageDirs = await readdirWithStats(publishDir);
  for (const packageDir of packageDirs) {
    if (!packageDir.stats.isDirectory()) continue;
    const packagePath = path.join(publishDir, packageDir.name);
    const packageJson = await readPackageJsonFromDir(packagePath).catch(() => undefined);
    if (!packageJson) continue;
    const name = packageJson.name!;
    if (filteredPackages.size > 0 && !filteredPackages.has(name)) continue;
    console.log(chalk.blueBright(`Running \`${command}\` in package '${name}'`));
    await runCmd({ cmd: command, cwd: packagePath });
    filteredPackages.set(name, true);
  }

  const missedPackages = [...filteredPackages.entries()].filter(([_name, cmdDidRun]) => !cmdDidRun);
  if (missedPackages.length > 0) {
    console.error(
      chalk.yellow(`Packages not found: ${missedPackages.map(([name]) => name).join(', ')}`),
    );
  }
  console.log(chalk.green('Finished running command'));
};
