// Import boundaries per design D2: modules never import each other, and the
// shell never reaches into a specific module. Conventions do not survive a
// tired evening; this does.
const expoConfig = require('eslint-config-expo/flat');
const boundaries = require('eslint-plugin-boundaries');

module.exports = [
  ...expoConfig,
  {
    ignores: ['dist/*', '.expo/*', 'node_modules/*'],
  },
  {
    files: ['src/**/*.{js,jsx,ts,tsx}'],
    plugins: { boundaries },
    settings: {
      // Expo's config only registers the node resolver, which cannot follow
      // the `@/…` path aliases in tsconfig.json.
      'import/resolver': {
        typescript: { project: './tsconfig.json' },
      },
      'boundaries/include': ['src/**/*'],
      // `partialMatch: false` matches the pattern against the whole file path.
      // The default classifies by folder, which leaves files sitting directly
      // in src/shell/ or src/core/ unclassified — and an unclassified file is
      // silently exempt from every policy below, which is the one failure mode
      // this rule cannot afford.
      'boundaries/elements': [
        {
          type: 'module',
          pattern: 'src/modules/*/**',
          partialMatch: false,
          capture: ['moduleName'],
        },
        { type: 'core', pattern: 'src/core/**', partialMatch: false },
        { type: 'shell', pattern: 'src/shell/**', partialMatch: false },
        { type: 'route', pattern: 'src/app/**', partialMatch: false },
        {
          type: 'shared',
          pattern: 'src/(components|hooks|constants)/**',
          partialMatch: false,
        },
      ],
    },
    rules: {
      'boundaries/dependencies': [
        'error',
        {
          default: 'disallow',
          policies: [
            // core is the shared domain: it must not know about any module,
            // nor about the shell.
            {
              from: { element: { type: 'core' } },
              allow: {
                to: { element: { types: { anyOf: ['core', 'shared'] } } },
              },
            },
            // The shell learns what modules exist from the registry, never by
            // importing one (design D2).
            {
              from: { element: { type: 'shell' } },
              allow: {
                to: {
                  element: { types: { anyOf: ['shell', 'core', 'shared'] } },
                },
              },
            },
            // Route files are the shell's entry points.
            {
              from: { element: { type: 'route' } },
              allow: {
                to: {
                  element: {
                    types: { anyOf: ['route', 'shell', 'core', 'shared'] },
                  },
                },
              },
            },
            // A module may import core, but never a sibling module — shared
            // behaviour belongs in core/ (design D2).
            {
              from: { element: { type: 'module' } },
              allow: {
                to: { element: { types: { anyOf: ['core', 'shared'] } } },
              },
            },
            {
              from: { element: { type: 'module' } },
              allow: {
                to: {
                  element: {
                    type: 'module',
                    captured: { moduleName: '{{from.moduleName}}' },
                  },
                },
              },
            },
            {
              from: { element: { type: 'shared' } },
              allow: { to: { element: { type: 'shared' } } },
            },
          ],
        },
      ],
    },
  },
];
