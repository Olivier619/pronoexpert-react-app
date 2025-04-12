// src/components/common/MainLayout.tsx
import React, { ReactNode } from 'react';
// --- >>> Vérifier que Tab est bien dans cet import <<< ---
import {
    AppBar, Toolbar, Typography, Container, Box, Tabs, Tab, // 'Tab' est nécessaire ici
    Select, MenuItem, FormControl, InputLabel, CircularProgress, SelectChangeEvent
} from '@mui/material';
// --- >>> Fin Vérification <<<---
import { useAppContext, PeriodType } from '../../context/AppContext';

interface MainLayoutProps {
  children: ReactNode;
}

const MainLayout: React.FC<MainLayoutProps> = ({ children }) => {
  const {
      selectedPeriod, setSelectedPeriod,
      availableLeagues, leaguesLoading, selectedLeagueId, setSelectedLeagueId
  } = useAppContext();

  const handleTabChange = (event: React.SyntheticEvent, newValue: PeriodType) => {
    setSelectedPeriod(newValue);
  };

  const handleLeagueChange = (event: SelectChangeEvent<number | string>) => {
      const value = event.target.value;
      const leagueId = value === "all" ? null : Number(value);
      setSelectedLeagueId(leagueId);
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <AppBar position="static">
        <Toolbar>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            PronoExpert
          </Typography>
            {/* Filtre Compétition */}
            <FormControl sx={{ m: 1, minWidth: 200, backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: 1 }} size="small">
              <InputLabel id="league-select-label" sx={{ color: 'white' }}>Compétition</InputLabel>
              <Select
                labelId="league-select-label"
                id="league-select"
                value={selectedLeagueId === null ? 'all' : selectedLeagueId}
                label="Compétition"
                onChange={handleLeagueChange}
                disabled={leaguesLoading}
                sx={{ color: 'white', '.MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(255, 255, 255, 0.3)' }, '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(255, 255, 255, 0.5)' }, '.MuiSvgIcon-root': { color: 'white' } }}
                MenuProps={{ PaperProps: { sx: { maxHeight: 400 } } }}
              >
                <MenuItem value="all">
                  <em>Toutes les compétitions</em>
                </MenuItem>
                {leaguesLoading ? (
                  <MenuItem disabled value="loading">
                    <CircularProgress size={20} sx={{ mr: 1 }}/> Chargement...
                  </MenuItem>
                ) : (
                  availableLeagues // La liste est déjà triée dans le contexte maintenant
                    .map((league) => (
                      <MenuItem key={league.id} value={league.id}>
                        <img src={league.logo} alt="" width="16" height="16" style={{ marginRight: '8px', verticalAlign: 'middle' }} />
                        {league.name} ({league.country?.name ?? 'Monde'})
                      </MenuItem>
                  ))
                )}
              </Select>
            </FormControl>
        </Toolbar>
        {/* Barre d'onglets */}
        <Tabs
          value={selectedPeriod}
          onChange={handleTabChange}
          indicatorColor="secondary"
          textColor="inherit"
          variant="scrollable"
          scrollButtons="auto"
          aria-label="Navigation par période"
          sx={{ bgcolor: 'primary.main' }}
        >
          {/* --- >>> Utilisation de Tab ici <<< --- */}
          <Tab label="Aujourd'hui" value="today" />
          <Tab label="Demain" value="tomorrow" />
          <Tab label="Derniers Matchs" value="yesterday" />
          {/* --- >>> Fin Utilisation <<< --- */}
        </Tabs>
      </AppBar>

      <Container component="main" sx={{ mt: 4, mb: 4, flexGrow: 1 }}>
        {children}
      </Container>

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