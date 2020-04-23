import { SpecificationValue } from './SpecificationValue';

/** https://www.ecma-international.org/ecma-262/10.0/index.html#sec-set-and-relation-specification-type */
export class SetValue<T> extends SpecificationValue {
  constructor(public values: Set<T>) {
    super();
  }
}
