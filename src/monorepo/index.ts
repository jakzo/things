import { MonorepoProps, Monorepo } from './monorepo';

export { Monorepo, MonorepoProps } from './monorepo';
export { Package, PackageProps } from './package';

export const buildAndPublishPackages = async (opts: MonorepoProps) => {
  const monorepo = new Monorepo(opts);
  await monorepo.prepare();
  // await monorepo.publish();
};
