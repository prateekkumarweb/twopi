import pluginJs from "@eslint/js";
import pluginQuery from "@tanstack/eslint-plugin-query";
import * as tsParser from "@typescript-eslint/parser";
import eslintConfigPrettier from "eslint-config-prettier";
import oxlint from "eslint-plugin-oxlint";
import solid from "eslint-plugin-solid/configs/typescript";
import sonarjs from "eslint-plugin-sonarjs";
import globals from "globals";
import tseslint from "typescript-eslint";

/** @type {import('eslint').Linter.Config[]} */
export default [
  { files: ["**/*.{js,mjs,cjs,ts,jsx,tsx}"] },
  { ignores: ["dist"] },
  { languageOptions: { globals: { ...globals.browser, ...globals.node } } },
  pluginJs.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ["src/**/*.{ts,tsx}"],
    ...solid,
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        project: "tsconfig.app.json",
      },
    },
  },
  ...pluginQuery.configs["flat/recommended"],
  {
    rules: {
      "@typescript-eslint/no-unused-vars": "warn",
      "@typescript-eslint/consistent-type-imports": "error",
    },
  },
  sonarjs.configs.recommended,
  {
    rules: {
      "sonarjs/function-return-type": "off",
      "sonarjs/class-name": "off",
      "sonarjs/todo-tag": "off",
    },
  },
  ...oxlint.configs["flat/recommended"],
  eslintConfigPrettier,
];
