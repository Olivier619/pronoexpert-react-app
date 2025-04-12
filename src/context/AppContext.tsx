// src/context/AppContext.tsx
import React, { createContext, useState, useContext, ReactNode, useMemo, useEffect } from 'react';
import { format, addDays, subDays } from 'date-fns';
import { LeagueInfo, getAvailableLeagues } from '../api/sportDataService'; // Importer l'interface LeagueInfo et la fonction

// --- >>> CORRECTION ICI : Ajout de 'export' <<< ---
export type PeriodType = 'today' | 'tomorrow' | 'yesterday';
// --- >>> FIN CORRECTION <<< ---

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

// Créer le contexte avec une valeur par défaut (ou undefined)
const AppContext = createContext<AppContextProps | undefined>(undefined);

// Créer le fournisseur de contexte (Provider)
interface AppProviderProps {
  children: ReactNode;
}

export const AppProvider: React.FC<AppProviderProps> = ({ children }) => {
  // Utiliser 'setSelectedPeriodState' pour l'état interne
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
              // Trier les ligues par pays puis par nom avant de les stocker
              const sortedLeagues = leagues.sort((a, b) =>
                    (a.country?.name ?? '').localeCompare(b.country?.name ?? '') ||
                    a.name.localeCompare(b.name)
                );
              setAvailableLeagues(sortedLeagues);
              console.log(`[AppContext] ${sortedLeagues.length} ligues chargées et triées.`);
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


  // Fonction wrapper pour logger le changement de période
  const setSelectedPeriod = (period: PeriodType) => {
      console.log(`[AppContext] setSelectedPeriod appelé avec: ${period}`);
      setSelectedPeriodState(period); // Met à jour l'état réel
  };


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
      case 'yesterday': // Pour "Derniers matchs joués"
        newDate = format(subDays(today, 1), 'yyyy-MM-dd');
        break;
      default:
        newDate = format(today, 'yyyy-MM-dd');
    }
    return newDate;
  }, [selectedPeriod]);

  // useEffect pour logger quand selectedDate change réellement
  useEffect(() => {
      console.log(`[AppContext] La valeur de selectedDate a changé ou est initialisée: ${selectedDate}`);
  }, [selectedDate]);


  // Ajouter les nouveaux états/setters à la valeur du contexte
  const contextValue = useMemo(() => ({
    selectedPeriod,
    setSelectedPeriod, // Passe la fonction wrapper avec log
    selectedDate,
    // --- AJOUTS pour Filtres ---
    availableLeagues,
    leaguesLoading,
    selectedLeagueId,
    setSelectedLeagueId, // Passe la fonction wrapper qui met aussi à jour la saison
    selectedLeagueSeason,
    // --- FIN AJOUTS ---
  }), [
      selectedPeriod,
      selectedDate,
      availableLeagues,
      leaguesLoading,
      selectedLeagueId,
      selectedLeagueSeason
  ]); // Assurer que toutes les dépendances sont listées

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