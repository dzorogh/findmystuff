import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

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
  // Правила для компонентов, страниц и хуков (запрещаем прямые запросы)
  {
    files: [
      "app/**/*.{ts,tsx}",
      "components/**/*.{ts,tsx}",
      "hooks/**/*.{ts,tsx}",
    ],
    ignores: [
      "app/api/**",           // API routes разрешены
      "components/auth/**",   // Auth компоненты разрешены
      "components/navigation/sidebar.tsx", // Использует только для auth.signOut()
      "components/navigation/top-bar.tsx", // Использует только для auth.signOut()
    ],
    rules: {
      // Запрещаем импорт createClient из @/lib/supabase/client
      "no-restricted-imports": [
        "error",
        {
          paths: [
            {
              name: "@/lib/supabase/client",
              message: "Импорт createClient из @/lib/supabase/client разрешен только в сервисах (lib/), API routes (app/api/), контекстах (contexts/) и auth компонентах (components/auth/). Используйте apiClient из @/lib/api-client",
              allowTypeImports: true,
            },
          ],
        },
      ],
      // Запрещаем использование fetch
      "no-restricted-syntax": [
        "error",
        {
          selector: "CallExpression[callee.name='fetch']",
          message: "Прямые fetch-запросы разрешены только в сервисах (lib/), API routes (app/api/) и контекстах (contexts/). Используйте apiClient из @/lib/api-client",
        },
        // Запрещаем Supabase методы .from() - проверяем, что это вызывается на объекте supabase
        {
          selector: "CallExpression[callee.type='MemberExpression'][callee.property.name='from']",
          message: "Прямые Supabase запросы (.from()) разрешены только в сервисах (lib/), API routes (app/api/) и контекстах (contexts/). Используйте apiClient из @/lib/api-client",
        },
        // Запрещаем Supabase методы .rpc()
        {
          selector: "CallExpression[callee.type='MemberExpression'][callee.property.name='rpc']",
          message: "Прямые Supabase запросы (.rpc()) разрешены только в сервисах (lib/), API routes (app/api/) и контекстах (contexts/). Используйте apiClient из @/lib/api-client",
        },
        // Запрещаем Supabase методы .insert() - только если это часть цепочки запросов
        {
          selector: "CallExpression[callee.type='MemberExpression'][callee.property.name='insert'][callee.object.type='MemberExpression']",
          message: "Прямые Supabase запросы (.insert()) разрешены только в сервисах (lib/), API routes (app/api/) и контекстах (contexts/). Используйте apiClient из @/lib/api-client",
        },
        // Запрещаем Supabase методы .update() - только если это часть цепочки запросов
        {
          selector: "CallExpression[callee.type='MemberExpression'][callee.property.name='update'][callee.object.type='MemberExpression']",
          message: "Прямые Supabase запросы (.update()) разрешены только в сервисах (lib/), API routes (app/api/) и контекстах (contexts/). Используйте apiClient из @/lib/api-client",
        },
        // Запрещаем Supabase методы .delete() - только если это часть цепочки запросов (не params.delete)
        {
          selector: "CallExpression[callee.type='MemberExpression'][callee.property.name='delete'][callee.object.type='MemberExpression']",
          message: "Прямые Supabase запросы (.delete()) разрешены только в сервисах (lib/), API routes (app/api/) и контекстах (contexts/). Используйте apiClient из @/lib/api-client",
        },
        // Запрещаем Supabase auth методы .auth.getUser() и .auth.getSession() - только в компонентах (не в контекстах и auth компонентах)
        {
          selector: "CallExpression[callee.type='MemberExpression'][callee.property.name='getUser'][callee.object.type='MemberExpression'][callee.object.property.name='auth']",
          message: "Прямые запросы к auth API (.auth.getUser()) разрешены только в сервисах (lib/), API routes (app/api/), контекстах и auth компонентах (components/auth/). Используйте хук useUser из @/lib/users/context",
        },
        {
          selector: "CallExpression[callee.type='MemberExpression'][callee.property.name='getSession'][callee.object.type='MemberExpression'][callee.object.property.name='auth']",
          message: "Прямые запросы к auth API (.auth.getSession()) разрешены только в сервисах (lib/), API routes (app/api/), контекстах и auth компонентах (components/auth/). Используйте хук useUser из @/lib/users/context",
        },
      ],
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
