// src/api/sportDataService.ts

import axios, { AxiosError } from 'axios';
import { format, addDays, subDays } from 'date-fns'; // Importer des fonctions date-fns pour la simulation
import config from '../config'; // Importer le fichier de configuration

// --- Configuration & Client Axios ---

const API_KEY = config.apiSports.key; // Utilise la clé depuis config

const apiClient = axios.create({
  // PAS DE baseURL ici ! L'URL complète avec /api/foot est utilisée dans les requêtes individuelles
  headers: {
    'Content-Type': 'application/json',
    'x-apisports-key': API_KEY || '', // Utilise la clé lue, vide si absente
  },
  timeout: 15000, // 15 secondes de timeout
});


// --- Interfaces TypeScript (Complètes et Mises à Jour pour inclure tous les champs potentiels) ---

export interface TeamInfo { id: number; name: string; logo: string; winner?: boolean | null; }
export interface LeagueInfo { id: number; name: string; type?: string; logo: string; country?: CountryInfo; season?: LeagueSeason; round?: string; } // <-- round est bien ici
export interface CountryInfo { name: string; code: string | null; flag: string | null; }
export interface LeagueSeason { year: number; start?: string; end?: string; current?: boolean; coverage?: any; } // 'coverage' peut être plus précis si nécessaire
export interface Goals { home: number | null; away: number | null; }
export interface ScoreInfo { halftime: Goals; fulltime: Goals; extratime: Goals | null; penalty: Goals | null; }
export interface FixtureStatus { long: string; short: string; elapsed: number | null; }
// Fixture complète selon la documentation ou les données réelles
export interface Fixture {
    id: number;
    referee: string | null;
    timezone: string;
    date: string; // Format ISO 8601 (ex: "2023-01-01T12:00:00+00:00")
    timestamp: number; // Timestamp Unix
    periods: { first: number | null; second: number | null; }; // Timestamps des périodes
    venue: { id: number | null; name: string | null; city: string | null; };
    status: FixtureStatus;
    // Ajouter d'autres champs si MatchData contient d'autres propriétés directes de fixture
}
// MatchData complète
export interface MatchData { fixture: Fixture; league: LeagueInfo; teams: { home: TeamInfo; away: TeamInfo; }; goals: Goals; score: ScoreInfo; events?: any[]; lineups?: any[]; statistics?: any[]; players?: any[]; } // Ajouter players si présent

// Interfaces des réponses API (Complètes, basées sur la structure standard API-Sports)
// Incluent tous les champs potentiels que l'API peut renvoyer au top level
interface ApiResponseBase {
    get?: string; // La requête GET effectuée (optionnel si absent en cas d'erreur très précoce)
    parameters?: Record<string, any>; // Les paramètres utilisés (optionnel)
    errors?: any[] | Record<string, string>; // Tableau ou objet d'erreurs (optionnel)
    results?: number; // Nombre de résultats trouvés (optionnel si erreur)
    paging?: { current: number; total: number; }; // Infos de pagination (optionnel)
    errorCode?: number; // Code d'erreur spécifique API (optionnel)
    message?: string; // Message d'erreur API (optionnel)
}

interface FixturesApiResponse extends ApiResponseBase {
    response: MatchData[]; // Tableau des matchs (peut être vide même si results > 0 selon l'API)
}

interface LeaguesApiResponse extends ApiResponseBase {
    // La réponse des ligues est un tableau d'objets contenant league, country, seasons
    response: Array<{ league: LeagueInfo; country: CountryInfo; seasons: LeagueSeason[]; }>;
}

interface CountriesApiResponse extends ApiResponseBase {
    response: Array<{ name: string; code: string | null; flag: string | null; }>;
}

type RawLeagueResponseItem = { league: LeagueInfo; country: CountryInfo; seasons: LeagueSeason[]; };


// --- Fonctions utilitaires de Simulation (déplacées ici) ---

