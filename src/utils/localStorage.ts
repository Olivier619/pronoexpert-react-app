// src/utils/localStorage.ts

const RECENT_LEAGUES_STORAGE_KEY = 'recentLeagueIds';
const MAX_RECENT_LEAGUES = 10; // Limite le nombre d'éléments récemment vus

/**
 * Lit la liste des IDs de ligues récemment vus depuis localStorage.
 * @returns Tableau d'IDs de ligues.
 */
export const getRecentLeagueIds = (): number[] => {
    try {
        const item = localStorage.getItem(RECENT_LEAGUES_STORAGE_KEY);
        if (item) {
            const ids = JSON.parse(item);
            // S'assurer que c'est bien un tableau de nombres
            if (Array.isArray(ids) && ids.every(id => typeof id === 'number' || id === null)) {
                 // Filtrer les nulls si vous utilisez null pour "Toutes"
                 return ids.filter(id => id !== null) as number[];
            }
            console.warn("localStorage contained invalid data for recent leagues.");
            return [];
        }
    } catch (error) {
        console.error("Error reading recent leagues from localStorage:", error);
    }
    return [];
};

/**
 * Ajoute un ID de ligue à la liste des éléments récemment vus dans localStorage.
 * Gère l'unicité et la taille maximale. L'élément le plus récent est en tête.
 * @param leagueId - L'ID de la ligue à ajouter.
 */
export const addRecentLeagueId = (leagueId: number | null): void => {
    // Ne rien faire si l'ID est null ou non valide (sauf si vous voulez stocker un ID spécial pour "Toutes")
    if (leagueId === null || typeof leagueId !== 'number') {
        // Si vous avez un ID spécial pour "Toutes", gérez-le ici
        return;
    }

    try {
        const recentIds = getRecentLeagueIds();
        // Supprimer l'ID s'il est déjà présent pour le déplacer en tête
        const filteredIds = recentIds.filter(id => id !== leagueId);
        // Ajouter le nouvel ID en tête
        const newRecentIds = [leagueId, ...filteredIds];
        // Tronquer la liste si elle dépasse la taille maximale
        const finalRecentIds = newRecentIds.slice(0, MAX_RECENT_LEAGUES);
        // Sauvegarder dans localStorage
        localStorage.setItem(RECENT_LEAGUES_STORAGE_KEY, JSON.stringify(finalRecentIds));
    } catch (error) {
         console.error("Error writing recent league to localStorage:", error);
    }
};

/**
 * Supprime tous les IDs de ligues récemment vus de localStorage.
 */
export const clearRecentLeagueIds = (): void => {
     try {
         localStorage.removeItem(RECENT_LEAGUES_STORAGE_KEY);
     } catch (error) {
         console.error("Error clearing recent leagues from localStorage:", error);
     }
};