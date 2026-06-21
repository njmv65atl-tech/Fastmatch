import globals from "globals";
import pluginJs from "@eslint/js";
import tseslint from "@typescript-eslint/eslint-plugin";
import tsParser from "@typescript-eslint/parser";

/** @type {import('eslint').Linter.FlatConfig[]} */
export default [
  {
    files: ["**/*.{ts,tsx}"], // Include all TypeScript files (excluding mjs)
    languageOptions: {
      parser: tsParser, // Use TypeScript parser
      globals: {
        ...globals.browser,
        ...globals.node, // Include Node.js globals if needed
        Express: "readonly", // Declare Express as a global type
      },
    },
    plugins: {
      "@typescript-eslint": tseslint,
    },
    rules: {
      ...pluginJs.configs.recommended.rules, // Add recommended JS rules
      ...tseslint.configs.recommended.rules, // Add recommended TS rules

      "no-console": "off", // Warn on console usage

      // Restrict direct access to process.env
      "no-restricted-syntax": [
        "error",
        {
          selector: "MemberExpression[object.name='process'][property.name='env']",
          message: "Direct access to process.env is not allowed. Use config.ts instead.",
        },
      ],

      // Warn on the usage of 'any'
      "@typescript-eslint/no-explicit-any": "off", // Set 'any' usage as a offing
      "@typescript-eslint/no-namespace": "off",

      // Set unused variable offings as 'off'
      "no-unused-vars": "off", // Warn on unused vars for JavaScript files
      "@typescript-eslint/no-unused-vars": [
        "off",
        { argsIgnorePattern: "^_", varsIgnorePattern: "^_" }, // Allow _ as unused variable prefix
      ], // TypeScript-specific unused vars
    },
  },
  {
    // Allow process.env usage only in config.ts and serverValidator.ts
    files: ["src/config/config.ts", "src/config/serverValidator.ts"], // Adjust path to match your project structure
    rules: {
      "no-restricted-syntax": "off", // Disable the restriction for process.env in these files
    },
  },
  {
    // Example for path alias handling (if using import plugin)
    settings: {
      "import/resolver": {
        typescript: {
          project: "./tsconfig.json", // Point to your tsconfig.json
        },
      },
    },
  },
];