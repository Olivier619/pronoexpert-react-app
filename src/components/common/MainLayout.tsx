// src/components/common/MainLayout.tsx
import React, { ReactNode } from 'react';
import { AppBar, Toolbar, Typography, Container, Box, Tabs, Tab } from '@mui/material';
import { useAppContext, PeriodType } from '../../context/AppContext'; // Importer le hook et le type

interface MainLayoutProps {
  children: ReactNode;
}

const MainLayout: React.FC<MainLayoutProps> = ({ children }) => {
  // Utiliser le contexte pour obtenir et modifier la période sélectionnée
  const { selectedPeriod, setSelectedPeriod } = useAppContext();

  // Gérer le changement d'onglet
  const handleTabChange = (event: React.SyntheticEvent, newValue: PeriodType) => {
    setSelectedPeriod(newValue);
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <AppBar position="static">
        <Toolbar>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            PronoExpert
          </Typography>
          {/* Ajouter des boutons ici plus tard */}
        </Toolbar>
        {/* Barre d'onglets sous la barre principale */}
        <Tabs
          value={selectedPeriod}
          onChange={handleTabChange}
          indicatorColor="secondary"
          textColor="inherit"
          variant="scrollable" // Permet le défilement si pas assez de place
          scrollButtons="auto" // Affiche les boutons de défilement si nécessaire
          aria-label="Navigation par période"
          sx={{ bgcolor: 'primary.main' }} // Fond assorti à l'AppBar
        >
          <Tab label="Aujourd'hui" value="today" />
          <Tab label="Demain" value="tomorrow" />
          <Tab label="Derniers Matchs" value="yesterday" />
          {/* On pourrait ajouter d'autres périodes ici */}
        </Tabs>
      </AppBar>

      <Container component="main" sx={{ mt: 4, mb: 4, flexGrow: 1 }}>
        {children}
      </Container>

      {/* Footer (inchangé) */}
      <Box component="footer" /* ... etc ... */ >
         {/* ... contenu du footer ... */}
      </Box>
    </Box>
  );
};

export default MainLayout;