// src/api/sportDataService.ts

import axios, { AxiosError } from 'axios';

// Récupérer SEULEMENT la clé API des variables d'environnement
// Nous n'utilisons PAS API_BASE_URL directement ici car nous utilisons les rewrites Vercel
const API_KEY = process.env.REACT_APP_API_KEY;

// Vérifier si la clé API est définie (crucial pour l'authentification)
if (!API_KEY) {
  console.error("Erreur : La variable d'environnement REACT_APP_API_KEY n'est pas définie.");
  // En production, il est préférable de lancer une erreur ou d'avoir un état d'erreur clair.
  // throw new Error("Configuration API manquante : Clé API non définie.");
}

// Créer une instance Axios préconfigurée SANS baseURL
// La baseURL sera gérée par les chemins relatifs et les rewrites Vercel
const apiClient = axios.create({
  // PAS DE baseURL ici !
  headers: {
    'Content-Type': 'application/json',
    // Utiliser l'en-tête CORRECT pour football-data.org : 'X-Auth-Token'
    'X-Auth-Token': API_KEY,
    // Commentez ou supprimez les autres en-têtes d'authentification non pertinents
    // 'x-rapidapi-key': API_KEY,
  },
  timeout: 15000, // Augmenté légèrement le timeout à 15 secondes
});

// --- Interfaces pour typer les données de l'API ---
// !! ADAPTEZ CES INTERFACES À LA STRUCTURE RÉELLE DE football-data.org !!
// (Basé sur une structure courante pour cette API, mais à vérifier)

export interface Team {
  id: number;
  name: string;
  shortName?: string;
  tla?: string; // Three Letter Abbreviation (ex: ARS)
  crest?: string; // URL du logo/blason
  // Ajoutez d'autres champs si présents
}

