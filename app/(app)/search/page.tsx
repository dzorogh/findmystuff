import type { Metadata } from "next";
import { GlobalSearchPage } from "@/components/search/global-search-page";

export const metadata: Metadata = {
  title: "Поиск",
};

export default function SearchPage() {
  return <GlobalSearchPage />;
}
