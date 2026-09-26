import js from "@eslint/js";
import globals from "globals";
import tseslint from "typescript-eslint";
import pluginReact from "eslint-plugin-react";
import { defineConfig } from "eslint/config";

export default defineConfig([
  js.configs.recommended,
  tseslint.configs.recommended,
  pluginReact.configs.flat.recommended,
  {
    files: ["**/*.{js,mjs,cjs,ts,mts,cts,jsx,tsx}"],
    languageOptions: { globals: globals.browser },
    settings: { react: { version: "detect" } },
    rules: {
      "react/jsx-uses-react": "off",
      "react/react-in-jsx-scope": "off",
    },
  },
  {
    files: [
      "jest.setup.ts",
      "src/screens/auth/SignInScreen.tsx",
      "src/screens/splash/SplashScreen.tsx",
    ],
    rules: {
      "@typescript-eslint/no-require-imports": "off",
    },
  },
]);
