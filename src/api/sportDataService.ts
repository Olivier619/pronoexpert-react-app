// src/api/sportDataService.ts
import axios, { AxiosError } from 'axios';
import config from '../config';

// --- Configuration (inchangée) ---
const API_KEY = process.env.REACT_APP_API_SPORTS_KEY;
if (!API_KEY) { /* ... erreur ... */ } else { /* ... log ... */ }
const apiClient = axios.create({ /* ... config ... */ });

// --- Interfaces (Ajouter/Modifier) ---

// Garder TeamInfo, Goals, ScoreInfo, FixtureStatus, Fixture
export interface TeamInfo { id: number; name: string; logo: string; winner?: boolean | null; }
export interface Goals { home: number | null; away: number | null; }
export interface ScoreInfo { halftime: Goals; fulltime: Goals; extratime: Goals | null; penalty: Goals | null; }
export interface FixtureStatus { long: string; short: string; elapsed: number | null; }
export interface Fixture { id: number; referee: string | null; timezone: string; date: string; timestamp: number; periods: { first: number | null; second: number | null; }; venue: { id: number | null; name: string | null; city: string | null; }; status: FixtureStatus; }

// MODIFIER LeagueInfo pour inclure la saison actuelle (si retournée par /leagues)
// src/api/sportDataService.ts

export interface LeagueInfo { // Renommé
  id: number;
  name: string;
  type?: string; // Ex: 'League', 'Cup'
  logo: string;
  country?: CountryInfo; // Inclure les infos du pays si retourné par /leagues
  season?: LeagueSeason; // Informations sur la saison actuelle si retourné par /leagues
  // --- >>> AJOUTER CETTE LIGNE <<< ---
  round?: string; // Ex: "Regular Season - 15", "Final" (Rendre optionnel car pas toujours présent)
  // --- >>> FIN AJOUT <<< ---
}

// ... (reste du fichier) ...

// NOUVELLE Interface pour les infos de pays (si retourné par /leagues)
export interface CountryInfo {
    name: string;
    code: string | null; // Ex: 'GB', 'FR'
    flag: string | null;
}

// NOUVELLE Interface pour les saisons (si retourné par /leagues)
export interface LeagueSeason {
    year: number; // Saison actuelle
    start?: string;
    end?: string;
    current?: boolean;
    coverage?: any; // Détails sur la couverture de l'API pour cette saison
}

// MODIFIER MatchData pour utiliser LeagueInfo (si ce n'est déjà fait)
export interface MatchData {
  fixture: Fixture;
  league: LeagueInfo; // Utilise la nouvelle interface
  teams: { home: TeamInfo; away: TeamInfo; };
  goals: Goals;
  score: ScoreInfo;
  // ... autres champs ...
}

// MODIFIER FixturesApiResponse (peu de changement nécessaire)
interface FixturesApiResponse {
  get?: string;
  parameters?: Record<string, any>;
  errors?: any[];
  results?: number;
  paging?: { current: number; total: number; };
  response: MatchData[];
}

// NOUVELLE Interface pour la réponse de /leagues
interface LeaguesApiResponse {
    get?: string;
    parameters?: Record<string, any>;
    errors?: any[];
    results?: number;
    paging?: { current: number; total: number; };
    response: Array<{ // La réponse est un tableau d'objets contenant league et country
        league: LeagueInfo;
        country: CountryInfo;
        seasons: LeagueSeason[]; // API-Football retourne les saisons ici
    }>;
}

// --- Fonctions du Service API ---

/**
 * Récupère la liste des ligues disponibles (souvent filtré par plan API).
 * @returns Une promesse résolue avec un tableau de LeagueInfo[].
 */
export const getAvailableLeagues = async (): Promise<LeagueInfo[]> => {
    const requestPath = '/api/foot/leagues'; // Endpoint pour les ligues
    console.log(`[Service] Appel getAvailableLeagues vers ${requestPath}`);
    try {
        // Peut-être ajouter ?current=true pour ne récupérer que celles avec une saison active ? A vérifier dans la doc.
        const response = await apiClient.get<LeaguesApiResponse>(requestPath/*, { params: { current: 'true' } }*/);

        if (response.data && Array.isArray(response.data.response)) {
            console.log(`[Service] ${response.data.response.length} ligues reçues.`);
            // Transformer la réponse pour avoir une structure LeagueInfo simple
            // On prend la saison la plus récente marquée comme 'current' si possible
            const leagues = response.data.response.map(item => {
                 const currentSeason = item.seasons?.find(s => s.current === true) ?? item.seasons?.[item.seasons.length - 1]; // Prend la saison courante ou la dernière
                 return {
                     ...item.league, // Prend les infos de base de la ligue
                     country: item.country, // Ajoute les infos du pays
                     season: currentSeason // Ajoute les infos de la saison courante/dernière
                 };
            });
            return leagues;
        } else {
            console.warn('[Service] Réponse API pour /leagues inattendue.', response.data);
            return [];
        }
    } catch (error) {
        console.error(`[Service] ERREUR lors de la récupération des ligues via ${requestPath}:`, error);
        // Gérer les détails de l'erreur comme dans getMatchesByDate si nécessaire
        throw error; // Propager l'erreur
    }
}


