import { SpecificationValue } from './SpecificationValue';
import { BooleanValue } from '../language/BooleanValue';
import { UndefinedValue } from '../language/UndefinedValue';
import { ObjectValue } from '../language/ObjectValue';
import { StringValue } from '../language/StringValue';
import { SymbolValue } from '../language/SymbolValue';
import { NumberValue } from '../language/NumberValue';
import { EnvironmentRecord } from '../../execution/EnvironmentRecord';
import { ReturnIfAbrupt } from '../../conventions/runtime-semantics';
import { ThrowCompletion, CompletionRecordValue } from './CompletionRecordValue';
import { LanguageValue } from '../language/LanguageValue';

/** https://www.ecma-international.org/ecma-262/10.0/index.html#sec-reference-specification-type */
type ValueComponent =
  | UndefinedValue
  | ObjectValue
  | BooleanValue
  | StringValue
  | SymbolValue
  | NumberValue
  | EnvironmentRecord;

/** https://www.ecma-international.org/ecma-262/10.0/index.html#sec-reference-specification-type */
export class ReferenceValue extends SpecificationValue {
  constructor(
    public baseValue: ValueComponent,
    public name: StringValue | SymbolValue,
    public strictFlag: BooleanValue,
  ) {
    super();
  }
}

/** https://www.ecma-international.org/ecma-262/10.0/index.html#super-reference */
export class SuperReferenceValue extends ReferenceValue {
  constructor(
    public baseValue:
      | UndefinedValue
      | ObjectValue
      | BooleanValue
      | StringValue
      | SymbolValue
      | NumberValue,
    name: StringValue | SymbolValue,
    strictFlag: BooleanValue,
    public thisValue: ValueComponent, // TODO: Is this type right? The spec doesn't explicitly say...
  ) {
    super(baseValue, name, strictFlag);
  }
}

/** https://www.ecma-international.org/ecma-262/10.0/index.html#sec-getbase */
export const GetBase = (V: ReferenceValue): ReferenceValue['baseValue'] => V.baseValue;

/** https://www.ecma-international.org/ecma-262/10.0/index.html#sec-getreferencedname */
export const GetReferencedName = (V: ReferenceValue): ReferenceValue['name'] => V.name;

/** https://www.ecma-international.org/ecma-262/10.0/index.html#sec-isstrictreference */
export const IsStrictReference = (V: ReferenceValue): ReferenceValue['strictFlag'] => V.strictFlag;

/** https://www.ecma-international.org/ecma-262/10.0/index.html#sec-hasprimitivebase */
export const HasPrimitiveBase = (V: ReferenceValue): BooleanValue =>
  new BooleanValue(
    V.baseValue instanceof BooleanValue ||
      V.baseValue instanceof StringValue ||
      V.baseValue instanceof SymbolValue ||
      V.baseValue instanceof NumberValue,
  );

/** https://www.ecma-international.org/ecma-262/10.0/index.html#sec-ispropertyreference */
export const IsPropertyReference = (V: ReferenceValue): BooleanValue =>
  new BooleanValue(V.baseValue instanceof ObjectValue || HasPrimitiveBase(V).value === true);

/** https://www.ecma-international.org/ecma-262/10.0/index.html#sec-isunresolvablereference */
export const IsUnresolvableReference = (V: ReferenceValue): BooleanValue =>
  new BooleanValue(V.baseValue instanceof UndefinedValue);

/** https://www.ecma-international.org/ecma-262/10.0/index.html#sec-issuperreference */
export const IsSuperReference = (V: ReferenceValue): BooleanValue =>
  new BooleanValue(Boolean((V as SuperReferenceValue).thisValue));

/** https://www.ecma-international.org/ecma-262/10.0/index.html#sec-getvalue */
export const GetValue = (V: ReferenceValue): CompletionRecordValue =>
  ReturnIfAbrupt(V, V => {
    if (!(V instanceof ReferenceValue)) return V;
    let base = GetBase(V);
    if (IsUnresolvableReference(V).value === true) {
      return ThrowCompletion(/* TODO: ReferenceError */);
    }
    if (IsPropertyReference(V).value === true) {
      if (HasPrimitiveBase(V).value === true) {
        base = ToObject(base).Value;
      }
      return ReturnIfAbrupt((base as ObjectValue).Get(GetReferencedName(V), GetThisValue(V)));
    }
    return ReturnIfAbrupt(
      (base as EnvironmentRecord).GetBindingValue(GetReferencedName(V), IsStrictReference(V)),
    );
  });

/** https://www.ecma-international.org/ecma-262/10.0/index.html#sec-putvalue */
export const PutValue = (V: ReferenceValue, W: ReferenceValue): CompletionRecordValue =>
  ReturnIfAbrupt(V, V =>
    ReturnIfAbrupt(W, W => {
      if (!(V instanceof ReferenceValue)) {
        return ThrowCompletion(/* TODO: ReferenceError */);
      }
      let base = GetBase(V);
      if (IsUnresolvableReference(V).value === true) {
        if (IsStrictReference(V).value === true) {
          return ThrowCompletion(/* TODO: ReferenceError */);
        }
        const globalObj = GetGlobalObject();
        return ReturnIfAbrupt(Set_(globalObj, GetReferencedName(V), W, false));
      } else if (IsPropertyReference(V).value === true) {
        if (HasPrimitiveBase(V).value === true) {
          base = ToObject(base).Value;
        }
        return ReturnIfAbrupt(
          (base as ObjectValue).Set(GetReferencedName(V), W, GetThisValue(V)),
          succeeded => {
            if (succeeded.value === false && IsStrictReference(V).value === true) {
              return ThrowCompletion(/* TODO: TypeError */);
            }
            return;
          },
        );
      } else {
        return ReturnIfAbrupt(
          (base as EnvironmentRecord).SetMutableBinding(
            GetReferencedName(V),
            W,
            IsStrictReference(V),
          ),
        );
      }
    }),
  );

/** https://www.ecma-international.org/ecma-262/10.0/index.html#sec-getthisvalue */
export const GetThisValue = (V: ReferenceValue): ValueComponent => {
  if (IsSuperReference(V).value === true) {
    return (V as SuperReferenceValue).thisValue;
  }
  return GetBase(V);
};

/** https://www.ecma-international.org/ecma-262/10.0/index.html#sec-initializereferencedbinding */
export const InitializeReferencedBinding = (V: ReferenceValue, W: ReferenceValue) =>
  ReturnIfAbrupt(V, V =>
    ReturnIfAbrupt(W, W => {
      const base = GetBase(V) as EnvironmentRecord;
      return base.InitializeBinding(GetReferencedName(V), W);
    }),
  );
