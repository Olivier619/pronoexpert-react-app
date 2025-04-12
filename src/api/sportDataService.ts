// src/api/sportDataService.ts

import axios, { AxiosError } from 'axios';
// import config from '../config'; // <<<--- LIGNE SUPPRIMÉE (config non utilisé ici)

// --- Configuration ---

const API_KEY = process.env.REACT_APP_API_SPORTS_KEY;

if (!API_KEY) {
  console.error(
    "ERREUR CRITIQUE : La variable d'environnement REACT_APP_API_SPORTS_KEY n'est pas définie." +
    " Assurez-vous qu'elle est configurée dans les paramètres du projet Vercel."
  );
}
// else { // Commenté pour éviter erreur ESLint potentielle dans certains setups
//   console.log(`Clé API (REACT_APP_API_SPORTS_KEY) lue, commence par: ${API_KEY.substring(0, 5)}...`);
// }


const apiClient = axios.create({
  // PAS DE baseURL ici !
  headers: {
    'Content-Type': 'application/json',
    'x-apisports-key': API_KEY || '', // Utilise la clé lue
  },
  timeout: 15000,
});


// --- Interfaces TypeScript ---

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

// --- Fonctions du Service API ---

/**
 * Test: Récupère la liste des pays.
 */
export const getCountries = async (): Promise<Array<{ name: string; code: string | null; flag: string | null }>> => {
    const requestPath = '/api/foot/countries';
    console.log(`[Service] Appel TEST getCountries vers ${requestPath}`);
    try {
        const response = await apiClient.get<CountriesApiResponse>(requestPath);
        console.log('--- Réponse API /countries Reçue ---');
        console.log(`  Statut HTTP: ${response.status}`); /* ... autres logs ... */
        console.log('--- Fin Réponse API /countries ---');

        if (response.data && Array.isArray(response.data.response)) {
            console.log(`  Traitement réussi: ${response.data.response.length} pays retournés.`);
            return response.data.response;
        } else { /* ... gestion réponse inattendue ... */ return []; }
    } catch (error) {
        console.error(`[Service] ERREUR lors de la récupération des pays via ${requestPath}:`, error);
        if (axios.isAxiosError(error)) {
             const axiosError = error as AxiosError; /* ... */
             const apiErrorData = axiosError.response?.data as any;
             if (apiErrorData && typeof apiErrorData.message === 'string') { /* ... */ }
             else if (apiErrorData && (Array.isArray(apiErrorData.errors) || typeof apiErrorData.errors === 'object')) { /* ... */ }
             else if (axiosError.message) { /* ... */ }
             /* ... logs spécifiques 401/403 etc ... */
        } else { console.error('  Erreur inattendue:', error); }
        throw error;
    }
}

/**
 * Récupère la liste des ligues disponibles.
 */
export const getAvailableLeagues = async (): Promise<LeagueInfo[]> => {
    const requestPath = '/api/foot/leagues';
    console.log(`[Service] Appel getAvailableLeagues vers ${requestPath}`);
    try {
        const response = await apiClient.get<LeaguesApiResponse>(requestPath);
        console.log(`[Service] ${response.data?.results ?? 'N/A'} ligues brutes reçues.`);

        if (response.data && Array.isArray(response.data.response)) {
            const leagues = response.data.response.map(item => { /* ... traitement ... */ return { /* ... */ }; })
                                          .filter(league => league.id && league.name);
            console.log(`[Service] ${leagues.length} ligues valides après traitement.`);
            return leagues;
        } else { /* ... gestion réponse inattendue ... */ return []; }
    } catch (error) {
        console.error(`[Service] ERREUR lors de la récupération des ligues via ${requestPath}:`, error);
        if (axios.isAxiosError(error)) {
             const axiosError = error as AxiosError; /* ... */
             const apiErrorData = axiosError.response?.data as any;
            if (apiErrorData && typeof apiErrorData.message === 'string') { /* ... */ }
            else if (apiErrorData && (Array.isArray(apiErrorData.errors) || typeof apiErrorData.errors === 'object')) { /* ... */ }
            else if (axiosError.message) { /* ... */ }
             /* ... logs spécifiques 401/403 etc ... */
        } else { console.error('  Erreur inattendue (non-Axios):', error); }
        console.warn("[Service] Retour d'un tableau vide pour getAvailableLeagues suite à une erreur.");
        return [];
    }
};

/**
 * Récupère les matchs pour une date/ligue.
 */
export const getMatchesByDate = async ( date: string, leagueId?: number | null, seasonYear?: number | null ): Promise<MatchData[]> => {
  const requestPath = `/api/foot/fixtures`;
  const params: Record<string, any> = { date: date };
  if (leagueId && seasonYear) { /* ... ajout league/season ... */ }
  else { /* ... log toutes ligues ... */ }
  console.log(`  Chemin requête: ${requestPath}, Params: ${JSON.stringify(params)}`);

  try {
    const response = await apiClient.get<FixturesApiResponse>(requestPath, { params });
    console.log('--- Réponse API-Football /fixtures Reçue ---');
    /* ... logs de la réponse ... */
    console.log('--- Fin Réponse API-Football /fixtures ---');

    if (response.data && Array.isArray(response.data.response)) {
      console.log(`  Traitement réussi: ${response.data.response.length} matchs retournés.`);
       if (response.data.paging && response.data.paging.current < response.data.paging.total) { /* ... log pagination ... */ }
      return response.data.response;
    } else { /* ... gestion réponse inattendue ... */ return []; }
  } catch (error) {
    console.error(`ERREUR CATCHÉE dans getMatchesByDate (date: ${date}, league: ${leagueId}, season: ${seasonYear}):`);
    if (axios.isAxiosError(error)) {
         const axiosError = error as AxiosError; /* ... */
         const apiErrorData = axiosError.response?.data as any;
        if (apiErrorData && typeof apiErrorData.message === 'string') { /* ... */ }
        else if (apiErrorData && (Array.isArray(apiErrorData.errors) || typeof apiErrorData.errors === 'object')) { /* ... */ }
        else if (axiosError.message) { /* ... */ }
         /* ... logs spécifiques 401/403 etc ... */
    } else { console.error('  Erreur inattendue (non-Axios):', error); }
    throw error; // Relancer pour le composant
  }
};

// --- TODO: Adapter getTeamHistoryAndStats ---