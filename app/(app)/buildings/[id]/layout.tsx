import type { Metadata } from "next";
import { generateEntityDetailMetadata } from "@/lib/entities/server-metadata";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  return generateEntityDetailMetadata("building", params);
}

export default function BuildingDetailLayout({ children }: { children: React.ReactNode }) {
  return children;
}
