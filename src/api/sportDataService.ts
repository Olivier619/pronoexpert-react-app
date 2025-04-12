// src/api/sportDataService.ts

import axios, { AxiosError } from 'axios';
import config from '../config'; // Importer la configuration

// --- Configuration ---

const API_KEY = process.env.REACT_APP_API_SPORTS_KEY;

if (!API_KEY) {
  console.error(
    "ERREUR CRITIQUE : La variable d'environnement REACT_APP_API_SPORTS_KEY n'est pas définie." +
    " Assurez-vous qu'elle est configurée dans les paramètres du projet Vercel."
  );
} else {
  // Log seulement une partie pour vérifier qu'elle est lue (ne pas logger la clé complète)
  console.log(`Clé API (REACT_APP_API_SPORTS_KEY) lue, commence par: ${API_KEY.substring(0, 5)}...`);
}

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
  get?: string; parameters?: Record<string, any>; errors?: any[]; results?: number; paging?: { current: number; total: number; }; response: MatchData[]; errorCode?: number; message?: string;
}

// --- >>> NOUVELLE Interface pour la réponse de /countries <<< ---
interface CountriesApiResponse {
    get?: string;
    parameters?: any[];
    errors?: any[];
    results?: number;
    response: Array<{ // Tableau d'objets pays
        name: string;
        code: string | null; // Ex: GB, FR, null
        flag: string | null;
    }>;
    errorCode?: number;
    message?: string;
}
// --- >>> FIN NOUVELLE Interface <<< ---



// --- Fonctions du Service API ---

/**                                           ***
 * NOUVELLE Fonction pour tester l'endpoint /countries
 * Récupère la liste des pays couverts par l'API.
 * @returns Une promesse résolue avec un tableau de pays.
 */
export const getCountries = async (): Promise<Array<{ name: string; code: string | null; flag: string | null }>> => {
    const requestPath = '/api/foot/countries'; // Utilise le rewrite Vercel + endpoint /countries
    console.log(`[Service] Appel TEST getCountries vers ${requestPath}`);
    try {
        const response = await apiClient.get<CountriesApiResponse>(requestPath);

        console.log('--- Réponse API /countries Reçue ---');
        console.log(`  Statut HTTP: ${response.status}`);
        console.log(`  Résultats API: ${response.data?.results ?? 'N/A'}`);
         try {
             console.log('  Contenu response.data:', response.data);
         } catch (e) { console.error('  Impossible de logger response.data'); }
        console.log(`  Nombre de pays dans response.data.response: ${Array.isArray(response.data?.response) ? response.data.response.length : 'N/A'}`);
        console.log('--- Fin Réponse API /countries ---');


        if (response.data && Array.isArray(response.data.response)) {
            console.log(`  Traitement réussi: ${response.data.response.length} pays retournés.`);
            return response.data.response;
        } else {
            console.warn('[Service] Réponse API pour /countries inattendue.');
             if(response.data?.errors && response.data.errors.length > 0) { console.error('  Erreurs API:', response.data.errors); }
             if(response.data?.message) { console.error('  Message API:', response.data.message); }
            return [];
        }
    } catch (error) {
        console.error(`[Service] ERREUR lors de la récupération des pays via ${requestPath}:`, error);
         if (axios.isAxiosError(error)) {
             const axiosError = error as AxiosError;
             console.error(`  Status HTTP: ${axiosError.response?.status || 'N/A'}`);
             const apiErrorData = axiosError.response?.data as any;
             if (apiErrorData?.message) { console.error(`  Message API: ${apiErrorData.message}`); }
             else if (apiErrorData?.errors) { console.error('  Erreurs API:', apiErrorData.errors); }
             else if (axiosError.message) { console.error(`  Message Axios: ${axiosError.message}`); }
             if (axiosError.response?.status === 401 || axiosError.response?.status === 499 ) {
                 console.error("  >>> PISTE AUTH: Vérif clé REACT_APP_API_SPORTS_KEY sur Vercel.");
             }
         } else { console.error('  Erreur inattendue:', error); }
        throw error;
    }
}
// --- >>> FIN NOUVELLE Fonction <<< ---



// Fonction pour récupérer les ligues (INCHANGÉE)
export const getAvailableLeagues = async (): Promise<LeagueInfo[]> => { /* ... code existant ... */ };

// Fonction pour récupérer les matchs (INCHANGÉE, mais ne sera pas appelée par MatchList dans ce test)
export const getMatchesByDate = async ( date: string, leagueId?: number | null, seasonYear?: number | null ): Promise<MatchData[]> => { /* ... code existant ... */ };

// --- TODO: Adapter getTeamHistoryAndStats ---