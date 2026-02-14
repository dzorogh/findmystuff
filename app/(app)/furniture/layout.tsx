import type { Metadata } from "next";

export const metadata: Metadata = {
  title: {
    template: "%s - FindMyStuff",
    default: "Мебель",
  },
};

export default function FurnitureLayout({ children }: { children: React.ReactNode }) {
  return children;
}
