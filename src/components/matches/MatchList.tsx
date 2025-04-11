import React, { useState, useEffect } from 'react';
import { Box, Typography, CircularProgress, Alert, List, ListItem, ListItemText } from '@mui/material';
import { format } from 'date-fns';
import { getMatchesByDate, Match } from '../../api/sportDataService'; // Importez le service et l'interface

const MatchList: React.FC = () => {
  // États pour stocker les données, le chargement et les erreurs
  const [matches, setMatches] = useState<Match[]>([]); // Tableau de matchs
  const [loading, setLoading] = useState<boolean>(true); // Indicateur de chargement
  const [error, setError] = useState<string | null>(null); // Message d'erreur

  // useEffect pour charger les données au montage du composant
  useEffect(() => {
    const fetchMatches = async () => {
      setLoading(true); // Début du chargement
      setError(null); // Réinitialiser l'erreur précédente
      try {
        const today = format(new Date(), 'yyyy-MM-dd'); // Obtenir la date d'aujourd'hui
        const fetchedMatches = await getMatchesByDate(today);
        setMatches(fetchedMatches); // Mettre à jour l'état avec les matchs reçus
      } catch (err) {
        console.error("Erreur dans le composant MatchList:", err);
        setError('Impossible de charger les matchs. Veuillez réessayer plus tard.'); // Message d'erreur générique pour l'utilisateur
      } finally {
        setLoading(false); // Fin du chargement (succès ou échec)
      }
    };

    fetchMatches(); // Appeler la fonction de chargement
  }, []); // Le tableau vide [] signifie que cet effet ne s'exécute qu'une fois au montage

  // --- Affichage conditionnel ---

  // Cas 1: Chargement en cours
  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', p: 4 }}>
        <CircularProgress />
        <Typography sx={{ ml: 2 }}>Chargement des matchs...</Typography>
      </Box>
    );
  }

  // Cas 2: Erreur lors du chargement
  if (error) {
    return <Alert severity="error">{error}</Alert>;
  }

  // Cas 3: Chargement terminé, pas d'erreur, mais aucun match trouvé
  if (matches.length === 0) {
    return <Typography>Aucun match trouvé pour aujourd'hui.</Typography>;
  }

  // Cas 4: Affichage de la liste des matchs
  return (
    <Box>
      <Typography variant="h5" gutterBottom>
        Matchs du jour ({format(new Date(), 'dd/MM/yyyy')})
      </Typography>
      <List>
        {matches.map((match) => (
          // !! Améliorer l'affichage ici plus tard (avec MatchItem) !!
          <ListItem key={match.id} divider>

<ListItemText
  primary={`${match.homeTeam.name} vs ${match.awayTeam.name}`}
  secondary={`${match.competition.name} - ${match.status || format(new Date(match.utcDate), 'HH:mm')}`}
/>
{/* Condition pour afficher le score si disponible */}
{match.score && match.score.fullTime && match.score.fullTime.home !== null && (
  <Typography sx={{ fontWeight: 'bold', ml: 2 }}> {/* Ajout un peu de marge à gauche (ml: 2) */}
    {match.score.fullTime.home} - {match.score.fullTime.away}
  </Typography>
)}
</ListItem>
))}
</List>
</Box>
);
};

export default MatchList;
