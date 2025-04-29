// src/setupProxy.js
const { createProxyMiddleware } = require('http-proxy-middleware');

// Récupérez l'URL de l'API-Sports depuis votre fichier config (ou .env si non configuré dans config)
// Assurez-vous que cette URL est correcte
// Si votre config.ts n'est pas utilisable ici (code Node.js), utilisez directement process.env
const API_SPORTS_URL = process.env.REACT_APP_API_SPORTS_URL || 'https://v3.football.api-sports.io';

// Vérifiez si la variable d'environnement existe (utile pour le debug)
if (!process.env.REACT_APP_API_SPORTS_URL) {
    console.warn("REACT_APP_API_SPORTS_URL n'est pas définie. Utilisation de la valeur par défaut : https://v3.football.api-sports.io");
}


module.exports = function(app) {
  app.use(
    '/api/foot', // Le chemin qui déclenche le proxy (celui que vous utilisez dans vos appels)
    createProxyMiddleware({
      target: API_SPORTS_URL, // L'URL de l'API réelle
      changeOrigin: true, // Change l'en-tête Host pour qu'il corresponde à l'URL cible
      pathRewrite: { // Réécrit le chemin : enlève '/api/foot' avant de l'envoyer à l'API cible
        '^/api/foot': '',
      },
      // Optionnel: Ajouter des logs si vous voulez voir ce que fait le proxy
      // logLevel: 'debug', // Peut être 'info', 'debug', 'warn', 'error', 'silent'
    })
  );

  // Si vous avez d'autres chemins API à proxifier, ajoutez d'autres app.use ici
  // Exemple: app.use('/autre/chemin', createProxyMiddleware({...}));
};