import { Monorepo, MonorepoProps } from '../monorepo';
import { Package } from '../package';

describe('Monorepo', () => {
  const testProps: MonorepoProps = {
    rootDir: '/root',
    srcDir: '/root/src',
    buildDir: '/root/build',
    publishDir: '/root/publish',
    ignoreGlobs: ['__*__'],
    ignoreGitignored: true,
    packageNamePrefix: '@test/',
  };

  describe('getPackageNamePrefix', () => {
    it('gets prefix', () => {
      const monorepo = new Monorepo(testProps);
      expect(monorepo.getPackageNamePrefix()).toBe('@test/');
    });

    it('returns an empty string if there is no prefix', () => {
      const monorepo = new Monorepo({ ...testProps, packageNamePrefix: undefined });
      expect(monorepo.getPackageNamePrefix()).toBe('');
    });
  });

  describe('getImportPathResolver', () => {
    it('returns the resolver', () => {
      const monorepo = new Monorepo({ ...testProps, importPathResolver: () => 'x' });
      expect(monorepo.getImportPathResolver()('a')).toBe('x');
    });

    it('returns an identity function if there is no resolver', () => {
      const monorepo = new Monorepo(testProps);
      expect(monorepo.getImportPathResolver()('a')).toBe('a');
    });
  });

  describe('getPackageAtPath', () => {
    it('returns a package', () => {
      const monorepo = new Monorepo(testProps);
      const relativePath = 'a';
      const pack = monorepo.getPackageAtPath(relativePath);
      expect(pack).toBeInstanceOf(Package);
      expect(pack.monorepo).toBe(monorepo);
      expect(pack.relativePath).toBe(relativePath);
    });

    it('returns cached packages', () => {
      const monorepo = new Monorepo(testProps);
      const relativePath = 'a';
      const pack1 = monorepo.getPackageAtPath(relativePath);
      const pack2 = monorepo.getPackageAtPath(relativePath);
      expect(pack1).toBe(pack2);
    });
  });

  describe('prepare', () => {
    it('calls .prepare() on all packages', async () => {
      const monorepo = new Monorepo(testProps);
      const createPackage = (relativePath: string) => {
        const pack = monorepo.getPackageAtPath(relativePath);
        pack.prepare = jest.fn(async () => {});
        return pack;
      };
      const packages = [createPackage('/a'), createPackage('/b'), createPackage('/c')];
      monorepo.getAllPackages = async () => packages;

      await monorepo.prepare();
      for (const pack of packages) {
        expect(pack.prepare).toBeCalled();
      }
    });
  });
});
