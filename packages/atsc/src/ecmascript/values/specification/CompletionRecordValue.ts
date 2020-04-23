import { RecordValue } from './RecordValue';
import { LanguageValue } from '../language/LanguageValue';

/** https://www.ecma-international.org/ecma-262/10.0/index.html#table-8 */
export type CompletionType = 'normal' | AbruptCompletion;

/** https://www.ecma-international.org/ecma-262/10.0/index.html#sec-completion-record-specification-type */
const abruptCompletionTypes = ['break', 'continue', 'return', 'throw'] as const;
export type AbruptCompletion = typeof abruptCompletionTypes[number];
export const isAbruptCompletion = (arg: unknown): arg is CompletionRecordValue =>
  arg instanceof CompletionRecordValue &&
  (abruptCompletionTypes as readonly string[]).includes(arg.Type);

/** https://www.ecma-international.org/ecma-262/10.0/index.html#sec-completion-record-specification-type */
export class CompletionRecordValue extends RecordValue {
  constructor(fields: CompletionRecordFields) {
    super();
    Object.assign(this, fields);
  }
}
export interface CompletionRecordValue extends CompletionRecordFields {}
interface CompletionRecordFields {
  Type: CompletionType;
  Value: LanguageValue | undefined;
  Target: string | undefined;
}

/** https://www.ecma-international.org/ecma-262/10.0/index.html#sec-normalcompletion */
export const NormalCompletion = (argument: CompletionRecordFields['Value']) =>
  new CompletionRecordValue({
    Type: 'normal',
    Value: argument,
    Target: undefined,
  });

/** https://www.ecma-international.org/ecma-262/10.0/index.html#sec-throwcompletion */
export const ThrowCompletion = (argument: CompletionRecordFields['Value']) =>
  new CompletionRecordValue({
    Type: 'throw',
    Value: argument,
    Target: undefined,
  });

/** https://www.ecma-international.org/ecma-262/10.0/index.html#sec-updateempty */
export const UpdateEmpty = (
  completionRecord: CompletionRecordValue,
  value: CompletionRecordFields['Value'],
) => {
  if (completionRecord.Value !== undefined) {
    return new CompletionRecordValue(completionRecord);
  }
  return new CompletionRecordValue({
    Type: completionRecord.Type,
    Value: value,
    Target: completionRecord.Target,
  });
};
