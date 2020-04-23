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

atsc is inspired by [Prepack](https://prepack.io/). The goals of these two projects are almost identical but because atsc leverages TypeScript instead of JavaScript/Babel and because Prepack is archived, atsc is a complete rewrite and separate project.

## Technical Explanation

Fundamentally atsc executes the code as written then serializes the final state and outputs that as the compiled code. Code which is not run on startup (eg. functions which are added as event listener callbacks) are also executed and outputted in this manner.

Below is a more detailed explanation of the steps atsc takes when compiling a TypeScript project:

1. Uses the TypeScript compiler APIs to generate an AST of the entire project
2. Executes the AST code of the entire project using atsc's custom ECMAScript interpreter and symbolic evaluator
   - During execution some values will be known (eg. in `x = 2+3` the `x` variable will have a value of `5`)
   - For other values the type will be known but not the exact value (eg. we don't know the exact value of `x` in `x = Math.random()` but we know that it will be a `number` between 0 and 1)
   - For others we will not even know the type (eg. `x = JSON.parse(serverResponse)` could be many different types and shapes of data)
     - Side note: because the value could be many different types, we assume it could be any of them which means less optimizations can be made. It's possible we could trust the author's type when explicitly narrowing from `unknown` or `any` but this may produce confusing or dangerous bugs if the type ends up being wrong!
   - When there is only one possible value it is called a _concrete value_ and when there are multiple it is called an _abstract value_
     - Abstract values are encoded as a set of TypeScript types the value could be
   - Whenever an operation is performed on an abstract value we:
     1. Find all possible paths based on the possible values
        - Eg. when executing the `if` statement in `let x = Math.random(); if (x < 0.5) doSomething();` there are two possible paths: one where we call `doSomething()` and one where we don't, however if the condition were `if (x === 'some str')` we can tell that because `x` is a number it will never equal `some str` so there is only one possible path
     2. _fork_ the execution and evaluate each path
        - If after forking execution has reached the same operation which caused the fork and the value is still abstract, we stop evaluating it to prevent infinite loops (eg. in `let x = Math.random(); while (x < 1) { doSomething(); x += 0.1; }` we would only evaluate the `while` loop once and assume it could repeatedly execute the path an unknown number of times)
   - Each piece of code which doesn't run on startup but will run (eg. a function passed to an event listener) is run after the startup code
   - Some pieces of code may be run multiple times if dependent values change
     - For example:
       ```js
       let a = 1;
       document.addEventListener('mousedown', () => {
         console.log(a);
       });
       document.addEventListener('keydown', () => {
         a += 1;
         console.log(a);
       });
       ```
       Here the `mousedown` event listener will be executed first and atsc will find that it should log `1` but after executing the `keydown` event listener it will find that `a` could actually be any number `1` or greater so it will execute the `mousedown` event listener again and update the global state
     - Worst case example:
       ```js
       let a = 1;
       document.addEventListener('mousedown', () => {
         if (a === 1) a = 'x';
         else if (a === 'x') a = {};
         else if (typeof a === 'object') a = 1;
         console.log(a);
       });
       document.addEventListener('keydown', () => {
         if (a === 1) a = 'x';
         else if (a === 'x') a = {};
         else if (typeof a === 'object') a = 1;
         console.log(a);
       });
       ```
3. Once the final state (changes to global variables and calls to APIs) has been calculated the final state is serialized into an AST
   - This serialization makes the changes to global state directly using literals
   - Some space optimizations are applied in this step (eg. extracing duplicated data into common variables or frequent operations into functions)
     - Duplicate data is found using the cache from the execution step
4. The entire project's TypeScript compiler AST is replaced with this new one
5. Using the TypeScript compiler APIs the new project AST is serialized to JavaScript code according to the TSConfig and written to file

## Roadmap

- Create a spec-compliant ECMAScript interpreter which can execute a TypeScript AST of some code (only supporting a subset of ECMAScript for now)
- Add support for symbolic execution to the interpreter (possible abstract values match TypeScript types)
- Display errors when runtime types do not match TypeScript types
- Transform the AST to replace expressions with literals when possible
- Support all of ECMAScript
- Use a heuristic to decide whether to inline expressions or not based on a configurable trade-off threshold of runtime performance and bundle size
- Add more space-time saving techniques like using variables instead of object properties, tuples instead of objects, variables and functions instead of classes, etc.
- Build a simple constraint solver to aid symbolic execution
- Build test case fuzzer/generator
