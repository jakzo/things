import { Monorepo, MonorepoProps } from '../monorepo';

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
});
