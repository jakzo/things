#!/usr/bin/env node
import path from 'path';

import { Monorepo } from '../monorepo';
import chalk from 'chalk';

const main = async () => {
  // TODO
  try {
    const rootDir = path.resolve('.');
    const srcDir = path.resolve('./src');
    const buildDir = path.resolve('./built/src');
    const publishDir = path.resolve('./dist');
    const monorepo = new Monorepo({
      rootDir,
      srcDir,
      buildDir,
      publishDir,
      ignoreGlobs: ['__*__'],
    });
    await monorepo.prepare();
  } catch (err) {
    console.error(chalk.red(String(err)));
    process.exit(1);
  }
};

main();
