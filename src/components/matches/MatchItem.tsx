// src/components/matches/MatchItem.tsx

// --- AJOUTS/VÉRIFICATIONS IMPORTS ---
import React, { useState } from 'react'; // Ajout de useState
import { Card, CardContent, Typography, Box, Chip, Avatar, Collapse, Button, CircularProgress, Stack, Divider } from '@mui/material'; // Ajout de Collapse, Button, CircularProgress, Stack, Divider
import { format, parseISO } from 'date-fns';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore'; // Icône pour déplier
import ExpandLessIcon from '@mui/icons-material/ExpandLess'; // Icône pour replier
// --- FIN AJOUTS IMPORTS ---

import { MatchData } from '../../api/sportDataService';

interface MatchItemProps {
  matchData: MatchData;
}

// --- AJOUT : Composant pour afficher l'historique ---
interface TeamHistoryDisplayProps {
    history: string[] | null; // Tableau de 'V', 'N', 'D' ou null si pas chargé
    loading: boolean;
}
const TeamHistoryDisplay: React.FC<TeamHistoryDisplayProps> = ({ history, loading }) => {
    if (loading) {
        return <CircularProgress size={16} sx={{ ml: 1 }} />;
    }
    if (!history) {
        return <Typography variant="caption" sx={{ ml: 1 }}>N/A</Typography>;
    }
    if (history.length === 0) {
        return <Typography variant="caption" sx={{ ml: 1 }}>Aucun historique</Typography>;
    }

    const renderChip = (result: string, index: number) => {
        let color: "success" | "warning" | "error" | "default" = 'default';
        if (result === 'V') color = 'success';
        else if (result === 'N') color = 'warning';
        else if (result === 'D') color = 'error';
        return (
          <Chip
            key={index}
            label={result}
            size="small"
            color={color}
            variant="outlined"
            sx={{ mr: 0.5, mb: 0.5, fontWeight: 'bold', height: '20px', lineHeight: '1' }} // Taille réduite
          />
        );
    }

    // Afficher seulement les 15 derniers, même si on en reçoit plus
    return (
        <Stack direction="row" spacing={0.5} useFlexGap flexWrap="wrap">
            {history.slice(0, 15).map(renderChip)}
        </Stack>
    );
};
// --- FIN AJOUT Composant Historique ---


