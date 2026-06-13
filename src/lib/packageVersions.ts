import { readFile } from 'node:fs/promises';
import path from 'node:path';

type RegistryVersion = {
  version?: string;
};

export type PublishedPackageVersions = {
  python: string;
  npm: string;
  display: string;
};

const REVALIDATE_SECONDS = 60 * 60;

const readLocalPythonVersion = async () => {
  const pyproject = await readFile(path.join(process.cwd(), 'pyproject.toml'), 'utf8');
  const match = pyproject.match(/^version\s*=\s*"([^"]+)"/m);
  return match?.[1] ?? '0.0.0';
};

const readLocalNpmVersion = async () => {
  const packageJson = await readFile(path.join(process.cwd(), 'sdk/typescript/package.json'), 'utf8');
  const parsed = JSON.parse(packageJson) as RegistryVersion;
  return parsed.version ?? '0.0.0';
};

const fetchRegistryVersion = async (url: string) => {
  const response = await fetch(url, { next: { revalidate: REVALIDATE_SECONDS } });
  if (!response.ok) throw new Error(`Registry request failed: ${response.status}`);
  const payload = (await response.json()) as RegistryVersion | { info?: RegistryVersion };
  if ('info' in payload) return payload.info?.version;
  return (payload as RegistryVersion).version;
};

export async function getPublishedPackageVersions(): Promise<PublishedPackageVersions> {
  const [localPython, localNpm] = await Promise.all([readLocalPythonVersion(), readLocalNpmVersion()]);

  const [python, npm] = await Promise.all([
    fetchRegistryVersion('https://pypi.org/pypi/ward-protocol/json').catch(() => localPython),
    fetchRegistryVersion('https://registry.npmjs.org/@wardprotocol%2Fsdk/latest').catch(() => localNpm),
  ]);

  const safePython = python ?? localPython;
  const safeNpm = npm ?? localNpm;
  const display = safePython === safeNpm ? safePython : `PyPI ${safePython} · npm ${safeNpm}`;

  return {
    python: safePython,
    npm: safeNpm,
    display,
  };
}
