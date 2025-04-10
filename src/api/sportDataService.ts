import axios from 'axios';

// Récupérer les variables d'environnement
const API_BASE_URL = process.env.REACT_APP_API_BASE_URL;
const API_KEY = process.env.REACT_APP_API_KEY;

// Vérifier si l'URL de base est définie
if (!API_BASE_URL) {
  console.error("Erreur : La variable d'environnement REACT_APP_API_BASE_URL n'est pas définie.");
  // Vous pourriez lancer une erreur ici ou gérer ce cas autrement
  // throw new Error("Configuration API manquante : URL de base non définie.");
}

// Créer une instance Axios préconfigurée
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
    // Ajoutez ici l'en-tête d'authentification requis par VOTRE API
    // Exemple 1: Clé API dans un en-tête personnalisé
     'x-rapidapi-key': API_KEY, // Adaptez 'x-rapidapi-key' au nom requis par votre API
    // Exemple 2: Clé API en tant que Bearer Token
    // 'Authorization': `Bearer ${API_KEY}`,
    // Exemple 3: Si la clé doit être passée en paramètre d'URL (moins sécurisé),
    // ne la mettez pas ici mais ajoutez-la dans les fonctions getMatches etc.
  },
  timeout: 10000, // 10 secondes timeout
});

// --- Interfaces pour typer les données de l'API ---
// !! ADAPTEZ CES INTERFACES À LA STRUCTURE RÉELLE DE VOTRE API !!
export interface Team {
  id: number | string; // L'ID peut être un nombre ou une chaîne
  name: string;
  logo?: string; // Logo optionnel
}

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
