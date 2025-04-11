// src/components/matches/MatchList.tsx

import React, { useState, useEffect } from 'react';
import { Box, Typography, CircularProgress, Alert } from '@mui/material'; // Plus besoin de List, ListItem, etc. ici
import { format } from 'date-fns';
import { getMatchesByDate, MatchData } from '../../api/sportDataService';
import MatchItem from './MatchItem'; // Importer le nouveau composant

const MatchList: React.FC = () => {
  const [matches, setMatches] = useState<MatchData[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchMatches = async () => {
      setLoading(true);
      setError(null);
      try {
        const today = format(new Date(), 'yyyy-MM-dd');
        const fetchedMatches = await getMatchesByDate(today);
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
  if (loading) {/* ... */}
  if (error) {/* ... */}
  if (matches.length === 0) {/* ... */}

  // --- Affichage de la liste en utilisant MatchItem ---
  return (
    <Box>
      <Typography variant="h5" gutterBottom>
        Matchs du jour ({format(new Date(), 'dd/MM/yyyy')})
      </Typography>
      {/* Boucler et rendre un composant MatchItem pour chaque match */}
      {matches.map((matchData) => (
        <MatchItem key={matchData.fixture.id} matchData={matchData} />
      ))}
    </Box>
  );
};

export default MatchList;