// Fonction utilitaire pour créer un objet Fixture simulé complet
const createSimulatedFixture = (id: number, dateString: string, time: string, statusShort: string, statusLong: string, elapsed: number | null, venueName: string | null, city: string | null, referee: string | null, timezone: string = "UTC") => {
    const dateTime = `${dateString}T${time}:00+00:00`; // Format ISO
    const timestamp = new Date(dateTime).getTime() / 1000;
    return {
        id, referee, timezone, date: dateTime, timestamp,
        periods: statusShort === 'NS' ? { first: null, second: null } : { first: 45, second: 45 },
        venue: { id: id + 1000, name: venueName, city: city },
        status: { long: statusLong, short: statusShort, elapsed: elapsed },
    };
};

// Fonction utilitaire pour créer un objet MatchData simulé complet
const createSimulatedMatch = (fixtureId: number, date: string, time: string, statusShort: string, statusLong: string, elapsed: number | null, venueName: string | null, city: string | null, referee: string | null, league: LeagueInfo, homeTeam: TeamInfo, awayTeam: TeamInfo, homeGoals: number | null, awayGoals: number | null, halfTimeHome: number | null, halfTimeAway: number | null): MatchData => { // Ajout du type de retour
    const fixture = createSimulatedFixture(fixtureId, date, time, statusShort, statusLong, elapsed, venueName, city, referee);
    const goals = { home: homeGoals, away: awayGoals };
    const fullTimeScore = (statusShort === 'FT' || statusShort === 'AET' || statusShort === 'PEN') ? goals : { home: null, away: null };
    const score = { halftime: { home: halfTimeHome, away: halfTimeAway }, fulltime: fullTimeScore, extratime: null, penalty: null };
    const winner = fullTimeScore.home !== null && fullTimeScore.away !== null ? (fullTimeScore.home > fullTimeScore.away ? homeTeam.id : (fullTimeScore.away > fullTimeScore.home ? awayTeam.id : null)) : null;
    const teams = { home: { ...homeTeam, winner: winner === homeTeam.id }, away: { ...awayTeam, winner: winner === awayTeam.id } };
    return { fixture, league, teams, goals, score }; // Retourne l'objet MatchData complet
};


// --- Fonctions de Simulation de Données Principales ---

