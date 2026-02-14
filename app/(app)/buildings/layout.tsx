import type { Metadata } from "next";

export const metadata: Metadata = {
  title: {
    template: "%s - FindMyStuff",
    default: "Здания",
  },
};

export default function BuildingsLayout({ children }: { children: React.ReactNode }) {
  return children;
}
