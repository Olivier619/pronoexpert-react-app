// src/api/sportDataService.ts

import axios, { AxiosError } from 'axios';

// --- Configuration ---

const API_KEY = process.env.REACT_APP_API_SPORTS_KEY;

if (!API_KEY) {
  console.error(
    "ERREUR CRITIQUE : La variable d'environnement REACT_APP_API_SPORTS_KEY n'est pas définie." +
    " Assurez-vous qu'elle est configurée dans les paramètres du projet Vercel."
  );
}

const apiClient = axios.create({
  // PAS DE baseURL ici !
  headers: {
    'Content-Type': 'application/json',
    'x-apisports-key': API_KEY || '',
  },
  timeout: 15000,
});


// --- Interfaces TypeScript (inchangées depuis la version précédente) ---

export interface TeamInfo { id: number; name: string; logo: string; winner?: boolean | null; }
export interface LeagueInfo { id: number; name: string; type?: string; logo: string; country?: CountryInfo; season?: LeagueSeason; round?: string; }
export interface CountryInfo { name: string; code: string | null; flag: string | null; }
export interface LeagueSeason { year: number; start?: string; end?: string; current?: boolean; coverage?: any; }
export interface Goals { home: number | null; away: number | null; }
export interface ScoreInfo { halftime: Goals; fulltime: Goals; extratime: Goals | null; penalty: Goals | null; }
export interface FixtureStatus { long: string; short: string; elapsed: number | null; }
export interface Fixture { id: number; referee: string | null; timezone: string; date: string; timestamp: number; periods: { first: number | null; second: number | null; }; venue: { id: number | null; name: string | null; city: string | null; }; status: FixtureStatus; }
export interface MatchData { fixture: Fixture; league: LeagueInfo; teams: { home: TeamInfo; away: TeamInfo; }; goals: Goals; score: ScoreInfo; events?: any[]; lineups?: any[]; statistics?: any[]; }

interface FixturesApiResponse {
  get?: string; parameters?: Record<string, any>; errors?: any[] | Record<string, string>; results?: number; paging?: { current: number; total: number; }; response: MatchData[]; errorCode?: number; message?: string;
}
interface LeaguesApiResponse {
    get?: string; parameters?: Record<string, any>; errors?: any[] | Record<string, string>; results?: number; paging?: { current: number; total: number; }; response: Array<{ league: LeagueInfo; country: CountryInfo; seasons: LeagueSeason[]; }>; errorCode?: number; message?: string;
}
interface CountriesApiResponse {
    get?: string; parameters?: any[]; errors?: any[] | Record<string, string>; results?: number; response: Array<{ name: string; code: string | null; flag: string | null; }>; errorCode?: number; message?: string;
}

type RawLeagueResponseItem = { league: LeagueInfo; country: CountryInfo; seasons: LeagueSeason[]; };


// --- Fonctions du Service API ---

/**
 * Test: Récupère la liste des pays. (Peut être commenté/supprimé si plus nécessaire)
 */
export const getCountries = async (): Promise<Array<{ name: string; code: string | null; flag: string | null }>> => { /* ... code précédent ... */ };

/**
 * Récupère la liste des ligues disponibles. (Inchangé)
 */
export const getAvailableLeagues = async (): Promise<LeagueInfo[]> => { /* ... code précédent avec la correction TS2339 ... */ };

/**
 * Récupère les matchs pour une date donnée, avec filtre optionnel par ligue.
 * Utilise une saison FIXE pour le test lorsque filtré par ligue.
 * @param date - La date au format 'YYYY-MM-DD'.
 * @param leagueId - ID optionnel de la ligue à filtrer.
 * @param seasonYear - Année de la saison (reçue du contexte, mais ignorée pour le test si leagueId est présent).
 * @returns Une promesse résolue avec un tableau de MatchData[].
 */
export const getMatchesByDate = async (
    date: string,
    leagueId?: number | null,
    seasonYear?: number | null // On reçoit la saison du contexte, mais on va la surcharger pour le test
): Promise<MatchData[]> => {
  const requestPath = `/api/foot/fixtures`;
  const params: Record<string, any> = { date: date }; // Paramètre de date toujours présent

  // --- >>> MODIFICATION POUR TEST SAISON FIXE <<< ---
  // Ajouter league et une saison FIXE si leagueId est fourni
  if (leagueId) { // On vérifie juste si leagueId existe
      params.league = leagueId;
      params.season = 2024; // <<<--- TEST : Utiliser une année de saison fixe (ex: 2024)
      console.log(`[Service] getMatchesByDate pour date: ${date}, league: ${leagueId}, season: ${params.season} (TEST FIXE)`);
  } else {
      console.log(`[Service] getMatchesByDate pour date: ${date} (toutes ligues autorisées)`);
  }
  // --- >>> FIN MODIFICATION <<< ---

  console.log(`  Chemin requête: ${requestPath}, Params: ${JSON.stringify(params)}`);

  try {
    const response = await apiClient.get<FixturesApiResponse>(requestPath, { params });
    // ... (Logs de réponse et traitement inchangés) ...

    if (response.data && Array.isArray(response.data.response)) {
      console.log(`  Traitement réussi: ${response.data.response.length} matchs retournés.`);
      if (response.data.paging && response.data.paging.current < response.data.paging.total) { /* ... log pagination ... */ }
      return response.data.response;
    } else {
      // ... (gestion réponse inattendue inchangée) ...
      return [];
    }
  } catch (error) {
    // ... (gestion d'erreur inchangée avec la correction ESLint appliquée) ...
    throw error;
  }
};


// --- TODO: Adapter getTeamHistoryAndStats ---
// export const getTeamHistoryAndStats = async (teamId: number): Promise<MatchData[]> => { ... }