import fs from 'mz/fs';
import * as goldenFleece from 'golden-fleece';

import { prettifyIfNecessary } from '../util/prettier';

export const readFile = async (filePath: string) => {
  const contents = await fs.readFile(filePath, 'utf8');
  const value = goldenFleece.evaluate(contents);
  return { contents, value };
};

/**
 * Set the contents of a JSON file without modifying formatting of existing properties which are
 * not modified.
 */
export const updateFile = async (filePath: string, newValue: any, usePrettier?: boolean) => {
  const { contents } = await readFile(filePath);
  const newContents = await prettifyIfNecessary(filePath, patch(contents, newValue), usePrettier);
  await fs.writeFile(filePath, newContents);
};

export const patch = (contents: string, newValue: any) => goldenFleece.patch(contents, newValue);
