// src/App.tsx
import React from 'react';
import { ThemeProvider, CssBaseline } from '@mui/material';
import MainLayout from './components/common/MainLayout';
import MatchList from './components/matches/MatchList';
import theme from './theme';
import { AppProvider } from './context/AppContext'; // Importer le Provider

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      {/* Envelopper avec AppProvider */}
      <AppProvider>
        <MainLayout>
          <MatchList />
        </MainLayout>
      </AppProvider>
    </ThemeProvider>
  );
}

export default App;