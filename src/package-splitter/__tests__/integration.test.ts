import path from 'path';
import fse from 'fs-extra';
import { Monorepo } from '../monorepo';

test('end-to-end', async () => {
  const rootDir = path.join(__dirname, '..', '__fixtures__', 'example-monorepo');
  const srcDir = path.join(rootDir, 'src');
  const publishDir = path.join(rootDir, 'dist');

  await fse.remove(publishDir);

  const monorepo = new Monorepo({
    rootDir,
    srcDir,
    publishDir,
    ignoreGlobs: ['dist'],
  });
  await monorepo.publish(async () => {});

  const modPackageJsonPath = path.join(publishDir, 'a', 'package.json');
  expect(await fse.pathExists(modPackageJsonPath)).toBe(true);
  const packageJson = await fse.readJson(modPackageJsonPath);
  expect(packageJson).toEqual({
    name: 'a',
    version: '1.2.3',
    bin: {
      cli: 'bin/cli.ts',
    },
    dependencies: {
      'root-dep': '1',
      'unimported-dep': '1',
      'version-override-dep': '2',
      b: '5.0.0',
    },
    optionalDependencies: {
      'optional-dep': '1',
    },
    peerDependencies: {
      'peer-dep': '1',
    },
  });
});
