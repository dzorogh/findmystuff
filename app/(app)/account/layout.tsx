import type { Metadata } from "next";

export const metadata: Metadata = {
  title: {
    template: "%s - FindMyStuff",
    default: "Аккаунт",
  },
};

export default function AccountLayout({ children }: { children: React.ReactNode }) {
  return children;
}
