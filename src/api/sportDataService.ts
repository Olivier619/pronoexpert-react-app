// src/api/sportDataService.ts

import axios, { AxiosError } from 'axios';

// --- Configuration ---

const API_KEY = process.env.REACT_APP_API_KEY;

if (!API_KEY) {
  console.error(
    "ERREUR CRITIQUE : La variable d'environnement REACT_APP_API_KEY n'est pas définie." +
    " Assurez-vous qu'elle est configurée dans les paramètres du projet Vercel."
  );
} else {
  // Log seulement une partie pour vérifier qu'elle est lue (ne pas logger la clé complète)
  console.log(`Clé API (REACT_APP_API_KEY) lue, commence par: ${API_KEY.substring(0, 5)}...`);
}

const apiClient = axios.create({
  // PAS DE baseURL ici !
  headers: {
    'Content-Type': 'application/json',
    'X-Auth-Token': API_KEY || '', // Utilise la clé lue
  },
  timeout: 15000, // 15 secondes timeout
});


// --- Interfaces TypeScript (basées sur la V4 de football-data.org) ---

export interface Team {
  id: number;
  name: string;
  shortName?: string;
  tla?: string;
  crest?: string;
}

export interface League {
  id: number;
  name: string;
  code?: string;
  emblem?: string;
}

export interface ScoreTime {
  home: number | null;
  away: number | null;
}

export interface Score {
  winner: 'HOME_TEAM' | 'AWAY_TEAM' | 'DRAW' | null;
  duration: 'REGULAR' | 'EXTRA_TIME' | 'PENALTY_SHOOTOUT';
  fullTime: ScoreTime;
  halfTime?: ScoreTime;
  extraTime?: ScoreTime;
  penalties?: ScoreTime;
}

export interface Match {
  id: number;
  utcDate: string;
  status: 'SCHEDULED' | 'LIVE' | 'IN_PLAY' | 'PAUSED' | 'FINISHED' | 'POSTPONED' | 'SUSPENDED' | 'CANCELED';
  matchday?: number;
  stage?: string;
  group?: string | null;
  lastUpdated: string;
  competition: League;
  homeTeam: Team;
  awayTeam: Team;
  score: Score;
  odds?: {
    msg: string;
    homeWin?: number;
    draw?: number;
    awayWin?: number;
  };
  referees?: Array<{
    id: number;
    name: string;
    type: string;
    nationality: string | null;
  }>;
}

interface MatchesApiResponse {
  count?: number;
  filters?: Record<string, any>;
  matches: Match[];
  resultSet?: {
      count: number;
      first: string;
      last: string;
      played: number;
  }
  errorCode?: number;
  message?: string;
}


// --- Fonctions du Service API ---

/**
 * Récupère les matchs (par défaut pour la période courante de l'API si pas de filtre date)
 * en utilisant les rewrites Vercel.
 * @param date - La date logique (utilisée pour le log), mais PAS envoyée à l'API.
 * @returns Une promesse résolue avec un tableau de matchs (Match[]).
 */
