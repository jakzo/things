import path from 'path';
import { TraverseOptions } from '@babel/traverse';
import { traverse } from '@babel/core';
import jsesc from 'jsesc';
import { SourceLocation, StringLiteral, Node, TemplateElement } from '@babel/types';
import chalk from 'chalk';
import { resolveSourceMap as resolveSourceMapCb } from 'source-map-resolve';
import { promisify } from 'util';
import fs from 'mz/fs';
import coreModules from 'resolve/lib/core.json';
import { regex as sourceMapRegex } from 'source-map-url';
import { SourceMapConsumer, SourceMapGenerator, MappingItem } from 'source-map';

import { parse } from '../babel-parse-file';
import { ImportPathResolver } from './types';
import { doFs } from './util/fs';

const resolveSourceMap = promisify(resolveSourceMapCb);

type ImportPathNode = StringLiteral | TemplateElement;

/** Represents the path and location of an import string within a file. */
export interface Import {
  start: number;
  end: number;
  loc: SourceLocation;
  path: string;
  quoteChar: string;
}

export interface ImportReplacement {
  originalImport: Import;
  path: string;
  code: string;
}

export type SourceMapUpdate = { filePath: string; contents: string } | { comment: string };

const quoteTypes: { [quoteChar: string]: string } = {
  "'": 'single',
  '"': 'double',
  '`': 'backtick',
};
/** Replaces the source map comment of some file content if specified by `srcMapUpdates`. */
const updateSourceMapComment = (
  contents: string,
  srcMapUpdates: SourceMapUpdate | undefined,
): string =>
  srcMapUpdates && 'comment' in srcMapUpdates
    ? contents.replace(sourceMapRegex, srcMapUpdates.comment)
    : contents;

/**
 * Babel visitors which find all import statements and call `state.onImport(node, importPath)` with
 * found imports and `state.onDynamicDep(node)` when a dynamically generated import path is found.
 */
export const visitors: TraverseOptions<{
  onImport(node: ImportPathNode, importPath: string): void;
  onDynamicDep(node: Node): void;
}> = {
  ImportDeclaration({ node }, { onImport }) {
    onImport(node.source, node.source.value);
  },
  ExportNamedDeclaration({ node }, { onImport }) {
    if (!node.source) return;
    onImport(node.source, node.source.value);
  },
  ExportAllDeclaration({ node }, { onImport }) {
    onImport(node.source, node.source.value);
  },
  CallExpression({ node }, { onImport, onDynamicDep }) {
    const { callee, arguments: args } = node;
    if ((callee.type === 'Identifier' && callee.name === 'require') || callee.type === 'Import') {
      if (args.length === 0) return;

      const [arg] = args;
      if (arg.type === 'StringLiteral') {
        onImport(arg, arg.value);
        return;
      }

      if (
        arg.type === 'TemplateLiteral' &&
        arg.quasis.length === 1 &&
        arg.expressions.length === 0
      ) {
        const el = arg.quasis[0];
        onImport(el, el.value.raw);
        return;
      }

      onDynamicDep(node);
    }
  },
  TSImportEqualsDeclaration({ node }, { onImport }) {
    if (node.moduleReference.type !== 'TSExternalModuleReference') return;
    const { expression } = node.moduleReference;
    onImport(expression, expression.value);
  },
};

