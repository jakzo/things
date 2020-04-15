import * as ts from 'typescript';

export const compileCode = (code: string): string => {
  // @ts-ignore
  const sourceFile = ts.createSourceFile('code.ts', code, ts.ScriptTarget.ES2015, true);
  return code;
};
