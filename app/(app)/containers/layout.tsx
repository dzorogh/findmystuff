import type { Metadata } from "next";

export const metadata: Metadata = {
  title: {
    template: "%s - FindMyStuff",
    default: "Контейнеры",
  },
};

export default function ContainersLayout({ children }: { children: React.ReactNode }) {
  return children;
}
