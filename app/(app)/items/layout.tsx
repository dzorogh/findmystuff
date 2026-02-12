import type { Metadata } from "next";

export const metadata: Metadata = {
  title: {
    template: "%s - FindMyStuff",
    default: "Вещи",
  },
};

export default function ItemsLayout({ children }: { children: React.ReactNode }) {
  return children;
}
