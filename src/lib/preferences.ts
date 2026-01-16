export interface UserPreferences {
    // Budget
    minPrice?: number;
    maxPrice?: number;

    // Location preferences
    preferredCountries: string[];

    // Brands
    preferredBrands: string[];
    dislikedBrands: string[];

    // Size
    minLength?: number;
    maxLength?: number;

    // Accommodation
    minCabins?: number;
    minBaths?: number;

    // Boat type filters
    onlyNew?: boolean;
    onlyHighlighted?: boolean;
    includeCharter?: boolean;
    excludeSold?: boolean;

    // Year
    minYear?: number;

    // Media preferences
    preferWithVideo?: boolean;
    prefer360Images?: boolean;
}

export const DEFAULT_PREFERENCES: UserPreferences = {
    preferredCountries: ['Italy', 'France', 'Monaco', 'Croatia'],
    preferredBrands: ['Azimut', 'Riva', 'Sunseeker', 'Ferretti', 'Sanlorenzo'],
    dislikedBrands: [],
    maxPrice: 5000000,
    minLength: 15,
    excludeSold: true,
    includeCharter: false,
    preferWithVideo: true,
    prefer360Images: true
};

// Simple localStorage-based persistence
export function savePreferences(prefs: UserPreferences): void {
    if (typeof window !== 'undefined') {
        localStorage.setItem('batoo_match_preferences', JSON.stringify(prefs));
    }
}

export function loadPreferences(): UserPreferences {
    if (typeof window !== 'undefined') {
        const saved = localStorage.getItem('batoo_match_preferences');
        if (saved) {
            try {
                return { ...DEFAULT_PREFERENCES, ...JSON.parse(saved) };
            } catch {
                return DEFAULT_PREFERENCES;
            }
        }
    }
    return DEFAULT_PREFERENCES;
}
