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
// Dans src/api/sportDataService.ts, remplacer le corps de getAvailableLeagues

// Fonction pour récupérer les ligues
export const getAvailableLeagues = async (): Promise<LeagueInfo[]> => {
  const requestPath = '/api/foot/leagues'; // Endpoint pour les ligues
  console.log(`[Service] Appel getAvailableLeagues vers ${requestPath}`);
  try {
      // Appel API vers l'endpoint /leagues
      const response = await apiClient.get<LeaguesApiResponse>(requestPath/*, { params: { current: 'true' } }*/); // L'appel réel

      if (response.data && Array.isArray(response.data.response)) {
          console.log(`[Service] ${response.data.response.length} ligues reçues.`);
          // Transformer la réponse pour avoir une structure LeagueInfo simple
          const leagues = response.data.response.map(item => {
              const currentSeason = item.seasons?.find(s => s.current === true) ?? item.seasons?.[item.seasons.length - 1];
              return {
                  ...item.league,
                  country: item.country,
                  season: currentSeason
              };
          }).filter(league => league.id && league.name); // Filtrer celles sans ID ou nom

          console.log(`[Service] ${leagues.length} ligues valides après traitement.`);
          return leagues; // <<<--- INSTRUCTION RETURN NÉCESSAIRE

      } else {
          console.warn('[Service] Réponse API pour /leagues inattendue.', response.data);
           if(response.data?.errors && response.data.errors.length > 0) { console.error('  Erreurs API:', response.data.errors); }
           if(response.data?.message) { console.error('  Message API:', response.data.message); }
          return []; // <<<--- INSTRUCTION RETURN NÉCESSAIRE (tableau vide)
      }
    } catch (error) { // Début du bloc catch
      console.error(`[Service] ERREUR lors de la récupération des ligues via ${requestPath}:`, error);

      // Vérifier si c'est une erreur Axios
      if (axios.isAxiosError(error)) {
          // DANS LE BLOC catch -> if (axios.isAxiosError(error)) CONCERNÉ (vers ligne 192)

          const axiosError = error as AxiosError;
          console.error(`  Erreur Axios détectée.`);
          console.error(`  Status HTTP: ${axiosError.response?.status || 'N/A (Erreur Réseau ou CORS?)'}`);
          const apiErrorData = axiosError.response?.data as any;

          // --- >>> APPLIQUER LA MÊME CORRECTION ICI <<< ---
          if (apiErrorData && typeof apiErrorData.message === 'string') {
              console.error(`  Message API: ${apiErrorData.message}`);
               if (apiErrorData.errorCode) { // Log code si dispo avec message
                  console.error(`  Code d'erreur API: ${apiErrorData.errorCode}`);
               }
          } else if (apiErrorData && Array.isArray(apiErrorData.errors)) {
              console.error('  Erreurs API:', apiErrorData.errors);
          } else if (axiosError.message) { // Sinon, log message Axios général
              console.error(`  Message Axios: ${axiosError.message}`);
          }
          // --- >>> FIN CORRECTION <<< ---

          // Log spécifiques pour erreurs communes (doivent déjà être là)
          if (axiosError.response?.status === 401 || axiosError.response?.status === 499 ) { /* ... */ }
          else if (axiosError.response?.status === 403 || axiosError.response?.status === 429) { /* ... */ }
          else if (!axiosError.response) { /* ... */ }

      } else {
          // Gérer les erreurs qui ne sont PAS des erreurs Axios
          console.error('  Erreur inattendue (non-Axios):', error);
      }
    // ... reste du catch de cette fonction ...
    throw error; // Assurez-vous que l'erreur est relancée à la fin du catch

// La fonction getMatchesByDate reste ici aussi
export const getMatchesByDate = ... // (INCHANGÉE)

// La fonction getCountries reste ici aussi
export const getCountries = ... // (INCHANGÉE)

// --- TODO: Adapter les autres fonctions ---