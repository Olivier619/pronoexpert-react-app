// src/components/matches/MatchList.tsx

import React, { useState, useEffect } from 'react';
import { Box, Typography, CircularProgress, Alert } from '@mui/material';
import { format, parseISO } from 'date-fns';
import { getMatchesByDate, MatchData } from '../../api/sportDataService';
import MatchItem from './MatchItem';
import { useAppContext } from '../../context/AppContext'; // Importer le hook du contexte

const MatchList: React.FC = () => {
  const { selectedDate, selectedPeriod } = useAppContext(); // Obtenir la date/période depuis le contexte

  const [matches, setMatches] = useState<MatchData[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  // Suivi de la date en cours de chargement pour éviter re-fetch inutile si date inchangée
  const [currentLoadingDate, setCurrentLoadingDate] = useState<string>('');

  useEffect(() => {
    // --- AJOUT : Log au début de l'effet ---
    console.log(`[MatchList] useEffect déclenché. selectedDate reçue du contexte: ${selectedDate}`); // <-- LOG AJOUTÉ
    // --- FIN AJOUT ---

    // Si on charge déjà cette date ou si la date est vide (ne devrait pas arriver avec le contexte), on sort
    if (selectedDate === currentLoadingDate || !selectedDate) {
        console.log(`[MatchList] Skip fetch: currentLoadingDate=${currentLoadingDate}, selectedDate=${selectedDate}`);
        // Si la date sélectionnée est celle qu'on chargeait mais qu'on a fini (loading=false), on ne fait rien
        // S'assure qu'on ne relance pas indéfiniment si le composant re-render pour une autre raison
        if (!loading) return;
    }

    const fetchMatches = async (dateToFetch: string) => {
      console.log(`[MatchList] Démarrage fetchMatches pour la date: ${dateToFetch}`);
      setError(null); // Réinitialiser l'erreur au début d'un nouveau fetch
      setLoading(true); // Indiquer le début du chargement
      setCurrentLoadingDate(dateToFetch); // Marquer cette date comme étant en cours de chargement

      try {
        const fetchedMatches = await getMatchesByDate(dateToFetch); // Appeler l'API

        // Après réception, vérifier si la date sélectionnée est TOUJOURS celle qu'on a demandée
        // Cela évite d'afficher des données pour une date si l'utilisateur a cliqué ailleurs TRES vite
        if (selectedDate === dateToFetch) {
          console.log(`[MatchList] Réception et mise à jour de l'état pour ${dateToFetch}. Nombre de matchs: ${fetchedMatches.length}`);
          setMatches(fetchedMatches); // Mettre à jour l'état avec les matchs reçus
        } else {
          console.log(`[MatchList] La date sélectionnée (${selectedDate}) a changé pendant le chargement de ${dateToFetch}. Abandon des résultats.`);
        }
      } catch (err) {
         // Gérer l'erreur seulement si elle correspond à la date actuellement sélectionnée
         if (selectedDate === dateToFetch) {
             console.error(`[MatchList] Erreur lors du chargement pour ${dateToFetch}:`, err);
             setError('Impossible de charger les matchs. Veuillez réessayer.');
             setMatches([]); // Vider les matchs en cas d'erreur
         } else {
              console.log(`[MatchList] Erreur ignorée pour ${dateToFetch} car la date sélectionnée est maintenant ${selectedDate}.`);
         }
      } finally {
         // Marquer le chargement comme terminé UNIQUEMENT si la date chargée correspond à la date actuelle
         // Cela évite un flash de "chargement terminé" si l'utilisateur a changé d'onglet rapidement
          if (selectedDate === dateToFetch) {
             console.log(`[MatchList] Fin du chargement pour ${dateToFetch}.`);
             setLoading(false);
             setCurrentLoadingDate(''); // Permet un re-fetch si on revient sur cette date
         }
      }
    };

    // Lancer le fetch seulement si selectedDate a une valeur
    if (selectedDate) {
        fetchMatches(selectedDate);
    } else {
        // Cas où selectedDate serait vide (ne devrait pas arriver avec useMemo)
        console.warn("[MatchList] selectedDate est vide, impossible de charger les matchs.");
        setLoading(false); // Arrêter le chargement si pas de date
    }

  // Dépendances de l'effet : se redéclenche si 'selectedDate' change
  }, [selectedDate]); // currentLoadingDate a été enlevé car géré en interne

  // --- Affichage conditionnel ---
  // Afficher le loader principal si loading ET (pas d'erreur OU pas encore de matchs chargés)
  // Cela évite de cacher les anciens matchs pendant le rechargement d'une nouvelle date
  if (loading && matches.length === 0 && !error) {
    return (
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', p: 4 }}>
          <CircularProgress />
          <Typography sx={{ ml: 2 }}>Chargement des matchs pour le {format(parseISO(selectedDate), 'dd/MM/yyyy')}...</Typography>
        </Box>
      );
  }

  // --- Affichage de la liste ---
   const getTitleForPeriod = () => {
       // S'assurer que selectedDate est valide avant de parser
       try {
           const dateObj = parseISO(selectedDate);
           const formattedDate = format(dateObj, 'dd/MM/yyyy');
           switch(selectedPeriod) {
               case 'today': return `Matchs du jour (${formattedDate})`;
               case 'tomorrow': return `Matchs de demain (${formattedDate})`;
               // case 'after-tomorrow': // Supprimé
               case 'yesterday': return `Derniers matchs joués (${formattedDate})`;
               default: return `Matchs (${formattedDate})`;
           }
       } catch (e) {
           console.error("Erreur de parsing de selectedDate:", selectedDate, e);
           return "Matchs"; // Titre par défaut en cas d'erreur
       }
   }

  return (
    <Box>
      <Typography variant="h5" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
        {getTitleForPeriod()}
         {/* Indicateur de chargement discret si on recharge pour une NOUVELLE date */}
         {loading && currentLoadingDate === selectedDate && <CircularProgress size={20} sx={{ ml: 2 }} />}
      </Typography>

      {/* Afficher l'erreur si elle existe ET qu'on n'est pas en train de charger */}
      {error && !loading && (
          <Alert severity="error" sx={{ mt: 2 }}>{error}</Alert>
      )}

      {/* Message si aucun match après chargement et pas d'erreur */}
      {!loading && matches.length === 0 && !error && (
          <Typography sx={{ mt: 2 }}>Aucun match trouvé pour cette période.</Typography>
      )}

      {/* Affichage des matchs (si pas en chargement initial ou si on a des matchs même en rechargeant) */}
      {matches.length > 0 && matches.map((matchData) => (
        <MatchItem key={matchData.fixture.id} matchData={matchData} />
      ))}
    </Box>
  );
};

export default MatchList;