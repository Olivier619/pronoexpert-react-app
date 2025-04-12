// src/context/AppContext.tsx
import React, { createContext, useState, useContext, ReactNode, useMemo, useEffect } from 'react';
import { format, addDays, subDays } from 'date-fns';
import { LeagueInfo, getAvailableLeagues } from '../api/sportDataService';

export type PeriodType = 'today' | 'tomorrow' | 'yesterday';

interface AppContextProps {
  selectedPeriod: PeriodType;
  setSelectedPeriod: (period: PeriodType) => void;
  selectedDate: string;
  availableLeagues: LeagueInfo[];
  leaguesLoading: boolean;
  selectedLeagueId: number | null;
  setSelectedLeagueId: (id: number | null) => void;
  selectedLeagueSeason: number | null;
}

const AppContext = createContext<AppContextProps | undefined>(undefined);

interface AppProviderProps {
  children: ReactNode;
}

export const AppProvider: React.FC<AppProviderProps> = ({ children }) => {
  const [selectedPeriod, setSelectedPeriodState] = useState<PeriodType>('today');
  const [availableLeagues, setAvailableLeagues] = useState<LeagueInfo[]>([]);
  const [leaguesLoading, setLeaguesLoading] = useState<boolean>(true);
  const [selectedLeagueId, setSelectedLeagueIdState] = useState<number | null>(null);
  const [selectedLeagueSeason, setSelectedLeagueSeason] = useState<number | null>(null);

  const setSelectedLeagueId = (id: number | null) => {
      console.log(`[AppContext] setSelectedLeagueId appelé avec: ${id}`);
      setSelectedLeagueIdState(id);
      const selectedLeague = availableLeagues.find(league => league.id === id);
      const season = selectedLeague?.season?.year ?? null;
      setSelectedLeagueSeason(season);
      console.log(`[AppContext] Saison associée mise à jour: ${season}`);
  };

  useEffect(() => {
      const fetchLeagues = async () => {
          console.log("[AppContext] Chargement des ligues disponibles...");
          setLeaguesLoading(true);
          try {
              const leagues = await getAvailableLeagues();
              const sortedLeagues = leagues.sort((a, b) =>
                    (a.country?.name ?? '').localeCompare(b.country?.name ?? '') ||
                    a.name.localeCompare(b.name)
                );
              setAvailableLeagues(sortedLeagues);
              console.log(`[AppContext] ${sortedLeagues.length} ligues chargées et triées.`);
          } catch (error) { console.error("[AppContext] Erreur lors du chargement des ligues:", error); }
          finally { setLeaguesLoading(false); }
      };
      fetchLeagues();
  }, []);

  const setSelectedPeriod = (period: PeriodType) => {
      console.log(`[AppContext] setSelectedPeriod appelé avec: ${period}`);
      setSelectedPeriodState(period);
  };

  const selectedDate = useMemo(() => {
    const today = new Date();
    let newDate: string;
    switch (selectedPeriod) {
      case 'today': newDate = format(today, 'yyyy-MM-dd'); break;
      case 'tomorrow': newDate = format(addDays(today, 1), 'yyyy-MM-dd'); break;
      case 'yesterday': newDate = format(subDays(today, 1), 'yyyy-MM-dd'); break;
      default: newDate = format(today, 'yyyy-MM-dd');
    }
    return newDate;
  }, [selectedPeriod]);

  useEffect(() => { console.log(`[AppContext] La valeur de selectedDate a changé ou est initialisée: ${selectedDate}`); }, [selectedDate]);

  // Ajouter les nouveaux états/setters à la valeur du contexte
  const contextValue = useMemo(() => ({
    selectedPeriod,
    setSelectedPeriod,
    selectedDate,
    availableLeagues,
    leaguesLoading,
    selectedLeagueId,
    setSelectedLeagueId, // Passe la fonction wrapper
    selectedLeagueSeason,
  // --- >>> CORRECTION ICI : Ajouter setSelectedLeagueId aux dépendances <<< ---
  }), [
      selectedPeriod,
      selectedDate,
      availableLeagues,
      leaguesLoading,
      selectedLeagueId,
      setSelectedLeagueId, // <-- DÉPENDANCE AJOUTÉE
      selectedLeagueSeason
  ]);
  // --- >>> FIN CORRECTION <<< ---


  return (
    <AppContext.Provider value={contextValue}>
      {children}
    </AppContext.Provider>
  );
};

export const useAppContext = (): AppContextProps => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useAppContext must be used within an AppProvider');
  }
  return context;
};