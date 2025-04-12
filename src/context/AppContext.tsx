// src/context/AppContext.tsx
import React, { createContext, useState, useContext, ReactNode, useMemo, useEffect } from 'react';
import { format, addDays, subDays } from 'date-fns';
import { LeagueInfo, getAvailableLeagues } from '../api/sportDataService'; // Importer l'interface LeagueInfo et la fonction

// ... (PeriodType reste le même) ...

// Définir la structure du contexte
interface AppContextProps {
  selectedPeriod: PeriodType;
  setSelectedPeriod: (period: PeriodType) => void;
  selectedDate: string; // Date au format YYYY-MM-DD

  // --- AJOUTS pour Filtres ---
  availableLeagues: LeagueInfo[]; // Liste des ligues pour le dropdown
  leaguesLoading: boolean; // Indicateur de chargement des ligues
  selectedLeagueId: number | null; // ID de la ligue sélectionnée (null pour 'Toutes')
  setSelectedLeagueId: (id: number | null) => void;
  selectedLeagueSeason: number | null; // Saison associée à la ligue sélectionnée
  // --- FIN AJOUTS ---
}

const AppContext = createContext<AppContextProps | undefined>(undefined);

interface AppProviderProps {
  children: ReactNode;
}

export const AppProvider: React.FC<AppProviderProps> = ({ children }) => {
  const [selectedPeriod, setSelectedPeriodState] = useState<PeriodType>('today');

  // --- AJOUTS pour Filtres ---
  const [availableLeagues, setAvailableLeagues] = useState<LeagueInfo[]>([]);
  const [leaguesLoading, setLeaguesLoading] = useState<boolean>(true);
  const [selectedLeagueId, setSelectedLeagueIdState] = useState<number | null>(null);
  const [selectedLeagueSeason, setSelectedLeagueSeason] = useState<number | null>(null); // Pour stocker la saison

  // Fonction pour mettre à jour la ligue ET sa saison associée
  const setSelectedLeagueId = (id: number | null) => {
      console.log(`[AppContext] setSelectedLeagueId appelé avec: ${id}`);
      setSelectedLeagueIdState(id);
      // Trouver la saison correspondante dans la liste chargée
      const selectedLeague = availableLeagues.find(league => league.id === id);
      const season = selectedLeague?.season?.year ?? null; // Prend l'année de la saison
      setSelectedLeagueSeason(season);
      console.log(`[AppContext] Saison associée mise à jour: ${season}`);
  };

  // Charger les ligues une fois au montage du Provider
  useEffect(() => {
      const fetchLeagues = async () => {
          console.log("[AppContext] Chargement des ligues disponibles...");
          setLeaguesLoading(true);
          try {
              const leagues = await getAvailableLeagues();
              setAvailableLeagues(leagues);
              console.log(`[AppContext] ${leagues.length} ligues chargées.`);
          } catch (error) {
              console.error("[AppContext] Erreur lors du chargement des ligues:", error);
              // Gérer l'erreur (ex: afficher un message ?)
          } finally {
              setLeaguesLoading(false);
          }
      };
      fetchLeagues();
  }, []); // Tableau vide pour exécuter une seule fois

  // --- FIN AJOUTS ---


  const setSelectedPeriod = (period: PeriodType) => {
    console.log(`[AppContext] setSelectedPeriod appelé avec: ${period}`);
    setSelectedPeriodState(period);
  };

  const selectedDate = useMemo(() => { /* ... (inchangé) ... */ }, [selectedPeriod]);
  useEffect(() => { /* ... (log inchangé) ... */ }, [selectedDate]);

  // Ajouter les nouveaux états/setters à la valeur du contexte
  const contextValue = useMemo(() => ({
    selectedPeriod,
    setSelectedPeriod,
    selectedDate,
    // --- AJOUTS pour Filtres ---
    availableLeagues,
    leaguesLoading,
    selectedLeagueId,
    setSelectedLeagueId, // Passe la fonction wrapper
    selectedLeagueSeason,
    // --- FIN AJOUTS ---
  }), [
      selectedPeriod,
      selectedDate,
      availableLeagues, // Ajouter les dépendances
      leaguesLoading,
      selectedLeagueId,
      selectedLeagueSeason
  ]);

  return (
    <AppContext.Provider value={contextValue}>
      {children}
    </AppContext.Provider>
  );
};

export const useAppContext = (): AppContextProps => { /* ... (inchangé) ... */ };