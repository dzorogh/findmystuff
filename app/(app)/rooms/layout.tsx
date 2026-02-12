import type { Metadata } from "next";

export const metadata: Metadata = {
  title: {
    template: "%s - FindMyStuff",
    default: "Помещения",
  },
};

export default function RoomsLayout({ children }: { children: React.ReactNode }) {
  return children;
}
