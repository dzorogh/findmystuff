import type { Metadata } from "next";
import { PageHeader } from "@/components/layout/page-header";
import { HomeQuickActions } from "@/components/home/home-quick-actions";

export const metadata: Metadata = {
  title: "Главная",
};

export default function Home() {
  return (
    <div className="flex flex-col gap-4">
      <PageHeader title="Главная" />
      <HomeQuickActions />
    </div>
  );
}
