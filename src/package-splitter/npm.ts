import { spawn } from 'child_process';
import pLimit from 'p-limit';

const globalNpmLimit = pLimit(16);

// Yarn sets this variable to Yarn's registry when running scripts.
// Set this to npm's registry in case the publish was triggered from Yarn.
// https://github.com/yarnpkg/yarn/issues/2935#issuecomment-355292633
const getNpmRegistry = () =>
  process.env.npm_config_registry === 'https://registry.yarnpkg.com'
    ? undefined
    : process.env.npm_config_registry;

export const publishPackage = async (preparedPackagePath: string): Promise<void> =>
  console.log('Publishing package at:', preparedPackagePath);
// globalNpmLimit(
//   () =>
//     new Promise((resolve, reject) => {
//       const proc = spawn('npm', ['publish'], {
//         cwd: preparedPackagePath,
//         env: Object.assign({}, process.env, {
//           // eslint-disable-next-line @typescript-eslint/camelcase
//           npm_config_registry: getNpmRegistry(),
//         }),
//         stdio: 'inherit',
//       });
//       proc.on('close', code => {
//         if (code === 0) resolve();
//         else reject(new Error(`npm failed with code: ${code}`));
//       });
//     }),
// );

export const getCurrentPackageVersion = async (packageName: string): Promise<string | undefined> =>
  globalNpmLimit(
    () =>
      new Promise((resolve, reject) => {
        const proc = spawn('npm', ['info', packageName, '--json'], {
          env: Object.assign({}, process.env, {
            // eslint-disable-next-line @typescript-eslint/camelcase
            npm_config_registry: getNpmRegistry(),
          }),
        });
        let stdout = '';
        proc.stdout.on('data', data => {
          stdout += data.toString();
        });
        proc.on('close', code => {
          let data;
          try {
            data = JSON.parse(stdout);
          } catch {}

          if (data?.error?.code === 'E404') {
            resolve(undefined);
            return;
          }

          if (code !== 0) {
            reject(new Error(`npm failed with code: ${code}`));
            return;
          }

          resolve(data?.version);
        });
      }),
  );
