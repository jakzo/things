import { LanguageValue } from './LanguageValue';

/** https://www.ecma-international.org/ecma-262/10.0/index.html#sec-ecmascript-language-types-string-type */
export class StringValue extends LanguageValue {
  constructor(public value: string) {
    super();
  }
}