const simulateGetLeagues = async (): Promise<LeagueInfo[]> => {
    console.log("[sportDataService] MODE SIMULATION : Chargement des ligues simulées...");
    const simulatedLeagues: LeagueInfo[] = [
        // Ajoutez ici beaucoup plus de ligues pour simuler une longue liste
        { id: 39, name: "Premier League", type: "league", logo: "https://media.api-sports.io/football/leagues/39.png", country: { name: "England", code: "GB", flag: "https://media.api-sports.io/flags/gb.svg" }, season: { year: 2023, current: true, start: "2023-08-11", end: "2024-05-19" } },
        { id: 140, name: "La Liga", type: "league", logo: "https://media.api-sports.io/football/leagues/140.png", country: { name: "Spain", code: "ES", flag: "https://media.api-sports.io/flags/es.svg" }, season: { year: 2023, current: true, start: "2023-08-11", end: "2024-05-26" } },
        { id: 61, name: "Ligue 1", type: "league", logo: "https://media.api-sports.io/football/leagues/61.png", country: { name: "France", code: "FR", flag: "https://media.api-sports.io/flags/fr.svg" }, season: { year: 2023, current: true, start: "2023-08-11", end: "2024-05-18" } },
        { id: 78, name: "Bundesliga", type: "league", logo: "https://media.api-sports.io/football/leagues/78.png", country: { name: "Germany", code: "DE", flag: "https://media.api-sports.io/flags/de.svg" }, season: { year: 2023, current: true, start: "2023-08-18", end: "2024-05-18" } },
        { id: 135, name: "Serie A", type: "league", logo: "https://media.api-sports.io/football/leagues/135.png", country: { name: "Italy", code: "IT", flag: "https://media.api-sports.io/flags/it.svg" }, season: { year: 2023, current: true, start: "2023-08-19", end: "2024-05-26" } },
        { id: 2, name: "UEFA Champions League", type: "cup", logo: "https://media.api-sports.io/football/leagues/2.png", country: { name: "World", code: null, flag: null }, season: { year: 2023, current: false, start: "2023-06-27", end: "2024-06-01" } },
        { id: 203, name: "Ligue 1 (Algeria)", type: "league", logo: "https://media.api-sports.io/football/leagues/203.png", country: { name: "Algeria", code: "DZ", flag: "https://media.api-sports.io/flags/dz.svg" }, season: { year: 2023, current: true, start: "2023-09-15", end: "2024-07-15" } },
        { id: 1, name: "World Cup", type: "cup", logo: "https://media.api-sports.io/football/leagues/1.png", country: { name: "World", code: null, flag: null }, season: { year: 2022, current: false, start: "2022-11-20", end: "2022-12-18" } },
        { id: 8, name: "Africa Cup of Nations", type: "cup", logo: "https://media.api-sports.io/football/leagues/8.png", country: { name: "World", code: null, flag: null }, season: { year: 2023, current: false, start: "2024-01-13", end: "2024-02-11" } },
        { id: 45, name: "FA Cup", type: "cup", logo: "https://media.api-sports.io/football/leagues/45.png", country: { name: "England", code: "GB", flag: "https://media.api-sports.io/flags/gb.svg" }, season: { year: 2023, current: true, start: "2023-08-05", end: "2024-05-25" } },
        { id: 136, name: "Serie B", type: "league", logo: "https://media.api-sports.io/football/leagues/136.png", country: { name: "Italy", code: "IT", flag: "https://media.api-sports.io/flags/it.svg" }, season: { year: 2023, current: true, start: "2023-08-18", end: "2024-05-10" } },
        { id: 141, name: "Segunda Division", type: "league", logo: "https://media.api-sports.io/football/leagues/141.png", country: { name: "Spain", code: "ES", flag: "https://media.api-sports.io/flags/es.svg" }, season: { year: 2023, current: true, start: "2023-08-11", end: "2024-06-02" } },
        { id: 66, name: "Ligue 2", type: "league", logo: "https://media.api-sports.io/football/leagues/66.png", country: { name: "France", code: "FR", flag: "https://media.api-sports.io/flags/fr.svg" }, season: { year: 2023, current: true, start: "2023-08-05", end: "2024-05-18" } },
        { id: 137, name: "Coppa Italia", type: "cup", logo: "https://media.api-sports.io/football/leagues/137.png", country: { name: "Italy", code: "IT", flag: "https://media.api-sports.io/flags/it.svg" }, season: { year: 2023, current: true, start: "2023-07-22", end: "2024-05-15" } },
        { id: 142, name: "Copa del Rey", type: "cup", logo: "https://media.api-sports.io/football/leagues/142.png", country: { name: "Spain", code: "ES", flag: "https://media.api-sports.io/flags/es.svg" }, season: { year: 2023, current: true, start: "2023-10-11", end: "2024-04-06" } },
        { id: 65, name: "Coupe de France", type: "cup", logo: "https://media.api-sports.io/football/leagues/65.png", country: { name: "France", code: "FR", flag: "https://media.api-sports.io/flags/fr.svg" }, season: { year: 2023, current: true, start: "2023-09-03", end: "2024-05-25" } },
         { id: 3, name: "UEFA Europa League", type: "cup", logo: "https://media.api-sports.io/football/leagues/3.png", country: { name: "World", code: null, flag: null }, season: { year: 2023, current: false, start: "2023-07-13", end: "2024-05-22" } },
         { id: 4, name: "UEFA Europa Conference League", type: "cup", logo: "https://media.api-sports.io/football/leagues/4.png", country: { name: "World", code: null, flag: null }, season: { year: 2023, current: false, start: "2023-07-13", end: "2024-05-29" } },
         { id: 529, name: "Liga MX", type: "league", logo: "https://media.api-sports.io/football/leagues/529.png", country: { name: "Mexico", code: "MX", flag: "https://media.api-sports.io/flags/mx.svg" }, season: { year: 2023, current: true, start: "2023-07-01", end: "2024-05-31" } },
         { id: 530, name: "Liga MX Apertura", type: "league", logo: "https://media.api-sports.io/football/leagues/530.png", country: { name: "Mexico", code: "MX", flag: "https://media.api-sports.io/flags/mx.svg" }, season: { year: 2023, current: false, start: "2023-06-30", end: "2023-12-17" } },
         { id: 531, name: "Liga MX Clausura", type: "league", logo: "https://media.api-sports.io/football/leagues/531.png", country: { name: "Mexico", code: "MX", flag: "https://media.api-sports.io/flags/mx.svg" }, season: { year: 2023, current: true, start: "2024-01-12", end: "2024-05-26" } },
        // ... Ajoutez autant que nécessaire pour simuler une grande liste
    ];
    await new Promise(resolve => setTimeout(resolve, 500)); // Simuler un délai
    console.log(`[sportDataService] MODE SIMULATION : ${simulatedLeagues.length} ligues simulées chargées.`);
    return simulatedLeagues;
};

