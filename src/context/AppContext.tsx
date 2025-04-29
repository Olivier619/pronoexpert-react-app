// src/context/AppContext.tsx
import React, { createContext, useState, useContext, ReactNode, useMemo, useEffect, useCallback } from 'react';
import { format, addDays, subDays } from 'date-fns';
import { LeagueInfo, getAvailableLeagues } from '../api/sportDataService';

export type PeriodType = 'today' | 'tomorrow' | 'yesterday'; // Assurez-vous que ces valeurs correspondent aux values des <Tab>

interface AppContextProps {
  selectedPeriod: PeriodType;
  setSelectedPeriod: (period: PeriodType) => void; // Fonction exposée pour changer la période
  selectedDate: string; // <--- selectedDate est maintenant une valeur calculée, PAS un état modifiable directement

  availableLeagues: LeagueInfo[];
  leaguesLoading: boolean;
  leaguesError: string | null;

  selectedLeagueId: number | null;
  setSelectedLeagueId: (id: number | null) => void;
  selectedLeagueSeason: number | null;
}

const AppContext = createContext<AppContextProps | undefined>(undefined);

interface AppProviderProps {
  children: ReactNode;
}

export const AppProvider: React.FC<AppProviderProps> = ({ children }) => {
  // --- États globaux ---
  const [selectedPeriodState, setSelectedPeriodState] = useState<PeriodType>('today'); // <-- État interne pour la période (valeur par défaut 'today' ou 'yesterday' ?)
  const [availableLeagues, setAvailableLeagues] = useState<LeagueInfo[]>([]);
  const [leaguesLoading, setLeaguesLoading] = useState<boolean>(true);
  const [leaguesError, setLeaguesError] = useState<string | null>(null);
  const [selectedLeagueIdState, setSelectedLeagueIdState] = useState<number | null>(null);
  const [selectedLeagueSeason, setSelectedLeagueSeason] = useState<number | null>(null);
  // --- Supprimer : const [selectedDateState, setSelectedDateState] = useState<string>(format(new Date(), 'yyyy-MM-dd')); ---
  // --- Supprimer : const setSelectedDate = (date: string) => { ... } ---


  // --- Action : Mettre à jour la ligue sélectionnée ---
  const setSelectedLeagueId = useCallback((id: number | null) => {
      console.log(`[AppContext] setSelectedLeagueId appelé avec: ${id}`);
      setSelectedLeagueIdState(id);

      const selectedLeague = availableLeagues.find(league => league.id === id);
      const season = selectedLeague?.season?.year ?? null;
      setSelectedLeagueSeason(season);
      console.log(`[AppContext] Saison associée mise à jour: ${season} pour ligue ${id}`);

  }, [availableLeagues]); // Dépend de availableLeagues

  // --- Chargement initial des ligues ---
  useEffect(() => {
      const fetchLeagues = async () => {
          console.log("[AppContext] Chargement des ligues disponibles...");
          setLeaguesLoading(true);
          setLeaguesError(null);
          try {
              const leagues = await getAvailableLeagues();
              const sortedLeagues = leagues.sort((a, b) =>
                    (a.country?.name ?? '').localeCompare(b.country?.name ?? '') ||
                    a.name.localeCompare(b.name)
                );
              setAvailableLeagues(sortedLeagues);
              console.log(`[AppContext] ${sortedLeagues.length} ligues chargées et triées.`);
          } catch (error) {
              console.error("[AppContext] Erreur lors du chargement des ligues:", error);
              setLeaguesError("Impossible de charger la liste des compétitions.");
              setAvailableLeagues([]);
          }
          finally { setLeaguesLoading(false); }
      };
      fetchLeagues();
  }, []);

    // --- Action : Mettre à jour la période sélectionnée ---
    // Cette fonction ne fait que changer l'état de la période
    const setSelectedPeriod = (period: PeriodType) => {
        console.log(`[AppContext] setSelectedPeriod appelé avec: ${period}`);
        setSelectedPeriodState(period);
        // La date sera recalculée automatiquement par le useMemo ci-dessous
    };

    // --- Date calculée (dérivée) ---
    // Cette date est calculée à chaque fois que selectedPeriodState change
    const selectedDate = useMemo(() => {
      const today = new Date();
      let dateString: string;
      switch (selectedPeriodState) { // <--- Dépend de l'état de la période
        case 'today': dateString = format(today, 'yyyy-MM-dd'); break;
        case 'tomorrow': dateString = format(addDays(today, 1), 'yyyy-MM-dd'); break;
        case 'yesterday': dateString = format(subDays(today, 1), 'yyyy-MM-dd'); break;
        default: dateString = format(today, 'yyyy-MM-dd'); // Fallback
      }
       console.log(`[AppContext] selectedDate calculée via useMemo: ${dateString} (basée sur ${selectedPeriodState})`);
      return dateString;
    }, [selectedPeriodState]); // <-- Recalculer seulement quand selectedPeriodState change


  // --- Valeurs fournies par le contexte ---
  const contextValue = useMemo(() => ({
    selectedPeriod: selectedPeriodState, // Expose l'état interne de la période
    setSelectedPeriod, // Expose le setter de la période

    selectedDate, // <--- Expose la date CALCULÉE (dérivée)

    availableLeagues,
    leaguesLoading,
    leaguesError,

    selectedLeagueId: selectedLeagueIdState,
    setSelectedLeagueId,
    selectedLeagueSeason,
  }), [
      selectedPeriodState, // <--- Dépendance de l'état de la période
      selectedDate, // <--- Dépendance de la date calculée
      availableLeagues,
      leaguesLoading,
      leaguesError,
      selectedLeagueIdState,
      setSelectedLeagueId,
      selectedLeagueSeason,
      // setSelectedPeriod n'a pas besoin d'être ici
  ]);


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