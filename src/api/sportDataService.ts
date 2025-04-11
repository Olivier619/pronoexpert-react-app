// src/api/sportDataService.ts

import axios, { AxiosError } from 'axios';

// --- Configuration ---

// Récupérer SEULEMENT la clé API des variables d'environnement Vercel
const API_KEY = process.env.REACT_APP_API_KEY;

// Vérification essentielle au démarrage de l'application
if (!API_KEY) {
  console.error(
    "ERREUR CRITIQUE : La variable d'environnement REACT_APP_API_KEY n'est pas définie." +
    " Assurez-vous qu'elle est configurée dans les paramètres du projet Vercel."
  );
  // Optionnel: Lancer une erreur pour bloquer le build si la clé est manquante
  // throw new Error("Configuration API manquante : Clé API non définie.");
}

// Créer une instance Axios préconfigurée SANS baseURL pour fonctionner avec Vercel Rewrites
const apiClient = axios.create({
  // PAS DE baseURL ici ! Le chemin relatif + Vercel Rewrites gèrent l'URL de destination.
  headers: {
    'Content-Type': 'application/json',
    // Utiliser l'en-tête CORRECT pour football-data.org : 'X-Auth-Token'
    'X-Auth-Token': API_KEY || '', // Utiliser '' si API_KEY est undefined pour éviter erreur, mais l'API retournera 401
  },
  timeout: 15000, // 15 secondes timeout
});


// --- Interfaces TypeScript pour typer les données de l'API ---
// Note: Ces interfaces sont basées sur la structure typique de football-data.org V4.
// Il est TOUJOURS recommandé de vérifier la réponse réelle de l'API pour les ajuster si nécessaire.

export interface Team {
  id: number;
  name: string;
  shortName?: string;
  tla?: string; // Three Letter Abbreviation (ex: ARS)
  crest?: string; // URL du logo/blason
}

export interface League {
  id: number;
  name: string;
  code?: string; // Ex: PL, BL1, SA
  emblem?: string; // URL de l'emblème de la ligue
}

export interface ScoreTime {
  home: number | null; // Peut être null si non disponible
  away: number | null;
}

export interface Score {
  winner: 'HOME_TEAM' | 'AWAY_TEAM' | 'DRAW' | null; // Null si match non joué/terminé
  duration: 'REGULAR' | 'EXTRA_TIME' | 'PENALTY_SHOOTOUT';
  fullTime: ScoreTime;
  halfTime?: ScoreTime;
  extraTime?: ScoreTime;
  penalties?: ScoreTime;
}

export interface Match {
  id: number;
  utcDate: string; // Date/heure UTC du match au format ISO 8601 (YYYY-MM-DDTHH:mm:ssZ)
  status: 'SCHEDULED' | 'LIVE' | 'IN_PLAY' | 'PAUSED' | 'FINISHED' | 'POSTPONED' | 'SUSPENDED' | 'CANCELED';
  matchday?: number;
  stage?: string; // Ex: REGULAR_SEASON, FINAL, SEMI_FINALS
  group?: string | null; // Ex: GROUP_A
  lastUpdated: string; // Date de dernière mise à jour (ISO 8601)
  competition: League; // Informations sur la ligue/compétition
  homeTeam: Team;
  awayTeam: Team;
  score: Score;
  odds?: { // Cotes, souvent limitées ou non disponibles dans le plan gratuit
    msg: string; // Peut indiquer "Data provided by..."
    homeWin?: number;
    draw?: number;
    awayWin?: number;
  };
  referees?: Array<{ // Arbitres, peut être un tableau vide
    id: number;
    name: string;
    type: 'REFEREE' | 'ASSISTANT_REFEREE_N1' | 'ASSISTANT_REFEREE_N2' | 'FOURTH_OFFICIAL' | 'VIDEO_ASSISTANT_REFEREE_N1' | 'VIDEO_ASSISTANT_REFEREE_N2';
    nationality: string | null;
  }>;
}

// Structure de la réponse de l'API pour l'endpoint /v4/matches
interface MatchesApiResponse {
  count?: number; // Nombre de résultats retournés
  filters?: Record<string, any>; // Filtres appliqués à la requête
  matches: Match[]; // Le tableau principal des matchs
  resultSet?: { // Informations sur le plan API utilisé
      count: number;
      first: string;
      last: string;
      played: number;
  }
}


// --- Fonctions du Service API ---

/**
 * Récupère les matchs pour une date donnée en utilisant les rewrites Vercel.
 * @param date - La date au format 'YYYY-MM-DD'.
 * @returns Une promesse résolue avec un tableau de matchs (Match[]).
 */
