// src/components/matches/MatchList.tsx
import React, { useState, useEffect } from 'react';
// ... (imports MUI et date-fns inchangés) ...
import { getMatchesByDate, MatchData } from '../../api/sportDataService';
import MatchItem from './MatchItem';
import { useAppContext } from '../../context/AppContext';

const MatchList: React.FC = () => {
  // Obtenir aussi les infos de filtre depuis le contexte
  const { selectedDate, selectedPeriod, selectedLeagueId, selectedLeagueSeason } = useAppContext();

  const [matches, setMatches] = useState<MatchData[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  // Pour suivre la combinaison date/ligue en cours de chargement
  const [currentLoadingKey, setCurrentLoadingKey] = useState<string>('');

  useEffect(() => {
    const loadingKey = `${selectedDate}-${selectedLeagueId ?? 'all'}`; // Clé unique pour la requête
    console.log(`[MatchList] useEffect déclenché. Clé: ${loadingKey}`);

    if (loadingKey === currentLoadingKey || !selectedDate) {
        console.log(`[MatchList] Skip fetch: currentLoadingKey=${currentLoadingKey}, loadingKey=${loadingKey}`);
        if (!loading) return;
    }

    const fetchMatches = async (dateToFetch: string, leagueToFetch: number | null, seasonToFetch: number | null) => {
      const currentFetchKey = `${dateToFetch}-${leagueToFetch ?? 'all'}`;
      console.log(`[MatchList] Démarrage fetchMatches pour la clé: ${currentFetchKey}`);
      setError(null);
      setLoading(true);
      setCurrentLoadingKey(currentFetchKey);

      try {
        // Passer les filtres à la fonction API
        const fetchedMatches = await getMatchesByDate(dateToFetch, leagueToFetch, seasonToFetch);

        const currentSelectedKey = `${selectedDate}-${selectedLeagueId ?? 'all'}`;
        if (currentFetchKey === currentSelectedKey) {
          console.log(`[MatchList] Réception et mise à jour pour ${currentFetchKey}. Nbr matchs: ${fetchedMatches.length}`);
          setMatches(fetchedMatches);
        } else {
           console.log(`[MatchList] Filtres (${currentSelectedKey}) ont changé pendant chargement de ${currentFetchKey}. Abandon.`);
        }
      } catch (err) {
         const currentSelectedKey = `${selectedDate}-${selectedLeagueId ?? 'all'}`;
         if (currentFetchKey === currentSelectedKey) {
             console.error(`[MatchList] Erreur lors du chargement pour ${currentFetchKey}:`, err);
             setError('Impossible de charger les matchs. Veuillez réessayer.');
             setMatches([]);
         } else {
              console.log(`[MatchList] Erreur ignorée pour ${currentFetchKey} car filtres sont ${currentSelectedKey}.`);
         }
      } finally {
          const currentSelectedKey = `${selectedDate}-${selectedLeagueId ?? 'all'}`;
          if (currentFetchKey === currentSelectedKey) {
             console.log(`[MatchList] Fin du chargement pour ${currentFetchKey}.`);
             setLoading(false);
             setCurrentLoadingKey('');
         }
      }
    };

    if (selectedDate) {
        // Passer la ligue et la saison sélectionnées
        fetchMatches(selectedDate, selectedLeagueId, selectedLeagueSeason);
    } else {
        console.warn("[MatchList] selectedDate est vide.");
        setLoading(false);
    }

  // --- >>> AJOUTER selectedLeagueId et selectedLeagueSeason AUX DÉPENDANCES <<< ---
  }, [selectedDate, selectedLeagueId, selectedLeagueSeason]); // Recharge si la date OU la ligue change

 // ... (Reste du composant : getTitleForPeriod, return JSX - quasiment inchangé) ...
 // Le JSX pour afficher la liste reste le même, il boucle sur 'matches' qui est maintenant filtré
 return (
     <Box>
       <Typography variant="h5" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
         {getTitleForPeriod()}
          {/* Afficher le nom de la ligue sélectionnée si pas "Toutes" ? */}
          {selectedLeagueId && !loading && ` - ${availableLeagues.find(l=>l.id === selectedLeagueId)?.name ?? ''}`}
          {loading && currentLoadingKey === `${selectedDate}-${selectedLeagueId ?? 'all'}` && <CircularProgress size={20} sx={{ ml: 2 }} />}
       </Typography>

       {error && !loading && ( <Alert severity="error" sx={{ mt: 2 }}>{error}</Alert> )}
       {!loading && matches.length === 0 && !error && ( <Typography sx={{ mt: 2 }}>Aucun match trouvé pour ces critères.</Typography> )}
       {matches.length > 0 && matches.map((matchData) => (
         <MatchItem key={matchData.fixture.id} matchData={matchData} />
       ))}
     </Box>
   );
 };

 export default MatchList; // Ajouter le hook useAppContext pour récupérer availableLeagues dans le titre