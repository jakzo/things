This directory contains an implementation of the ECMAScript specification. The file structure matches the chapters and headings of the specification and the data structures and algorithms also match the naming used in the specification.

It conforms to the **10th edition** which can be found here: https://www.ecma-international.org/ecma-262/10.0/index.html

### Notes about code style

- Use the exact same names (including capitalization) where possible
  - A lot of properties begin with uppercase in the spec so they should begin with uppercase in the code even though that is not JS convention
  - Only include valid identifier characters in property and variable names, meaning you shouldn't include `%` characters and such in property names (this is for readability and convenience so we don't need to refer to things like `completionRecord['[[Type]]']`)
- Some names in the spec are already taken by existing variables so we should choose an appropriate suffix to apply to all values of the same type to distinguish them
  - For example, the spec refers to the "Number type" and "Number values" but we can't represent ECMAScript numbers with a class called `Number` because that already exists so we call the class `NumberValue` and apply the `Value` suffix to all other ECMAScript value classes
- When the spec refers to `empty` we represent that as `undefined`
  - Do not use optional properties to represent `empty` (correct = `a: X | undefined`, incorrect = `a?: X`)
- Minimise polymorphism of spec routines
  - If a routine defined by the spec can be passed multiple types of values, separate it into multiple versions of the routine - one for each input type
  - If the type of the value being passed is unknown until runtime, we will need to have the symbolic executor fork execution
