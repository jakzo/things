/** https://www.npmjs.com/package/source-map-url */
declare module 'source-map-url' {
  export const existsIn: (code: string) => boolean;
  export const getFrom: (code: string) => string | null;
  export const removeFrom: (code: string) => string;
  export const insertBefore: (code: string, str: string) => string;
  export const regex: RegExp;
}