export const getMatchesByDate = async (date: string): Promise<Match[]> => {
  const requestPath = `/api/foot/v4/matches`;

  // Log modifié pour indiquer qu'on ne filtre pas par date dans l'appel API
  console.log(`Début getMatchesByDate (SANS FILTRE DE DATE API) pour la date logique ${date}`);
  console.log(`  Chemin requête prévu (via rewrite): ${requestPath}`);
  // console.log(`  Paramètres requête: {}`); // Précision qu'on envoie un objet vide
  console.log(`  Utilisation de l'en-tête X-Auth-Token avec la clé fournie.`);

  try {
    console.log(`  Tentative d'appel Axios vers: ${requestPath} SANS paramètres de date.`);
    const response = await apiClient.get<MatchesApiResponse>(requestPath, {
      // --- >>> MODIFICATION : PAS DE FILTRE DE DATE <<< ---
      params: {}, // Objet vide - Ne pas envoyer dateFrom/dateTo
      // --- >>> FIN MODIFICATION <<< ---
    });

    // --- LOGS DÉTAILLÉS DE LA RÉPONSE ---
    console.log('--- Réponse API Brute Reçue ---');
    console.log(`  Statut HTTP: ${response.status}`);
    console.log(`  Type de response.data: ${typeof response.data}`);
    try {
        console.log('  Contenu response.data:', response.data);
    } catch (e) {
        console.error('  Impossible de logger response.data directement, peut-être trop volumineux ou circulaire.');
    }
    console.log(`  Clé 'matches' présente? ${response.data && 'matches' in response.data}`);
    if (response.data && 'matches' in response.data) {
        console.log(`  Type de response.data.matches: ${typeof response.data.matches}`);
        console.log(`  response.data.matches est un tableau? ${Array.isArray(response.data.matches)}`);
        console.log(`  Nombre de matchs dans response.data.matches: ${Array.isArray(response.data.matches) ? response.data.matches.length : 'N/A'}`);
    }
    if (response.data?.count !== undefined) {
        console.log(`  Valeur de response.data.count: ${response.data.count}`);
    }
    if (response.data?.resultSet) {
        console.log('  Informations ResultSet API:', response.data.resultSet);
    }
    if (response.data?.message) {
        console.log(`  Message API dans la réponse: ${response.data.message}`);
    }
    if (response.data?.errorCode) {
        console.log(`  Code d'erreur API dans la réponse: ${response.data.errorCode}`);
    }
    console.log('--- Fin Réponse API Brute ---');
    // --- FIN LOGS DÉTAILLÉS ---


    // Vérification principale pour retourner les matchs
    if (response.data && Array.isArray(response.data.matches)) {
      console.log(`  Traitement réussi: ${response.data.matches.length} matchs trouvés dans le tableau 'matches'. Retour de ce tableau.`);
      // !!! ATTENTION: Ces matchs peuvent couvrir une période plus large que juste 'date' !!!
      // Vous pourriez vouloir filtrer côté client si nécessaire, mais voyons d'abord ce que l'API renvoie.
      return response.data.matches;
    } else {
      console.warn(`  Traitement AVERTISSEMENT: Réponse API reçue (statut ${response.status}) mais structure inattendue. Clé 'matches' manquante ou non-tableau.`);
      console.warn('  Retour d\'un tableau vide.');
      return [];
    }

  } catch (error) {
    // Gestion d'erreur (inchangée)
    console.error(`ERREUR CATCHÉE dans getMatchesByDate (SANS FILTRE DATE) pour la date logique ${date}:`);
    if (axios.isAxiosError(error)) {
      const axiosError = error as AxiosError;
      console.error(`  Erreur Axios détectée.`);
      console.error(`  Statut HTTP: ${axiosError.response?.status || 'N/A (Erreur Réseau ou CORS?)'}`);
      const apiErrorData = axiosError.response?.data as any;
      if (apiErrorData && apiErrorData.message) {
        console.error(`  Message d'erreur API: ${apiErrorData.message}`);
         if (apiErrorData.errorCode) {
            console.error(`  Code d'erreur API: ${apiErrorData.errorCode}`);
         }
      } else if (axiosError.message) {
        console.error(`  Message Axios: ${axiosError.message}`);
      }
      if (axiosError.response?.status === 401) {
        console.error("  >>> PISTE: Problème d'authentification (401). Vérifiez REACT_APP_API_KEY sur Vercel et l'en-tête 'X-Auth-Token'.");
      } else if (axiosError.response?.status === 403 || axiosError.response?.status === 429) {
         console.error(`  >>> PISTE: Limites du plan API (${axiosError.response?.status}). Vérifiez votre compte/plan sur football-data.org ou les filtres de la requête.`);
       } else if (!axiosError.response) {
         console.error("  >>> PISTE: Pas de réponse reçue. Problème réseau, mauvaise configuration des Rewrites Vercel, ou problème CORS si les rewrites ne fonctionnent pas.");
       }
    } else {
      console.error('  Erreur inattendue (non-Axios):', error);
    }
    throw error;
  }
};


// --- TODO: Ajouter les autres fonctions du service ici ---
// export const getTeamHistoryAndStats = async (teamId: number): Promise<any> => { ... }
// export const searchTeams = async (query: string): Promise<Team[]> => { ... }