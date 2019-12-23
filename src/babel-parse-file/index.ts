import path from 'path';
import { parse as babelParse, ParserPlugin } from '@babel/parser';
import chalk from 'chalk';

const typescriptPlugins: ParserPlugin[] = ['typescript'];

export const parse = (filePathOrName: string, contents: string, showWarning = false) => {
  const ext = path.extname(filePathOrName);
  const isTypescript = ext === '.ts' || ext === '.tsx';
  try {
    return babelParse(contents, {
      sourceType: 'module',
      plugins: [
        ...(isTypescript ? typescriptPlugins : []),
        'jsx',
        'asyncGenerators',
        'bigInt',
        'classProperties',
        'classPrivateProperties',
        'classPrivateMethods',
        ['decorators', { decoratorsBeforeExport: true }],
        // not decorators-legacy
        'doExpressions',
        'dynamicImport',
        'exportDefaultFrom',
        'exportNamespaceFrom',
        'functionBind',
        'functionSent',
        'importMeta',
        'logicalAssignment',
        'nullishCoalescingOperator',
        'numericSeparator',
        'objectRestSpread',
        'optionalCatchBinding',
        'optionalChaining',
        ['pipelineOperator', { proposal: 'minimal' }],
        'throwExpressions',
      ],
    });
  } catch (err) {
    if (showWarning) {
      console.error(
        chalk.yellow(
          'Error parsing:',
          path.relative(process.cwd(), filePathOrName),
          '\nIf this is a mistake, raise an issue or open a PR to add the necessary Babel plugin. 😃',
        ),
      );
    }
    throw err;
  }
};
