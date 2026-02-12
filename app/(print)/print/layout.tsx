import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Печать",
};

export default function PrintSectionLayout({ children }: { children: React.ReactNode }) {
  return children;
}
