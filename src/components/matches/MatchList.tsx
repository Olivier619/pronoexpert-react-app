// src/components/matches/MatchList.tsx

import React, { useState, useEffect } from 'react';
import { Box, Typography, CircularProgress, Alert, List, ListItem, ListItemText, Divider } from '@mui/material';
import { format, parseISO } from 'date-fns'; // parseISO est utile pour les dates ISO 8601
import { getMatchesByDate, MatchData } from '../../api/sportDataService'; // IMPORTER MatchData !

const MatchList: React.FC = () => {
  // Utiliser la nouvelle interface MatchData pour l'état
  const [matches, setMatches] = useState<MatchData[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchMatches = async () => {
      setLoading(true);
      setError(null);
      try {
        const today = format(new Date(), 'yyyy-MM-dd');
        const fetchedMatches = await getMatchesByDate(today); // La fonction retourne maintenant MatchData[]
        setMatches(fetchedMatches);
      } catch (err) {
        console.error("Erreur dans le composant MatchList lors de l'appel API:", err);
        setError('Impossible de charger les matchs. Veuillez réessayer plus tard.');
      } finally {
        setLoading(false);
      }
    };

    fetchMatches();
  }, []);

  // --- Affichage conditionnel (inchangé) ---
  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', p: 4 }}>
        <CircularProgress />
        <Typography sx={{ ml: 2 }}>Chargement des matchs...</Typography>
      </Box>
    );
  }
  if (error) {
    return <Alert severity="error">{error}</Alert>;
  }
  if (matches.length === 0) {
    return <Typography>Aucun match trouvé pour aujourd'hui.</Typography>;
  }

  // --- Affichage de la liste en utilisant la NOUVELLE STRUCTURE ---
  return (
    <Box>
      <Typography variant="h5" gutterBottom>
        Matchs du jour ({format(new Date(), 'dd/MM/yyyy')})
      </Typography>
      <List>
        {matches.map((matchData) => ( // Renommer la variable locale en matchData pour clarté
          // Utiliser matchData.fixture.id comme clé unique
          <ListItem key={matchData.fixture.id} divider sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', py: 1.5 }}>

            {/* Partie Informations Match */}
            <Box sx={{ flexGrow: 1, mr: 2 }}>
              <Typography variant="body1" component="div" sx={{ fontWeight: '500' }}>
                {/* Accès aux noms des équipes via matchData.teams */}
                {matchData.teams.home.name} vs {matchData.teams.away.name}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                 {/* Accès à la ligue via matchData.league */}
                {matchData.league.name} - {matchData.league.country}
              </Typography>
               <Typography variant="caption" color="text.secondary">
                 {/* Accès au statut via matchData.fixture.status */}
                 {matchData.fixture.status.long}
                 {/* Afficher l'heure si non terminé */}
                 {matchData.fixture.status.short !== 'FT' && ` (${format(parseISO(matchData.fixture.date), 'HH:mm')})`}
                 {/* Afficher les minutes si en direct */}
                 {matchData.fixture.status.elapsed && ` - ${matchData.fixture.status.elapsed}'`}
               </Typography>
            </Box>

            {/* Partie Score */}
            <Box sx={{ textAlign: 'center' }}>
              {/* Accès au score principal via matchData.goals (score final si terminé, ou actuel si en cours) */}
              {matchData.goals.home !== null && matchData.goals.away !== null ? (
                 <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                   {matchData.goals.home} - {matchData.goals.away}
                 </Typography>
              ) : (
                 <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                   -
                 </Typography>
              )}
                {/* Optionnel: Afficher le statut court (FT, HT, etc.) */}
                 <Typography variant="caption" color={matchData.fixture.status.short === 'FT' ? 'success.main' : 'text.secondary'}>
                   {matchData.fixture.status.short}
                 </Typography>
            </Box>

            {/* TODO: Ajouter logos équipes plus tard */}
            {/* <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: 50 }}>
                 <img src={matchData.teams.home.logo} alt={`${matchData.teams.home.name} logo`} width="24" height="24"/>
                 <img src={matchData.teams.away.logo} alt={`${matchData.teams.away.name} logo`} width="24" height="24"/>
               </Box> */}

          </ListItem>
        ))}
      </List>
    </Box>
  );
};

export default MatchList;