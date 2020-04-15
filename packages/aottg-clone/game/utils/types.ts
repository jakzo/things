export type RequiredProps<T, K extends keyof T> = T & { [P in K]-?: T[P] };

export type Entries<T> = {
  [P in keyof T]: [P, T[P]];
}[keyof T];
