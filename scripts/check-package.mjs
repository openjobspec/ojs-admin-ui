import {
  mkdirSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const pkg = JSON.parse(readFileSync(path.join(root, 'package.json'), 'utf8'));
const lock = JSON.parse(
  readFileSync(path.join(root, 'package-lock.json'), 'utf8'),
);
const changelog = readFileSync(path.join(root, 'CHANGELOG.md'), 'utf8');
if (lock.version !== pkg.version || lock.packages['']?.version !== pkg.version) {
  throw new Error('package.json and package-lock.json versions do not match');
}
if (!changelog.includes(`## [${pkg.version}]`)) {
  throw new Error(`CHANGELOG.md has no ${pkg.version} release heading`);
}
const scratch = path.join(root, '.package-smoke');
let tarball;

try {
  rmSync(scratch, { recursive: true, force: true });
  mkdirSync(scratch, { recursive: true });

  const dryRun = JSON.parse(run('npm', ['pack', '--dry-run', '--json'], root))[0];
  const files = new Set(dryRun.files.map((file) => file.path));
  for (const required of [pkg.main, pkg.types, 'dist/index.css']) {
    if (!files.has(required)) {
      throw new Error(`Packed package omitted required file: ${required}`);
    }
  }

  const packed = JSON.parse(
    run('npm', ['pack', '--json', '--pack-destination', scratch], root),
  )[0];
  tarball = path.join(scratch, packed.filename);

  const packageDir = path.join(
    scratch,
    'consumer',
    'node_modules',
    '@openjobspec',
    'admin-ui',
  );
  mkdirSync(packageDir, { recursive: true });
  run('tar', ['-xzf', tarball, '--strip-components=1', '-C', packageDir], root);

  const consumerDir = path.join(scratch, 'consumer');
  writeFileSync(
    path.join(consumerDir, 'package.json'),
    JSON.stringify({ private: true, type: 'module' }),
  );
  writeFileSync(
    path.join(consumerDir, 'consumer.mjs'),
    "import { mountOJSAdmin, OJSAdminClient } from '@openjobspec/admin-ui';\n" +
      "if (typeof mountOJSAdmin !== 'function' || typeof OJSAdminClient !== 'function') process.exit(1);\n",
  );
  run(process.execPath, ['consumer.mjs'], consumerDir);

  writeFileSync(
    path.join(consumerDir, 'consumer.ts'),
    "import { mountOJSAdmin, OJSAdminClient } from '@openjobspec/admin-ui';\n" +
      'void mountOJSAdmin;\nvoid OJSAdminClient;\n',
  );
  writeFileSync(
    path.join(consumerDir, 'tsconfig.json'),
    JSON.stringify({
      compilerOptions: {
        target: 'ES2022',
        module: 'ESNext',
        moduleResolution: 'Bundler',
        lib: ['ES2022', 'DOM'],
        strict: true,
        noEmit: true,
        skipLibCheck: false,
      },
      files: ['consumer.ts'],
    }),
  );
  const tsc = path.join(root, 'node_modules', 'typescript', 'bin', 'tsc');
  run(process.execPath, [tsc, '-p', 'tsconfig.json'], consumerDir);

  console.log(
    `Verified ${pkg.name}@${pkg.version} dry-run contents, packed runtime imports, and consumer types.`,
  );
} finally {
  if (tarball) rmSync(tarball, { force: true });
  rmSync(scratch, { recursive: true, force: true });
}

function run(command, args, cwd) {
  const result = spawnSync(command, args, {
    cwd,
    encoding: 'utf8',
    env: process.env,
  });
  if (result.status !== 0) {
    throw new Error(
      `${command} ${args.join(' ')} failed\n${result.stdout}\n${result.stderr}`,
    );
  }
  return result.stdout.trim();
}
