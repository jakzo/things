import { LanguageValue } from './LanguageValue';
import { UndefinedValue } from './UndefinedValue';
import { BooleanValue } from './BooleanValue';
import { NullValue } from './NullValue';
import { ListValue } from '../specification/ListValue';

/** https://www.ecma-international.org/ecma-262/10.0/index.html#sec-object-type */
export class ObjectValue extends LanguageValue {
  constructor(public properties: Map<string, ObjectProperty> = new Map()) {
    super();
  }

  private prototype: ObjectValue | NullValue = new NullValue();
  private extensible: BooleanValue = new BooleanValue(true);

  /**
   * - https://www.ecma-international.org/ecma-262/10.0/index.html#table-5
   * - https://www.ecma-international.org/ecma-262/10.0/index.html#sec-invariants-of-the-essential-internal-methods
   */
  GetPrototypeOf(): ObjectValue | NullValue {
    // TODO
    return this.prototype;
  }

  /**
   * - https://www.ecma-international.org/ecma-262/10.0/index.html#table-5
   * - https://www.ecma-international.org/ecma-262/10.0/index.html#sec-invariants-of-the-essential-internal-methods
   */
  SetPrototypeOf(prototype: ObjectValue | NullValue): BooleanValue {
    // TODO
    this.prototype = prototype;
    return new BooleanValue(true);
  }

  /**
   * - https://www.ecma-international.org/ecma-262/10.0/index.html#table-5
   * - https://www.ecma-international.org/ecma-262/10.0/index.html#sec-invariants-of-the-essential-internal-methods
   */
  IsExtensible(): BooleanValue {
    // TODO
    return this.extensible;
  }

  /**
   * - https://www.ecma-international.org/ecma-262/10.0/index.html#table-5
   * - https://www.ecma-international.org/ecma-262/10.0/index.html#sec-invariants-of-the-essential-internal-methods
   */
  PreventExtensions(): BooleanValue {
    // TODO
    this.extensible = new BooleanValue(true);
    return new BooleanValue(true);
  }

  /**
   * - https://www.ecma-international.org/ecma-262/10.0/index.html#table-5
   * - https://www.ecma-international.org/ecma-262/10.0/index.html#sec-invariants-of-the-essential-internal-methods
   */
  GetOwnProperty(propertyKey: LanguageValue): UndefinedValue | PropertyDescriptor {
    // TODO
    return this.properties.get();
  }

  /**
   * - https://www.ecma-international.org/ecma-262/10.0/index.html#table-5
   * - https://www.ecma-international.org/ecma-262/10.0/index.html#sec-invariants-of-the-essential-internal-methods
   */
  DefineOwnProperty(propertyKey: LanguageValue, propertyDescriptor: LanguageValue): BooleanValue {
    // TODO
  }

  /**
   * - https://www.ecma-international.org/ecma-262/10.0/index.html#table-5
   * - https://www.ecma-international.org/ecma-262/10.0/index.html#sec-invariants-of-the-essential-internal-methods
   */
  HasProperty(propertyKey): Boolean {
    // TODO
  }

  /**
   * - https://www.ecma-international.org/ecma-262/10.0/index.html#table-5
   * - https://www.ecma-international.org/ecma-262/10.0/index.html#sec-invariants-of-the-essential-internal-methods
   */
  Get(propertyKey, Receiver): any {
    // TODO
  }

  /**
   * - https://www.ecma-international.org/ecma-262/10.0/index.html#table-5
   * - https://www.ecma-international.org/ecma-262/10.0/index.html#sec-invariants-of-the-essential-internal-methods
   */
  Set(propertyKey, value, Receiver): Boolean {
    // TODO
  }

  /**
   * - https://www.ecma-international.org/ecma-262/10.0/index.html#table-5
   * - https://www.ecma-international.org/ecma-262/10.0/index.html#sec-invariants-of-the-essential-internal-methods
   */
  Delete(propertyKey): Boolean {
    // TODO
  }

