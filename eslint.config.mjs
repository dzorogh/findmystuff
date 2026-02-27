import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";


/** Пути, где разрешены прямые запросы к Supabase и fetch (в остальных местах запрещены) */
const fetchAndSupabaseAllowedPaths = [
  "lib/*/api.ts",
  "lib/shared/api/**/*.ts",
  "app/api/**/*.ts",
  "app/(auth)/**/*.{ts,tsx}",
  "contexts/**/*.{ts,tsx}",
  "components/auth/**/*.{ts,tsx}",
];

const ALLOWED_PATHS_HINT = "Прямые запросы разрешены только в " + fetchAndSupabaseAllowedPaths.join(", ") + ".";

/** Правила: fetch и прямые запросы к Supabase запрещены везде, кроме fetchAndSupabaseAllowedPaths */
const fetchAndSupabaseRestrictedSyntax = [
  { selector: "CallExpression[callee.name='fetch']", message: `Прямые fetch-запросы запрещены. ${ALLOWED_PATHS_HINT}` },
  { selector: "CallExpression[callee.type='MemberExpression'][callee.property.name='rpc']", message: `Прямые Supabase запросы (.rpc()) запрещены. ${ALLOWED_PATHS_HINT}` },
  { selector: "CallExpression[callee.type='MemberExpression'][callee.property.name='insert'][callee.object.type='MemberExpression']", message: `Прямые Supabase запросы (.insert()) запрещены. ${ALLOWED_PATHS_HINT}` },
  { selector: "CallExpression[callee.type='MemberExpression'][callee.property.name='update'][callee.object.type='MemberExpression']", message: `Прямые Supabase запросы (.update()) запрещены. ${ALLOWED_PATHS_HINT}` },
  { selector: "CallExpression[callee.type='MemberExpression'][callee.property.name='delete'][callee.object.type='MemberExpression']", message: `Прямые Supabase запросы (.delete()) запрещены. ${ALLOWED_PATHS_HINT}` },
  { selector: "CallExpression[callee.type='MemberExpression'][callee.property.name='getUser'][callee.object.type='MemberExpression'][callee.object.property.name='auth']", message: `Прямые запросы к auth API (.auth.getUser()) запрещены. ${ALLOWED_PATHS_HINT}` },
  { selector: "CallExpression[callee.type='MemberExpression'][callee.property.name='getSession'][callee.object.type='MemberExpression'][callee.object.property.name='auth']", message: `Прямые запросы к auth API (.auth.getSession()) запрещены. ${ALLOWED_PATHS_HINT}` },
];



const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    "coverage/**",
    // Android build files
    "android/**",
  ]),
  // JSX и общие правила для app, components, hooks, lib
  {
    files: [
      "app/**/*.{ts,tsx}",
      "components/**/*.{ts,tsx}",
      "hooks/**/*.{ts,tsx}",
      "lib/**/*.{ts,tsx}",
    ],
    rules: {
      "react/jsx-first-prop-new-line": ["error", "multiline-multiprop"],
      "react/jsx-max-props-per-line": ["error", { maximum: 1, when: "multiline" }],
    },
  },
  // Fetch и прямые запросы к Supabase: запрет для app/components/hooks/lib
  {
    files: [
      "app/**/*.{ts,tsx}",
      "components/**/*.{ts,tsx}",
      "hooks/**/*.{ts,tsx}",
      "lib/**/*.{ts,tsx}",
    ],
    rules: {
      "no-restricted-syntax": ["error", ...fetchAndSupabaseRestrictedSyntax],
    },
  },
  // В этих путях разрешены и Supabase, и fetch, и auth
  {
    files: fetchAndSupabaseAllowedPaths,
    rules: {
      "no-restricted-syntax": "off",
    },
  },
  // Игнорировать переменные/аргументы с префиксом _ (намеренно неиспользуемые)
  {
    files: ["**/*.{ts,tsx,js,jsx}"],
    rules: {
      "@typescript-eslint/no-unused-vars": ["warn", { "argsIgnorePattern": "^_", "varsIgnorePattern": "^_" }],
    },
  },
  // Тесты и скрипты: разрешаем any, require и неиспользуемые переменные
  {
    files: [
      "**/__tests__/**/*.{ts,tsx}",
      "**/e2e/**/*.{ts,tsx}",
      "jest.config.js",
      "scripts/**/*.js",
    ],
    rules: {
      "@typescript-eslint/no-explicit-any": "off",
      "@typescript-eslint/no-require-imports": "off",
      "@next/next/no-img-element": "off",
      "@typescript-eslint/no-unused-vars": "off",
    },
  },
]);

export default eslintConfig;
