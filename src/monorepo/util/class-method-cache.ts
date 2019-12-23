export type ClassMethodCache<T extends {} = any> = {
  [K in keyof T]?: T[K] extends () => any
    ? ReturnType<T[K]>
    : T[K] extends (arg: string) => any
    ? { [arg: string]: ReturnType<T[K]> }
    : never;
};

const isNullary = (fn: Function): fn is () => any => fn.length === 0;

/**
 * Caches the return value of a method of a class.
 *
 * Requires a public `_cache: ClassMethodCache<ClassName>` property on the class.
 * Cached function must either take zero arguments or a single string argument.
 *
 * Should only be used when the method makes a heavy non-cached call.
 * For example, a method which reads a file should be cached whereas a method which makes
 * two calls which are both to other cached methods should not be cached.
 *
 * The cached value can be overriden or reset by accessing it in the class' `_cache` property
 * where the key is the name of the method.
 */
export const cache = <T extends { _cache: ClassMethodCache }, R>(
  _target: T,
  key: keyof T,
  descriptor:
    | TypedPropertyDescriptor<(this: T) => R>
    | TypedPropertyDescriptor<(this: T, arg: string) => R>,
): TypedPropertyDescriptor<any> => {
  const fn = descriptor.value!;
  return isNullary(fn)
    ? {
        ...descriptor,
        value(this: T): R {
          if (!this._cache.hasOwnProperty(key)) {
            this._cache[key] = fn.call(this);
          }
          return this._cache[key];
        },
      }
    : {
        ...descriptor,
        value(this: T, arg: string): R {
          const cache = this._cache[key] || (this._cache[key] = {});
          if (!cache.hasOwnProperty(arg)) {
            cache[arg] = fn.call(this, arg);
          }
          return cache[arg];
        },
      };
};
