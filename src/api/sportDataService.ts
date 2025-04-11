// src/api/sportDataService.ts

import axios, { AxiosError } from 'axios';
import config from '../config'; // Importer la configuration

// --- Configuration Axios pour API-Football (api-sports.io) ---

// Créer l'instance apiClient SANS baseURL pour les rewrites Vercel
const apiClient = axios.create({
  // PAS DE baseURL !
  headers: {
    'Content-Type': 'application/json',
    // En-tête requis par api-sports.io (version directe)
    'x-apisports-key': config.apiSports.key || '', // Utilise la clé depuis config
  },
  timeout: 15000,
});

// --- Interfaces TypeScript pour API-Football V3 ---
// !! STRUCTURE TRÈS DIFFÉRENTE DE football-data.org !! A Vérifier !

export interface TeamInfo { // Renommé pour éviter conflit si 'Team' est utilisé ailleurs
  id: number;
  name: string;
  logo: string; // api-sports fournit généralement le logo
  winner?: boolean | null; // Peut être ajouté par l'API pour indiquer le vainqueur
}

export interface LeagueInfo { // Renommé
  id: number;
  name: string;
  country: string;
  logo: string;
  flag: string | null; // Drapeau du pays
  season: number; // Saison
  round?: string; // Journée/Tour
}

export interface Goals {
  home: number | null;
  away: number | null;
}

export interface ScoreInfo { // Renommé
  halftime: Goals;
  fulltime: Goals;
  extratime: Goals | null;
  penalty: Goals | null;
}

export interface FixtureStatus {
  long: string; // Ex: "Match Finished", "Not Started", "First Half"
  short: string; // Ex: "FT", "NS", "1H", "HT", "2H", "ET", "P", "SUSP", "INT", "PST", "CANC", "ABD", "AWD", "WO"
  elapsed: number | null; // Minutes écoulées si en direct
}

export interface Fixture { // Remplace l'ancienne interface 'Match'
  id: number;
  referee: string | null;
  timezone: string; // Ex: "UTC"
  date: string; // Date et heure ISO 8601
  timestamp: number; // Timestamp Unix
  periods: {
    first: number | null; // Timestamp début 1ère mi-temps
    second: number | null; // Timestamp début 2ème mi-temps
  };
  venue: {
    id: number | null;
    name: string | null;
    city: string | null;
  };
  status: FixtureStatus;
}

// Structure principale d'un match/fixture selon API-Football V3
export interface MatchData { // Renommé pour éviter conflit
  fixture: Fixture;
  league: LeagueInfo;
  teams: {
    home: TeamInfo;
    away: TeamInfo;
  };
  goals: Goals; // Score principal souvent ici
  score: ScoreInfo; // Scores détaillés (mi-temps, etc.)
  events?: any[]; // Liste des événements (buts, cartons...)
  lineups?: any[]; // Composition des équipes
  statistics?: any[]; // Statistiques du match
  // Ajoutez d'autres champs si présents (players...)
}

// Structure de la réponse de l'API pour l'endpoint /fixtures
// API-Football retourne un objet avec 'get', 'parameters', 'errors', 'results', 'paging', 'response'
interface FixturesApiResponse {
  get?: string;
  parameters?: Record<string, any>;
  errors?: any[];
  results?: number; // Nombre de résultats dans la réponse
  paging?: {
    current: number;
    total: number;
  };
  response: MatchData[]; // Le tableau des matchs/fixtures est ici
}


// --- Fonctions du Service API ---

/**
 * Récupère les matchs (fixtures) pour une date donnée via API-Football et Vercel Rewrites.
 * @param date - La date au format 'YYYY-MM-DD'.
 * @returns Une promesse résolue avec un tableau de MatchData[].
 */
