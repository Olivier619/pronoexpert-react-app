import React, { ReactNode } from 'react';
import { AppBar, Toolbar, Typography, Container, Box } from '@mui/material';

// Interface pour définir les props attendues, notamment 'children'
interface MainLayoutProps {
  children: ReactNode; // ReactNode permet de passer n'importe quel élément React comme enfant
}

const MainLayout: React.FC<MainLayoutProps> = ({ children }) => {
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      {/* Barre de navigation supérieure */}
      <AppBar position="static">
        <Toolbar>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            PronoExpert
          </Typography>
          {/* On pourra ajouter des boutons ici plus tard (ex: connexion, refresh) */}
        </Toolbar>
      </AppBar>

      {/* Conteneur principal pour le contenu de la page */}
      <Container component="main" sx={{ mt: 4, mb: 4, flexGrow: 1 }}>
        {children} {/* C'est ici que le contenu de chaque page sera affiché */}
      </Container>

      {/* Pied de page (optionnel) */}
      <Box
        component="footer"
        sx={{
          py: 2, // Padding vertical
          px: 2, // Padding horizontal
          mt: 'auto', // Pousse le footer en bas
          backgroundColor: (theme) =>
            theme.palette.mode === 'light'
              ? theme.palette.grey[200]
              : theme.palette.grey[800],
        }}
      >
        <Container maxWidth="sm">
          <Typography variant="body2" color="text.secondary" align="center">
            {'Copyright © '}
            PronoExpert {new Date().getFullYear()}
            {'.'}
          </Typography>
        </Container>
      </Box>
    </Box>
  );
};

export default MainLayout;