  /**
   * - https://www.ecma-international.org/ecma-262/10.0/index.html#table-5
   * - https://www.ecma-international.org/ecma-262/10.0/index.html#sec-invariants-of-the-essential-internal-methods
   */
  OwnPropertyKeys(): ListValue {
    // TODO
  }
}

/** https://www.ecma-international.org/ecma-262/10.0/index.html#table-6 */
export class FunctionObjectValue extends ObjectValue {
  /** https://www.ecma-international.org/ecma-262/10.0/index.html#table-6 */
  Call(thisValue: LanguageValue, args: ListValue<LanguageValue>): LanguageValue {
    // TODO
  }
}

/** https://www.ecma-international.org/ecma-262/10.0/index.html#table-6 */
export class ConstructorFunctionObjectValue extends FunctionObjectValue {
  /**
   * - https://www.ecma-international.org/ecma-262/10.0/index.html#table-6
   * - https://www.ecma-international.org/ecma-262/10.0/index.html#sec-invariants-of-the-essential-internal-methods
   */
  Construct(args: ListValue<LanguageValue>, target: ObjectValue): ObjectValue {
    // TODO
  }
}

/** https://www.ecma-international.org/ecma-262/10.0/index.html#sec-property-attributes */
export abstract class ObjectProperty {
  constructor(
    public Enumerable: BooleanValue = new BooleanValue(false),
    public Configurable: BooleanValue = new BooleanValue(false),
  ) {}
}

/** https://www.ecma-international.org/ecma-262/10.0/index.html#table-2 */
export class DataProperty extends ObjectProperty {
  constructor(
    Enumerable: BooleanValue | undefined,
    Configurable: BooleanValue | undefined,
    public Writable: BooleanValue = new BooleanValue(false),
    public Value: LanguageValue = new UndefinedValue(),
  ) {
    super(Enumerable, Configurable);
  }
}

/** https://www.ecma-international.org/ecma-262/10.0/index.html#table-3 */
export class AccessorProperty extends ObjectProperty {
  constructor(
    Enumerable: BooleanValue | undefined,
    Configurable: BooleanValue | undefined,
    public Get: FunctionObjectValue | UndefinedValue = new UndefinedValue(),
    public Set: FunctionObjectValue | UndefinedValue = new UndefinedValue(),
  ) {
    super(Enumerable, Configurable);
  }
}