export const getMatchesByDate = async (date: string): Promise<MatchData[]> => {
  // Chemin relatif pour Vercel Rewrites + endpoint API-Football pour les fixtures
  const requestPath = `/api/foot/fixtures`; // '/fixtures' est l'endpoint commun d'API-Football

  console.log(`Début getMatchesByDate pour API-Football (date: ${date})`);
  console.log(`  Chemin requête prévu (via rewrite): ${requestPath}`);
  console.log(`  Utilisation de l'en-tête x-apisports-key.`);

  try {
    console.log(`  Tentative d'appel Axios vers: ${requestPath} avec paramètre date=${date}`);
    const response = await apiClient.get<FixturesApiResponse>(requestPath, {
      params: {
        // Paramètre 'date' utilisé par API-Football pour les fixtures d'un jour donné
        date: date,
        // 'timezone' peut être utile si vous voulez une heure locale spécifique, sinon UTC par défaut
        // timezone: 'Europe/Paris'
      },
    });

    // --- LOGS DÉTAILLÉS DE LA RÉPONSE ---
    console.log('--- Réponse API-Football Brute Reçue ---');
    console.log(`  Statut HTTP: ${response.status}`);
    console.log(`  Nombre de résultats indiqué par API ('results'): ${response.data?.results ?? 'N/A'}`);
    if (response.data?.paging) {
        console.log(`  Pagination API: Page ${response.data.paging.current}/${response.data.paging.total}`);
    }
     // Essayer de logger l'objet entier, peut être volumineux
     try {
         console.log('  Contenu response.data:', response.data);
     } catch (e) {
         console.error('  Impossible de logger response.data directement.');
     }
    console.log(`  Clé 'response' présente? ${response.data && 'response' in response.data}`);
    if (response.data && 'response' in response.data) {
        console.log(`  Type de response.data.response: ${typeof response.data.response}`);
        console.log(`  response.data.response est un tableau? ${Array.isArray(response.data.response)}`);
        console.log(`  Nombre de matchs dans response.data.response: ${Array.isArray(response.data.response) ? response.data.response.length : 'N/A'}`);
    }
    console.log('--- Fin Réponse API-Football Brute ---');
    // --- FIN LOGS DÉTAILLÉS ---


    // Vérification principale pour retourner les matchs
    // API-Football met les résultats dans la clé 'response'
    if (response.data && Array.isArray(response.data.response)) {
      console.log(`  Traitement réussi: ${response.data.response.length} matchs trouvés dans le tableau 'response'. Retour de ce tableau.`);
      // Gérer la pagination si nécessaire (si response.data.paging.current < response.data.paging.total)
      // Pour l'instant, on ne retourne que la première page.
      if (response.data.paging && response.data.paging.current < response.data.paging.total) {
           console.warn(`  AVERTISSEMENT: Pagination détectée (Page ${response.data.paging.current}/${response.data.paging.total}). Seule la première page est retournée pour l'instant.`);
           // TODO: Implémenter la logique pour récupérer toutes les pages si besoin.
       }
      return response.data.response;
    } else {
      console.warn(`  Traitement AVERTISSEMENT: Réponse API-Football reçue (statut ${response.status}) mais structure inattendue. Clé 'response' manquante ou non-tableau.`);
      console.warn('  Retour d\'un tableau vide.');
      // Logguer les erreurs API si présentes dans la réponse
      if(response.data?.errors && response.data.errors.length > 0) {
          console.error('  Erreurs retournées par API-Football:', response.data.errors);
      }
      return [];
    }

  } catch (error) {
    console.error(`ERREUR CATCHÉE dans getMatchesByDate pour API-Football (date ${date}):`);
    if (axios.isAxiosError(error)) {
        const axiosError = error as AxiosError;
        console.error(`  Erreur Axios détectée.`);
        console.error(`  Statut HTTP: ${axiosError.response?.status || 'N/A (Erreur Réseau/CORS/Rewrite?)'}`);
        const apiErrorData = axiosError.response?.data as any;
         // API-Football retourne souvent les erreurs dans une clé 'errors' ou 'message'
        if (apiErrorData?.errors && Array.isArray(apiErrorData.errors) && apiErrorData.errors.length > 0) {
            console.error('  Erreurs API:', apiErrorData.errors);
        } else if (apiErrorData?.message) {
            console.error('  Message API:', apiErrorData.message);
        } else if (axiosError.message) {
            console.error(`  Message Axios: ${axiosError.message}`);
        }
        if (axiosError.response?.status === 401 || axiosError.response?.status === 499 ) { // 499 souvent utilisé par api-sports pour clé invalide
            console.error("  >>> PISTE: Problème d'authentification (401/499). Vérifiez REACT_APP_API_SPORTS_KEY sur Vercel et l'en-tête 'x-apisports-key'.");
        } else if (axiosError.response?.status === 403 || axiosError.response?.status === 429) {
           console.error(`  >>> PISTE: Limites du plan API (${axiosError.response?.status}) ou accès refusé. Vérifiez votre compte/plan sur api-sports.io.`);
        } else if (!axiosError.response) {
           console.error("  >>> PISTE: Pas de réponse reçue. Problème réseau, mauvaise config Rewrites Vercel, ou problème CORS si rewrites échouent.");
        }
    } else {
      console.error('  Erreur inattendue (non-Axios):', error);
    }
    throw error;
  }
};

// --- TODO: Adapter les autres fonctions (Historique, Recherche) ---
// Il faudra réécrire getTeamHistoryAndStats et searchTeams pour utiliser les endpoints
// et les structures de données d'API-Football.


// --- TODO: Ajouter les autres fonctions du service ici ---
// export const getTeamHistoryAndStats = async (teamId: number): Promise<any> => { ... }
// export const searchTeams = async (query: string): Promise<Team[]> => { ... }