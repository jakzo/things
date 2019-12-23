import { PackageJson } from 'type-fest';

import { Package, PackageDependencies } from '../package';
import { Monorepo } from '../monorepo';

describe('Package', () => {
  const createMockMonorepo = () =>
    new Monorepo({
      rootDir: '/root',
      srcDir: '/root/src',
      publishDir: '/root/publish',
      ignoreGlobs: [],
    });

  describe('getFullPackageJson', () => {
    const createMockPackage = (
      monorepo: Monorepo,
      relativePath: string,
      {
        name = 'package',
        isRootPackage = false,
        partialPackageJson = {},
        dependencies = { dependencies: {}, optionalDependencies: {}, peerDependencies: {} },
        binaries = {},
        parent,
      }: {
        name?: string;
        isRootPackage?: boolean;
        partialPackageJson?: PackageJson;
        binaries?: { [binary: string]: string };
        dependencies?: PackageDependencies;
        parent?: Package;
      },
    ) => {
      const mockPackage = monorepo.getPackageAtPath(relativePath);
      const resolvedParent =
        parent ||
        (isRootPackage ? mockPackage : createMockPackage(monorepo, '.', { isRootPackage: true }));
      mockPackage.isRootPackage = () => isRootPackage;
      mockPackage.getGeneratedName = () => name;
      mockPackage.getPartialPackageJson = async () => partialPackageJson;
      mockPackage.getBinaries = async () => binaries;
      mockPackage.getDependencies = async () => dependencies;
      mockPackage.getParent = async () => resolvedParent;
      return mockPackage;
    };

    it('should return package.json if it is the root package', async () => {
      const mockPackage = new Package({
        monorepo: createMockMonorepo(),
        relativePath: 'a',
      });
      const partialPackageJson = {};
      mockPackage.isRootPackage = () => true;
      mockPackage.getPartialPackageJson = async () => partialPackageJson;

      expect(await mockPackage.getFullPackageJson()).toBe(partialPackageJson);
    });

    it('should return package.json with properties from ancestor packages', async () => {
      const monorepo = createMockMonorepo();
      const testPackage = createMockPackage(monorepo, 'a/b', {
        name: 'test',
        partialPackageJson: { repository: 'repository' },
        parent: createMockPackage(monorepo, 'a', {
          partialPackageJson: { license: 'license' },
          parent: createMockPackage(monorepo, '.', {
            isRootPackage: true,
            partialPackageJson: { author: 'author' },
          }),
        }),
      });

      const packageJson = await testPackage.getFullPackageJson();

      // Ignore these fields because they are not important for the test
      delete packageJson.bin;
      delete packageJson.dependencies;
      delete packageJson.optionalDependencies;
      delete packageJson.peerDependencies;

      expect(packageJson).toEqual({
        name: 'test',
        author: 'author',
        license: 'license',
        repository: 'repository',
      });
    });

    it('should return custom properties from package.json but not from ancestor packages', async () => {
      const monorepo = createMockMonorepo();
      const testPackage = createMockPackage(monorepo, 'a/b', {
        partialPackageJson: { customA: 'a' },
        parent: createMockPackage(monorepo, 'a', {
          partialPackageJson: { customB: 'b' },
        }),
      });

      const packageJson = await testPackage.getFullPackageJson();

      // Ignore these fields because they are not important for the test
      delete packageJson.name;
      delete packageJson.bin;
      delete packageJson.dependencies;
      delete packageJson.optionalDependencies;
      delete packageJson.peerDependencies;

      expect(packageJson).toEqual({
        customA: 'a',
      });
    });

    it('should override with name from package.json', async () => {
      const monorepo = createMockMonorepo();
      const testPackage = createMockPackage(monorepo, 'a/b', {
        name: 'wrong',
        partialPackageJson: { name: 'test' },
        parent: createMockPackage(monorepo, 'a', {
          partialPackageJson: { name: 'wrong' },
          parent: createMockPackage(monorepo, '.', {
            isRootPackage: true,
            partialPackageJson: { name: 'wrong' },
          }),
        }),
      });

      const packageJson = await testPackage.getFullPackageJson();
      expect(packageJson.name).toBe('test');
    });

    it('should fall back to generated name', async () => {
      const monorepo = createMockMonorepo();
      const testPackage = createMockPackage(monorepo, 'a', {
        name: 'generated',
      });

      const packageJson = await testPackage.getFullPackageJson();
      expect(packageJson.name).toBe('generated');
    });

    it('should get binary and dependency properties separately', async () => {
      const monorepo = createMockMonorepo();
      const binaries = {};
      const dependencies = {
        dependencies: {},
        optionalDependencies: {},
        peerDependencies: {},
      };
      const testPackage = createMockPackage(monorepo, 'a', {
        binaries,
        dependencies,
      });

      const packageJson = await testPackage.getFullPackageJson();
      expect(packageJson.bin).toBe(binaries);
      expect(packageJson.dependencies).toBe(dependencies.dependencies);
      expect(packageJson.optionalDependencies).toBe(dependencies.optionalDependencies);
      expect(packageJson.peerDependencies).toBe(dependencies.peerDependencies);
    });
  });
});
