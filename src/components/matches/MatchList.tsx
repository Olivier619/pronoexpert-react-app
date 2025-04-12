// src/components/matches/MatchList.tsx

import React, { useState, useEffect } from 'react';
// --- >>> AJOUT/VÉRIFICATION DES IMPORTS MUI <<< ---
import { Box, Typography, CircularProgress, Alert } from '@mui/material';
// --- >>> FIN AJOUT/VÉRIFICATION <<< ---
import { format, parseISO } from 'date-fns';
import { getMatchesByDate, MatchData } from '../../api/sportDataService';
import MatchItem from './MatchItem';
import { useAppContext } from '../../context/AppContext';

const MatchList: React.FC = () => {
  // Obtenir aussi les infos de filtre depuis le contexte
  const { selectedDate, selectedPeriod, selectedLeagueId, selectedLeagueSeason, availableLeagues } = useAppContext(); // Ajouter availableLeagues ici

  const [matches, setMatches] = useState<MatchData[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  // Pour suivre la combinaison date/ligue en cours de chargement
  const [currentLoadingKey, setCurrentLoadingKey] = useState<string>('');

  useEffect(() => {
    const loadingKey = `${selectedDate}-${selectedLeagueId ?? 'all'}`; // Clé unique pour la requête
    console.log(`[MatchList] useEffect déclenché. Clé: ${loadingKey}`);

    // Ne pas recharger si on charge déjà cette clé ou si la date est invalide
    if (loadingKey === currentLoadingKey || !selectedDate) {
        console.log(`[MatchList] Skip fetch: currentLoadingKey=${currentLoadingKey}, loadingKey=${loadingKey}`);
        // Si la date/ligue sélectionnée est celle qu'on chargeait mais qu'on a fini (loading=false), on ne fait rien
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
        // Après réception, vérifier si la date/ligue sélectionnée est TOUJOURS celle qu'on a demandée
        if (currentFetchKey === currentSelectedKey) {
          console.log(`[MatchList] Réception et mise à jour pour ${currentFetchKey}. Nbr matchs: ${fetchedMatches.length}`);
          setMatches(fetchedMatches); // Mettre à jour l'état avec les matchs reçus
        } else {
           console.log(`[MatchList] Filtres (${currentSelectedKey}) ont changé pendant chargement de ${currentFetchKey}. Abandon.`);
        }
      } catch (err) {
         const currentSelectedKey = `${selectedDate}-${selectedLeagueId ?? 'all'}`;
         // Gérer l'erreur seulement si elle correspond à la date/ligue actuellement sélectionnée
         if (currentFetchKey === currentSelectedKey) {
             console.error(`[MatchList] Erreur lors du chargement pour ${currentFetchKey}:`, err);
             setError('Impossible de charger les matchs. Veuillez réessayer.');
             setMatches([]); // Vider les matchs en cas d'erreur
         } else {
              console.log(`[MatchList] Erreur ignorée pour ${currentFetchKey} car filtres sont ${currentSelectedKey}.`);
         }
      } finally {
          const currentSelectedKey = `${selectedDate}-${selectedLeagueId ?? 'all'}`;
          // Marquer le chargement comme terminé UNIQUEMENT si la date/ligue chargée correspond à la date/ligue actuelle
          if (currentFetchKey === currentSelectedKey) {
             console.log(`[MatchList] Fin du chargement pour ${currentFetchKey}.`);
             setLoading(false);
             setCurrentLoadingKey(''); // Permet un re-fetch si on revient sur cette combinaison
         }
      }
    };

    // Lancer le fetch seulement si selectedDate a une valeur valide
    if (selectedDate) {
        // Si une ligue est sélectionnée mais qu'on n'a pas encore sa saison (possible au 1er chargement), on attend potentiellement
        // Mais ici on suppose que AppContext fournit la saison correctement.
        fetchMatches(selectedDate, selectedLeagueId, selectedLeagueSeason);
    } else {
        console.warn("[MatchList] selectedDate est vide ou invalide, impossible de charger les matchs.");
        setLoading(false);
    }

  // Dépendances de l'effet : se redéclenche si la date OU la ligue (ou sa saison) change
  }, [selectedDate, selectedLeagueId, selectedLeagueSeason]); // Enlever currentLoadingKey des dépendances


 // --- Affichage conditionnel ---
  // Afficher le loader principal si loading ET (pas d'erreur OU pas encore de matchs chargés)
  // Cela évite de cacher les anciens matchs pendant le rechargement d'une nouvelle date/ligue
  if (loading && matches.length === 0 && !error) {
    let loadingText = "Chargement des matchs";
    try {
        loadingText += ` pour le ${format(parseISO(selectedDate), 'dd/MM/yyyy')}`;
    } catch (e) { /* Ignorer l'erreur de formatage si date invalide */ }

    return (
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', p: 4 }}>
          <CircularProgress />
          <Typography sx={{ ml: 2 }}>{loadingText}...</Typography>
        </Box>
      );
  }


 // --- Affichage de la liste ---
   const getTitleForPeriod = () => {
       try {
           const dateObj = parseISO(selectedDate);
           const formattedDate = format(dateObj, 'dd/MM/yyyy');
           switch(selectedPeriod) {
               case 'today': return `Matchs du jour (${formattedDate})`;
               case 'tomorrow': return `Matchs de demain (${formattedDate})`;
               case 'yesterday': return `Derniers matchs joués (${formattedDate})`;
               default: return `Matchs (${formattedDate})`;
           }
       } catch (e) {
           console.error("Erreur de parsing de selectedDate dans getTitle:", selectedDate, e);
           return "Matchs";
       }
   }

  // Trouver le nom de la ligue sélectionnée pour l'afficher dans le titre
  const selectedLeagueName = selectedLeagueId && !loading // Ne pas chercher si loading ou toutes ligues
      ? availableLeagues.find(l=>l.id === selectedLeagueId)?.name ?? ''
      : '';

  return (
    // Utilisation de React.Fragment pour éviter une Box inutile si on veut juste le titre et la liste
    <>
      <Typography variant="h5" gutterBottom sx={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap' }}>
        {getTitleForPeriod()}
         {/* Afficher le nom de la ligue si une est sélectionnée */}
         {selectedLeagueName && (
             <span style={{ fontWeight: 'normal', marginLeft: '8px' }}> - {selectedLeagueName}</span>
         )}
         {/* Indicateur de chargement discret */}
         {loading && <CircularProgress size={20} sx={{ ml: 2 }} />}
      </Typography>

      {/* Afficher l'erreur si elle existe ET qu'on n'est pas en train de charger */}
      {error && !loading && (
          <Alert severity="error" sx={{ mt: 2 }}>{error}</Alert>
      )}

      {/* Message si aucun match après chargement et pas d'erreur */}
      {!loading && matches.length === 0 && !error && (
          <Typography sx={{ mt: 2 }}>Aucun match trouvé pour ces critères.</Typography>
      )}

      {/* Affichage des matchs */}
      {/* Ajouter un conteneur Box si on veut contrôler le layout de la liste */}
      <Box>
          {matches.length > 0 && matches.map((matchData) => (
            <MatchItem key={matchData.fixture.id} matchData={matchData} />
          ))}
      </Box>
    </>
  );
 };

 export default MatchList;