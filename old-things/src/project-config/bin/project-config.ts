#!/usr/bin/env node
import chalk from 'chalk';
import yargs from 'yargs';

import { runCommand } from '../command';

yargs
  .usage('Usage: $0 [options] <command> [args...]')
  .command('*', 'runs a config command', {}, async ({ _: [command] }) =>
    runCommand({ dir: process.cwd(), command }),
  )
  .strict()
  .help('help')
  .alias('help', 'h')
  .fail((msg, err) => {
    console.error(chalk.red(msg || err));
    process.exit(1);
  })
  .parse();
