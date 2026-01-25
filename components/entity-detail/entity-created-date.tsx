interface EntityCreatedDateProps {
  createdAt: string;
  label?: string;
}

export const EntityCreatedDate = ({
  createdAt,
  label = "Создан",
}: EntityCreatedDateProps) => {
  return (
    <div>
      <p className="text-sm text-muted-foreground">
        {label}:{" "}
        {new Date(createdAt).toLocaleDateString("ru-RU", {
          year: "numeric",
          month: "long",
          day: "numeric",
        })}
      </p>
    </div>
  );
};