const simulateGetMatchesByDate = async (date: string, leagueId?: number | null, seasonYear?: number | null): Promise<MatchData[]> => {
     console.log(`[sportDataService] MODE SIMULATION : Chargement des matchs simulés pour date: ${date}, league: ${leagueId}, season: ${seasonYear}`);
     const simulatedMatches: MatchData[] = [];
     const today = format(new Date(), 'yyyy-MM-dd');
     const tomorrow = format(addDays(new Date(), 1), 'yyyy-MM-dd');
     const yesterday = format(subDays(new Date(), 1), 'yyyy-MM-dd');


     // Ajouter des matchs simulés pour "Aujourd'hui" (today)
     if (date === today) {
         simulatedMatches.push(createSimulatedMatch(112233, today, "14:00", "FT", "Match Finished", 90, "Old Trafford Simulé", "Manchester", "Michael Oliver Simulé", { id: 39, name: "Premier League", logo: "https://media.api-sports.io/football/leagues/39.png", country: { name: "England", code: "GB", flag: "https://media.api-sports.io/flags/gb.svg" } }, { id: 1, name: "Man Utd Simulé", logo: "https://media.api-sports.io/football/teams/33.png" }, { id: 2, name: "Liverpool Simulé", logo: "https://media.api-sports.io/football/teams/40.png" }, 3, 2, 1, 1));
         simulatedMatches.push(createSimulatedMatch(112234, today, "19:30", "NS", "Not Started", null, "Santiago Bernabéu Simulé", "Madrid", null, { id: 140, name: "La Liga", logo: "https://media.api-sports.io/football/leagues/140.png", country: { name: "Spain", code: "ES", flag: "https://media.api-sports.io/flags/es.svg" } }, { id: 3, name: "Real Madrid Simulé", logo: "https://media.api-sports.io/football/teams/584.png" }, { id: 4, name: "Barcelone Simulé", logo: "https://media.api-sports.io/football/teams/529.png" }, null, null, null, null));
         simulatedMatches.push(createSimulatedMatch(112235, today, "17:00", "1H", "First Half", 30, "Parc des Princes Simulé", "Paris", "Clément Turpin Simulé", { id: 61, name: "Ligue 1", logo: "https://media.api-sports.io/football/leagues/61.png", country: { name: "France", code: "FR", flag: "https://media.api-sports.io/flags/fr.svg" } }, { id: 5, name: "PSG Simulé", logo: "https://media.api-sports.io/football/teams/85.png" }, { id: 6, name: "Marseille Simulé", logo: "https://media.api-sports.io/football/teams/93.png" }, 1, 0, 1, 0));
     }

     // Ajouter des matchs simulés pour "Demain" (tomorrow)
     if (date === tomorrow) {
          simulatedMatches.push(createSimulatedMatch(112236, tomorrow, "21:00", "NS", "Not Started", null, "Allianz Arena Simulé", "Munich", null, { id: 78, name: "Bundesliga", logo: "https://media.api-sports.io/football/leagues/78.png", country: { name: "Germany", code: "DE", flag: "https://media.api-sports.io/flags/de.svg" } }, { id: 7, name: "Bayern Simulé", logo: "https://media.api-sports.io/football/teams/157.png" }, { id: 8, name: "Dortmund Simulé", logo: "https://media.api-sports.io/football/teams/165.png" }, null, null, null, null));
     }

      // Ajouter des matchs simulés pour "Hier" (yesterday)
     if (date === yesterday) {
          simulatedMatches.push(createSimulatedMatch(112237, yesterday, "20:00", "FT", "Match Finished", 90, "San Siro Simulé", "Milan", "Daniele Orsato Simulé", { id: 135, name: "Serie A", logo: "https://media.api-sports.io/football/leagues/135.png", country: { name: "Italy", code: "IT", flag: "https://media.api-sports.io/flags/it.svg" } }, { id: 9, name: "Juventus Simulé", logo: "https://media.api-sports.io/football/teams/496.png" }, { id: 10, name: "Inter Simulé", logo: "https://media.api-sports.io/football/teams/505.png" }, 0, 0, 0, 0)); // Match nul
     }


      // Filtrer les matchs simulés si une ligue spécifique est demandée
      const filteredMatches = leagueId !== null && leagueId !== undefined
          ? simulatedMatches.filter(match => match.league.id === leagueId)
          : simulatedMatches;


     await new Promise(resolve => setTimeout(resolve, 700)); // Simuler un délai
     console.log(`[sportDataService] MODE SIMULATION : ${filteredMatches.length} matchs simulés retournés.`);
     return filteredMatches;
};

