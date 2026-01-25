"use client";

import { createContext, useContext, useState, ReactNode } from "react";

interface CurrentPageContextValue {
  entityName: string | null;
  isLoading: boolean;
  setEntityName: (name: string | null) => void;
  setIsLoading: (loading: boolean) => void;
}

const CurrentPageContext = createContext<CurrentPageContextValue | undefined>(
  undefined
);

export const CurrentPageProvider = ({ children }: { children: ReactNode }) => {
  const [entityName, setEntityName] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  return (
    <CurrentPageContext.Provider value={{ entityName, isLoading, setEntityName, setIsLoading }}>
      {children}
    </CurrentPageContext.Provider>
  );
};

export const useCurrentPage = () => {
  const context = useContext(CurrentPageContext);
  if (context === undefined) {
    throw new Error("useCurrentPage must be used within a CurrentPageProvider");
  }
  return context;
};
