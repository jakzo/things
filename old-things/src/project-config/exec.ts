import { spawn } from 'child_process';

export const exec = ({ cmd, args = [], cwd }: { cmd: string; args?: string[]; cwd?: string }) =>
  new Promise((resolve, reject) => {
    const proc = spawn(cmd, args, {
      stdio: 'inherit',
      cwd,
    });
    proc.on('close', code => {
      if (code !== 0) reject(new Error(`${cmd} exited with code ${code}`));
      else resolve();
    });
  });
