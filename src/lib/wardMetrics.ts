export const WARD_MARKETING_STATS = {
  chainAdapters: 8,
  testsPassing: 660,
  coveragePercent: 92,
  formalInvariants: 32,
  suites: {
    pythonCore: 550,
    pythonSdk: 9,
    rust: 48,
    typescript: 53,
  },
} as const;

export const formatPackageVersion = (packageVersion: string) =>
  packageVersion.startsWith('PyPI') ? packageVersion : `v${packageVersion}`;

export const wardMarketingStatusLine = (packageVersion: string) =>
  `${formatPackageVersion(packageVersion)} · ${WARD_MARKETING_STATS.chainAdapters} chains · ${WARD_MARKETING_STATS.testsPassing} tests · ward_signed = False`;
