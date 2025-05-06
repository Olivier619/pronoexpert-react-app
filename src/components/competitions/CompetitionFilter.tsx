import React, { useState, useEffect, useMemo } from 'react';
import {
    Box, Typography, CircularProgress,
    TextField, FormControl // Garder FormControl et InputLabel si besoin pour le wrapper, mais TextField a déjà un label
} from '@mui/material';
// Importez createFilterOptions spécifiquement depuis @mui/material/Autocomplete
import Autocomplete, { createFilterOptions } from '@mui/material/Autocomplete';

import { useAppContext } from '../../context/AppContext';
import { LeagueInfo } from '../../api/sportDataService';
import { getRecentLeagueIds, addRecentLeagueId } from '../../utils/localStorage';

// Créer un objet représentant l'option "Toutes les compétitions"
const ALL_LEAGUES_OPTION: LeagueInfo = {
    id: null as any, // Utiliser 'any' ou -1 car l'ID réel est number | null
    name: "Toutes les compétitions",
    logo: "", // Pas de logo pour cette option
    country: { name: "", code: null, flag: null }, // Pays vide ou null
};

// Helper pour trier les ligues (inchangé)
const sortLeaguesByRecent = (leagues: LeagueInfo[], recentIds: number[]): LeagueInfo[] => {
    console.log("[sortLeaguesByRecent] Début tri. recentIds:", recentIds);
    console.log("[sortLeaguesByRecent] Nombre total de ligues à trier:", leagues.length);

    const recentIndexMap = new Map<number, number>();
    recentIds.forEach((id, index) => recentIndexMap.set(id, index));

    const recentLeagues: LeagueInfo[] = [];
    const otherLeagues: LeagueInfo[] = [];

    leagues.forEach(league => {
        // Exclure l'option "Toutes les compétitions" si elle est passée par erreur ici
        if (league.id === (ALL_LEAGUES_OPTION.id as any)) return;

        if (recentIndexMap.has(league.id)) {
            recentLeagues.push(league);
        } else {
            otherLeagues.push(league);
        }
    });

    recentLeagues.sort((a, b) => recentIndexMap.get(a.id)! - recentIndexMap.get(b.id)!);
    otherLeagues.sort((a, b) =>
        (a.country?.name ?? '').localeCompare(b.country?.name ?? '') ||
        a.name.localeCompare(b.name)
    );

    const finalSortedList = [...recentLeagues, ...otherLeagues];
    console.log("[sortLeaguesByRecent] Tri final combiné (sans 'Toutes'):", finalSortedList.map(l => l.name));

    return finalSortedList;
};

// --- Définir la fonction de filtrage personnalisée ---
// Cette fonction sera utilisée par l'Autocomplete pour déterminer si une option correspond à l'input de l'utilisateur.
// Elle recherche dans une chaîne qui combine le nom de la ligue et le nom du pays.
const filterOptions = createFilterOptions({
  // `stringify` est la fonction qui génère la chaîne de texte à rechercher pour chaque option.
  stringify: (option: LeagueInfo) => {
      // Pour l'option "Toutes les compétitions", rechercher uniquement sur son nom.
      if (option.id === (ALL_LEAGUES_OPTION.id as any)) {
          return option.name;
      }
      // Pour les vraies ligues, combiner le nom de la ligue et le nom du pays.
      // Utiliser des chaînes vides si country ou country.name sont null/undefined.
      return `${option.name} ${option.country?.name ?? ''}`;
  },
  matchFrom: 'any', // Permet de trouver une correspondance n'importe où dans la chaîne `stringify` (pas seulement au début).
  // Ajoutez d'autres options de `createFilterOptions` ici si nécessaire, par exemple:
  // limit: 10, // Limiter le nombre d'options affichées
  // ignoreCase: true, // Ignorer la casse (c'est le défaut, mais peut être explicité)
  // trim: true, // Supprimer les espaces blancs au début et à la fin (c'est le défaut)
});
// --- FIN Définition de la fonction de filtrage ---


