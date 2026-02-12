import type { Metadata } from "next";

export const metadata: Metadata = {
  title: {
    template: "%s - FindMyStuff",
    default: "Места",
  },
};

export default function PlacesLayout({ children }: { children: React.ReactNode }) {
  return children;
}
