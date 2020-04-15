import { spawn } from 'child_process';

export const runCmd = ({ cmd, cwd }: { cmd: string; cwd: string }): Promise<void> =>
  new Promise((resolve, reject) => {
    const proc = spawn(cmd, { cwd, shell: true, stdio: 'inherit' });
    proc.on('exit', code => {
      if (code !== 0) reject(`Exited with code: ${code}`);
      else resolve();
    });
  });