const CompetitionFilter: React.FC = () => {
    const {
        availableLeagues,
        leaguesLoading,
        leaguesError,
        selectedLeagueId, // L'ID sélectionné vient du contexte
        setSelectedLeagueId // Pour mettre à jour l'ID dans le contexte
    } = useAppContext();

    // État local pour stocker la liste des IDs de ligues récemment vues (inchangé)
    const [recentLeagueIds, setRecentLeagueIds] = useState<number[]>([]);

    // État local pour l'input text de l'Autocomplete (inchangé)
    const [inputValue, setInputValue] = useState('');
    // État local pour l'objet Ligue sélectionné dans l'Autocomplete (inchangé)
    const [selectedLeagueObject, setSelectedLeagueObject] = useState<LeagueInfo | null>(ALL_LEAGUES_OPTION);


    // Charger la liste des IDs récemment vues depuis localStorage au montage (inchangé)
    useEffect(() => {
        console.log("[CompetitionFilter] useEffect: Chargement initial des IDs récents depuis localStorage.");
        const recent = getRecentLeagueIds();
        console.log("[CompetitionFilter] useEffect: IDs récents chargés:", recent);
        setRecentLeagueIds(recent);
    }, []);

    // Synchroniser l'état local selectedLeagueObject avec selectedLeagueId du contexte (inchangé)
    useEffect(() => {
        console.log("[CompetitionFilter] useEffect: Synchronisation avec selectedLeagueId du contexte:", selectedLeagueId);
        if (selectedLeagueId === null) {
            setSelectedLeagueObject(ALL_LEAGUES_OPTION);
            setInputValue(''); // Vider l'input si "Toutes" est sélectionné
        } else {
            const leagueFromContext = availableLeagues.find(l => l.id === selectedLeagueId);
            if (leagueFromContext) {
                 setSelectedLeagueObject(leagueFromContext);
                 // Mettre aussi l'input text à jour avec le nom de la ligue sélectionnée
                 setInputValue(leagueFromContext.name);
            } else {
                 // Si la ligue sélectionnée dans le contexte n'est pas trouvée dans availableLeagues (ex: chargement pas fini)
                 // On peut laisser la sélection précédente ou réinitialiser à "Toutes"
                 // Laisser la sélection précédente est souvent mieux pour éviter un clignotement
            }
        }
    }, [selectedLeagueId, availableLeagues]); // Dépend du contexte ID et des ligues disponibles


    // Utiliser useMemo pour calculer la liste des ligues triées pour l'affichage dans le dropdown. (inchangé)
    const sortedLeagues = useMemo(() => {
         console.log("[CompetitionFilter] useMemo déclenché: Re-calcul du tri des ligues.");
         if (availableLeagues.length === 0) {
             console.log("[CompetitionFilter] useMemo: availableLeagues est vide, retourne liste triée vide.");
             return [];
         }
         // Appliquer le tri par récence et par défaut
         const sorted = sortLeaguesByRecent(availableLeagues, recentLeagueIds);
         console.log(`[CompetitionFilter] useMemo: Tri terminé. ${sorted.length} ligues triées.`);
         return sorted;
    }, [availableLeagues, recentLeagueIds]); // Dépend de availableLeagues et de l'état local recentLeagueIds


    // Liste complète des options pour l'Autocomplete : "Toutes" + ligues triées (inchangé)
    const autocompleteOptions = useMemo(() => {
        // Inclure l'option "Toutes les compétitions" au début
        return [ALL_LEAGUES_OPTION, ...sortedLeagues];
    }, [sortedLeagues]); // Dépend de la liste triée


    // Gérer la sélection d'une option dans l'Autocomplete (inchangé)
    const handleAutocompleteChange = (event: any, newValue: LeagueInfo | null) => {
        console.log("[CompetitionFilter] handleAutocompleteChange: Nouvelle valeur sélectionnée:", newValue);

        // newValue est l'objet LeagueInfo sélectionné (ou null si désélectionné)
        // Si newValue est l'option "Toutes les compétitions", l'ID à utiliser est null
        const newLeagueId = newValue?.id === (ALL_LEAGUES_OPTION.id as any) ? null : newValue?.id ?? null;

        // Mettre à jour la ligue sélectionnée dans le contexte
        // C'est l'ID qui est géré globalement, pas l'objet entier
        setSelectedLeagueId(newLeagueId);

        // Mettre à jour l'état local de l'objet sélectionné (pour que l'Autocomplete affiche la bonne valeur)
        setSelectedLeagueObject(newValue);

        // Mettre à jour localStorage ET l'état local des IDs récents si une ligue spécifique est sélectionnée
        if (newLeagueId !== null) {
             console.log(`[CompetitionFilter] handleAutocompleteChange: Ligue ID ${newLeagueId} sélectionnée. Ajout aux récents.`);
             addRecentLeagueId(newLeagueId); // Ajoute/déplace l'ID en tête dans localStorage
             // Lire à nouveau localStorage pour mettre à jour l'état local.
             const updatedRecentIds = getRecentLeagueIds();
             console.log("[CompetitionFilter] handleAutocompleteChange: localStorage mis à jour et relu:", updatedRecentIds);
             setRecentLeagueIds(updatedRecentIds); // Mettre à jour l'état local (déclenchera useMemo)
        } else {
             console.log("[CompetitionFilter] handleAutocompleteChange: 'Toutes les compétitions' sélectionné.");
             // Optionnel : Vider la liste des récents si "Toutes" est sélectionné
             // clearRecentLeagueIds(); setRecentLeagueIds([]);
             // Mettre à jour l'état local des IDs récents pour forcer le tri (la liste sera vide)
             // setRecentLeagueIds([]); // Si vous implémentez clearRecentLeagueIds pour 'all'
        }
         // Note: L'inputValue est géré automatiquement par l'Autocomplete quand une option est sélectionnée
    };

    // Gérer le changement de l'input text (ce que l'utilisateur tape) (inchangé)
    const handleInputChange = (event: any, newInputValue: string) => {
        console.log("[CompetitionFilter] handleInputChange: Nouvel input text:", newInputValue);
        setInputValue(newInputValue);
         // Important: Lorsque l'utilisateur tape, cela change l'inputValue.
         // Si l'input ne correspond à aucune option et que l'utilisateur quitte le champ,
         // la valeur de l'Autocomplete revient à la dernière sélection (ou null/undefined si freeSolo est false).
         // On ne met PAS à jour selectedLeagueId du contexte ici, seulement lors d'une SELECTION.
    };


    // Rendu conditionnel (chargement, erreur, ou Autocomplete) (inchangé)
    if (leaguesLoading) {
        return (
            <Box sx={{ display: 'flex', alignItems: 'center', minWidth: 200, height: 40, justifyContent: 'center' }}>
                <CircularProgress size={20} sx={{ mr: 1 }} />
                <Typography variant="body2" sx={{ color: 'white' }}>Chargement comp...</Typography>
            </Box>
        );
    }

    if (leaguesError) {
         return (
             <Box sx={{ minWidth: 200, height: 40, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                 <Typography color="error" variant="body2" sx={{ color: 'white' }}>{leaguesError}</Typography>
             </Box>
         );
    }

    // Rendre l'Autocomplete avec la fonction de filtrage
    return (
        // MUI Autocomplete peut être directement stylisé ou enveloppé dans FormControl si vous avez besoin de Label/HelperText standard
         <Autocomplete
             value={selectedLeagueObject} // L'objet actuellement sélectionné (peut être null)
             onChange={handleAutocompleteChange} // Gère la SELECTION d'une option
             inputValue={inputValue} // Le texte actuellement dans l'input
             onInputChange={handleInputChange} // Gère la MODIFICATION du texte dans l'input
             options={autocompleteOptions} // La liste des options disponibles (incluant "Toutes")
             // --- PASSEZ LA FONCTION DE FILTRAGE PERSONNALISÉE ICI ---
             filterOptions={filterOptions}
             // --- FIN DU CHANGEMENT ---
             getOptionLabel={(option) => option.name} // Comment afficher chaque option (le nom de la ligue) - INCHANGÉ
             isOptionEqualToValue={(option, value) => option.id === value?.id} // Comment déterminer si deux options sont "égales" (par leur ID) - INCHANGÉ
             sx={{ m: 1, minWidth: 200, '& .MuiOutlinedInput-root': { backgroundColor: 'rgba(255,255,255,0.15)', '& fieldset': { borderColor: 'rgba(255, 255, 255, 0.3)' }, '&:hover fieldset': { borderColor: 'rgba(255, 255, 255, 0.5)' }, '&.Mui-focused fieldset': { borderColor: 'white' }, '& input': { color: 'white' }, '& .MuiSvgIcon-root': { color: 'white' } } }} // Styles MUI - INCHANGÉ
             size="small"
             renderInput={(params) => ( // Comment afficher l'input text de l'Autocomplete - INCHANGÉ
                 <TextField
                     {...params}
                     label="Compétition" // Label pour l'input
                     InputLabelProps={{ sx: { color: 'white' } }} // Style du label
                     // Pas besoin d'InputProps ou d'icône ici, Autocomplete les gère
                 />
             )}
             // Optionnel: Ajouter une icône de loupe si vous voulez (peut nécessiter customization)
             // Optionnel: Ajouter une option renderOption pour afficher le logo/pays dans la liste déroulante - INCHANGÉ
             renderOption={(props, option) => (
                 <Box component="li" sx={{ '& > img': { mr: 2, flexShrink: 0 } }} {...props}>
                     {option.logo && option.logo !== "" && option.id !== (ALL_LEAGUES_OPTION.id as any) ? (
                         <img loading="lazy" width="20" src={option.logo} alt={option.name} />
                     ) : null}
                     {/* Afficher le nom de la ligue et le nom du pays (si présent et pas l'option "Toutes") */}
                     {option.name} {option.country?.name && option.country.name !== "" && option.id !== (ALL_LEAGUES_OPTION.id as any) ? ` (${option.country.name})` : ''}
                 </Box>
             )}
        />
    );
};

export default CompetitionFilter;
