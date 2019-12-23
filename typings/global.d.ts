interface ObjectConstructor {
  assign<T, U>(target: T, ...sources: U[]): T & U;
}