const MatchItem: React.FC<MatchItemProps> = ({ matchData }) => {
  const { fixture, league, teams, goals, score } = matchData;

  // --- AJOUT : États locaux ---
  const [isDetailsExpanded, setIsDetailsExpanded] = useState(false);
  const [historyLoading, setHistoryLoading] = useState(false);
  // Données factices pour l'instant
  const [homeHistory, setHomeHistory] = useState<string[] | null>(null); // Commencer à null
  const [awayHistory, setAwayHistory] = useState<string[] | null>(null); // Commencer à null
  const [historyError, setHistoryError] = useState<string | null>(null);
  // --- FIN AJOUT États ---

  // --- AJOUT : Fonction pour basculer les détails ---
  const handleToggleDetails = () => {
    const newState = !isDetailsExpanded;
    setIsDetailsExpanded(newState);

    // Si on ouvre les détails ET qu'on n'a pas encore chargé l'historique
    if (newState && !homeHistory && !awayHistory && !historyLoading) {
      // Déclencher le chargement (on mettra l'appel API ici demain)
      console.log(`[MatchItem ${fixture.id}] Déclenchement chargement historique...`);
      setHistoryLoading(true);
      setHistoryError(null); // Reset error

      // -- SIMULATION D'APPEL API (à remplacer demain) --
      setTimeout(() => {
          console.log(`[MatchItem ${fixture.id}] Réception données factices historique.`);
          // Simuler une réponse réussie avec des données factices
          setHomeHistory(['V', 'V', 'N', 'D', 'V', 'N', 'N', 'V', 'D', 'V', 'V', 'V', 'N', 'D', 'V'].reverse()); // .reverse() pour avoir le plus récent à gauche ? Ou l'API le donne déjà ?
          setAwayHistory(['D', 'N', 'V', 'V', 'D', 'N', 'V', 'D', 'D', 'N', 'V', 'N', 'V', 'V', 'D'].reverse());
          setHistoryLoading(false);

          // // Simuler une erreur (décommenter pour tester l'affichage d'erreur)
          // console.log(`[MatchItem ${fixture.id}] Simulation ERREUR historique.`);
          // setHistoryError("Erreur simulée lors du chargement de l'historique.");
          // setHomeHistory(null);
          // setAwayHistory(null);
          // setHistoryLoading(false);

      }, 1500); // Simule un délai réseau de 1.5s
      // -- FIN SIMULATION --
    } else if (!newState) {
        // Optionnel: Réinitialiser si on referme ? Ou garder en cache local ?
        // setHomeHistory(null);
        // setAwayHistory(null);
        // setHistoryError(null);
    }
  };
  // --- FIN AJOUT Fonction ---


  const getStatusColor = (shortStatus: string): "success" | "warning" | "error" | "info" | "default" => { /* ... (inchangé) ... */ };

  return (
    <Card variant="outlined" sx={{ mb: 2 }}>
      <CardContent sx={{ pb: isDetailsExpanded ? 1 : 2 }}> {/* Moins de padding bottom si détails ouverts */}
        {/* Header avec Ligue et Statut/Heure (inchangé) */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
            {/* ... code inchangé ... */}
        </Box>

        {/* Corps avec Équipes et Score (inchangé) */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
             {/* ... code inchangé ... */}
        </Box>

        {/* --- AJOUT : Bouton Voir/Masquer Détails --- */}
        <Box sx={{ textAlign: 'center', mt: 1.5 }}>
            <Button
              size="small"
              onClick={handleToggleDetails}
              endIcon={isDetailsExpanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
              disabled={historyLoading && isDetailsExpanded} // Désactiver si on charge
            >
              {isDetailsExpanded ? 'Masquer détails' : 'Voir détails'}
              {historyLoading && isDetailsExpanded && <CircularProgress size={14} sx={{ ml: 1}} />}
            </Button>
        </Box>
        {/* --- FIN AJOUT Bouton --- */}

      </CardContent>

        {/* --- AJOUT : Section Détails (Historique + futur Prono) --- */}
        <Collapse in={isDetailsExpanded} timeout="auto" unmountOnExit>
            <Divider /> {/* Séparateur visuel */}
            <CardContent sx={{ pt: 1.5 }}> {/* Un peu de padding en haut */}
                 <Typography variant="subtitle2" gutterBottom>
                    Forme Récente (15 derniers) :
                 </Typography>

                 {historyError && (
                    <Alert severity="error" sx={{mt: 1}}>{historyError}</Alert>
                 )}

                 {/* Affichage Historique Domicile */}
                 <Box sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
                     <Typography variant="body2" sx={{ minWidth: '80px', fontWeight: '500' }}>{teams.home.name}:</Typography>
                     <TeamHistoryDisplay history={homeHistory} loading={historyLoading} />
                 </Box>

                 {/* Affichage Historique Extérieur */}
                 <Box sx={{ display: 'flex', alignItems: 'center' }}>
                     <Typography variant="body2" sx={{ minWidth: '80px', fontWeight: '500' }}>{teams.away.name}:</Typography>
                     <TeamHistoryDisplay history={awayHistory} loading={historyLoading} />
                 </Box>

                 {/* TODO: Ajouter le Pronostic Calculé ici */}
                 {/* {homeHistory && awayHistory && !historyLoading && (
                     <Box sx={{ mt: 1.5, pt: 1, borderTop: '1px dashed grey' }}>
                         <Typography variant="subtitle2">Pronostic:</Typography>
                         <Typography variant="body2">Calcul basé sur la forme...</Typography>
                     </Box>
                 )} */}

            </CardContent>
        </Collapse>
        {/* --- FIN AJOUT Section Détails --- */}

    </Card>
  );
};

export default MatchItem;