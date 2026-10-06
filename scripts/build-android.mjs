import { spawn } from 'node:child_process';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const node = process.execPath;
const capacitorCli = path.join(projectRoot, 'node_modules', '@capacitor', 'cli', 'bin', 'capacitor');
const viteCli = path.join(projectRoot, 'node_modules', 'vite', 'bin', 'vite.js');

function run(command, args, cwd = projectRoot) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, { cwd, stdio: 'inherit', windowsHide: true });
    child.once('error', reject);
    child.once('exit', code => {
      if (code === 0) resolve();
      else reject(new Error(`${command} exited with code ${code}`));
    });
  });
}

try {
  await run(node, [viteCli, 'build']);
  await run(node, [capacitorCli, 'sync', 'android']);

  if (process.platform === 'win32') {
    const driveLetter = [...'ZYXWVUTSRQPON'].find(letter => !existsSync(`${letter}:\\`));
    if (!driveLetter) throw new Error('No unused drive letter is available for the Gradle path workaround.');

    const drive = `${driveLetter}:`;
    const systemRoot = process.env.SystemRoot || 'C:\\Windows';
    await run(path.join(systemRoot, 'System32', 'subst.exe'), [drive, projectRoot]);
    try {
      await run('cmd.exe', ['/d', '/s', '/c', `${drive}\\android\\gradlew.bat assembleDebug`]);
    } finally {
      await run(path.join(systemRoot, 'System32', 'subst.exe'), [drive, '/d']);
    }
  } else {
    await run(path.join(projectRoot, 'android', 'gradlew'), ['assembleDebug'], path.join(projectRoot, 'android'));
  }

  console.log(`\nAPK created at ${path.join(projectRoot, 'android', 'app', 'build', 'outputs', 'apk', 'debug', 'app-debug.apk')}`);
} catch (error) {
  console.error(error.message);
  process.exitCode = 1;
}