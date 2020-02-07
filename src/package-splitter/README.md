Publish a codebase as multiple packages.

## When should I use this?

You should consolidate your packages into a monorepo when you have multiple related packages which:

- Are interdependent (eg. a component library where each component is a package and should always depend on the latest version of other component packages you maintain)
- Have shared tooling (eg. all packages use the same TypeScript config, ESLint config, Jest config)

There are many existing monorepo tools which help you do this (eg. Lerna, Bolt, Rush). The unique benefits that _Package Splitter_ provides are:

- Zero boilerplate (eg. you don't need to define a full `package.json` for each package, never repeat yourself)
- No need for custom tooling (eg. you don't need to maintain project references in TypeScript or run tools multiple times for different packages, it's one regular project so you use tools like normal, things like VSCode "jump to reference" work naturally over cross-package boundaries)
- Can easily be added to existing projects (eg. if you're splitting up a monolith, just add a few `package.json` files at package boundaries and you're done)
- Super easy to setup (provide the path to a few directories and it Just Works™️)

In most cases a monorepo using Package Splitter is the easiest solution, however there are times when you may need to go with a traditional monorepo tool, such as when:

- You need different build tooling for different packages (eg. you have backend packages which are compiled by TypeScript and frontend packages which are compiled by Webpack and Babel)

In these cases you should probably use a tool like Lerna but keep in mind you can mix and match approaches depending on your needs (eg. have Lerna maintain a frontend package and a backend package, each with their own build tooling, then have these packages both use Package Splitter to further split them into many modules).

## Usage

1. Build a standard single project repository with the code for your packages all somewhere within the source directory.
2. Create a `package.json` file for each subpackage and place them in each subpackage's source directory. These `package.json` files can contain as much or as little details as you'd like. Nothing is required; anything not specified will be inferred according to the [package inference rules](#Package-Inference-Rules).
3. Install Package Splitter with: `npm i package-splitter` or `yarn add package-splitter`
4. To publish modules use: `package-splitter publish -s INPUT_PATH_FOR_SOURCE_FILES -b INPUT_PATH_FOR_BUILT_FILES -p OUTPUT_PATH_FOR_PUBLISH_FILES`

All packages have now:

- Had their versions bumped (type of bump based on your Git commit message)
- Been published to npm

## Default Configuration

For convenience there are a few behaviors configured by default. Read more about them here:

- [`package.json` fields are inferred](#Package-Inference-Rules)
- [The release type (patch, minor or major) of the version bump when publishing is determined by commit messages](#Versioning)

## Package Inference Rules

Below are the default values for `package.json` files:

| Field          | Default Value                                                                              | Example                                                                                                                        |
| -------------- | ------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------ |
| `name`         | Path from the `src` directory to the package's directory. Name is converted to snake-case. | If the `package.json` is at `src/esky/lid/package.json`, then the inferred package name will be `esky-lid`.                    |
| `version`      | The latest version published on npm, or `0.0.1` if it is not published.                    |
| `dependencies` | Packages which are imported in the code are added to the list of dependencies.             | If the package has a source file containing `import x from 'some-module';` then `some-module` will be added to `dependencies`. |
| `engines`      | The `engines` field of the parent `package.json`.                                          | If the root `package.json` has `"engines": { "node": "12" }` then a package will inherit the same `engines` value.             |
| `type`         | The `type` field of the parent `package.json`.                                             | If the root `package.json` has `"type": "module"` then a package will inherit the same `type` value.                           |

**Dependencies**

The `dependencies`, `peerDependencies` and `optionalDependencies` fields require some extra explanation.

- All source files (`.js`, `.jsx`, `.ts`, `.tsx`) within the package are scanned for imported packages (through `import` statements, dynamic `import` statements and `require` calls where the argument is a string literal)
- Imported packages are added to the `dependencies` field whether or not the `dependencies` field already exists in the `package.json`
- The versions of imported packages are retrieved from the nearest parent `package.json` file which contains the dependency in a `dependencies`, `peerDependencies` or `optionalDependencies` field
- If an imported dependency has been explicitly declared in `dependencies`, `peerDependencies` or `optionalDependencies`, it will not be added to `dependencies`
- If the version of a dependency is explicitly declared in `dependencies`, `peerDependencies` or `optionalDependencies` as `null` (eg. `"dependencies": { "some-module": null }`) then the version will be replaced with the version from the nearest parent `package.json` file

## Versioning

When publishing a package, the following things happen when there is no `version` field in its `package.json`:

- The latest version number of the package is looked up on npm
- This is used as the inferred `version` of the package
- The Git commit messages since the last publish for files within the package are collected
- If there have been no commits within the package since the last publish, the process ends here and the package is not published
- Collected messages are each assigned a release type depending on what they begin with:
  - `release: MAJOR` - major
  - `feat:` - minor
  - Other - patch
- The inferred version of the package is bumped according to the greatest release type of the collected commit messages
- The package is published with this bumped inferred version
