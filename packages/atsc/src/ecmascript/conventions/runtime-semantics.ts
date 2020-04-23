import {
  isAbruptCompletion,
  CompletionRecordValue,
} from '../values/specification/CompletionRecordValue';
import { LanguageValue } from '../values/language/LanguageValue';

/**
 * https://www.ecma-international.org/ecma-262/10.0/index.html#sec-returnifabrupt
 *
 * NOTE: Use type-specific ReturnIfAbrupt functions instead of this one.
 *
 * This should be a macro but since JS does not support macros we use the following convention:
 * - The caller should immediately return the result of `ReturnIfAbrupt`
 * - `ReturnIfAbrupt` takes a callback which receives the updated value of `argument`
 * - The value returned by the callback will be returned by `ReturnIfAbrupt`
 */
export const ReturnIfAbrupt = <T, U = T>(
  argument: T,
  cb: (argument: T extends CompletionRecordValue ? LanguageValue | undefined : T) => U = a =>
    (a as unknown) as U,
): CompletionRecordValue | U => {
  if (isAbruptCompletion(argument)) return argument;
  if (argument instanceof CompletionRecordValue) return cb(argument.Value as any);
  return cb(argument as any);
};
