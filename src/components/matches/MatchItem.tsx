// src/components/matches/MatchItem.tsx

import React from 'react';
import { Card, CardContent, Typography, Box, Chip, Avatar } from '@mui/material';
import { format, parseISO } from 'date-fns';
import { MatchData } from '../../api/sportDataService'; // Importer l'interface

// Interface pour les props attendues par MatchItem
interface MatchItemProps {
  matchData: MatchData;
  // On ajoutera 'isExpanded' et 'onToggleDetails' plus tard pour l'historique
}

const MatchItem: React.FC<MatchItemProps> = ({ matchData }) => {
  const { fixture, league, teams, goals, score } = matchData;

  // Fonction pour obtenir une couleur de chip basée sur le statut court
  const getStatusColor = (shortStatus: string): "success" | "warning" | "error" | "info" | "default" => {
    switch (shortStatus) {
      case 'FT': // Terminé
      case 'AET': // Après Prolongation
      case 'PEN': // Après Tirs au But
        return 'success';
      case 'HT': // Mi-temps
      case 'P': // Pénaltys en cours
      case 'BT': // Prolongations
      case 'LIVE': // alias pour 1H, HT, 2H, ET, P, BT
      case '1H':
      case '2H':
        return 'warning';
      case 'PST': // Reporté
      case 'SUSP': // Suspendu
      case 'INT': // Interrompu
        return 'error';
      case 'NS': // Pas commencé
        return 'info';
      case 'TBD': // À déterminer
      case 'CANC': // Annulé
      case 'ABD': // Abandonné
      case 'AWD': // Forfait
      case 'WO': // Forfait
      default:
        return 'default';
    }
  }

  return (
    <Card variant="outlined" sx={{ mb: 2 }}>
      <CardContent>
        {/* Header avec Ligue et Statut/Heure */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
             {league.logo && <Avatar src={league.logo} alt={league.name} sx={{ width: 20, height: 20, mr: 1 }} />}
            <Typography variant="caption" color="text.secondary">
              {league.name} - {league.country} {league.round && `- ${league.round}`}
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
          <Box sx={{ display: 'flex', alignItems: 'center', flex: 1, justifyContent: 'flex-start' }}>
             {teams.home.logo && <Avatar src={teams.home.logo} alt={teams.home.name} sx={{ width: 24, height: 24, mr: 1 }} />}
            <Typography sx={{ fontWeight: '500' }}>{teams.home.name}</Typography>
          </Box>

          {/* Score */}
          <Box sx={{ textAlign: 'center', mx: 2 }}>
            {goals.home !== null && goals.away !== null ? (
              <Typography variant="h6" component="div" sx={{ fontWeight: 'bold' }}>
                {goals.home} - {goals.away}
              </Typography>
            ) : (
               <Typography variant="body1" component="div">vs</Typography> // Affiche "vs" si pas de score
            )}
             {/* Afficher le score mi-temps si dispo et match commencé */}
             {score.halftime?.home !== null && fixture.status.short !== 'NS' && (
                <Typography variant="caption" color="text.secondary">
                    ({score.halftime.home}-{score.halftime.away})
                </Typography>
             )}
          </Box>

          {/* Équipe Extérieur */}
          <Box sx={{ display: 'flex', alignItems: 'center', flex: 1, justifyContent: 'flex-end' }}>
            <Typography sx={{ fontWeight: '500', textAlign: 'right' }}>{teams.away.name}</Typography>
             {teams.away.logo && <Avatar src={teams.away.logo} alt={teams.away.name} sx={{ width: 24, height: 24, ml: 1 }} />}
          </Box>
        </Box>

         {/* TODO: Ajouter bouton pour voir les détails/historique */}
         {/* <Button size="small" sx={{ mt: 1 }}>Voir détails</Button> */}

      </CardContent>
    </Card>
  );
};

export default MatchItem;