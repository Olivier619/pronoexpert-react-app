// src/components/matches/MatchItem.tsx

import React, { useState, useEffect, useCallback } from 'react';
import {
    Card, CardContent, Typography, Box, Chip, Avatar,
    Collapse, Button, CircularProgress, Stack, Divider, Alert
    // Assurez-vous que CircularProgress, Typography, Box, Chip, Stack sont importés ici
} from '@mui/material';

import { format, parseISO } from 'date-fns';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
// Importer les interfaces MatchData, TeamInfo et la nouvelle fonction API
import { MatchData, getTeamLastMatches, TeamInfo } from '../../api/sportDataService';


// --- Interfaces et Types pour les calculs (inchangés) ---

interface TeamForm {
    weightedWins: number;
    weightedDraws: number;
    weightedLosses: number;
    totalWeight: number;
}

interface MatchProbabilities {
    homeWin: number;
    draw: number;
    awayWin: number;
}

interface MatchOdds {
    home: string; // Stocké en string pour un formatage précis
    draw: string;
    away: string;
}

// Interface pour les props attendues par MatchItem
interface MatchItemProps {
  matchData: MatchData;
}

// --- Helper pour déterminer le résultat d'un match du point de vue d'une équipe (inchangé) ---
const getResultForTeam = (match: MatchData, teamId: number): 'W' | 'D' | 'L' | null => {
    if (match.fixture.status.short !== 'FT' && match.fixture.status.short !== 'AET' && match.fixture.status.short !== 'PEN') {
        return null; // Match non terminé
    }

    const teamIsHome = match.teams.home.id === teamId;
    const teamIsAway = match.teams.away.id === teamId;

    if (!teamIsHome && !teamIsAway) {
         console.warn(`[MatchItem] getResultForTeam: Team ID ${teamId} not found in fixture ${match.fixture.id}`);
         return null; // L'équipe n'est pas dans ce match (ne devrait pas arriver avec les données API)
    }

    const homeGoals = match.goals.home ?? 0; // Utiliser 0 si null pour le calcul
    const awayGoals = match.goals.away ?? 0;

    if (homeGoals === awayGoals) {
        return 'D'; // Nul
    }

    if (teamIsHome) {
        return homeGoals > awayGoals ? 'W' : 'L'; // Résultat pour l'équipe à domicile
    } else { // teamIsAway
        return awayGoals > homeGoals ? 'W' : 'L'; // Résultat pour l'équipe à l'extérieur
    }
};


// --- Helper pour calculer la forme pondérée d'une équipe (inchangé) ---
const calculateWeightedForm = (matches: MatchData[], teamId: number, weights: number[]): TeamForm => {
    let weightedWins = 0;
    let weightedDraws = 0;
    let weightedLosses = 0;
    let totalWeight = 0;

    // Parcourir les N premiers matchs selon la taille du tableau de poids
    for (let i = 0; i < Math.min(matches.length, weights.length); i++) {
        const match = matches[i];
        const weight = weights[i];
        const result = getResultForTeam(match, teamId);

        if (result === 'W') {
            weightedWins += weight;
        } else if (result === 'D') {
            weightedDraws += weight;
        } else if (result === 'L') {
            weightedLosses += weight;
        }

        if (result !== null) { // N'ajouter du poids que si le match est terminé et le résultat déterminé
             totalWeight += weight;
        }
    }

    return { weightedWins, weightedDraws, weightedLosses, totalWeight };
};


