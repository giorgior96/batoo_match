import { Boat, BoatResponse } from './types';

export async function getBoats(page: number = 1, pageSize: number = 50): Promise<Boat[]> {
    try {
        // NOTE: API filters are TOO restrictive and return 0 results
        // Better to download all boats and sort client-side with our scoring algorithm

        /* DISABLED - Too restrictive
        let filters: Record<string, string> = {};

        if (typeof window !== 'undefined') {
            try {
                const { getLearnedPreferences, getAnalytics } = await import('@/lib/analytics');
                const learnedPrefs = getLearnedPreferences();
                const analytics = getAnalytics();

                if (analytics.likes >= 3 && learnedPrefs) {
                    console.log('🎯 Applying learned filters:', learnedPrefs);
                    // ... filter logic
                }
            } catch (e) {
                // Analytics not available yet
            }
        }
        */

        // Build URL without filters - just pagination
        let apiUrl = typeof window !== 'undefined'
            ? `/api/boats?page=${page}&pageSize=${pageSize}`
            : `https://batoo.api.digibusiness.it/Navis2WS/v2/boats?start=${(page - 1) * pageSize}&limit=${pageSize}`;

        // Don't append filters - causes 0 results
        // Object.entries(filters).forEach(([key, value]) => {
        //     apiUrl += `&${key}=${encodeURIComponent(value)}`;
        // });

        const headers: HeadersInit = {};

        // Server-side: add auth header
        if (typeof window === 'undefined') {
            headers['Authorization'] = 'Bearer 4b84405e-5034-42d2-aac3-6a6275c826d1';
            headers['accept'] = 'application/json';
        }

        const res = await fetch(apiUrl, {
            headers,
            cache: 'no-store'
        });

        if (!res.ok) {
            throw new Error(`API error: ${res.status}`);
        }


        const data: BoatResponse = await res.json();
        const boats = data.Results || [];

        // Normalize boat data: ensure ImagesList exists and use .512.jpg format
        const normalizedBoats = boats.map(boat => {
            let imageUrl = boat.ImageUrl;

            // Simply replace .128.jpg with .512.jpg (or any other size with 512)
            if (imageUrl) {
                imageUrl = imageUrl.replace(/\.(\d+)\.jpg$/i, '.512.jpg');
            }

            return {
                ...boat,
                ImagesList: boat.ImagesList || (imageUrl ? [{ ImageUrl: imageUrl }] : []),
                City: boat.City || boat.VisibleAt || boat.Harbor
            };
        });

        // Get learned preferences from analytics (client-side only)
        let learnedPrefs = null;
        if (typeof window !== 'undefined') {
            try {
                const { getLearnedPreferences } = await import('@/lib/analytics');
                learnedPrefs = getLearnedPreferences();
            } catch (e) {
                // Analytics not available
            }
        }

        // Apply smart sorting based on user preferences and learning
        return normalizedBoats.sort((a, b) => {
            const scoreA = calculateScore(a, learnedPrefs);
            const scoreB = calculateScore(b, learnedPrefs);
            return scoreB - scoreA;
        });
    } catch (error) {
        console.warn(`Failed to fetch boats for page ${page}, using smart mock data engine.`, error);
        return generateMockBoats(page, pageSize);
    }
}

// --- Mock Data Engine & Matching Algorithm ---

// Simulation of User Preferences (The "Algorithm" Base)
const USER_PREFERENCES = {
    preferredBrands: ['Azimut', 'Riva', 'Sunseeker', 'Ferretti'],
    dislikedBrands: [] as string[],
    maxPrice: 5000000,
    preferredCountries: ['Italy', 'Monaco', 'France'],
    minLength: 15,
    excludeSold: true,
    includeCharter: false,
    preferWithVideo: true,
    prefer360Images: true,
    onlyNew: undefined as boolean | undefined,
    minPrice: undefined as number | undefined,
    maxLength: undefined as number | undefined,
    minCabins: undefined as number | undefined,
    minBaths: undefined as number | undefined,
    minYear: undefined as number | undefined,
    onlyHighlighted: undefined as boolean | undefined
};

const BRANDS = ['Azimut', 'Sunseeker', 'Ferretti', 'Riva', 'Princess', 'Sanlorenzo', 'Benetti', 'Pershing', 'Bavaria', 'Jeanneau'];
const LOCATIONS = ['Viareggio, Italy', 'Cannes, France', 'Miami, USA', 'Monaco', 'Split, Croatia', 'Athens, Greece', 'Palma, Spain', 'Dubai, UAE'];
const MODELS = ['Flybridge', 'Grande', 'Predator', 'Yacht', 'Sportfly', 'Magellano', 'Atlantis', 'Superyacht'];

