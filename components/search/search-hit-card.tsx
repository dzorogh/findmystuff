"use client";

import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  Building2,
  Container,
  DoorOpen,
  LayoutGrid,
  Package,
  Sofa,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { SearchHit } from "@/lib/search/types";

const ICONS = {
  item: Package,
  place: LayoutGrid,
  container: Container,
  room: DoorOpen,
  building: Building2,
  furniture: Sofa,
} as const;

export function SearchHitCard({ hit }: { hit: SearchHit }) {
  const Icon = ICONS[hit.entityType];

  return (
    <Card className="transition-all hover:border-primary/50 hover:shadow-md">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-3">
          <div className="flex min-w-0 items-start gap-3">
            {hit.preview?.imageUrl ? (
              <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-md border bg-muted">
                <Image
                  src={hit.preview.imageUrl}
                  alt={hit.title}
                  fill
                  className="object-cover"
                  sizes="48px"
                />
              </div>
            ) : (
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-md border bg-muted">
                <Icon className="h-5 w-5 text-muted-foreground" />
              </div>
            )}
            <div className="min-w-0">
              <CardTitle className="text-lg">{hit.title}</CardTitle>
              {hit.subtitle && (
                <p className="mt-1 text-sm text-muted-foreground">{hit.subtitle}</p>
              )}
            </div>
          </div>
          {hit.badges.length > 0 && (
            <div className="flex max-w-[45%] flex-wrap justify-end gap-2">
              {hit.badges.map((badge) => (
                <Badge
                  key={`${hit.entityType}-${hit.entityId}-${badge.label}`}
                  variant={badge.variant ?? "secondary"}
                  className="max-w-full truncate"
                >
                  {badge.label}
                </Badge>
              ))}
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {hit.locationLines.length > 0 && (
          <div className="space-y-1 text-sm text-muted-foreground">
            {hit.locationLines.map((line) => (
              <div key={`${hit.entityId}-${line.key}`} className="flex items-center gap-2">
                <span className="font-medium">{line.label}:</span>
                <span>{line.value}</span>
              </div>
            ))}
          </div>
        )}
        <div className="mt-3">
          <Link href={hit.href} className="inline-flex items-center text-sm text-primary">
            Открыть
            <ArrowRight className="ml-1 h-3 w-3" />
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}