export const getMatchesByDate = async (date: string): Promise<Match[]> => {
  // Construit le chemin relatif qui sera intercepté par Vercel Rewrites
  // '/api/foot/' correspond à la 'source' dans vercel.json
  // '/v4/matches' est le chemin réel de l'endpoint sur api.football-data.org
  const requestPath = `/api/foot/v4/matches`;

  console.log(`Préparation de l'appel API via Vercel Rewrites (${requestPath}) pour la date ${date}...`);

  try {
    const response = await apiClient.get<MatchesApiResponse>(requestPath, {
      params: {
        // Paramètres spécifiques à l'API football-data.org pour filtrer par date
        dateFrom: date,
        dateTo: date,
        // Note : L'API peut avoir des limites sur le nombre de jours/compétitions pour les plans gratuits.
      },
      // L'en-tête 'X-Auth-Token' est ajouté automatiquement par l'instance 'apiClient'
    });

    // Log succès et vérification de la structure de la réponse
    if (response.data && Array.isArray(response.data.matches)) {
      console.log(` ${response.data.matches.length} matchs reçus avec succès pour ${date}.`);
      return response.data.matches; // Retourne le tableau de matchs
    } else {
      // Si la réponse est inattendue (pas de clé 'matches' ou ce n'est pas un tableau)
      console.warn(`Réponse API reçue pour ${date}, mais le format est inattendu. Clé 'matches' manquante ou invalide.`, response.data);
      return []; // Retourne un tableau vide pour éviter une erreur dans le composant
    }

  } catch (error) {
    // Log détaillé en cas d'erreur
    console.error(`ERREUR lors de la récupération des matchs pour la date ${date} via ${requestPath}:`);
    if (axios.isAxiosError(error)) {
      // Erreur spécifique d'Axios
      const axiosError = error as AxiosError;
      console.error(`  Status HTTP: ${axiosError.response?.status || 'N/A (Network Error?)'}`);
      // Essayer d'extraire et logger le message d'erreur de l'API si présent
      const apiErrorData = axiosError.response?.data as any;
      if (apiErrorData && apiErrorData.message) {
        console.error(`  Message API: ${apiErrorData.message}`);
      } else if (axiosError.message) {
        console.error(`  Message Axios: ${axiosError.message}`);
      }
      // Log spécifique pour l'erreur 401 Unauthorized
      if (axiosError.response?.status === 401) {
        console.error("  >>> CAUSE POSSIBLE: Problème d'authentification (401). Vérifiez que REACT_APP_API_KEY est correctement configurée sur Vercel et que l'en-tête 'X-Auth-Token' est envoyé.");
      }
      // Log spécifique pour l'erreur 403 Forbidden / 429 Too Many Requests (limites du plan API)
       else if (axiosError.response?.status === 403 || axiosError.response?.status === 429) {
         console.error(`  >>> CAUSE POSSIBLE: Limites du plan API atteintes (${axiosError.response?.status}) ou accès refusé. Vérifiez votre plan sur football-data.org.`);
       }
    } else {
      // Erreur générique (ex: erreur dans le code, problème réseau imprévu)
      console.error('  Erreur inattendue (non-Axios):', error);
    }
    // Relancer l'erreur pour que le composant React puisse la gérer (ex: afficher un message à l'utilisateur)
    throw error;
  }
};

// --- TODO: Ajouter les autres fonctions du service ici ---

/*
export const getTeamHistoryAndStats = async (teamId: number): Promise<any> => { // Remplacer 'any' par une interface spécifique
  const requestPath = `/api/foot/v4/teams/${teamId}/matches`; // Exemple, vérifier l'endpoint réel
  try {
    const response = await apiClient.get(requestPath, {
        params: { limit: 15, status: 'FINISHED' } // Exemple de paramètres
    });
    // ... Traiter la réponse ...
    return response.data; // Adapter selon la structure réelle
  } catch (error) {
    console.error(`Erreur lors de la récupération de l'historique pour l'équipe ${teamId}:`, error);
    throw error;
  }
};
*/

/*
export const searchTeams = async (query: string): Promise<Team[]> => {
  // Note: La recherche d'équipe n'est peut-être pas disponible ou nécessite un endpoint différent
  // Vérifier la documentation de football-data.org
  const requestPath = `/api/foot/v4/teams`; // Endpoint hypothétique
  try {
      const response = await apiClient.get<{ teams: Team[] }>(requestPath, { // Supposant une structure { teams: [] }
          params: { name: query } // Paramètre hypothétique
      });
      return response.data.teams || [];
  } catch (error) {
      console.error(`Erreur lors de la recherche de l'équipe "${query}":`, error);
      throw error;
  }
};
*/

// Note : Il n'est généralement pas nécessaire d'exporter 'apiClient' directement.
// Les fonctions comme getMatchesByDate encapsulent son utilisation.