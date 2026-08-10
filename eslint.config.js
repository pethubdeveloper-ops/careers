import js from "@eslint/js";
import globals from "globals";
import reactHooks from "eslint-plugin-react-hooks";
import reactRefresh from "eslint-plugin-react-refresh";
import tseslint from "typescript-eslint";

export default tseslint.config(
  { ignores: ["dist", "design/reference", "mobile/node_modules"] },
  {
    extends: [js.configs.recommended, ...tseslint.configs.recommended],
    files: ["**/*.{ts,tsx}"],
    languageOptions: {
      ecmaVersion: 2022,
      globals: globals.browser,
    },
    plugins: {
      "react-hooks": reactHooks,
      "react-refresh": reactRefresh,
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      "react-refresh/only-export-components": [
        "warn",
        { allowConstantExport: true },
      ],
    },
  },
  {
    // Test files and helpers are never hot-reloaded.
    files: ["**/*.test.{ts,tsx}", "src/test/**"],
    rules: { "react-refresh/only-export-components": "off" },
  },
  {
    // The mobile app is React Native, not a Vite page: hot reload there does
    // not care whether a file exports helpers alongside its component, and
    // globals are React Native's, not the browser's.
    files: ["mobile/**/*.{ts,tsx}"],
    languageOptions: { globals: {} },
    rules: {
      "react-refresh/only-export-components": "off",
    },
  },
);
