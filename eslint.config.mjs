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
      ],
    },
  },
]);

export default eslintConfig;