/**
 * Récupère les matchs pour une date donnée, avec filtre optionnel par ligue.
 * @param date - La date au format 'YYYY-MM-DD'.
 * @param leagueId - ID optionnel de la ligue à filtrer.
 * @param seasonYear - Année de la saison (REQUIS si leagueId est fourni).
 * @returns Une promesse résolue avec un tableau de MatchData[].
 */
export const getMatchesByDate = async (
    date: string,
    leagueId?: number | null, // Rend le paramètre optionnel
    seasonYear?: number | null // Ajout de la saison
): Promise<MatchData[]> => {
  const requestPath = `/api/foot/fixtures`;
  const params: Record<string, any> = { date: date }; // Paramètre de date toujours présent

  // Ajouter league et season SEULEMENT si leagueId est fourni
  if (leagueId && seasonYear) {
      params.league = leagueId;
      params.season = seasonYear;
      console.log(`[Service] getMatchesByDate pour date: ${date}, league: ${leagueId}, season: ${seasonYear}`);
  } else {
      console.log(`[Service] getMatchesByDate pour date: ${date} (toutes ligues autorisées)`);
  }

  console.log(`  Chemin requête: ${requestPath}, Params: ${JSON.stringify(params)}`);

  try {
    const response = await apiClient.get<FixturesApiResponse>(requestPath, { params });

    // --- LOGS (Peuvent être réduits maintenant que ça fonctionne) ---
    console.log('--- Réponse API-Football Reçue ---');
    console.log(`  Statut HTTP: ${response.status}`);
    console.log(`  Résultats API: ${response.data?.results ?? 'N/A'}`);
    if (response.data?.paging) { console.log(`  Pagination API: Page ${response.data.paging.current}/${response.data.paging.total}`); }
    console.log(`  Nombre de matchs dans response.data.response: ${Array.isArray(response.data.response) ? response.data.response.length : 'N/A'}`);
    console.log('--- Fin Réponse API-Football ---');
    // --- FIN LOGS ---

    if (response.data && Array.isArray(response.data.response)) {
      console.log(`  Traitement réussi: ${response.data.response.length} matchs retournés.`);
       // Gérer la pagination API si elle existe et qu'on veut toutes les pages
       if (response.data.paging && response.data.paging.current < response.data.paging.total) {
           console.warn(`  AVERTISSEMENT: Pagination détectée (Page ${response.data.paging.current}/${response.data.paging.total}). Seule la première page est traitée.`);
           // TODO: Implémenter la récupération de toutes les pages ici si nécessaire.
       }
      return response.data.response;
    } else {
      console.warn(`  Traitement AVERTISSEMENT: Réponse API-Football inattendue. Clé 'response' manquante ou non-tableau.`);
      if(response.data?.errors && response.data.errors.length > 0) { console.error('  Erreurs API:', response.data.errors); }
      return [];
    }

  } catch (error) {
    console.error(`ERREUR CATCHÉE dans getMatchesByDate (date: ${date}, league: ${leagueId}, season: ${seasonYear}):`);
    // ... (Gestion détaillée des erreurs inchangée) ...
    throw error;
  }
};


// --- TODO: Adapter getTeamHistoryAndStats ---
// export const getTeamHistoryAndStats = async (teamId: number): Promise<MatchData[]> => {
//     const requestPath = `/api/foot/fixtures`;
//     const currentSeason = new Date().getFullYear(); // Ou obtenir dynamiquement
//     try {
//         const response = await apiClient.get<FixturesApiResponse>(requestPath, {
//             params: {
//                 team: teamId,
//                 last: 15, // Demander les 15 derniers
//                 status: 'FT-AET-PEN' // Statuts terminés
//                 // Ou utiliser season: currentSeason, status: 'FT-AET-PEN' et trier/limiter côté client
//             }
//         });
//         if (response.data && Array.isArray(response.data.response)) {
//             return response.data.response;
//         }
//         return [];
//     } catch (error) {
//         console.error(`Erreur getTeamHistory team ${teamId}:`, error);
//         throw error;
//     }
// }