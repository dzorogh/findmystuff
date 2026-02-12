import type { Metadata } from "next";
import { generateEntityDetailMetadata } from "@/lib/entities/server-metadata";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  return generateEntityDetailMetadata("container", params);
}

export default function ContainerDetailLayout({ children }: { children: React.ReactNode }) {
  return children;
}
