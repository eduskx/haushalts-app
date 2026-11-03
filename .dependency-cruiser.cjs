// Mirrors the "Darf importieren" table in docs/module-contract.md. Change both together.
// Every package may use the config presets, because they are tooling and not runtime code.
const KIT_IMPORTS = {
  config: [],
  core: [],
  ui: ["core"],
  auth: ["core", "ui"],
  spaces: ["core", "auth", "ui"],
  sync: ["core"],
  media: ["core"],
  activity: ["core", "spaces"],
  notify: ["core"],
};

const kitRules = Object.entries(KIT_IMPORTS).map(([name, allowed]) => ({
  name: `kit-${name}-imports`,
  severity: "error",
  comment: `packages/kit/${name} may import: config${allowed.map((a) => `, ${a}`).join("")}.`,
  from: { path: `^packages/kit/${name}/` },
  to: {
    path: "^packages/kit/",
    pathNot: `^packages/kit/(${[name, "config", ...allowed].join("|")})/`,
  },
}));

module.exports = {
  forbidden: [
    {
      name: "kit-not-to-features",
      severity: "error",
      comment: "packages/kit never imports from packages/features.",
      from: { path: "^packages/kit/" },
      to: { path: "^packages/features/" },
    },
    {
      name: "packages-not-to-apps",
      severity: "error",
      comment: "packages/ never imports from apps/.",
      from: { path: "^packages/" },
      to: { path: "^apps/" },
    },
    {
      name: "features-not-to-features",
      severity: "error",
      comment: "Feature modules do not know each other.",
      from: { path: "^packages/features/([^/]+)/" },
      to: { path: "^packages/features/", pathNot: "^packages/features/$1/" },
    },
    {
      name: "kit-package-not-in-contract",
      severity: "error",
      comment: "A kit package missing from the contract table may not import other kit packages.",
      from: {
        path: "^packages/kit/",
        pathNot: `^packages/kit/(${Object.keys(KIT_IMPORTS).join("|")})/`,
      },
      to: { path: "^packages/kit/", pathNot: "^packages/kit/config/" },
    },
    ...kitRules,
  ],
  options: {
    doNotFollow: { path: "node_modules" },
    exclude: { path: "(^|/)(dist|coverage|\\.turbo)/" },
    tsPreCompilationDeps: true,
    combinedDependencies: true,
  },
};