/** Returns an object representing updates to make to source maps to reflect import path changes. */
const getSourceMapUpdates = async (
  filePath: string,
  contents: string,
  replacements: ImportReplacement[],
): Promise<SourceMapUpdate | undefined> => {
  try {
    const srcMap = await resolveSourceMap(contents, filePath, async (url, cb) => {
      try {
        const contents = await doFs(fs.readFile)(url, 'utf8');
        cb(undefined, contents);
      } catch (err) {
        cb(err);
      }
    });
    if (!srcMap) return undefined;
    const srcMapConsumer = await new SourceMapConsumer(srcMap.map);
    if (!srcMapConsumer) return undefined;
    const srcMapGenerator = new SourceMapGenerator({
      file: filePath,
      sourceRoot: srcMap.sourcesRelativeTo,
    });

    const state = {
      replacementIdx: 0,
      curLine: 0,
      offsetLine: 0,
      offsetCol: 0,
    };

    const setCurLine = (lineNumberBeforeModifications: number) => {
      const lineNum = lineNumberBeforeModifications + state.offsetLine;
      if (state.curLine === lineNum) return;
      state.curLine = lineNum;
      // Reset column offset if we're on a new line without previous modifications
      state.offsetCol = 0;
    };

    const addMapping = (mapping: MappingItem, line: number, col: number) => {
      srcMapGenerator.addMapping({
        generated: {
          line: line + state.offsetLine,
          column: col + state.offsetCol,
        },
        original: {
          line: mapping.originalLine,
          column: mapping.originalColumn,
        },
        source: mapping.source,
        name: mapping.name,
      });
    };

    srcMapConsumer.eachMapping(mapping => {
      for (; state.replacementIdx < replacements.length; state.replacementIdx++) {
        const {
          originalImport: {
            loc: { start, end },
          },
          code,
        } = replacements[state.replacementIdx];

        // If mapping is before node start
        if (
          start.line > mapping.generatedLine ||
          (start.line === mapping.generatedLine && start.column >= mapping.generatedColumn)
        ) {
          // Update mapping but do not increment replacementIdx
          break;
        }

        setCurLine(start.line);

        // If mapping is inside the node
        if (
          end.line > mapping.generatedLine ||
          (end.line === mapping.generatedLine && mapping.generatedColumn < end.column)
        ) {
          // Add mapping at start of node
          addMapping(mapping, start.line, start.column);
          // Do not re-add mapping and do not increment replacementIdx
          return;
        }

        // If mapping is after end of node
        const nodeNumLines = end.line - start.line;
        const replacementNumLines = 0; // replacement is always a single line string
        const removedLines = replacementNumLines - nodeNumLines;
        state.offsetLine -= removedLines;

        const replacementEndCol = start.column + code.length;
        state.offsetCol += replacementEndCol - end.column;
      }

      // Add mapping with updated position
      setCurLine(mapping.generatedLine);
      addMapping(mapping, mapping.generatedLine, mapping.generatedColumn);
    });

    const updatedSrcMap = srcMapGenerator.toString();
    if (srcMap.url) {
      const srcMapPath = path.resolve(path.dirname(filePath), srcMap.url);
      return { filePath: srcMapPath, contents: updatedSrcMap };
    }

    return {
      comment:
        // Break up comment to avoid being parsed as a source map
        '//#' +
        ` sourceMappingURL=data:application/json;charset=utf-8;base64,${new Buffer(
          updatedSrcMap,
        ).toString('base64')}`,
    };
  } catch {
    // Ignore any problems with source maps
    return undefined;
  }
};

/**
 * Logs a warning message due to an import path being dynamically generated at runtime and
 * therefore not statically known.
 */
export const warnOnDynamicDep = (filePath: string, loc: SourceLocation | null): void => {
  console.error(
    chalk.yellow(
      'Warning: Cannot find dependency due to dynamic require at',
      path.relative(process.cwd(), filePath),
      ...(loc ? ['@', `${loc.start.line}:${loc.start.column}`] : []),
    ),
  );
};

/** Returns a list of imports in the order they appear in the source. */
export const findAllImports = (
  filePath: string,
  contents: string,
  importResolver: ImportPathResolver,
): Import[] => {
  const ast = parse(filePath, contents, true);
  const imports: Import[] = [];
  traverse(ast, visitors, undefined, {
    onImport(node, importPath) {
      // They should have these properties but just in case...
      if (node.start == null || node.end == null || !node.loc) return;
      const resolvedImportPath = importResolver(importPath);
      imports.push({
        start: node.start,
        end: node.end,
        loc: node.loc,
        path: resolvedImportPath,
        quoteChar: contents[node.start],
      });
    },
    onDynamicDep(node) {
      warnOnDynamicDep(filePath, node.loc);
    },
  });
  return (
    imports
      // They should be sorted after traversal but just in case...
      .sort((a, b) => a.start - b.start)
  );
};

/**
 * Finds all imports and returns a map of modified files to save (source files and source maps)
 * based on an `importReplacer` function.
 */
export const getImportModifications = async (
  filePathAbsolute: string,
  contents: string,
  imports: Import[],
  importReplacer: (importPath: string) => Promise<string | undefined>,
): Promise<{ [pathRelativeToFile: string]: string } | undefined> => {
  const replacements = (
    await Promise.all(
      imports.map(
        async (originalImport): Promise<ImportReplacement | undefined> => {
          const newImportPath = await importReplacer(originalImport.path);
          return newImportPath
            ? {
                originalImport,
                path: newImportPath,
                code:
                  originalImport.quoteChar +
                  jsesc(newImportPath, {
                    quote: quoteTypes[originalImport.quoteChar],
                  }) +
                  originalImport.quoteChar,
              }
            : undefined;
        },
      ),
    )
  ).filter((r): r is ImportReplacement => !!r);

  if (replacements.length === 0) return;

  // TODO: Copy source map source files into built directory as well
  const srcMapUpdates = await getSourceMapUpdates(filePathAbsolute, contents, replacements);

  const parts: string[] = [];
  let pos = 0;
  for (const { originalImport, code } of replacements) {
    parts.push(contents.substring(pos, originalImport.start), code);
    pos = originalImport.end;
  }
  parts.push(contents.substring(pos));

  const fileDirAbsolute = path.dirname(filePathAbsolute);
  const filename = path.basename(filePathAbsolute);
  const modified = updateSourceMapComment(parts.join(''), srcMapUpdates);
  return {
    [filename]: modified,
    ...(srcMapUpdates && 'filePath' in srcMapUpdates
      ? { [path.relative(fileDirAbsolute, srcMapUpdates.filePath)]: srcMapUpdates.contents }
      : {}),
  };
};

export const isBuiltinNodeModule = (name: string) => coreModules.hasOwnProperty(name);
