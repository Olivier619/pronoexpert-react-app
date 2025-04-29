// src/components/common/MainLayout.tsx
import React, { ReactNode } from 'react';
import {
    AppBar, Toolbar, Typography, Container, Box, Tabs, Tab,
    // Retirer imports liés au filtre de ligue si CompetitionFilter gère tout
} from '@mui/material';
// Retirer imports date-fns si la date est calculée dans le contexte
// import { format, addDays, subDays } from 'date-fns'; // <--- A retirer
// Importation du contexte
import { useAppContext, PeriodType } from '../../context/AppContext';
// Importation du composant CompetitionFilter
import CompetitionFilter from '../competitions/CompetitionFilter';


interface MainLayoutProps {
  children: ReactNode;
}

const MainLayout: React.FC<MainLayoutProps> = ({ children }) => {
  // Récupérer seulement ce dont MainLayout a besoin du contexte
  // selectedDate est maintenant une valeur calculée dans le contexte, pas besoin du setter ici
  const {
      selectedPeriod,
      setSelectedPeriod,
      // selectedDate // Vous pouvez le garder pour l'afficher si vous voulez, mais pas pour le modifier
  } = useAppContext();


  // Gérer le changement d'onglet (Période)
  const handleTabChange = (event: React.SyntheticEvent, newValue: PeriodType) => {
    console.log(`[MainLayout] Onglet de période changé: ${newValue}`);
    // Appeler SEULEMENT setSelectedPeriod du contexte
    setSelectedPeriod(newValue);
    // La date sera automatiquement recalculée et mise à jour dans le contexte par le useMemo
    // --- Supprimer : Logique de calcul de date et setSelectedDate(newDate); ---
  };

  // handleLeagueChange est géré dans CompetitionFilter


  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <AppBar position="static">
        <Toolbar>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            PronoExpert
          </Typography>

          {/* Intégration du composant CompetitionFilter */}
          <CompetitionFilter />

        </Toolbar>
        {/* Barre d'onglets pour les périodes */}
        {/* Value et onChange utilisent les états et handlers de MainLayout */}
        <Tabs
          value={selectedPeriod} // Utilise la période du contexte
          onChange={handleTabChange} // Appelle le handler qui met à jour la période
          indicatorColor="secondary"
          textColor="inherit"
          variant="scrollable"
          scrollButtons="auto"
          aria-label="Navigation par période"
          sx={{ bgcolor: 'primary.main' }}
        >
          {/* Les valeurs doivent correspondre aux PeriodType définis dans le contexte */}
          <Tab label="Aujourd'hui" value="today" />
          <Tab label="Demain" value="tomorrow" />
          <Tab label="Derniers Matchs" value="yesterday" /> {/* Vérifiez la valeur si 'yesterday' ne convient pas */}
        </Tabs>
      </AppBar>

      {/* Contenu principal de la page (la liste des matchs, etc.) */}
      <Container component="main" sx={{ mt: 4, mb: 4, flexGrow: 1 }}>
        {children} {/* Affiche le contenu passé en props (ex: MatchList) */}
      </Container>

      {/* Pied de page */}
      <Box component="footer" sx={{ py: 2, px: 2, mt: 'auto', backgroundColor: (theme) => theme.palette.mode === 'light' ? theme.palette.grey[200] : theme.palette.grey[800], }} >
          <Container maxWidth="sm">
            <Typography variant="body2" color="text.secondary" align="center">
              {'Copyright © '} PronoExpert {new Date().getFullYear()}{'.'}
            </Typography>
          </Container>
      </Box>
    </Box>
  );
};

export default MainLayout;