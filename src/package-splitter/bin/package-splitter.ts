#!/usr/bin/env node
import chalk from 'chalk';
import yargs from 'yargs';

import { Monorepo } from '../monorepo';
import { runCommandInPackages } from '../util/commands';

yargs
  .usage('Usage: $0 <command> [options]')
  .command(
    'prepare',
    'prepare packages for publishing',
    {
      sourceDir: {
        alias: 's',
        default: './src/',
        describe: 'path to the source directory (where the package.json files are)',
      },
      buildDir: {
        alias: 'b',
        default: './build/',
        describe:
          "path to your build tool's output directory, should match the structure of `sourceDir`, can be the same as `sourceDir` if you have no build step",
      },
      outputDir: {
        alias: 'o',
        default: './dist/',
        describe: 'path to output the packages ready for publishing to',
      },
      rootDir: {
        alias: 'r',
        default: process.cwd(),
        describe: 'root directory of the project',
      },
      ignoreGlob: {
        alias: 'i',
        default: ['__*__'],
        describe:
          'gitignore-style glob pattern of files and directories to ignore when collecting files to publish, option can appear multiple times to use multiple globs',
      },
    },
    async ({ rootDir, sourceDir, buildDir, outputDir, ignoreGlob }) => {
      const monorepo = new Monorepo({
        rootDir,
        srcDir: sourceDir,
        buildDir,
        publishDir: outputDir,
        ignoreGlobs: ignoreGlob,
      });
      await monorepo.validateConfig();
      await monorepo.publish();
    },
  )
  .command(
    'run',
    'runs a shell command in all built package directories',
    {
      outputDir: {
        alias: 'o',
        default: './dist/',
        describe: 'path to built packages',
      },
      command: {
        alias: 'c',
        type: 'string',
        demandOption: true,
        describe: 'command to run in each package directory',
      },
      package: {
        alias: 'p',
        type: 'array',
        string: true,
        describe:
          'name of package to run command on (option can be specified multiple times, not specifying runs the command in all packages)',
      },
    },
    async ({ outputDir, command, package: packageNames }) =>
      runCommandInPackages(outputDir, command, packageNames),
  )
  .strict()
  .demandCommand()
  .recommendCommands()
  .help('help')
  .alias('help', 'h')
  .fail((msg, err) => {
    console.error(chalk.red(msg || err));
    process.exit(1);
  })
  .parse();
