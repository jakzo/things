/** https://www.npmjs.com/package/source-map-resolve */
declare module 'source-map-resolve' {
  import { RawSourceMap } from 'source-map';

  export interface Result {
    /** The source map for code, as an object (not a string). */
    map: RawSourceMap;
    /**
     * The url to the source map. If the source map came from a data uri, this property is null,
     * since then there is no url to it.
     */
    url: string | null;
    /**
     * The url that the sources of the source map are relative to.
     * Since the sources are relative to the source map,
     * and the url to the source map is provided as the url property,
     * this property might seem superfluos.
     * However, remember that the url property can be null if the source map came from a data uri.
     * If so, the sources are relative to the file containing the data uri—codeUrl.
     * This property will be identical to the url property or codeUrl, whichever is appropriate.
     * This way you can conveniently resolve the sources without having to think about
     * where the source map came from.
     */
    sourcesRelativeTo: string;
    /** The url of the sourceMappingURL comment in code. */
    sourceMappingURL: string;
  }

  interface Opts {
    /**
     * code is a string of code that may or may not contain a sourceMappingURL comment.
     * Such a comment is used to resolve the source map.
     */
    code: string;
    /**
     * codeUrl is the url to the file containing code.
     * If the sourceMappingURL is relative, it is resolved against codeUrl.
     */
    codeUrl: string;
    /**
     * read(url, callback) is a function that reads url and responds using callback(error, content).
     * In Node.js you might want to use fs.readFile, while in the browser you might want to
     * use an asynchronus XMLHttpRequest.
     */
    read: (url: string, callback: (err?: Error, content?: string | Buffer) => void) => void;
    /**
     * callback(error, result) is a function that is invoked with
     * either an error or null and the result.
     */
    callback: (err?: Error, result?: Result) => void;
  }

  export const resolveSourceMap: {
    (
      code: Opts['code'],
      codeUrl: Opts['codeUrl'],
      read: Opts['read'],
      callback: Opts['callback'],
    ): void;

    __promisify__(
      code: Opts['code'],
      codeUrl: Opts['codeUrl'],
      read: Opts['read'],
    ): Promise<Parameters<Opts['callback']>[1]>;
  };
}
