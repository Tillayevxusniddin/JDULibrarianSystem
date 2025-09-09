// src/contexts/ScrollContext.tsx

import React, { createContext, useContext, useState } from 'react';
import type { ReactNode } from 'react';

interface ScrollContextType {
  disableMainScroll: boolean;
  setDisableMainScroll: (disable: boolean) => void;
}

const ScrollContext = createContext<ScrollContextType | undefined>(undefined);

export const useScrollControl = () => {
  const context = useContext(ScrollContext);
  if (context === undefined) {
    throw new Error('useScrollControl must be used within a ScrollProvider');
  }
  return context;
};

interface ScrollProviderProps {
  children: ReactNode;
}

export const ScrollProvider: React.FC<ScrollProviderProps> = ({ children }) => {
  const [disableMainScroll, setDisableMainScroll] = useState(false);

  const value = {
    disableMainScroll,
    setDisableMainScroll,
  };

  return (
    <ScrollContext.Provider value={value}>
      {children}
    </ScrollContext.Provider>
  );
};
