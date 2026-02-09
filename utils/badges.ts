import { BADGE_DEFINITIONS } from '@/constants/Badges';

export interface UserBadgeState {
    definitionId: string;
    category: string;

    // Tier Info
    currentTier: number; // 0 if none
    nextTier: number | null; // null if maxed

    // Next Tier Info (for visualization)
    nextTierName?: string;
    nextTierIcon?: string;
    nextTierColor?: string;

    // Display Info
    name: string;
    description: string;
    icon: string;
    color: string;

    // Progress
    progress: number;
    target: number;
    earned: boolean;
}

export interface UserStats {
    gamesPlayed: number;
    gamesOrganized: number;
    rating: number;
    ratingCount: number;
    accountAgeInMonths: number;
    profileCompletion: number; // 0-100
}

export const calculateUserBadges = (stats: UserStats): UserBadgeState[] => {
    const badges: UserBadgeState[] = [];

    BADGE_DEFINITIONS.forEach(def => {
        let userProgress = 0;

        // Map definition ID to stat value
        switch (def.id) {
            case 'games_played':
                userProgress = stats.gamesPlayed;
                break;
            case 'games_organized':
                userProgress = stats.gamesOrganized;
                break;
            case 'rating':
                // Only count rating if they have enough ratings to matter (e.g. 5)
                userProgress = stats.ratingCount >= 5 ? stats.rating : 0;
                break;
            case 'popularity':
                userProgress = stats.ratingCount;
                break;
            case 'loyalty':
                userProgress = stats.accountAgeInMonths;
                break;
            case 'profile_completion':
                userProgress = stats.profileCompletion;
                break;
            // TODO: attendance, streak logic requires more complex inputs
            default:
                userProgress = 0;
        }

        // Find current tier
        // Tiers are sorted by level 1..N.
        // Current tier is the highest tier passed.
        let currentTierDef = null;
        let nextTierDef = null;

        for (const tier of def.tiers) {
            if (userProgress >= tier.target) {
                currentTierDef = tier;
            } else {
                nextTierDef = tier;
                break; // Found the next target
            }
        }

        // If we haven't even hit tier 1, show tier 1 as the goal
        if (!currentTierDef && !nextTierDef) {
            // Should not happen if tiers exist, but safe fallback
            return;
        }

        // What to display?
        // If we have a next tier, show progress towards it.
        // If we are maxed out, show the top tier.
        const displayTier = nextTierDef || currentTierDef;

        if (displayTier) {
            badges.push({
                definitionId: def.id,
                category: def.category,
                currentTier: currentTierDef ? currentTierDef.level : 0,
                nextTier: nextTierDef ? nextTierDef.level : null,

                nextTierName: nextTierDef?.name,
                nextTierIcon: nextTierDef?.icon,
                nextTierColor: nextTierDef?.color,

                // Display Info - Prioritize current tier, else next tier (locked view)
                name: currentTierDef ? currentTierDef.name : nextTierDef!.name,
                description: currentTierDef ? currentTierDef.description : nextTierDef!.description,
                icon: currentTierDef ? currentTierDef.icon : nextTierDef!.icon,
                color: currentTierDef ? currentTierDef.color : '#bdbdbd',

                progress: userProgress,
                target: nextTierDef ? nextTierDef.target : (currentTierDef ? currentTierDef.target : 1), // If maxed, target = progress
                earned: !!currentTierDef
            });
        }
    });

    return badges;
};