function generateMockBoats(page: number, pageSize: number): Boat[] {
    const boats: Boat[] = [];
    const startId = (page - 1) * pageSize;

    for (let i = 0; i < pageSize; i++) {
        const id = startId + i;
        // Deterministic random helpers based on id
        const rand = (mod: number) => (id * 9301 + 49297) % mod;
        const pick = <T>(arr: T[]): T => arr[rand(arr.length)];

        const builder = pick(BRANDS);
        const model = pick(MODELS) + " " + (40 + rand(60)); // e.g. "Flybridge 55"
        const year = 2010 + rand(15); // 2010-2024
        const length = 10 + rand(30) + (rand(100) / 100);
        const price = 200000 + (rand(100) * 100000);
        const locationStr = pick(LOCATIONS); // "City, Country"
        const [city, country] = locationStr.split(', ');

        // Image rotation
        const images = [
            "https://images.unsplash.com/photo-1569263979104-865ab7cd8d13?q=80&w=2000&auto=format&fit=crop",
            "https://images.unsplash.com/photo-1567899378494-47b22a2ae96a?q=80&w=2000&auto=format&fit=crop",
            "https://images.unsplash.com/photo-1605281317010-fe5ffe798166?q=80&w=2000&auto=format&fit=crop",
            "https://images.unsplash.com/photo-1544551763-46a8723ba3f9?q=80&w=2000&auto=format&fit=crop",
            "https://images.unsplash.com/photo-1621275471769-e6aa344546d5?q=80&w=2000&auto=format&fit=crop"
        ];

        boats.push({
            BoatID: `mock-${id}`,
            Builder: builder,
            Model: model,
            YearBuilt: year,
            Length: length,
            Cabins: 3 + rand(3),
            Baths: 2 + rand(3),
            SellPrice: price,
            SellPriceCurrency: "EUR",
            SellPriceFormatted: `€ ${price.toLocaleString()}`,
            City: city,
            Country: country || "International",
            ImagesList: [{ ImageUrl: images[id % images.length] }]
        });
    }

    // --- The Matching Algorithm ---
    // Sort boats by how well they match USER_PREFERENCES
    return boats.sort((a, b) => calculateScore(b) - calculateScore(a));
}

