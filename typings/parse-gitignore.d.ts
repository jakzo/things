/** https://www.npmjs.com/package/parse-gitignore */
declare module 'parse-gitignore' {
  const parse: (gitignoreContents: string | Buffer) => string[];
  export default parse;
}