/** https://www.ecma-international.org/ecma-262/10.0/index.html#sec-well-known-intrinsic-objects */
export const createWellKnownIntrinsicObjects = () => ({
  // TODO
  Array: new ObjectValue(),
  ArrayBuffer: new ObjectValue(),
  ArrayBufferPrototype: new ObjectValue(),
  ArrayIteratorPrototype: new ObjectValue(),
  ArrayPrototype: new ObjectValue(),
  ArrayProto_entries: new ObjectValue(),
  ArrayProto_forEach: new ObjectValue(),
  ArrayProto_keys: new ObjectValue(),
  ArrayProto_values: new ObjectValue(),
  AsyncFromSyncIteratorPrototype: new ObjectValue(),
  AsyncFunction: new ObjectValue(),
  AsyncFunctionPrototype: new ObjectValue(),
  AsyncGenerator: new ObjectValue(),
  AsyncGeneratorFunction: new ObjectValue(),
  AsyncGeneratorPrototype: new ObjectValue(),
  AsyncIteratorPrototype: new ObjectValue(),
  Atomics: new ObjectValue(),
  Boolean: new ObjectValue(),
  BooleanPrototype: new ObjectValue(),
  DataView: new ObjectValue(),
  DataViewPrototype: new ObjectValue(),
  Date: new ObjectValue(),
  DatePrototype: new ObjectValue(),
  decodeURI: new ObjectValue(),
  decodeURIComponent: new ObjectValue(),
  encodeURI: new ObjectValue(),
  encodeURIComponent: new ObjectValue(),
  Error: new ObjectValue(),
  ErrorPrototype: new ObjectValue(),
  eval: new ObjectValue(),
  EvalError: new ObjectValue(),
  EvalErrorPrototype: new ObjectValue(),
  Float32Array: new ObjectValue(),
  Float32ArrayPrototype: new ObjectValue(),
  Float64Array: new ObjectValue(),
  Float64ArrayPrototype: new ObjectValue(),
  Function: new ObjectValue(),
  FunctionPrototype: new ObjectValue(),
  Generator: new ObjectValue(),
  GeneratorFunction: new ObjectValue(),
  GeneratorPrototype: new ObjectValue(),
  Int8Array: new ObjectValue(),
  Int8ArrayPrototype: new ObjectValue(),
  Int16Array: new ObjectValue(),
  Int16ArrayPrototype: new ObjectValue(),
  Int32Array: new ObjectValue(),
  Int32ArrayPrototype: new ObjectValue(),
  isFinite: new ObjectValue(),
  isNaN: new ObjectValue(),
  IteratorPrototype: new ObjectValue(),
  JSON: new ObjectValue(),
  JSONParse: new ObjectValue(),
  JSONStringify: new ObjectValue(),
  Map: new ObjectValue(),
  MapIteratorPrototype: new ObjectValue(),
  MapPrototype: new ObjectValue(),
  Math: new ObjectValue(),
  Number: new ObjectValue(),
  NumberPrototype: new ObjectValue(),
  Object: new ObjectValue(),
  ObjectPrototype: new ObjectValue(),
  ObjProto_toString: new ObjectValue(),
  ObjProto_valueOf: new ObjectValue(),
  parseFloat: new ObjectValue(),
  parseInt: new ObjectValue(),
  Promise: new ObjectValue(),
  PromisePrototype: new ObjectValue(),
  PromiseProto_then: new ObjectValue(),
  Promise_all: new ObjectValue(),
  Promise_reject: new ObjectValue(),
  Promise_resolve: new ObjectValue(),
  Proxy: new ObjectValue(),
  RangeError: new ObjectValue(),
  RangeErrorPrototype: new ObjectValue(),
  ReferenceError: new ObjectValue(),
  ReferenceErrorPrototype: new ObjectValue(),
  Reflect: new ObjectValue(),
  RegExp: new ObjectValue(),
  RegExpPrototype: new ObjectValue(),
  Set: new ObjectValue(),
  SetIteratorPrototype: new ObjectValue(),
  SetPrototype: new ObjectValue(),
  SharedArrayBuffer: new ObjectValue(),
  SharedArrayBufferPrototype: new ObjectValue(),
  String: new ObjectValue(),
  StringIteratorPrototype: new ObjectValue(),
  StringPrototype: new ObjectValue(),
  Symbol: new ObjectValue(),
  SymbolPrototype: new ObjectValue(),
  SyntaxError: new ObjectValue(),
  SyntaxErrorPrototype: new ObjectValue(),
  ThrowTypeError: new ObjectValue(),
  TypedArray: new ObjectValue(),
  TypedArrayPrototype: new ObjectValue(),
  TypeError: new ObjectValue(),
  TypeErrorPrototype: new ObjectValue(),
  Uint8Array: new ObjectValue(),
  Uint8ArrayPrototype: new ObjectValue(),
  Uint8ClampedArray: new ObjectValue(),
  Uint8ClampedArrayPrototype: new ObjectValue(),
  Uint16Array: new ObjectValue(),
  Uint16ArrayPrototype: new ObjectValue(),
  Uint32Array: new ObjectValue(),
  Uint32ArrayPrototype: new ObjectValue(),
  URIError: new ObjectValue(),
  URIErrorPrototype: new ObjectValue(),
  WeakMap: new ObjectValue(),
  WeakMapPrototype: new ObjectValue(),
  WeakSet: new ObjectValue(),
  WeakSetPrototype: new ObjectValue(),
});
