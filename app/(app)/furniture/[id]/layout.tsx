import { generateEntityDetailMetadata } from "@/lib/entities/server-metadata";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  return generateEntityDetailMetadata("furniture", params);
}

export default function FurnitureDetailLayout({ children }: { children: React.ReactNode }) {
  return children;
}