// --- Helper pour calculer les probabilités et les cotes (inchangé) ---
const calculateProbabilitiesAndOdds = (homeForm: TeamForm, awayForm: TeamForm): { probabilities: MatchProbabilities, odds: MatchOdds } => {
    console.log("[calculateProbabilitiesAndOdds] Home Form:", homeForm);
    console.log("[calculateProbabilitiesAndOdds] Away Form:", awayForm);

    const homeTotal = homeForm.totalWeight > 0 ? homeForm.totalWeight : 1;
    const awayTotal = awayForm.totalWeight > 0 ? awayForm.totalWeight : 1;

    const homeWinPct = homeForm.weightedWins / homeTotal;
    const homeDrawPct = homeForm.weightedDraws / homeTotal;
    const homeLossPct = homeForm.weightedLosses / homeTotal;

    const awayWinPct = awayForm.weightedWins / awayTotal;
    const awayDrawPct = awayForm.weightedDraws / awayTotal;
    const awayLossPct = awayForm.weightedLosses / awayTotal;

    console.log(`[calculateProbabilitiesAndOdds] Home Pct: W=${homeWinPct.toFixed(2)}, D=${homeDrawPct.toFixed(2)}, L=${homeLossPct.toFixed(2)}`);
    console.log(`[calculateProbabilitiesAndOdds] Away Pct: W=${awayWinPct.toFixed(2)}, D=${awayDrawPct.toFixed(2)}, L=${awayLossPct.toFixed(2)}`);

    // Modèle de combinaison simple : moyenne des pourcentages pertinents
    const rawHomeWinProb = (homeWinPct + awayLossPct) / 2;
    const rawDrawProb = (homeDrawPct + awayDrawPct) / 2;
    const rawAwayWinProb = (awayWinPct + homeLossPct) / 2;

    console.log(`[calculateProbabilitiesAndOdds] Raw Probabilities: 1=${rawHomeWinProb.toFixed(2)}, N=${rawDrawProb.toFixed(2)}, 2=${rawAwayWinProb.toFixed(2)}`);

    // Normaliser les probabilités pour qu'elles fassent 100%
    const totalRawProb = rawHomeWinProb + rawDrawProb + rawAwayWinProb;
    let homeWinProb = totalRawProb > 0 ? rawHomeWinProb / totalRawProb : 0;
    let drawProb = totalRawProb > 0 ? rawDrawProb / totalRawProb : 0;
    let awayWinProb = totalRawProb > 0 ? rawAwayWinProb / totalRawProb : 0;

    // Ajustement mineur pour que la somme soit très proche de 1
    const sum = homeWinProb + drawProb + awayWinProb;
     if (sum > 0) {
        homeWinProb = homeWinProb / sum;
        drawProb = drawProb / sum;
        awayWinProb = awayWinProb / sum;
     } else {
        // Assigner des probabilités par défaut si aucune donnée (ou totalRawProb est 0)
        homeWinProb = drawProb = awayWinProb = 1/3; // Ex: 33.3% partout
     }

    console.log(`[calculateProbabilitiesAndOdds] Normalized Probabilities: 1=${homeWinProb.toFixed(2)}, N=${drawProb.toFixed(2)}, 2=${awayWinProb.toFixed(2)}`);

    // Calculer les cotes décimales (Odds = 1 / Probability)
    const homeOdds = homeWinProb > 0 ? 1 / homeWinProb : 999; // Utiliser une cote très haute si prob = 0
    const drawOdds = drawProb > 0 ? 1 / drawProb : 999;
    const awayOdds = awayWinProb > 0 ? 1 / awayWinProb : 999;

    console.log(`[calculateProbabilitiesAndOdds] Calculated Odds: 1=${homeOdds.toFixed(2)}, N=${drawOdds.toFixed(2)}, 2=${awayOdds.toFixed(2)}`);


    return {
        probabilities: { homeWin: homeWinProb, draw: drawProb, awayWin: awayWinProb },
        odds: { home: homeOdds.toFixed(2), draw: drawOdds.toFixed(2), away: awayOdds.toFixed(2) } // Formatage en string avec 2 décimales
    };
};


