import type { CapacitorConfig } from "@capacitor/cli";

const serverUrl = process.env.CAPACITOR_SERVER_URL;
const isHttpServer = serverUrl?.startsWith("http://");

const config: CapacitorConfig = {
  appId: "com.findmystuff.app",
  appName: "FindMyStuff",
  webDir: "out",
  server: serverUrl
    ? {
        url: serverUrl,
        cleartext: Boolean(isHttpServer),
      }
    : undefined,
};

export default config;
