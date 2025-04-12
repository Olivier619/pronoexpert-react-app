// src/components/matches/MatchList.tsx

import React, { useState, useEffect, useCallback } from 'react'; // Ajout de useCallback
import { Box, Typography, CircularProgress, Alert } from '@mui/material';
import { format, parseISO } from 'date-fns';
// --- >>> Remettre les bons imports <<< ---
import { getMatchesByDate, MatchData } from '../../api/sportDataService';
import MatchItem from './MatchItem';
// --- >>> Fin modif <<< ---
import { useAppContext } from '../../context/AppContext';

const MatchList: React.FC = () => {
  const { selectedDate, selectedPeriod, selectedLeagueId, selectedLeagueSeason, availableLeagues } = useAppContext();

  // --- >>> Remettre l'état 'matches' <<< ---
  const [matches, setMatches] = useState<MatchData[]>([]);
  // --- >>> Fin modif <<< ---
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [currentLoadingKey, setCurrentLoadingKey] = useState<string>('');

  // --- >>> Correction Warning ESLint : Utiliser useCallback pour fetchMatches <<<---
  // Cela permet d'éviter de le redéfinir à chaque render si les dépendances ne changent pas
  // et de l'ajouter au tableau de dépendances de useEffect si nécessaire (bien que pas strictement requis ici)
  const fetchMatches = useCallback(async (dateToFetch: string, leagueToFetch: number | null, seasonToFetch: number | null) => {
    const currentFetchKey = `${dateToFetch}-${leagueToFetch ?? 'all'}`;
    console.log(`[MatchList] Démarrage fetchMatches pour la clé: ${currentFetchKey}`);
    setError(null);
    setLoading(true);
    setCurrentLoadingKey(currentFetchKey);

    try {
      // --- >>> Remettre l'appel à getMatchesByDate <<< ---
      const fetchedMatches = await getMatchesByDate(dateToFetch, leagueToFetch, seasonToFetch);
      // --- >>> Fin modif <<< ---

      const currentSelectedKey = `${selectedDate}-${selectedLeagueId ?? 'all'}`;
      if (currentFetchKey === currentSelectedKey) {
        console.log(`[MatchList] Réception et mise à jour pour ${currentFetchKey}. Nbr matchs: ${fetchedMatches.length}`);
        // --- >>> Remettre setMatches <<< ---
        setMatches(fetchedMatches);
        // --- >>> Fin modif <<< ---
      } else {
         console.log(`[MatchList] Filtres (${currentSelectedKey}) ont changé pendant chargement de ${currentFetchKey}. Abandon.`);
      }
    } catch (err) {
       const currentSelectedKey = `${selectedDate}-${selectedLeagueId ?? 'all'}`;
       if (currentFetchKey === currentSelectedKey) {
           console.error(`[MatchList] Erreur lors du chargement pour ${currentFetchKey}:`, err);
           setError('Impossible de charger les matchs. Veuillez réessayer.');
           // --- >>> Remettre setMatches([]) <<< ---
           setMatches([]);
           // --- >>> Fin modif <<< ---
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
  // eslint-disable-next-line react-hooks/exhaustive-deps -- On re-crée fetchMatches seulement quand les filtres changent via useEffect
  }, [selectedDate, selectedLeagueId]); // Dépendances de useCallback

  useEffect(() => {
    const loadingKey = `${selectedDate}-${selectedLeagueId ?? 'all'}`;
    console.log(`[MatchList] useEffect déclenché. Clé: ${loadingKey}`);

    // L'ancienne logique pour skipper si currentLoadingKey est le même était potentiellement problématique
    // On lance le fetch si la date est valide. La logique DANS fetchMatches gère l'abandon si les filtres changent pendant l'appel.
    if (selectedDate) {
        fetchMatches(selectedDate, selectedLeagueId, selectedLeagueSeason);
    } else {
        console.warn("[MatchList] selectedDate est vide ou invalide.");
        setLoading(false); // Pas de date, pas de chargement
        setMatches([]); // Vider les matchs
    }

  // --- >>> Correction Warning ESLint : Ajouter fetchMatches aux dépendances <<<---
  // Même si fetchMatches est stable grâce à useCallback, ESLint aime le voir ici.
  // Les dépendances principales restent selectedDate, selectedLeagueId, selectedLeagueSeason
  }, [selectedDate, selectedLeagueId, selectedLeagueSeason, fetchMatches]);
  // --- >>> Fin Correction <<<---


 // --- >>> Remettre l'affichage normal <<< ---
 // Affichage conditionnel (inchangé)
 if (loading && matches.length === 0 && !error) { /* ... Loader ... */ }

 // Affichage de la liste (inchangé - utilise maintenant 'matches' qui est vide ou rempli)
 const getTitleForPeriod = () => { /* ... */ };
 const selectedLeagueName = selectedLeagueId && !loading ? availableLeagues.find(l=>l.id === selectedLeagueId)?.name ?? '' : '';

 return (
   <>
     <Typography variant="h5" gutterBottom sx={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap' }}>
       {getTitleForPeriod()}
       {selectedLeagueName && ( <span style={{ fontWeight: 'normal', marginLeft: '8px' }}> - {selectedLeagueName}</span> )}
       {loading && <CircularProgress size={20} sx={{ ml: 2 }} />}
     </Typography>

     {error && !loading && ( <Alert severity="error" sx={{ mt: 2 }}>{error}</Alert> )}
     {!loading && matches.length === 0 && !error && ( <Typography sx={{ mt: 2 }}>Aucun match trouvé pour ces critères.</Typography> )}
     <Box>
         {matches.length > 0 && matches.map((matchData) => (
           <MatchItem key={matchData.fixture.id} matchData={matchData} />
         ))}
     </Box>
   </>
 );
 // --- >>> FIN Remise en état <<< ---
};

export default MatchList;