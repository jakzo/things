import { EnvironmentRecord } from './EnvironmentRecord';

/** https://www.ecma-international.org/ecma-262/10.0/index.html#sec-lexical-environments */
export class LexicalEnvironment {
  environmentRecord: EnvironmentRecord;
  outer: LexicalEnvironment | null;
}
