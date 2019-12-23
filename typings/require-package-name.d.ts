/** https://www.npmjs.com/package/require-package-name */
declare module 'require-package-name' {
  interface RequirePackageName {
    /** Gets the name of a module for a require string like `'xtend'` from `'xtend/mutable.js'`. */
    (str: string): string;
    /** Gets the _base_ name of a module. This is the same as above, except it excludes scoped usernames. */
    base(str: string): string;
  }

  const requirePackageName: RequirePackageName;
  export default requirePackageName;
}
