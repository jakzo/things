import { SpecificationValue } from './SpecificationValue';

/** https://www.ecma-international.org/ecma-262/10.0/index.html#sec-list-and-record-specification-type */
export class ListValue<T> extends SpecificationValue {
  constructor(public values: T[]) {
    super();
  }
}
