import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Печать этикетки",
};

export default function PrintLabelLayout({ children }: { children: React.ReactNode }) {
  return children;
}
