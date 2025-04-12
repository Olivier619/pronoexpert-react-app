// src/components/matches/MatchItem.tsx

import React, { useState } from 'react';
import {
    Card, CardContent, Typography, Box, Chip, Avatar,
    Collapse, Button, CircularProgress, Stack, Divider, Alert // Assurez-vous qu'Alert est bien importé
} from '@mui/material';
import { format, parseISO } from 'date-fns';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import { MatchData } from '../../api/sportDataService'; // Importer l'interface

// Interface pour les props attendues par MatchItem
interface MatchItemProps {
  matchData: MatchData;
}

// --- Composant pour afficher l'historique ---
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
            sx={{ mr: 0.5, mb: 0.5, fontWeight: 'bold', height: '20px', lineHeight: '1' }}
          />
        );
    }

    return (
        <Stack direction="row" spacing={0.5} useFlexGap flexWrap="wrap">
            {history.slice(0, 15).map(renderChip)}
        </Stack>
    );
};
// --- FIN Composant Historique ---


const MatchItem: React.FC<MatchItemProps> = ({ matchData }) => {
  const { fixture, league, teams, goals, score } = matchData;

  // --- États locaux ---
  const [isDetailsExpanded, setIsDetailsExpanded] = useState(false);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [homeHistory, setHomeHistory] = useState<string[] | null>(null);
  const [awayHistory, setAwayHistory] = useState<string[] | null>(null);
  const [historyError, setHistoryError] = useState<string | null>(null);
  // --- FIN États ---

  // --- Fonction pour basculer les détails ---
  const handleToggleDetails = () => {
    const newState = !isDetailsExpanded;
    setIsDetailsExpanded(newState);

    if (newState && !homeHistory && !awayHistory && !historyLoading) {
      console.log(`[MatchItem ${fixture.id}] Déclenchement chargement historique...`);
      setHistoryLoading(true);
      setHistoryError(null);

      // -- SIMULATION D'APPEL API (à remplacer demain) --
      setTimeout(() => {
          console.log(`[MatchItem ${fixture.id}] Réception données factices historique.`);
          setHomeHistory(['V', 'V', 'N', 'D', 'V', 'N', 'N', 'V', 'D', 'V', 'V', 'V', 'N', 'D', 'V'].reverse());
          setAwayHistory(['D', 'N', 'V', 'V', 'D', 'N', 'V', 'D', 'D', 'N', 'V', 'N', 'V', 'V', 'D'].reverse());
          setHistoryLoading(false);
          // // Simuler une erreur
          // setHistoryError("Erreur simulée lors du chargement de l'historique.");
          // setHomeHistory(null); setAwayHistory(null); setHistoryLoading(false);
      }, 1500);
      // -- FIN SIMULATION --
    }
  };
  // --- FIN Fonction ---


  // --- >>> CORPS COMPLET DE getStatusColor RESTAURÉ <<< ---
  const getStatusColor = (shortStatus: string): "success" | "warning" | "error" | "info" | "default" => {
    switch (shortStatus) {
      case 'FT': case 'AET': case 'PEN':
        return 'success';
      case 'HT': case 'P': case 'BT': case 'LIVE': case '1H': case '2H': case 'ET':
        return 'warning';
      case 'PST': case 'SUSP': case 'INT':
        return 'error';
      case 'NS':
        return 'info';
      case 'TBD': case 'CANC': case 'ABD': case 'AWD': case 'WO':
      default:
        return 'default';
    }
  };
  // --- >>> FIN RESTAURATION <<< ---


  return (
    <Card variant="outlined" sx={{ mb: 2 }}>
      <CardContent sx={{ pb: isDetailsExpanded ? 1 : 2 }}>
        {/* Header avec Ligue et Statut/Heure */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
             <Box sx={{ display: 'flex', alignItems: 'center' }}>
                 {league.logo && <Avatar src={league.logo} alt={league.name} sx={{ width: 20, height: 20, mr: 1 }} />}
                 <Typography variant="caption" color="text.secondary">
                    {/* Correction accès country.name + fallback + affichage round */}
                    {`${league.name} - ${league.country?.name ?? 'N/A'} ${league.round ? `- ${league.round}` : ''}`}
                 </Typography>
             </Box>
             <Chip
                 label={fixture.status.short === 'NS' ? format(parseISO(fixture.date), 'HH:mm') : fixture.status.long}
                 size="small"
                 color={getStatusColor(fixture.status.short)}
                 variant="outlined"
             />
        </Box>

        {/* Corps avec Équipes et Score */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            {/* Équipe Domicile */}
            <Box sx={{ display: 'flex', alignItems: 'center', flex: 1, justifyContent: 'flex-start', overflow: 'hidden', mr: 1 }}>
               {teams.home.logo && <Avatar src={teams.home.logo} alt={teams.home.name} sx={{ width: 24, height: 24, mr: 1, flexShrink: 0 }} />}
               <Typography sx={{ fontWeight: '500', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{teams.home.name}</Typography>
            </Box>

            {/* Score */}
            <Box sx={{ textAlign: 'center', mx: 1 }}> {/* Réduit marge horizontale */}
              {goals.home !== null && goals.away !== null ? (
                 <Typography variant="h6" component="div" sx={{ fontWeight: 'bold' }}>
                    {goals.home} - {goals.away}
                 </Typography>
              ) : (
                 <Typography variant="body1" component="div">vs</Typography>
              )}
              {/* Afficher le score mi-temps si dispo et match commencé */}
              {score.halftime?.home !== null && fixture.status.short !== 'NS' && (
                 <Typography variant="caption" color="text.secondary">
                     ({score.halftime.home}-{score.halftime.away})
                 </Typography>
              )}
            </Box>

            {/* Équipe Extérieur */}
            <Box sx={{ display: 'flex', alignItems: 'center', flex: 1, justifyContent: 'flex-end', overflow: 'hidden', ml: 1 }}>
               <Typography sx={{ fontWeight: '500', textAlign: 'right', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{teams.away.name}</Typography>
               {teams.away.logo && <Avatar src={teams.away.logo} alt={teams.away.name} sx={{ width: 24, height: 24, ml: 1, flexShrink: 0 }} />}
            </Box>
        </Box>

        {/* Bouton Voir/Masquer Détails */}
        <Box sx={{ textAlign: 'center', mt: 1.5 }}>
            <Button
               size="small"
               onClick={handleToggleDetails}
               endIcon={isDetailsExpanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
               disabled={historyLoading && isDetailsExpanded}
             >
               {isDetailsExpanded ? 'Masquer détails' : 'Voir détails'}
               {historyLoading && isDetailsExpanded && <CircularProgress size={14} sx={{ ml: 1}} />}
             </Button>
         </Box>

      </CardContent>

        {/* Section Détails (Historique + futur Prono) */}
        <Collapse in={isDetailsExpanded} timeout="auto" unmountOnExit>
            <Divider />
            <CardContent sx={{ pt: 1.5 }}>
                 <Typography variant="subtitle2" gutterBottom>
                    Forme Récente (15 derniers) :
                 </Typography>

                 {historyError && (
                    <Alert severity="error" sx={{mt: 1}}>{historyError}</Alert> // Utilise Alert importé
                 )}

                 {/* Affichage Historique Domicile */}
                 <Box sx={{ display: 'flex', alignItems: 'center', mb: 0.5, flexWrap: 'wrap' }}> {/* Ajout flexWrap */}
                     <Typography variant="body2" sx={{ minWidth: {xs: '60px', sm:'80px'}, mr: 1, fontWeight: '500', flexShrink: 0 }}>{teams.home.name}:</Typography> {/* Responsive minWidth */}
                     <TeamHistoryDisplay history={homeHistory} loading={historyLoading} />
                 </Box>

                 {/* Affichage Historique Extérieur */}
                 <Box sx={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap' }}> {/* Ajout flexWrap */}
                     <Typography variant="body2" sx={{ minWidth: {xs: '60px', sm:'80px'}, mr: 1, fontWeight: '500', flexShrink: 0 }}>{teams.away.name}:</Typography> {/* Responsive minWidth */}
                     <TeamHistoryDisplay history={awayHistory} loading={historyLoading} />
                 </Box>

                 {/* TODO: Ajouter le Pronostic Calculé ici */}

            </CardContent>
        </Collapse>

    </Card>
  );
};

export default MatchItem;