import { LanguageValue } from './LanguageValue';

/** https://www.ecma-international.org/ecma-262/10.0/index.html#sec-ecmascript-language-types-number-type */
export class NumberValue extends LanguageValue {
  constructor(public value: number) {
    super();
  }
}
