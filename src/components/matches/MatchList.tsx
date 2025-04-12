// src/components/matches/MatchList.tsx
import React, { useState, useEffect } from 'react';
import { Box, Typography, CircularProgress, Alert } from '@mui/material';
// Importer SEULEMENT getCountries pour ce test
import { getCountries } from '../../api/sportDataService';
// import MatchItem from './MatchItem'; // Pas besoin d'afficher les matchs pour ce test
import { useAppContext } from '../../context/AppContext';

const MatchList: React.FC = () => {
  // On utilise toujours selectedDate pour déclencher, mais on appelle getCountries
  const { selectedDate } = useAppContext(); // On n'a pas besoin de selectedPeriod ici

  // --- >>> MODIFIÉ : État pour stocker les pays (juste pour le test) <<< ---
  const [countries, setCountries] = useState<any[]>([]); // Utiliser any[] pour simplifier le test
  // --- >>> FIN MODIFICATION <<< ---
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [currentLoadingKey, setCurrentLoadingKey] = useState<string>('');

  useEffect(() => {
    // --- >>> MODIFIÉ : Clé basée sur 'countries' <<< ---
    const loadingKey = `countries-${selectedDate}`; // Clé basée sur la date juste pour déclencher une fois par jour
    // --- >>> FIN MODIFICATION <<< ---
    console.log(`[MatchList Test Pays] useEffect déclenché. Clé: ${loadingKey}`);

    if (loadingKey === currentLoadingKey || !selectedDate) {
      console.log(`[MatchList Test Pays] Skip fetch.`);
      if (!loading) return;
    }

    // --- >>> MODIFIÉ : Fonction interne renommée <<< ---
    const fetchCountriesTest = async () => {
      const currentFetchKey = `countries-${selectedDate}`; // Utilise la date juste pour la logique de clé
    // --- >>> FIN MODIFICATION <<< ---
      console.log(`[MatchList Test Pays] Démarrage fetchCountriesTest.`);
      setError(null);
      setLoading(true);
      setCurrentLoadingKey(currentFetchKey);

      try {
        // --- >>> MODIFIÉ : APPEL À getCountries ICI <<< ---
        const fetchedCountries = await getCountries();
        // --- >>> FIN MODIFICATION <<< ---

        // Vérifier si la date sélectionnée (utilisée comme déclencheur) est toujours la même
        if (selectedDate) {
          console.log(`[MatchList Test Pays] Réception. Nbr pays: ${fetchedCountries.length}`);
          setCountries(fetchedCountries); // Stocker les pays reçus
        }
      } catch (err) {
        if (selectedDate) {
          console.error(`[MatchList Test Pays] Erreur lors du chargement:`, err);
          setError('Impossible de charger les pays de test.');
          setCountries([]);
        }
      } finally {
        if (selectedDate) {
          console.log(`[MatchList Test Pays] Fin du chargement.`);
          setLoading(false);
          setCurrentLoadingKey('');
        }
      }
    };

    if (selectedDate) {
      // --- >>> MODIFIÉ : Appel de la fonction de test <<< ---
      fetchCountriesTest();
      // --- >>> FIN MODIFICATION <<< ---
    } else {
      setLoading(false);
    }

  // Dépend seulement de selectedDate pour se lancer une fois au début (ou si date change)
  }, [selectedDate]);

  // --- >>> MODIFIÉ : Affichage de Test <<< ---
  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', p: 4 }}>
        <CircularProgress />
        <Typography sx={{ ml: 2 }}>Test: Chargement des pays...</Typography>
      </Box>
    );
  }
  if (error) {
    return <Alert severity="error">{error}</Alert>;
  }

  return (
    <Box>
      <Typography variant="h5" gutterBottom>Test API /countries</Typography>
      <Typography>Nombre de pays reçus : {countries.length}</Typography>
      {/* Optionnel: Afficher la liste des noms de pays */}
      {countries.length > 0 ? (
          <ul style={{ maxHeight: '300px', overflowY: 'auto', border: '1px solid #ccc', padding: '10px' }}>
            {countries.map(c => <li key={c.name}>{c.name} ({c.code ?? 'N/A'})</li>)}
          </ul>
      ) : (
          <Typography sx={{mt: 2}}>(Aucun pays retourné par l'API)</Typography>
      )}
    </Box>
  );
  // --- >>> FIN MODIFICATION <<< ---
};

export default MatchList;