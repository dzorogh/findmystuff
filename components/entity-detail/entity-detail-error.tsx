import { Card, CardContent } from "@/components/ui/card";

interface EntityDetailErrorProps {
  error: string | null;
  entityName: string;
}

export const EntityDetailError = ({ error, entityName }: EntityDetailErrorProps) => {
  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <Card>
        <CardContent className="py-12 text-center">
          <p className="text-destructive">{error || `${entityName} не найден`}</p>
        </CardContent>
      </Card>
    </div>
  );
};
