"use client";

interface PageContainerProps {
  children: React.ReactNode;
}

export const PageContainer = ({ children }: PageContainerProps) => {
  return (
    <div className="container mx-auto pb-10 pt-4 px-4 md:py-6">
      <div className="mx-auto">
        {children}
      </div>
    </div>
  );
};
