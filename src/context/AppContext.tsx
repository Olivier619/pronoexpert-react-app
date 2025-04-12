// src/context/AppContext.tsx
import React, { createContext, useState, useContext, ReactNode, useMemo, useEffect } from 'react'; // Ajout de useEffect
import { format, addDays, subDays } from 'date-fns';

// Définir les types de périodes possibles
// J'enlève 'after-tomorrow' comme demandé
export type PeriodType = 'today' | 'tomorrow' | 'yesterday';

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
  // Utiliser 'setSelectedPeriodState' pour l'état interne
  const [selectedPeriod, setSelectedPeriodState] = useState<PeriodType>('today');

  // --- AJOUT : Fonction wrapper pour logger le changement de période ---
  const setSelectedPeriod = (period: PeriodType) => {
      console.log(`[AppContext] setSelectedPeriod appelé avec: ${period}`); // <-- LOG AJOUTÉ
      setSelectedPeriodState(period); // Met à jour l'état réel
  };
  // --- FIN AJOUT ---

  // Calculer la date correspondante en fonction de la période sélectionnée
  const selectedDate = useMemo(() => {
    const today = new Date();
    let newDate: string;
    switch (selectedPeriod) {
      case 'today':
        newDate = format(today, 'yyyy-MM-dd');
        break;
      case 'tomorrow':
        newDate = format(addDays(today, 1), 'yyyy-MM-dd');
        break;
      // case 'after-tomorrow': // Supprimé comme demandé
      //   newDate = format(addDays(today, 2), 'yyyy-MM-dd');
      //   break;
      case 'yesterday': // Pour "Derniers matchs joués"
        newDate = format(subDays(today, 1), 'yyyy-MM-dd');
        break;
      default:
        newDate = format(today, 'yyyy-MM-dd');
    }
    // Logguer la date calculée DANS le useMemo pour voir si le calcul se fait
    // console.log(`[AppContext] useMemo a calculé selectedDate: ${newDate} pour period: ${selectedPeriod}`);
    return newDate;
  }, [selectedPeriod]); // Recalculer seulement si selectedPeriod change

  // --- AJOUT : useEffect pour logger quand selectedDate change réellement ---
  useEffect(() => {
      console.log(`[AppContext] La valeur de selectedDate a changé ou est initialisée: ${selectedDate}`); // <-- LOG AJOUTÉ
  }, [selectedDate]);
  // --- FIN AJOUT ---


  // Valeur à fournir au contexte (utilise la fonction setSelectedPeriod wrapper)
  const contextValue = useMemo(() => ({
    selectedPeriod,
    setSelectedPeriod, // Passe la fonction wrapper avec log
    selectedDate,
  }), [selectedPeriod, selectedDate]); // dépendances correctes

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