// --- Fonction de Simulation des derniers matchs d'une équipe ---
const simulateGetTeamLastMatches = async (teamId: number, lastN: number): Promise<MatchData[]> => {
     console.log(`[sportDataService] MODE SIMULATION : Chargement des ${lastN} derniers matchs simulés pour l'équipe ${teamId}...`);
     const simulatedTeamMatches: MatchData[] = [];
     const teamName = `Équipe ${teamId} Simulé`;

     // Créer des matchs simulés pour cette équipe, en simulant des résultats variés
     // Ces matchs devraient avoir des dates passées (utiliser subDays) et des ID de fixture uniques
     const today = new Date();

     for (let i = 0; i < lastN; i++) {
         const matchDate = format(subDays(today, i + 1), 'yyyy-MM-dd'); // Jours précédents
         const isHome = i % 2 === 0; // Alterner domicile/extérieur simulé
         const opponentId = teamId * 10 + (isHome ? 100 + i : 1 + i); // ID opposé simulé (plus unique)
         const opponentName = `Opposant ${opponentId} Simulé`;
         const fixtureId = teamId * 10000 + i; // ID fixture unique simulé pour cette fonction


         // Simuler un résultat (V, N, D) pour teamId. L'ordre des résultats est inversé par rapport à l'index (les plus récents auront un index plus petit)
         let homeGoals: number | null, awayGoals: number | null, statusShort: string = 'FT', statusLong: string = 'Match Finished', elapsed: number | null = 90;
         let resultType = i % 3; // Cycle V, N, D du point de vue de teamId pour les matchs *les plus récents* (index 0, 3, 6...)
         let teamGoals, opponentGoals;

         if (resultType === 0) { // Victoire pour teamId (index 0, 3, 6...)
             teamGoals = 2 + Math.floor(Math.random() * 2); // 2 ou 3 buts
             opponentGoals = Math.max(0, teamGoals - 1 - Math.floor(Math.random() * 2)); // Au moins 1 but de moins
         } else if (resultType === 1) { // Nul (index 1, 4, 7...)
              teamGoals = Math.floor(Math.random() * 3); // 0, 1, ou 2 buts
              opponentGoals = teamGoals;
         } else { // Défaite pour teamId (index 2, 5, 8...)
              opponentGoals = 2 + Math.floor(Math.random() * 2); // 2 ou 3 buts pour l'adversaire
              teamGoals = Math.max(0, opponentGoals - 1 - Math.floor(Math.random() * 2)); // Au moins 1 but de moins
         }

         if (isHome) { homeGoals = teamGoals; awayGoals = opponentGoals; }
         else { homeGoals = opponentGoals; awayGoals = teamGoals; }


         const homeTeam: TeamInfo = isHome ? { id: teamId, name: teamName, logo: "" } : { id: opponentId, name: opponentName, logo: "" };
         const awayTeam: TeamInfo = isHome ? { id: opponentId, name: opponentName, logo: "" } : { id: teamId, name: teamName, logo: "" };
         const simulatedLeague: LeagueInfo = { id: 999, name: "Ligue Simulée", logo: "", country: { name: "Monde Simulé", code: null, flag: null } }; // Ligue bidon complète

         simulatedTeamMatches.push(createSimulatedMatch( // <-- Appel correct après déplacement
             fixtureId, matchDate, "18:00", statusShort, statusLong, elapsed,
             `Stade ${isHome ? teamName : opponentName} Simulé`, `Ville ${isHome ? teamName : opponentName} Simulé`, "Arbitre Simulé",
             simulatedLeague, // Utilise l'objet ligue bidon
             homeTeam, awayTeam, homeGoals, awayGoals,
             Math.floor((homeGoals ?? 0) / 2), // Score mi-temps simulé basique
             Math.floor((awayGoals ?? 0) / 2)
         ));
     }

     // Les matchs sont ajoutés du plus récent au plus ancien (par la boucle subDays),
     // donc ils sont déjà dans le bon ordre pour les poids.
     await new Promise(resolve => setTimeout(resolve, 300)); // Simuler un délai court
     console.log(`[sportDataService] MODE SIMULATION : ${simulatedTeamMatches.length} matchs simulés pour l'équipe ${teamId} retournés.`);
     return simulatedTeamMatches;
};


