// TODO: We don't need this anymore...
export interface MapWithKnownKeys<T extends Record<string | number, unknown>>
  extends Map<keyof T, T[keyof T]> {
  get<K extends keyof T>(key: K): T[K];
  set<K extends keyof T>(key: K, value: T[K]): this;
  has<K extends keyof T>(key: K): boolean;
  delete<K extends keyof T>(key: K): boolean;
  forEach(
    // As of TypeScript 3.8.3 narrowing `K` in the `callbackfn` doesn't also narrow `T[K]` but
    // hopefully that will change in future
    callbackfn: <K extends keyof T>(value: T[K], key: K, map: this) => void,
    thisArg?: unknown,
  ): void;
}
