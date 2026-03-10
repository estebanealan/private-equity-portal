const config = {
  extends: ["@commitlint/config-conventional"],
  rules: {
    "type-enum": [
      2,
      "always",
      ["feat", "fix", "chore", "docs", "refactor", "perf", "test", "ci", "build", "revert"],
    ],
    "subject-case": [2, "never", ["start-case", "pascal-case", "upper-case"]],
    "subject-max-length": [2, "always", 72],
    "body-max-line-length": [2, "always", 100],
    "subject-empty": [2, "never"],
    "type-empty": [2, "never"],
    "scope-case": [2, "always", "lower-case"],
  },
};

export default config;