// --- Fonctions du Service API (Utilisent la simulation ou l'appel réel) ---

/**
 * Récupère la liste des ligues disponibles.
 */
export const getAvailableLeagues = async (): Promise<LeagueInfo[]> => {
    if (config.useSimulatedData) {
        return simulateGetLeagues();
    }

    const requestPath = '/api/foot/leagues';
    console.log(`[sportDataService] Appel API Réel : getAvailableLeagues vers ${requestPath}`);
    // Paramètres pour l'API réelle - essayer sans filtre pour obtenir plus de ligues
    const params = {}; // Essayer sans filtre "current"


    try {
        const response = await apiClient.get<LeaguesApiResponse>(requestPath, { params });
        console.log(`[sportDataService] Réponse API Réel ${response.status}: /leagues reçue.`);
        // console.log("[sportDataService] Réponse brute /leagues:", response.data); // Log pour debug si besoin

        // Vérifier si la réponse, le tableau response et les résultats sont présents et valides
        if (response.data?.response && Array.isArray(response.data.response) && response.data.results !== undefined) {
             console.log(`  ${response.data.results} ligues brutes trouvées par l'API.`);
            const leagues: LeagueInfo[] = response.data.response
                .map((item: RawLeagueResponseItem): LeagueInfo => {
                    // Trouver la saison courante, sinon la dernière
                    const currentSeason = item.seasons?.find(s => s.current === true) ?? (item.seasons?.length ? item.seasons[item.seasons.length - 1] : undefined);
                    // Inclure l'objet saison complet
                    const leagueInfo: LeagueInfo = { ...item.league, country: item.country, season: currentSeason };
                    return leagueInfo;
                })
                 // Filtrer les ligues qui n'ont pas d'ID ou de nom
                .filter((league: LeagueInfo): league is LeagueInfo => !!(league.id && league.name));
            console.log(`[sportDataService] ${leagues.length} ligues valides après traitement.`);
            return leagues;
        } else {
           console.warn(`[sportDataService] Réponse API pour /leagues inattendue ou manquante.`, response.data);
           // Utiliser des vérifications d'existence pour les champs d'erreur/message
           if(response.data?.errors && Array.isArray(response.data.errors) && response.data.errors.length > 0) { console.error('  Erreurs API:', response.data.errors); }
           if(response.data?.message) { console.error('  Message API:', response.data.message); }
           console.warn("[sportDataService] Retour d'un tableau vide pour getAvailableLeagues suite à une réponse vide/inattendue.");
           return [];
        }
    } catch (error) {
        console.error(`[sportDataService] ERREUR lors de la récupération des ligues via ${requestPath}:`, error);
        if (axios.isAxiosError(error)) {
             const axiosError = error as AxiosError;
             console.error('  Message Axios:', axiosError.message);
             if (axiosError.response) {
                 console.error('  Statut HTTP:', axiosError.response.status);
                 console.error('  Données de réponse:', axiosError.response.data);
                 const errorResponseData = axiosError.response.data as ApiResponseBase;
                 if(errorResponseData?.errors && Array.isArray(errorResponseData.errors) && errorResponseData.errors.length > 0) { console.error('  Erreurs API dans réponse erreur:', errorResponseData.errors); }
                 if(errorResponseData?.message) { console.error('  Message API dans réponse erreur:', errorResponseData.message); }
             }
        } else { console.error('  Erreur inattendue (non-Axios):', error); }
        console.warn("[sportDataService] Retour d'un tableau vide pour getAvailableLeagues suite à une erreur.");
        return []; // Retourner un tableau vide en cas d'erreur pour ne pas bloquer l'application
    }
};