export interface League {
  id: number;
  name: string;
  code?: string; // Ex: PL, BL1, SA
  emblem?: string; // URL de l'emblème de la ligue
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

// Structure principale d'un match selon football-data.org (probable)
export interface Match {
  id: number;
  utcDate: string; // Date/heure UTC du match (ISO 8601)
  status: 'SCHEDULED' | 'LIVE' | 'IN_PLAY' | 'PAUSED' | 'FINISHED' | 'POSTPONED' | 'SUSPENDED' | 'CANCELED';
  matchday?: number;
  stage?: string;
  group?: string | null;
  lastUpdated: string;
  competition: League; // Information sur la compétition/ligue
  homeTeam: Team;
  awayTeam: Team;
  score: Score;
  odds?: { // Cotes souvent optionnelles ou dans un autre endpoint
    msg: string;
    homeWin?: number;
    draw?: number;
    awayWin?: number;
  };
  referees?: Array<{ id: number; name: string; type: string; nationality: string }>;
}

// Structure de la réponse de l'API pour une liste de matchs (probable)
// football-data.org retourne souvent un objet avec une clé 'matches'
interface MatchesApiResponse {
  count?: number;
  filters?: Record<string, any>; // Les filtres utilisés pour la requête
  matches: Match[]; // Le tableau des matchs est ici
  // Ajoutez d'autres clés si présentes (ex: resultSet)
}

// --- Fonctions du Service ---

/**
 * Récupère les matchs pour une date donnée en utilisant les rewrites Vercel.
 * @param date - La date au format 'YYYY-MM-DD'.
 * @returns Une promesse résolue avec un tableau de matchs.
 */
export const getMatchesByDate = async (date: string): Promise<Match[]> => {
  // Le chemin commence par /api/foot/ comme défini dans la 'source' de vercel.json
  // Suivi du chemin réel de l'endpoint de l'API football-data.org (ici /v4/matches)
  const requestPath = `/api/foot/v4/matches`;

  try {
    console.log(`Appel API via Vercel Rewrites (${requestPath}) pour les matchs du ${date}...`);

    const response = await apiClient.get<MatchesApiResponse>(requestPath, {
      params: {
        // Paramètres spécifiques à l'API football-data.org
        dateFrom: date, // football-data.org utilise souvent dateFrom/dateTo
        dateTo: date,   // Pour obtenir les matchs d'une seule journée
        // Vous pouvez ajouter d'autres filtres si nécessaire (ex: 'competitions=PL,BL1')
        // status: 'SCHEDULED,LIVE,FINISHED'
      },
      // L'en-tête 'X-Auth-Token' est ajouté automatiquement par l'instance apiClient
    });

    // Vérifier si la réponse contient bien le tableau 'matches'
    if (response.data && Array.isArray(response.data.matches)) {
      console.log(` ${response.data.matches.length} matchs reçus via Vercel Rewrites.`);
      return response.data.matches; // Retourne le tableau de matchs
    } else {
      // Si la structure est différente, logguer une erreur et retourner un tableau vide
      console.error("Format de réponse API (rewrites) inattendu : clé 'matches' non trouvée ou n'est pas un tableau.", response.data);
      return [];
    }

  } catch (error) {
    // Gestion améliorée des erreurs
    console.error(`Erreur lors de la récupération des matchs via ${requestPath} pour la date ${date}:`);
    if (axios.isAxiosError(error)) {
      const axiosError = error as AxiosError;
      console.error('Erreur Axios Status:', axiosError.response?.status);
      // Tenter d'afficher le message d'erreur de l'API s'il existe
      const apiErrorData = axiosError.response?.data as any; // Utiliser 'any' pour flexibilité
      if (apiErrorData && apiErrorData.message) {
         console.error('Message API:', apiErrorData.message);
      } else if (apiErrorData) {
         console.error('Données d\'erreur API:', apiErrorData);
      } else {
         console.error('Message Erreur Axios:', axiosError.message);
      }
      // Si c'est une erreur 401, c'est probablement un problème de clé API sur Vercel
      if (axiosError.response?.status === 401) {
          console.error("ERREUR 401 Unauthorized : Vérifiez la variable d'environnement REACT_APP_API_KEY sur Vercel et l'en-tête X-Auth-Token.");
      }
    } else {
      // Erreur générique (problème réseau, code, etc.)
      console.error('Erreur inattendue:', error);
    }
    // Relancer l'erreur pour que le composant puisse la gérer (afficher un message à l'utilisateur)
    throw error;
  }
};

// --- TODO: Ajouter les autres fonctions du service ---
// export const getTeamHistoryAndStats = async (teamId: number): Promise<any> => {
//   const requestPath = `/api/foot/v4/teams/${teamId}/matches?limit=15`; // Exemple de chemin
//   // ... logique similaire d'appel et de gestion d'erreur ...
// }
// export const searchTeams = async (query: string): Promise<Team[]> => { ... }
export interface League {
  id: number | string;
  name: string;
  country?: string;
  logo?: string;
}

export interface Score {
    home: number | null; // Score peut être null si le match n'a pas commencé
    away: number | null;
}

// Structure principale d'un match
export interface Match {
  id: number | string;
  date: string; // Format ISO 8601 ou 'YYYY-MM-DD HH:MM:SS'
  timestamp?: number; // Timestamp Unix optionnel
  status?: string; // Ex: 'NS' (Not Started), 'FT' (Full Time), 'HT', 'LIVE', etc.
  league: League;
  homeTeam: Team;
  awayTeam: Team;
  score?: Score; // Score optionnel
  // Ajoutez ici d'autres champs retournés par votre API (ex: probabilities, odds)
  // probabilities?: { home: number; draw: number; away: number };
  // odds?: { home: number; draw: number; away: number };
}

// Structure de la réponse de l'API pour une liste de matchs
// !! ADAPTEZ CECI !! Votre API pourrait retourner directement un tableau [Match]
// ou un objet { response: [Match], errors: [], results: number }
interface MatchesApiResponse {
  response: Match[]; // Supposons que les matchs sont dans une clé 'response'
  // Ajoutez d'autres clés si présentes (errors, paging, etc.)
  // errors?: any[];
  // results?: number;
}

// --- Fonctions du Service ---

/**
 * Récupère les matchs pour une date donnée.
 * @param date - La date au format 'YYYY-MM-DD'.
 * @returns Une promesse résolue avec un tableau de matchs.
 */
export const getMatchesByDate = async (date: string): Promise<Match[]> => {
  try {
    console.log(`Appel API pour les matchs du ${date}...`);
    // Adaptez le chemin '/fixtures' et les paramètres ('date', 'league', 'season') selon votre API
    const response = await apiClient.get<MatchesApiResponse>('/fixtures', {
      params: {
        date: date,
        // Ajoutez d'autres paramètres si nécessaire (ex: league, season)
        // league: '39', // Exemple: Premier League
        // season: '2023', // Exemple: Saison
        // Si votre API prend la clé en paramètre (moins courant/sécurisé) :
        // apiKey: API_KEY
      },
      // Si votre clé doit être dans l'en-tête spécifique à cette requête :
      // headers: { 'X-ApiSports-Key': API_KEY }
    });

    // !! ADAPTEZ L'EXTRACTION DES DONNÉES !!
    // Vérifiez la structure de 'response.data' et retournez le tableau de matchs.
    if (response.data && Array.isArray(response.data.response)) {
       console.log(` ${response.data.response.length} matchs reçus.`);
      return response.data.response; // Extrait les matchs de la clé 'response'
    } else {
      // Si l'API retourne directement un tableau : return response.data;
      console.error("Format de réponse API inattendu:", response.data);
      return []; // Retourne un tableau vide en cas de format inconnu
    }

  } catch (error) {
    if (axios.isAxiosError(error)) {
      // Erreur spécifique d'Axios (réseau, timeout, code statut HTTP != 2xx)
      console.error('Erreur Axios lors de la récupération des matchs:', error.response?.status, error.message);
      // Vous pourriez vouloir inspecter error.response?.data pour plus de détails de l'API
    } else {
      // Erreur générique
      console.error('Erreur inattendue lors de la récupération des matchs:', error);
    }
    // Relancer l'erreur pour la gestion dans le composant, ou retourner un tableau vide
    throw error; // Permet au composant de savoir qu'il y a eu une erreur
    // return []; // Alternative: ne pas bloquer l'UI mais afficher "aucun match"
  }
};

// --- TODO: Ajouter les autres fonctions du service ---
// export const getTeamHistoryAndStats = async (teamId: string | number): Promise<any> => { ... }
// export const searchTeams = async (query: string): Promise<Team[]> => { ... }

// Vous pouvez aussi exporter l'instance apiClient si d'autres parties de l'app en ont besoin
// export default apiClient;