function calculateScore(boat: Boat, learnedPrefs?: any): number {
    let score = 0;

    // 0. Apply hard filters first (if boat fails, return -1000 to put at bottom)
    if (USER_PREFERENCES.excludeSold && boat.Sold) {
        return -1000;
    }

    if (!USER_PREFERENCES.includeCharter && boat.Charter && !boat.Sale) {
        return -1000;
    }

    // Adaptive weights based on learning confidence
    const learningConfidence = learnedPrefs ? 0.7 : 0.3; // Higher if we have learned data
    const staticWeight = 1 - learningConfidence;

    // 1. Brand Affinity (50 pts max - highest weight)
    const brandPrefs = learnedPrefs?.preferredBrands || USER_PREFERENCES.preferredBrands;
    const brandIndex = brandPrefs.indexOf(boat.Builder);

    if (brandIndex >= 0) {
        // Give more points to top brands (first = 50, second = 40, third = 30)
        score += (50 - (brandIndex * 10)) * (learnedPrefs ? 1.2 : 1.0);
    }

    // Penalize disliked brands heavily
    if (USER_PREFERENCES.dislikedBrands.includes(boat.Builder)) {
        score -= 50;
    }

    // 2. Price Intelligence (40 pts max)
    if (USER_PREFERENCES.maxPrice && boat.SellPrice > 0) {
        const avgPrice = learnedPrefs?.averagePrice || (USER_PREFERENCES.maxPrice * 0.6);

        if (boat.SellPrice <= USER_PREFERENCES.maxPrice) {
            // Gaussian curve - boats close to average price get highest score
            const priceDiff = Math.abs(boat.SellPrice - avgPrice);
            const sigma = USER_PREFERENCES.maxPrice * 0.3; // Standard deviation
            score += 40 * Math.exp(-(priceDiff * priceDiff) / (2 * sigma * sigma));
        } else {
            // Over budget - heavy penalty
            score -= 30;
        }
    }

    if (USER_PREFERENCES.minPrice && boat.SellPrice < USER_PREFERENCES.minPrice) {
        score -= 25;
    }

    // 3. Location Intelligence (30 pts max)
    const countryPrefs = learnedPrefs?.preferredCountries || USER_PREFERENCES.preferredCountries;
    const countryMatch = countryPrefs.find((loc: string) =>
        boat.Country?.toLowerCase().includes(loc.toLowerCase()) ||
        boat.CountryISOCode?.toLowerCase().includes(loc.toLowerCase())
    );

    if (countryMatch) {
        const countryIndex = countryPrefs.indexOf(countryMatch);
        score += (30 - (countryIndex * 5)); // Top country = 30, second = 25, etc.
    }

    // 4. Size Matching (25 pts max)
    if (boat.Length) {
        const targetLength = learnedPrefs?.averageLength || USER_PREFERENCES.minLength || 20;

        if (USER_PREFERENCES.minLength && boat.Length >= USER_PREFERENCES.minLength) {
            // Reward boats close to learned preference with exponential decay
            const lengthDiff = Math.abs(boat.Length - targetLength);
            score += 25 * Math.exp(-lengthDiff / 8);
        }

        if (USER_PREFERENCES.maxLength && boat.Length > USER_PREFERENCES.maxLength) {
            score -= 20;
        }
    }

    // 5. Year Intelligence (20 pts)
    if (boat.YearBuilt) {
        const targetYear = learnedPrefs?.averageYear || 2020;
        const currentYear = new Date().getFullYear();

        // Prefer newer boats
        if (boat.YearBuilt >= targetYear) {
            const yearBonus = Math.min(20, (boat.YearBuilt - targetYear + 1) * 2);
            score += yearBonus;
        }

        // Penalize very old boats
        const age = currentYear - boat.YearBuilt;
        if (age > 15) {
            score -= (age - 15) * 0.5;
        }

        if (USER_PREFERENCES.minYear && boat.YearBuilt < USER_PREFERENCES.minYear) {
            score -= 15;
        }
    }

    // 6. Accommodation (15 pts)
    if (USER_PREFERENCES.minCabins && (boat.Cabins || 0) >= USER_PREFERENCES.minCabins) {
        score += 8;
    }

    if (USER_PREFERENCES.minBaths && (boat.Baths || 0) >= USER_PREFERENCES.minBaths) {
        score += 7;
    }

    // 7. Premium Features & Quality Signals (25 pts max)
    if (USER_PREFERENCES.onlyNew && boat.New) {
        score += 25; // Strong boost for new boats
    }

    if (boat.Highlighted) {
        score += 12; // Broker highlighted = quality signal
    }

    if (boat.ImagesHQ) {
        score += 5; // HQ images = serious seller
    }

    if (USER_PREFERENCES.preferWithVideo && boat.Video) {
        score += 8;
    }

    if (USER_PREFERENCES.prefer360Images && boat.Images360) {
        score += 6;
    }

    if (boat.SellPriceReduced) {
        score += 15; // Price reduced = potential good deal
    }

    if (boat.Stock) {
        score += 5; // In stock = available now
    }

    // 8. Advanced Boat Characteristics (using extended API data)

    // Engine power & condition
    if (boat.EnginesList && boat.EnginesList.length > 0) {
        const totalHP = boat.EnginesList.reduce((sum, eng) => sum + (eng.HP || 0) * (eng.Qty || 1), 0);

        if (totalHP > 0 && boat.Length) {
            const powerRatio = totalHP / boat.Length;
            if (powerRatio > 20) score += 8; // High performance
            else if (powerRatio > 10) score += 4;
        }

        // Low engine hours = excellent condition
        boat.EnginesList.forEach(eng => {
            if (eng.Hours !== undefined) {
                if (eng.Hours < 500) score += 10;
                else if (eng.Hours < 1000) score += 5;
            }
            if (eng.YearBuilt && eng.YearBuilt >= 2018) score += 3;
        });
    }

    // Range & fuel capacity for cruising
    if (boat.Range && boat.Range > 300) score += 8;
    if (boat.Fuel && boat.Fuel > 500) score += 4;
    if (boat.Water && boat.Water > 300) score += 2;

    // Speed
    if (boat.SpeedMax && boat.SpeedMax > 30) score += 5;

    // Beam (width) - comfort factor
    if (boat.Beam && boat.Length) {
        const beamRatio = boat.Beam / boat.Length;
        if (beamRatio > 0.23) score += 4; // Wide = comfortable
    }

    // Shallow draft = more marinas accessible
    if (boat.Draft && boat.Draft < 2.5) score += 4;

    // Quality signals
    if (boat.ProfUse) score += 5; // Commercial grade
    if (boat.Generator) score += 3;
    if (boat.MaxPeople && boat.MaxPeople >= 8) score += 3;

    // Hull material
    if (boat.HullMaterial) {
        const material = boat.HullMaterial.toLowerCase();
        if (material.includes('carbon')) score += 10;
        else if (material.includes('fiberglass')) score += 2;
    }

    // Special types
    if (boat.Vintage) score += 6;
    if (boat.Watercraft) score += 2;

    // 9. Diversity Bonus - avoid showing only same brands/types
    // Add small random component to prevent echo chamber
    const diversityBonus = Math.random() * 8;
    score += diversityBonus;

    // 9. Freshness boost - newer listings get small boost
    if (boat.InsDate) {
        const insertDate = new Date(boat.InsDate);
        const daysSinceInsert = (Date.now() - insertDate.getTime()) / (1000 * 60 * 60 * 24);

        if (daysSinceInsert < 7) {
            score += 10; // New listing bonus
        } else if (daysSinceInsert < 30) {
            score += 5; // Recent listing bonus
        }
    }

    return score;
}


export async function contactBroker(boat: Boat) {
    // Mock function to simulate sending contact details
    console.log(`Contacting broker for boat ${boat.BoatID} - ${boat.Builder} ${boat.Model}`);
    // In a real app, this would be a POST request to an endpoint
    return new Promise((resolve) => setTimeout(resolve, 1000));
}
