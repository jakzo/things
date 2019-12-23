import prettier from 'prettier';

export const prettify = (filePath: string, contents: string) =>
  prettier.format(contents, { filepath: filePath });

export const prettifyIfNecessary = async (
  filePath: string,
  contents: string,
  forceUsePrettier?: boolean,
) =>
  forceUsePrettier || (forceUsePrettier === undefined && !!(await prettier.resolveConfig(filePath)))
    ? prettify(filePath, contents)
    : contents;
