import React from 'react';
import { ThemeProvider, CssBaseline } from '@mui/material';
import MainLayout from './components/common/MainLayout';
import MatchList from './components/matches/MatchList';
import theme from './theme'; // Importez votre thème

function App() {
  return (
    <ThemeProvider theme={theme}>
      {/* CssBaseline applique des styles de base et normalise */}
      <CssBaseline />
      <MainLayout>
        {/* Le contenu principal est maintenant MatchList */}
        <MatchList />
      </MainLayout>
    </ThemeProvider>
  );
}

export default App;