import { LanguageValue } from './LanguageValue';

/** https://www.ecma-international.org/ecma-262/10.0/index.html#sec-ecmascript-language-types-boolean-type */
export class BooleanValue extends LanguageValue {
  constructor(public value: boolean) {
    super();
  }
}