// --- Composant pour afficher l'historique (inchangé) ---
interface TeamHistoryDisplayProps {
    matches: MatchData[] | null; // Tableau de MatchData ou null
    teamId: number; // ID de l'équipe pour déterminer le résultat
    loading: boolean;
}
const TeamHistoryDisplay: React.FC<TeamHistoryDisplayProps> = ({ matches, teamId, loading }) => {
    if (loading) {
        return <CircularProgress size={16} sx={{ ml: 1 }} />;
    }
    if (!matches) { // Nul si pas chargé ou erreur
        return <Typography variant="caption" sx={{ ml: 1 }}>N/A</Typography>;
    }
    if (matches.length === 0) {
        return <Typography variant="caption" sx={{ ml: 1 }}>Aucun historique trouvé.</Typography>;
    }

    // Extraire et mapper les résultats V/N/D pour affichage pour les matchs terminés
    const results = matches.map(match => getResultForTeam(match, teamId)).filter(result => result !== null) as ('W' | 'D' | 'L')[];

    if (results.length === 0) {
         return <Typography variant="caption" sx={{ ml: 1 }}>Aucun match terminé trouvé.</Typography>;
    }

    const renderChip = (result: 'W' | 'D' | 'L', index: number) => {
        let color: "success" | "warning" | "error" = 'warning'; // Default to warning
        if (result === 'W') color = 'success'; // Vert pour Victoire
        else if (result === 'D') color = 'warning'; // Jaune pour Nul
        else if (result === 'L') color = 'error'; // Rouge pour Défaite

        // Afficher V/N/D
        const label = result === 'W' ? 'V' : (result === 'D' ? 'N' : 'D');

        return (
          <Chip
            key={index}
            label={label}
            size="small"
            color={color}
            variant="outlined"
            sx={{ mr: 0.5, mb: 0.5, fontWeight: 'bold', height: '20px', lineHeight: '1' }}
          />
        );
    }

    return (
        <Stack direction="row" spacing={0.5} useFlexGap flexWrap="wrap">
            {/* Afficher les 15 premiers résultats si disponibles */}
            {results.slice(0, 15).map(renderChip)}
        </Stack>
    );
};


