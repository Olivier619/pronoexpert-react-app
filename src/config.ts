// src/config.ts

/**
 * Configuration pour obtenir les clés API depuis les variables d'environnement
 * ou utiliser des valeurs par défaut pour le développement
 */

const config = {
    // API principale (API-Sports)
    apiSports: {
        url: process.env.REACT_APP_API_SPORTS_URL || 'https://v3.football.api-sports.io',
        key: process.env.REACT_APP_API_SPORTS_KEY, // Pas de clé par défaut en production !
        // L'hôte est dérivé de l'URL, pas besoin ici
    },
  
    // API de secours (RapidAPI - même API mais via un autre proxy)
    rapidApi: {
        url: process.env.REACT_APP_RAPID_API_URL || 'https://api-football-v1.p.rapidapi.com/v3',
        key: process.env.REACT_APP_RAPID_API_KEY, // Pas de clé par défaut en production !
        host: 'api-football-v1.p.rapidapi.com', // Hôte spécifique requis par RapidAPI
    },
  
    // Configuration du cache
    cacheDuration: parseInt(process.env.REACT_APP_CACHE_DURATION || '3600000', 10), // 1 heure par défaut
  
    // Nombre de tentatives pour les requêtes API
    apiRetries: parseInt(process.env.REACT_APP_API_RETRIES || '3', 10),
  
    // Délai entre les tentatives (en ms)
    apiBackoff: parseInt(process.env.REACT_APP_API_BACKOFF || '300', 10),
  
    // Utiliser des données simulées en mode développement si true
    useSimulatedData: process.env.NODE_ENV === 'development' && process.env.REACT_APP_USE_SIMULATED_DATA === 'true'
  };
  
  // Vérifications importantes pour les clés API en production
  if (process.env.NODE_ENV === 'production') {
      if (!config.apiSports.key) {
          console.error("ERREUR CRITIQUE: REACT_APP_API_SPORTS_KEY est manquante dans les variables d'environnement de production.");
      }
      // Optionnel: Vérifier aussi la clé RapidAPI si vous l'utilisez en secours
      // if (!config.rapidApi.key) {
      //     console.error("ERREUR CRITIQUE: REACT_APP_RAPID_API_KEY est manquante pour l'API de secours en production.");
      // }
  }
  
  export default config;