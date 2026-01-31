"use client";

import { createContext, useContext, useState, ReactNode } from "react";

interface CurrentPageContextValue {
  entityName: string | null;
  isLoading: boolean;
  entityActions: ReactNode | null;
  setEntityName: (name: string | null) => void;
  setIsLoading: (loading: boolean) => void;
  setEntityActions: (actions: ReactNode | null) => void;
}

const CurrentPageContext = createContext<CurrentPageContextValue | undefined>(
  undefined
);

export const CurrentPageProvider = ({ children }: { children: ReactNode }) => {
  const [entityName, setEntityName] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [entityActions, setEntityActions] = useState<ReactNode | null>(null);

  return (
    <CurrentPageContext.Provider
      value={{
        entityName,
        isLoading,
        entityActions,
        setEntityName,
        setIsLoading,
        setEntityActions,
      }}
    >
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
