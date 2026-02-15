import Link from "next/link";
import { Button } from "@/components/ui/button";

interface RelatedLink {
  href: string;
  label: string;
}

interface EntityRelatedLinksProps {
  links: RelatedLink[];
}

export function EntityRelatedLinks({ links }: EntityRelatedLinksProps) {
  if (links.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-2">
      {links.map(({ href, label }) => (
        <Button
          key={href}
          render={<Link href={href} />}
          variant="secondary"
          nativeButton={false}
        >
          {label}
        </Button>
      ))}
    </div>
  );
}
