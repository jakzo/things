# atsc

> **Attention:** atsc is still in early development and is not usable yet!

Advanced TypeScript Compiler (atsc) is a replacement for the default TypeScript compiler (tsc) which does complex analysis and transformation of the code to compile it to smaller and faster JavaScript which has the same effect as the original code. Also the data from analyzing the code to provide other useful tools like warning when TypeScript types do not match types at runtime, generating type definitions for untyped node modules or generating unit tests for functions.

### What does it do?

- Eliminates dead and unused code
  - `if (false) alert('a'); else alert('b');` -> `alert('b');`
  - `const n = +prompt(); if (n > 2) throw new Error(); alert([9, 1, 5, 3, 8][n]);` -> `const n = +prompt(); if (n > 2) throw new Error(); alert([9, 1, 5][n]);`
  - `const n = Math.floor(prompt()) * 2; if (n % 2 === 1) alert('n*2 is odd'); else alert('n*2 is even');` -> `prompt(); alert('n*2 is even');`
- Simplifies expressions
  - `const MAX_ITEMS = Math.pow(2, 10); alert('Max items: ' + MAX_ITEMS);` -> `alert('Max items: 1024');`
- Uses more efficient data structures
  - `const p = { age: 20, height: 1.7 }; f(p); g(p);` -> `const p = [20, 1.7]; f(p); g(p);`
- Moves conditions earlier
  - `const n = prompt(); const res = fibonacci(n); if (res === 13) throw new Error(); alert(res);` -> `const n = prompt(); if (n === '7') throw new Error(); alert(fibonacci(n));`
- Warns when TypeScript types do not match types at runtime
  - `const f = (x: any): number => x + 3; f('str');` -> warns that `f` should return `number` but will return `string` during execution
- Generates type definitions for untyped node modules
  - `export const f = n => n*2;` -> typings file containing `declare module 'some-module' { export const f: (n: number) => number; }`
- Generates unit tests for functions based on types and branches
  - `export const f = (n: number) => n%2 === 0 ? 3*n+1 : n/2;` -> `describe('f', () => { test('n%2 === 0', () => { expect(f(4)).toBe(2); }); test('n%2 !== 0', ...`

### How does it do it?

- Concrete execution - runs code during compilation to precompute results of sections of code
- Symbolic execution - tracks multiple values or ranges of values when executing branches
- Constraint solving - figures out what conditions earlier on would have caused a condition later to trigger

## atsc vs Prepack

atsc is inspired by [Prepack](https://prepack.io/). The goals of these two projects are almost identical but because atsc leverages TypeScript instead of JavaScript/Babel and because Prepack is archived, atsc is a complete rewrite and separate project. The approach taken is fundamentally the same and thus the code will look fairly similar.

## Roadmap

- Create a spec-compliant ECMAScript interpreter which can execute a TypeScript AST of some code (only supporting a subset of ECMAScript for now)
- Add support for symbolic execution to the interpreter (possible abstract values match TypeScript types)
- Display errors when runtime types do not match TypeScript types
- Transform the AST to replace expressions with literals when possible
- Make the interpreter fully spec-compliant
- Use a heuristic to decide whether to inline expressions or not based on a configurable trade-off threshold of runtime performance and bundle size
- Add more space-time saving techniques like using variables instead of object properties, tuples instead of objects, variables and functions instead of classes, etc.
- Build a simple constraint solver to aid symbolic execution
- Build test case fuzzer/generator
