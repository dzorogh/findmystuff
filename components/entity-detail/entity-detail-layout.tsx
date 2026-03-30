import { ReactNode } from "react";
import { EntityDetailError } from "./entity-detail-error";
import { EntityDetailSkeleton } from "./entity-detail-skeleton";

export interface EntityDetailLayoutProps {
  isLoading: boolean;
  isInvalidId?: boolean;
  error?: string | null;
  entityName: string;
  hasEntity: boolean;

  header: ReactNode;
  relatedLinks?: ReactNode;

  editForm: ReactNode;
  imageCard?: ReactNode;

  contentBlocks?: ReactNode;
  modals?: ReactNode;
}

export function EntityDetailLayout({
  isLoading,
  isInvalidId,
  error,
  entityName,
  hasEntity,
  header,
  relatedLinks,
  editForm,
  imageCard,
  contentBlocks,
  modals,
}: EntityDetailLayoutProps) {
  if (isInvalidId) {
    return (
      <EntityDetailError
        error={`Некорректный ID: ${entityName}`}
        entityName={entityName}
      />
    );
  }

  if (error && !isLoading) {
    return <EntityDetailError error={error} entityName={entityName} />;
  }

  if (!isLoading && !hasEntity) {
    return null;
  }

  return (
    <div className="flex flex-col gap-4">
      {header}
      {hasEntity && relatedLinks}
      
      {isLoading ? (
        <EntityDetailSkeleton />
      ) : hasEntity ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="flex flex-col gap-6">
            {editForm}
            {imageCard}
          </div>
          {contentBlocks && (
            <div className="flex flex-col gap-6">
              {contentBlocks}
            </div>
          )}
        </div>
      ) : null}

      {modals}
    </div>
  );
}