/**
 * Récupère les matchs pour une date/ligue/saison spécifiée.
 */
export const getMatchesByDate = async ( date: string, leagueId?: number | null, seasonYear?: number | null ): Promise<MatchData[]> => {
    if (config.useSimulatedData) {
        return simulateGetMatchesByDate(date, leagueId, seasonYear);
    }

    const requestPath = `/api/foot/fixtures`;
    const params: Record<string, any> = { date: date };

    if (leagueId !== null && leagueId !== undefined) { // S'assurer que leagueId est valide
        params.league = leagueId;
        if (seasonYear !== null && seasonYear !== undefined) { // S'assurer que seasonYear est valide
             params.season = seasonYear;
             console.log(`[sportDataService] Appel API Réel : getMatchesByDate pour date: ${date}, league: ${leagueId}, season: ${seasonYear}`);
        } else {
             console.warn(`[sportDataService] leagueId (${leagueId}) fourni pour getMatchesByDate, MAIS seasonYear MANQUANT. L'appel API va probablement échouer (400 Bad Request). Date: ${date}`);
        }
    } else {
        console.log(`[sportDataService] Appel API Réel : getMatchesByDate pour date: ${date} (toutes ligues)`);
    }
    console.log(`  Chemin requête: ${requestPath}, Params: ${JSON.stringify(params)}`);

    try {
      const response = await apiClient.get<FixturesApiResponse>(requestPath, { params });
      console.log(`[sportDataService] Réponse API Réel ${response.status}: /fixtures reçue.`);

      if (response.data?.response && Array.isArray(response.data.response) && response.data.results !== undefined) {
        console.log(`  ${response.data.results} matchs trouvés par l'API.`);
        if (response.data.paging && response.data.paging.current !== undefined && response.data.paging.total !== undefined && response.data.paging.current < response.data.paging.total) {
             console.log(`  Attention pagination: page ${response.data.paging.current} sur ${response.data.paging.total}.`);
        }
        return response.data.response;
      } else {
         console.warn(`[sportDataService] Réponse API /fixtures inattendue ou vide (résultats: ${response.data?.results}).`, response.data);
         if(response.data?.errors && Array.isArray(response.data.errors) && response.data.errors.length > 0) { console.error('  Erreurs API:', response.data.errors); }
         if(response.data?.message) { console.error('  Message API:', response.data.message); }
         console.warn("[sportDataService] Retour d'un tableau vide pour getMatchesByDate suite à une réponse vide/inattendue.");
         return [];
      }
    } catch (error) {
      console.error(`ERREUR CATCHÉE lors de l'appel API Réel getMatchesByDate (date: ${date}, league: ${leagueId}, season: ${seasonYear}):`);
      if (axios.isAxiosError(error)) {
           const axiosError = error as AxiosError;
           console.error('  Message Axios:', axiosError.message);
           if (axiosError.response) {
               console.error('  Statut HTTP:', axiosError.response.status);
               console.error('  Données de réponse:', axiosError.response.data);
               const errorResponseData = axiosError.response.data as ApiResponseBase;
               if(errorResponseData?.errors && Array.isArray(errorResponseData.errors) && errorResponseData.errors.length > 0) { console.error('  Erreurs API dans réponse erreur:', errorResponseData.errors); }
               if(errorResponseData?.message) { console.error('  Message API dans réponse erreur:', errorResponseData.message); }
           } else if (axiosError.request) {
               console.error('  Aucune réponse reçue (la requête a été faite mais pas de réponse).');
           } else {
               console.error('  Erreur lors de la configuration de la requête.');
           }
      } else { console.error('  Erreur inattendue (non-Axios):', error); }
      throw error; // Relancer l'erreur pour la gestion dans le composant MatchList
    }
};

