import { LanguageValue } from './LanguageValue';

/** https://www.ecma-international.org/ecma-262/10.0/index.html#sec-ecmascript-language-types-symbol-type */
export class SymbolValue extends LanguageValue {
  constructor(public description: string | undefined) {
    super();
  }
}

/** https://www.ecma-international.org/ecma-262/10.0/index.html#sec-well-known-symbols */
export const wellKnownSymbols = {
  asyncIterator: new SymbolValue('Symbol.asyncIterator'),
  hasInstance: new SymbolValue('Symbol.hasInstance'),
  isConcatSpreadable: new SymbolValue('Symbol.isConcatSpreadable'),
  iterator: new SymbolValue('Symbol.iterator'),
  match: new SymbolValue('Symbol.match'),
  replace: new SymbolValue('Symbol.replace'),
  search: new SymbolValue('Symbol.search'),
  species: new SymbolValue('Symbol.species'),
  split: new SymbolValue('Symbol.split'),
  toPrimitive: new SymbolValue('Symbol.toPrimitive'),
  toStringTag: new SymbolValue('Symbol.toStringTag'),
  unscopables: new SymbolValue('Symbol.unscopables'),
};
