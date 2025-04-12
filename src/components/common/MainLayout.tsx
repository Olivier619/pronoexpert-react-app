// src/components/common/MainLayout.tsx
import React, { ReactNode } from 'react';
import {
    AppBar, Toolbar, Typography, Container, Box, Tabs, Tab,
    Select, MenuItem, FormControl, InputLabel, CircularProgress, SelectChangeEvent // Ajouts pour Select
} from '@mui/material';
import { useAppContext, PeriodType } from '../../context/AppContext';

interface MainLayoutProps {
  children: ReactNode;
}

const MainLayout: React.FC<MainLayoutProps> = ({ children }) => {
  // Récupérer les états/setters du contexte, y compris pour les ligues
  const {
      selectedPeriod, setSelectedPeriod,
      availableLeagues, leaguesLoading, selectedLeagueId, setSelectedLeagueId
  } = useAppContext();

  const handleTabChange = (event: React.SyntheticEvent, newValue: PeriodType) => {
    setSelectedPeriod(newValue);
  };

  // Gérer le changement de ligue sélectionnée
  const handleLeagueChange = (event: SelectChangeEvent<number | string>) => {
      const value = event.target.value;
      // Convertir en nombre si ce n'est pas "all", sinon null
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
           {/* --- AJOUT: Filtre Compétition --- */}
            <FormControl sx={{ m: 1, minWidth: 200, backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: 1 }} size="small">
              <InputLabel id="league-select-label" sx={{ color: 'white' }}>Compétition</InputLabel>
              <Select
                labelId="league-select-label"
                id="league-select"
                value={selectedLeagueId === null ? 'all' : selectedLeagueId} // Utiliser 'all' pour la valeur null
                label="Compétition"
                onChange={handleLeagueChange}
                disabled={leaguesLoading} // Désactiver pendant le chargement
                sx={{ color: 'white', '.MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(255, 255, 255, 0.3)' }, '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(255, 255, 255, 0.5)' }, '.MuiSvgIcon-root': { color: 'white' } }}
                MenuProps={{ // Style du menu déroulant
                    PaperProps: {
                        sx: { maxHeight: 400 } // Limite la hauteur
                    }
                }}
              >
                {/* Option "Toutes" */}
                <MenuItem value="all">
                  <em>Toutes les compétitions</em>
                </MenuItem>
                {/* Options pour chaque ligue disponible */}
                {leaguesLoading ? (
                  <MenuItem disabled value="loading">
                    <CircularProgress size={20} sx={{ mr: 1 }}/> Chargement...
                  </MenuItem>
                ) : (
                  availableLeagues
                    // Optionnel: Trier les ligues par pays puis par nom
                    .sort((a, b) => (a.country?.name ?? '').localeCompare(b.country?.name ?? '') || a.name.localeCompare(b.name))
                    .map((league) => (
                      <MenuItem key={league.id} value={league.id}>
                        <img src={league.logo} alt="" width="16" height="16" style={{ marginRight: '8px', verticalAlign: 'middle' }} />
                        {league.name} ({league.country?.name ?? 'Monde'})
                      </MenuItem>
                  ))
                )}
              </Select>
            </FormControl>
           {/* --- FIN AJOUT Filtre --- */}
        </Toolbar>
        <Tabs
          value={selectedPeriod}
          onChange={handleTabChange}
          // ... (props des Tabs inchangées) ...
        >
           {/* ... (Tabs inchangées) ... */}
        </Tabs>
      </AppBar>

      <Container component="main" sx={{ mt: 4, mb: 4, flexGrow: 1 }}>
        {children}
      </Container>

      <Box component="footer" /* ... etc ... */ >
         {/* ... contenu du footer ... */}
      </Box>
    </Box>
  );
};

export default MainLayout;