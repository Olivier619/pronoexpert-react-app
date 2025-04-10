// src/theme.ts
import { createTheme } from '@mui/material/styles';

// Créez votre thème MUI personnalisé
const theme = createTheme({
  palette: {
    primary: {
      main: '#1976d2', // Couleur bleue par défaut de MUI
    },
    secondary: {
      main: '#dc004e', // Couleur rose par défaut
    },
    background: {
      default: '#f4f4f4', // Un gris clair pour le fond
    },
  },
  typography: {
    fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
    h6: { // Style pour le titre dans l'AppBar
      fontWeight: 600,
    },
  },
  // Vous pouvez ajouter des surcharges de composants ici
  // components: { ... }
});

export default theme;