/**
 * Récupère les N derniers matchs d'une équipe spécifique.
 * @param teamId - L'ID de l'équipe.
 * @param lastN - Le nombre de derniers matchs à récupérer.
 * @returns Promesse résolue avec un tableau de MatchData.
 */
export const getTeamLastMatches = async (teamId: number, lastN: number): Promise<MatchData[]> => {
     if (config.useSimulatedData) {
         return simulateGetTeamLastMatches(teamId, lastN);
     }

     const requestPath = `/api/foot/fixtures`;
     // Paramètres pour API-Sports: team={id} et last={n}
     const params = { team: teamId, last: lastN };
     console.log(`[sportDataService] Appel API Réel : getTeamLastMatches pour équipe ${teamId}, ${lastN} derniers matchs. Path: ${requestPath}, Params: ${JSON.stringify(params)}`);

     try {
         const response = await apiClient.get<FixturesApiResponse>(requestPath, { params });
         console.log(`[sportDataService] Réponse API Réel ${response.status}: /fixtures (team/last) reçue.`);

         if (response.data?.response && Array.isArray(response.data.response) && response.data.results !== undefined) {
             console.log(`  ${response.data.results} matchs trouvés par l'API pour équipe ${teamId}.`);
             // Les résultats de cette endpoint sont généralement déjà triés par date décroissante (le plus récent en premier)
             return response.data.response;
         } else {
              console.warn(`[sportDataService] Réponse API pour /fixtures (team/last) inattendue ou vide (résultats: ${response.data?.results}).`, response.data);
              if(response.data?.errors && Array.isArray(response.data.errors) && response.data.errors.length > 0) { console.error('  Erreurs API:', response.data.errors); }
              if(response.data?.message) { console.error('  Message API:', response.data.message); }
              console.warn(`[sportDataService] Retour d'un tableau vide pour getTeamLastMatches suite à une réponse vide/inattendue.`);
              return [];
         }
     } catch (error) {
         console.error(`ERREUR CATCHÉE lors de l'appel API Réel getTeamLastMatches (équipe ${teamId}, ${lastN} derniers matchs):`, error);
         if (axios.isAxiosError(error)) {
              const axiosError = error as AxiosError;
              console.error('  Message Axios:', axiosError.message);
              if (axiosError.response) {
                  console.error('  Statut HTTP:', axiosError.response.status);
                  console.error('  Données de réponse:', axiosError.response.data);
                  const errorResponseData = axiosError.response.data as ApiResponseBase;
                  if(errorResponseData?.errors && Array.isArray(errorResponseData.errors) && errorResponseData.errors.length > 0) { console.error('  Erreurs API dans réponse erreur:', errorResponseData.errors); }
                  if(errorResponseData?.message) { console.error('  Message API dans réponse erreur:', errorResponseData.message); }
              }
         } else { console.error('  Erreur inattendue (non-Axios):', error); }
         // Relancer l'erreur pour la gestion dans MatchItem
         throw error;
     }
};

// Fonctions getCountries (si besoin)
// export const getCountries = async (): Promise<Array<{ name: string; code: string | null; flag: string | null }>> => { ... };