const MatchItem: React.FC<MatchItemProps> = ({ matchData }) => {
  // Destructuration pour faciliter l'accès
  const { fixture, league, teams, goals, score } = matchData;

  // --- États locaux ---
  const [isDetailsExpanded, setIsDetailsExpanded] = useState(false);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [homeTeamLastMatches, setHomeTeamLastMatches] = useState<MatchData[] | null>(null);
  const [awayTeamLastMatches, setAwayTeamLastMatches] = useState<MatchData[] | null>(null);
  const [historyError, setHistoryError] = useState<string | null>(null);

  const [matchProbabilities, setMatchProbabilities] = useState<MatchProbabilities | null>(null);
  const [matchOdds, setMatchOdds] = useState<MatchOdds | null>(null);
  // --- FIN États ---

  // --- Définir les constantes de calculs ICI (au niveau du composant) ---
  const LAST_N_MATCHES = 15; // Nombre total de derniers matchs à considérer
  const WEIGHTED_LAST_M = 5; // Les 5 derniers matchs auront un poids supérieur
  const MIN_MATCHES_FOR_CALC = 5; // Minimum de matchs terminés requis par équipe pour le calcul
  const baseWeight = 1;
  const highWeight = 3; // Poids pour les derniers matchs

  // Créer le tableau de poids. L'API /fixtures?last=N renvoie les matchs du plus récent au plus ancien.
  // Donc le poids le plus élevé doit correspondre aux premiers éléments du tableau.
  const weights: number[] = [];
  for (let i = 0; i < LAST_N_MATCHES; i++) {
      if (i < WEIGHTED_LAST_M) {
          weights.push(highWeight); // Poids fort pour les M derniers
      } else {
          weights.push(baseWeight); // Poids faible pour le reste
      }
  }
  console.log(`[MatchItem ${fixture.id}] Poids utilisés:`, weights);

  // --- Fonction pour basculer les détails et charger/calculer ---
  const handleToggleDetails = async () => {
    const newState = !isDetailsExpanded;
    setIsDetailsExpanded(newState);

    // Charger les données si on ouvre les détails et qu'elles ne sont pas déjà chargées
    // Utiliser les IDs d'équipe pour s'assurer qu'on a bien les bonnes équipes
    if (newState && homeTeamLastMatches === null && awayTeamLastMatches === null && !historyLoading) {
      console.log(`[MatchItem ${fixture.id}] Déclenchement chargement historique et calcul pour équipes ${teams.home.id} (D) et ${teams.away.id} (E)...`);
      setHistoryLoading(true);
      setHistoryError(null); // Réinitialiser les erreurs précédentes
      setMatchProbabilities(null); // Réinitialiser les anciens calculs
      setMatchOdds(null);

      try {
          // Récupérer les N derniers matchs pour chaque équipe
          const [homeMatches, awayMatches] = await Promise.all([
              getTeamLastMatches(teams.home.id, LAST_N_MATCHES),
              getTeamLastMatches(teams.away.id, LAST_N_MATCHES),
          ]);

          console.log(`[MatchItem ${fixture.id}] Historique reçu. Domicile (${teams.home.id}): ${homeMatches?.length ?? 0} matchs. Extérieur (${teams.away.id}): ${awayMatches?.length ?? 0} matchs.`);

          // Stocker les données brutes (l'affichage de la forme récente utilise les données brutes)
          setHomeTeamLastMatches(homeMatches);
          setAwayTeamLastMatches(awayMatches);

          // Filtrer pour n'inclure que les matchs terminés pour le calcul de forme pondérée
          const homeFinishedMatches = homeMatches?.filter(match => getResultForTeam(match, teams.home.id) !== null) ?? [];
          const awayFinishedMatches = awayMatches?.filter(match => getResultForTeam(match, teams.away.id) !== null) ?? [];

           console.log(`[MatchItem ${fixture.id}] Matchs terminés pour calcul: Domicile=${homeFinishedMatches.length}, Extérieur=${awayFinishedMatches.length}`);


          // Calculer les probabilités et les cotes si au moins 5 matchs terminés sont disponibles pour chaque équipe
          if (homeFinishedMatches.length >= MIN_MATCHES_FOR_CALC && awayFinishedMatches.length >= MIN_MATCHES_FOR_CALC) {
               console.log(`[MatchItem ${fixture.id}] Suffisamment de matchs terminés (${MIN_MATCHES_FOR_CALC}) pour le calcul.`);
               const { probabilities, odds } = calculateProbabilitiesAndOdds(
                   calculateWeightedForm(homeFinishedMatches, teams.home.id, weights),
                   calculateWeightedForm(awayFinishedMatches, teams.away.id, weights)
               );
               setMatchProbabilities(probabilities);
               setMatchOdds(odds);
               console.log(`[MatchItem ${fixture.id}] Calcul terminé. Prob:`, probabilities, "Odds:", odds);
          } else {
              console.warn(`[MatchItem ${fixture.id}] Pas assez de matchs terminés pour le calcul (Minimum requis: ${MIN_MATCHES_FOR_CALC}).`);
              setHistoryError(`Pas assez de données historiques terminées (minimum ${MIN_MATCHES_FOR_CALC} par équipe) pour calculer les probabilités.`);
               // Les états probabilities et odds restent null
          }

      } catch (err) {
          console.error(`[MatchItem ${fixture.id}] Erreur lors du chargement ou du calcul de l'historique:`, err);
          setHistoryError('Impossible de charger les données pour le calcul. Veuillez réessayer.');
          setHomeTeamLastMatches([]); // Vider les données en cas d'erreur
          setAwayTeamLastMatches([]);
          setMatchProbabilities(null); // S'assurer que les états de calcul sont nuls en cas d'erreur
          setMatchOdds(null);
      } finally {
          setHistoryLoading(false);
          console.log(`[MatchItem ${fixture.id}] Fin du chargement/calcul.`);
      }
    }
  };
  // --- FIN Fonction ---


  // --- Helper pour la couleur du statut (inchangé) ---
  const getStatusColor = (shortStatus: string): "success" | "warning" | "error" | "info" | "default" => {
    switch (shortStatus) {
      case 'FT': case 'AET': case 'PEN': return 'success';
      case 'HT': case 'P': case 'BT': case 'LIVE': case '1H': case '2H': case 'ET': return 'warning';
      case 'PST': case 'SUSP': case 'INT': return 'error';
      case 'NS': return 'info';
      case 'TBD': case 'CANC': case 'ABD': case 'AWD': case 'WO': default: return 'default';
    }
  };
  // --- FIN Helper ---


  return (
    <Card variant="outlined" sx={{ mb: 2 }}>
      <CardContent sx={{ pb: isDetailsExpanded ? 1 : 2 }}>
        {/* Header avec Ligue et Statut/Heure */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
             <Box sx={{ display: 'flex', alignItems: 'center' }}>
                 {league.logo && <Avatar src={league.logo} alt={league.name} sx={{ width: 20, height: 20, mr: 1 }} />}
                 <Typography variant="caption" color="text.secondary">
                    {/* CORRECTION ICI : Utiliser league.round au lieu de fixture.round */}
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
            <Box sx={{ textAlign: 'center', mx: 1 }}>
              {/* Afficher le score si le match n'est pas "Not Started" */}
              {fixture.status.short !== 'NS' && goals.home !== null && goals.away !== null ? (
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
               disabled={historyLoading && !isDetailsExpanded} // Désactiver si le chargement est en cours ET que les détails sont déjà ouverts
             >
               {isDetailsExpanded ? 'Masquer détails' : 'Voir détails'}
               {/* Afficher le loader à côté du texte du bouton si le chargement est en cours */}
               {historyLoading && (isDetailsExpanded || (homeTeamLastMatches === null && awayTeamLastMatches === null)) && <CircularProgress size={14} sx={{ ml: 1}} />}
             </Button>
         </Box>

      </CardContent>

        {/* Section Détails (Historique + Prono/Cotes) */}
        <Collapse in={isDetailsExpanded} timeout="auto" unmountOnExit>
            <Divider />
            <CardContent sx={{ pt: 1.5 }}>
                 {historyError && (
                    <Alert severity="error" sx={{mb: 2}}>{historyError}</Alert>
                 )}

                 {/* Section Forme Récente */}
                 <Typography variant="subtitle2" gutterBottom>
                    Forme Récente ({LAST_N_MATCHES} derniers matchs terminés) :
                 </Typography>

                 {/* Affichage Historique Domicile */}
                 <Box sx={{ display: 'flex', alignItems: 'center', mb: 0.5, flexWrap: 'wrap' }}>
                     <Typography variant="body2" sx={{ minWidth: {xs: '60px', sm:'80px'}, mr: 1, fontWeight: '500', flexShrink: 0 }}>{teams.home.name}:</Typography>
                     {/* Passer les données brutes et l'ID équipe au composant d'affichage */}
                     <TeamHistoryDisplay matches={homeTeamLastMatches} teamId={teams.home.id} loading={historyLoading} />
                 </Box>

                 {/* Affichage Historique Extérieur */}
                 <Box sx={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap' }}>
                     <Typography variant="body2" sx={{ minWidth: {xs: '60px', sm:'80px'}, mr: 1, fontWeight: '500', flexShrink: 0 }}>{teams.away.name}:</Typography>
                      {/* Passer les données brutes et l'ID équipe au composant d'affichage */}
                     <TeamHistoryDisplay matches={awayTeamLastMatches} teamId={teams.away.id} loading={historyLoading} />
                 </Box>

                 {/* Section Probabilités et Cotes */}
                 {!historyLoading && matchProbabilities && matchOdds && (
                     <Box sx={{ mt: 2 }}>
                         <Typography variant="subtitle2" gutterBottom>
                            Pronostic Basé sur la Forme Récente :
                         </Typography>
                         <Box sx={{ display: 'flex', justifyContent: 'space-around', alignItems: 'center' }}>
                             {/* Probabilité Domicile */}
                             <Box sx={{ textAlign: 'center' }}>
                                 <Typography variant="body1" sx={{ fontWeight: 'bold' }}>
                                     {teams.home.name} (1)
                                 </Typography>
                                  {/* Afficher la probabilité arrondie */}
                                 <Typography variant="body2" color="text.secondary">
                                     {(matchProbabilities.homeWin * 100).toFixed(1)} %
                                 </Typography>
                                 {/* Afficher la cote */}
                                  {/* N'afficher la cote que si elle est calculée (pas la valeur par défaut 999) */}
                                 {matchOdds.home !== "999.00" && (
                                      <Chip label={`@ ${matchOdds.home}`} size="small" color="primary" sx={{ mt: 0.5, fontWeight: 'bold' }}/>
                                 )}
                             </Box>
                             {/* Probabilité Nul */}
                             <Box sx={{ textAlign: 'center' }}>
                                 <Typography variant="body1" sx={{ fontWeight: 'bold' }}>
                                     Nul (N)
                                 </Typography>
                                 <Typography variant="body2" color="text.secondary">
                                     {(matchProbabilities.draw * 100).toFixed(1)} %
                                 </Typography>
                                  {/* Afficher la cote */}
                                   {/* N'afficher la cote que si elle est calculée */}
                                  {matchOdds.draw !== "999.00" && (
                                      <Chip label={`@ ${matchOdds.draw}`} size="small" color="primary" sx={{ mt: 0.5, fontWeight: 'bold' }}/>
                                  )}
                             </Box>
                             {/* Probabilité Extérieur */}
                             <Box sx={{ textAlign: 'center' }}>
                                 <Typography variant="body1" sx={{ fontWeight: 'bold' }}>
                                     {teams.away.name} (2)
                                 </Typography>
                                 <Typography variant="body2" color="text.secondary">
                                     {(matchProbabilities.awayWin * 100).toFixed(1)} %
                                 </Typography>
                                  {/* Afficher la cote */}
                                   {/* N'afficher la cote que si elle est calculée */}
                                   {matchOdds.away !== "999.00" && (
                                      <Chip label={`@ ${matchOdds.away}`} size="small" color="primary" sx={{ mt: 0.5, fontWeight: 'bold' }}/>
                                  )}
                             </Box>
                         </Box>
                     </Box>
                 )}
                 {/* Message si calcul impossible après chargement */}
                 {/* CONDITION CORRIGÉE pour utiliser MIN_MATCHES_FOR_CALC qui est maintenant dans la portée */}
                 {!historyLoading && (
                     (homeTeamLastMatches !== null && awayTeamLastMatches !== null) && // S'assurer que les données sont chargées (même vides)
                     (homeTeamLastMatches.filter(match => getResultForTeam(match, teams.home.id) !== null).length < MIN_MATCHES_FOR_CALC ||
                      awayTeamLastMatches.filter(match => getResultForTeam(match, teams.away.id) !== null).length < MIN_MATCHES_FOR_CALC)
                 ) && !historyError && (
                      <Typography variant="body2" color="text.secondary" sx={{ mt: 2, textAlign: 'center' }}> {/* Centrer le texte */}
                           Pas assez de données historiques terminées (minimum {MIN_MATCHES_FOR_CALC} par équipe) pour calculer les probabilités.
                      </Typography>
                 )}


            </CardContent>
        </Collapse>

    </Card>
  );
};

export default MatchItem;