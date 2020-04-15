import { findAllImports } from '../imports';

describe('findAllImports', () => {
  it('should handle import declarations', () => {
    const imports = findAllImports(
      'file.ts',
      [
        'import "dep-a"',
        'import b from "dep-b"',
        'import { c } from "dep-c"',
        'import * as d from "dep-d"',
      ].join('\n'),
      importPath => importPath,
    );
    expect(imports.map(imp => imp.path)).toEqual(['dep-a', 'dep-b', 'dep-c', 'dep-d']);
  });

  it('should handle Typescript require imports', () => {
    const imports = findAllImports(
      'file.ts',
      'import dep = require("dep")',
      importPath => importPath,
    );
    expect(imports.map(imp => imp.path)).toEqual(['dep']);
  });

  it('should handle dynamic imports', () => {
    const imports = findAllImports('file.ts', 'import("dep")', importPath => importPath);
    expect(imports.map(imp => imp.path)).toEqual(['dep']);
  });

  it('should handle exports', () => {
    const imports = findAllImports(
      'file.ts',
      ['export { a } from "dep-a"', 'export * from "dep-b"'].join('\n'),
      importPath => importPath,
    );
    expect(imports.map(imp => imp.path)).toEqual(['dep-a', 'dep-b']);
  });

  it('should handle requires', () => {
    const imports = findAllImports(
      'file.ts',
      ['require("dep-a")', 'require(`dep-b`)'].join('\n'),
      importPath => importPath,
    );
    expect(imports.map(imp => imp.path)).toEqual(['dep-a', 'dep-b']);
  });

  it('should not handle Typescript namespace imports', () => {
    const imports = findAllImports(
      'file.ts',
      ['import NS2 = NS', 'import A = NS.A'].join('\n'),
      importPath => importPath,
    );
    expect(imports.map(imp => imp.path)).toEqual([]);
  });

  describe('dynamic module name warnings', () => {
    const consoleError = console.error;

    beforeEach(() => {
      console.error = jest.fn();
    });

    afterAll(() => {
      console.error = consoleError;
    });

    it('should log warning on require', () => {
      const imports = findAllImports(
        'file.ts',
        'require(process.env.DYNAMIC_VALUE)',
        importPath => importPath,
      );
      expect(imports.map(imp => imp.path)).toEqual([]);
      expect(console.error).toBeCalled();
    });

    it('should log warning on dynamic import', () => {
      const imports = findAllImports(
        'file.ts',
        'import(process.env.DYNAMIC_VALUE)',
        importPath => importPath,
      );
      expect(imports.map(imp => imp.path)).toEqual([]);
      expect(console.error).toBeCalled();
    });

    it('should not log on statically known module names', () => {
      findAllImports('file.ts', 'require("dep")', importPath => importPath);
      expect(console.error).not.toBeCalled();
    });
  });
});

// describe('findExtraPackageDependencies', () => {
//   it('should find all dependencies of a module', async () => {
//     const deps = await findExtraPackageDependencies(
//       path.resolve(__dirname, '..', '__fixtures__', 'example-monorepo','src','mod'),
//       'mod',
//     );
//     expect(deps).toEqual({
//       'root-dep': '1',
//     });
//   });
// });
