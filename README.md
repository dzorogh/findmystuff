This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

## Android (Capacitor)

Приложение запускается как нативная оболочка над работающим Next.js сервером.

1. Установить зависимости: `npm install`
2. Один раз создать Android-проект: `npm run android:add`
3. Dev-сервер и синхронизация:
   - `npm run dev:external`
   - `CAPACITOR_SERVER_URL="http://<LAN-IP>:3000" npm run android:sync`
4. Открыть Android Studio: `npm run android:open`

Продакшен URL:
`CAPACITOR_SERVER_URL="https://<DOMAIN>" npm run android:sync`

## QR-сканнер и доступ к камере

Для работы QR-сканнера на мобильных устройствах требуется HTTPS соединение. Используйте Cloudflare Tunnel для доступа к локальному серверу разработки:

1. Установите `cloudflared`: `brew install cloudflare/cloudflare/cloudflared` (macOS)
2. Запустите dev сервер: `pnpm dev`
3. В отдельном терминале запустите туннель: `pnpm dev:tunnel`
4. Откройте предоставленный HTTPS URL на телефоне

Подробная инструкция: [CLOUDFLARE_TUNNEL_SETUP.md](./CLOUDFLARE_TUNNEL_SETUP.md)

## Cursor MCP (Supabase)

В `.cursor/mcp.json` не хранится проект-специфичный Supabase URL. Чтобы подключить Supabase MCP: скопируйте `.cursor/mcp.example` в `.cursor/mcp.local.json`, подставьте свой Project Reference (Supabase Dashboard → Settings → General). Либо настройте MCP в Cursor Settings / `~/.cursor/mcp.json`. Подробнее: [.cursor/README.md](.cursor/README.md) и [SUPABASE_MCP_SETUP.md](SUPABASE_MCP_SETUP.md).

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
