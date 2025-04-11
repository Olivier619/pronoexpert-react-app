// src/context/AppContext.tsx
import React, { createContext, useState, useContext, ReactNode, useMemo } from 'react';
import { format, addDays, subDays } from 'date-fns';

// Définir les types de périodes possibles
export type PeriodType = 'today' | 'tomorrow' | 'after-tomorrow' | 'yesterday';

// Définir la structure du contexte
interface AppContextProps {
  selectedPeriod: PeriodType;
  setSelectedPeriod: (period: PeriodType) => void;
  selectedDate: string; // Date au format YYYY-MM-DD
}

// Créer le contexte avec une valeur par défaut (ou undefined)
const AppContext = createContext<AppContextProps | undefined>(undefined);

// Créer le fournisseur de contexte (Provider)
interface AppProviderProps {
  children: ReactNode;
}

export const AppProvider: React.FC<AppProviderProps> = ({ children }) => {
  const [selectedPeriod, setSelectedPeriod] = useState<PeriodType>('today');

  // Calculer la date correspondante en fonction de la période sélectionnée
  const selectedDate = useMemo(() => {
    const today = new Date();
    switch (selectedPeriod) {
      case 'today':
        return format(today, 'yyyy-MM-dd');
      case 'tomorrow':
        return format(addDays(today, 1), 'yyyy-MM-dd');
      case 'after-tomorrow':
        return format(addDays(today, 2), 'yyyy-MM-dd');
      case 'yesterday': // Pour "Derniers matchs joués"
        return format(subDays(today, 1), 'yyyy-MM-dd');
      default:
        return format(today, 'yyyy-MM-dd');
    }
  }, [selectedPeriod]); // Recalculer seulement si selectedPeriod change

  // Valeur à fournir au contexte
  const contextValue = useMemo(() => ({
    selectedPeriod,
    setSelectedPeriod,
    selectedDate,
  }), [selectedPeriod, selectedDate]);

  return (
    <AppContext.Provider value={contextValue}>
      {children}
    </AppContext.Provider>
  );
};

// Hook personnalisé pour utiliser facilement le contexte
export const useAppContext = (): AppContextProps => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useAppContext must be used within an AppProvider');
  }
  return context;
};