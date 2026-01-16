import { Boat, BoatResponse } from './types';

export async function getBoats(page: number = 1, pageSize: number = 50): Promise<Boat[]> {
    try {
        // --- 1. DETERMINE USER STATE & FILTERS ---
        let actualPage = page;
        let filters: Record<string, string> = {};
        let isSmartMode = false;
        let learnedPrefs: any = null;
        let totalSwipes = 0;

        // Try to load analytics
        if (typeof window !== 'undefined') {
            try {
                const { getLearnedPreferences, getAnalytics } = await import('@/lib/analytics');
                const analytics = getAnalytics();
                learnedPrefs = getLearnedPreferences();
                totalSwipes = analytics?.totalSwipes || 0;

                // PHASE 1: EXPLORATION (Initial < 30 swipes)
                // START SMALL: User request to start with boats <= 15m
                if (totalSwipes < 30) {
                    filters.lengthTo = '15';
                    // Optional: remove price constraints to see full range of small boats
                    // or keep a loose cap if needed. For now, just length as requested.
                }
                // PHASE 2: SMART PERSONALIZATION (> 5 Likes)
                else if (learnedPrefs && analytics.likes >= 5) {
                    isSmartMode = true; // Flag to handle "0 results" scenario

                    // Use a "Virtual Page" for smart mode to avoid "Page 10 of nothing"
                    // If we are at page 7 globally, but it's the 1st page of personalized results...
                    // Limitation: Client continues increasing 'page'.
                    // Mitigation: We drastically widen filters if we go deep, OR we rely on Fallback.

                    if (learnedPrefs.averagePrice > 0) {
                        const minP = Math.floor(learnedPrefs.averagePrice * 0.4); // Widen to ±60%
                        const maxP = Math.floor(learnedPrefs.averagePrice * 1.6);
                        filters.priceFrom = minP.toString();
                        filters.priceTo = maxP.toString();
                    }
                    if (learnedPrefs.averageLength > 0) {
                        const minL = (learnedPrefs.averageLength * 0.6).toFixed(1); // Widen to ±40%
                        const maxL = (learnedPrefs.averageLength * 1.4).toFixed(1);
                        filters.lengthFrom = minL;
                        filters.lengthTo = maxL;
                    }
                    if (learnedPrefs.averageYear > 1990) {
                        filters.yearFrom = (learnedPrefs.averageYear - 20).toString(); // Relax year
                    }
                    // NEW: Filter by Preferred Type if dominant
                    if (learnedPrefs.preferredTypes && learnedPrefs.preferredTypes.length > 0) {
                        filters.boatType = learnedPrefs.preferredTypes[0]; // Take top preferred type
                    }
                    console.log('🎯 Smart Filters Active:', filters);
                }
            } catch (e) { console.error('Analytics error:', e); }
        }

        // --- 2. FETCH DATA ---
        let boats = await fetchFromApi(actualPage, pageSize, filters);

        // --- 3. FALLBACK LOGIC (Crucial for "Page 7" problem) ---
        // If Smart Mode yielded 0 boats (likely because page index is too high for the filtered subset),
        // we must fallback to a broader search to keep the feed alive.
        if (boats.length === 0 && isSmartMode) {
            console.warn('⚠️ Smart Mode yielded 0 boats (likely page limit reached). Switching to Fallback Strategy.');

            // Strategy: Remove specific filters, keep only generic "Relevant" sort
            // And potentially map the page to a random one to explore unvisited generic boats
            const fallbackFilters = {
                // Keep minimal filtering if needed, e.g. just price floor?
                // For now, clear mostly everything to guarantee results
                priceFrom: '100000', // Basic noise filter
            };

            // Try fetching again with relaxed filters
            boats = await fetchFromApi(actualPage, pageSize, fallbackFilters);

            if (boats.length === 0) {
                console.warn('⚠️ Even fallback yielded 0 boats. Trying random page.');
                // Last ditch: user exhausted sequential content? Grab a random page.
                const randomPage = Math.floor(Math.random() * 20) + 1;
                boats = await fetchFromApi(randomPage, pageSize, {});
            }
        }

        // --- 4. SCORING & SORTING ---
        const normalizedBoats = normalizeBoats(boats);

        // Calculate scores
        const scoredBoats = normalizedBoats.map(boat => ({
            boat,
            score: calculateScore(boat, learnedPrefs)
        }));

        // Dynamically adjust randomness
        // Increased randomness to make the stream feel more organic
        let randomnessFactor = totalSwipes < 30 ? 1.5 : (totalSwipes < 50 ? 0.8 : 0.2);

        const randomizedScores = scoredBoats.map(sb => ({
            ...sb,
            finalScore: sb.score + (Math.random() * 200 * randomnessFactor)
        }));

        randomizedScores.sort((a, b) => b.finalScore - a.finalScore);

        // Filter min score
        // We relax minScore in Smart Mode fallback to ensure we return *something*
        const minScore = totalSwipes < 30 ? 5 : 20; // Lowered from 50/30 to 20 to be safer
        const goodBoats = randomizedScores.filter(sb => sb.score >= minScore);

        // Return limit
        const limit = totalSwipes < 30 ? 12 : 20;

        // If we filtered too aggressively, return top unscored boats anyway (Safe Fallback)
        const finalBoats = goodBoats.length > 0
            ? goodBoats.slice(0, limit).map(sb => sb.boat)
            : randomizedScores.slice(0, limit).map(sb => sb.boat); // Just return top formatted

        console.log(`✅ Returning ${finalBoats.length} boats (SmartMode: ${isSmartMode})`);

        return finalBoats;

    } catch (error) {
        console.warn(`Failed to fetch boats for page ${page}, using mock.`, error);
        return generateMockBoats(page, pageSize);
    }
}

export async function getBoatDetail(id: string): Promise<Boat | null> {
    try {
        const isClient = typeof window !== 'undefined';
        let apiUrl = '';

        if (isClient) {
            apiUrl = `/api/boats/${id}`;
        } else {
            apiUrl = `https://batoo.api.digibusiness.it/Navis2WS/v2/boats/${id}`;
        }

        const headers: HeadersInit = {};
        if (!isClient) {
            headers['Authorization'] = 'Bearer 4b84405e-5034-42d2-aac3-6a6275c826d1';
            headers['accept'] = 'application/json';
        }

        const res = await fetch(apiUrl, { headers, cache: 'no-store' });
        if (!res.ok) throw new Error(`API error: ${res.status}`);

        const data: Boat = await res.json();
        return data;
    } catch (error) {
        console.error(`Failed to fetch boat detail for ${id}:`, error);
        return null;
    }
}

// Helper to handle the raw fetch and normalization
async function fetchFromApi(page: number, pageSize: number, filters: Record<string, string>): Promise<Boat[]> {
    const isClient = typeof window !== 'undefined';
    let apiUrl = '';

    if (isClient) {
        apiUrl = `/api/boats?page=${page}&pageSize=${pageSize}`;
    } else {
        const start = (page - 1) * pageSize;
        apiUrl = `https://batoo.api.digibusiness.it/Navis2WS/v2/boats?start=${start}&limit=${pageSize}`;
    }

    Object.entries(filters).forEach(([key, value]) => {
        apiUrl += `&${key}=${encodeURIComponent(value)}`;
    });

    if (!apiUrl.includes('orderBy')) apiUrl += '&orderByDesc=true';

    const headers: HeadersInit = {};
    if (!isClient) {
        headers['Authorization'] = 'Bearer 4b84405e-5034-42d2-aac3-6a6275c826d1';
        headers['accept'] = 'application/json';
    }

    const res = await fetch(apiUrl, { headers, cache: 'no-store' });
    if (!res.ok) throw new Error(`API error: ${res.status}`);
    const data: BoatResponse = await res.json();
    return data.Results || [];
}

function normalizeBoats(boats: any[]): Boat[] {
    return boats.map(boat => {
        let imageUrl = boat.ImageUrl;
        if (imageUrl) imageUrl = imageUrl.replace(/\.(\d+)\.jpg$/i, '.512.jpg');
        return {
            ...boat,
            ImagesList: boat.ImagesList || (imageUrl ? [{ ImageUrl: imageUrl }] : []),
            City: boat.City || boat.VisibleAt || boat.Harbor
        };
    });
}

// --- Mock Data & Scoring (Unchanged) ---
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
const MODELS = ['Flybridge', 'Grande', 'Predator', 'Yacht', 'Sportfly', 'Magellano', 'Atlantis', 'Superyacht'];
const LOCATIONS = ['Viareggio, Italy', 'Cannes, France', 'Miami, USA', 'Monaco', 'Split, Croatia', 'Athens, Greece', 'Palma, Spain', 'Dubai, UAE'];

function generateMockBoats(page: number, pageSize: number): Boat[] {
    const boats: Boat[] = [];
    const startId = (page - 1) * pageSize;

    for (let i = 0; i < pageSize; i++) {
        const id = startId + i;
        const rand = (mod: number) => (id * 9301 + 49297) % mod;
        const pick = <T>(arr: T[]): T => arr[rand(arr.length)];

        boats.push({
            BoatID: `mock-${id}`,
            Builder: pick(BRANDS),
            Model: pick(MODELS) + " " + (40 + rand(60)),
            YearBuilt: 2010 + rand(15),
            Length: 10 + rand(30) + (rand(100) / 100),
            Cabins: 3 + rand(3),
            Baths: 2 + rand(3),
            SellPrice: 200000 + (rand(100) * 100000),
            SellPriceCurrency: "EUR",
            SellPriceFormatted: `€ ${(200000 + (rand(100) * 100000)).toLocaleString()}`,
            City: pick(LOCATIONS).split(', ')[0],
            Country: pick(LOCATIONS).split(', ')[1],
            ImagesList: [{ ImageUrl: "https://images.unsplash.com/photo-1569263979104-865ab7cd8d13" }]
        });
    }
    return boats.sort((a, b) => calculateScore(b) - calculateScore(a));
}

function calculateScore(boat: Boat, learnedPrefs?: any): number {
    let score = 0;

    if (USER_PREFERENCES.excludeSold && boat.Sold) return -1000;
    if (!USER_PREFERENCES.includeCharter && boat.Charter && !boat.Sale) return -1000;

    const brandPrefs = learnedPrefs?.preferredBrands || USER_PREFERENCES.preferredBrands;
    if (brandPrefs.includes(boat.Builder)) score += 50 * (learnedPrefs ? 1.2 : 1.0);
    if (USER_PREFERENCES.dislikedBrands.includes(boat.Builder)) score -= 50;

    if (boat.SellPrice > 0) {
        const targetPrice = learnedPrefs?.averagePrice || USER_PREFERENCES.maxPrice;
        if (targetPrice && boat.SellPrice <= targetPrice * 1.5) score += 30;
    }

    if (boat.Length) {
        const targetLength = learnedPrefs?.averageLength || 20;
        if (Math.abs(boat.Length - targetLength) < 5) score += 25;
    }

    if (boat.YearBuilt && boat.YearBuilt >= (learnedPrefs?.averageYear || 2015)) score += 20;

    // SCORING BY TYPE (New)
    if (learnedPrefs?.preferredTypes && boat.BoatType) {
        if (learnedPrefs.preferredTypes.includes(boat.BoatType)) {
            score += 40; // Bonus for matching type (Motor/Sail)
        }
    }

    // SCORING BY FAMILY (New)
    if (learnedPrefs?.preferredFamilies && boat.BoatFamilies) {
        // Check if boat has any of the preferred family IDs
        const boatFams = boat.BoatFamilies.split(',').map((s: string) => s.trim());
        const matches = boatFams.some((fam: string) => learnedPrefs.preferredFamilies.includes(fam));
        if (matches) {
            score += 30; // Bonus for matching family
        }
    }

    if (boat.New) score += 20;
    if (boat.Highlighted) score += 12;

    score += Math.random() * 8;
    return score;
}

export async function contactBroker(boat: Boat, userData?: { name: string, email: string, phone: string }) {
    if (!userData) {
        console.warn('⚠️ Cannot contact broker: No user data provided.');
        return;
    }

    const brokerEmail = boat.AgencyEmail || 'info@batoo.it';
    const apiUrl = 'https://batoo.api.digibusiness.it/Navis2WS/v2/contact';

    console.log(`🚀 Sending REAL contact request for ${boat.BoatID} to ${brokerEmail}...`);

    try {
        const payload = {
            name: userData.name,
            surname: "",
            email: userData.email,
            phone: userData.phone,
            interestedIn: `RICHIESTA MATCH: ${boat.Builder} ${boat.Model}`,
            message: `Salve,\n\nUn utente dell'App Batoo Match ha appena espresso un forte interesse per questa barca caricata su Batoo.it.\n\nDETTAGLI UTENTE:\n- Nome: ${userData.name}\n- Email: ${userData.email}\n- Telefono: ${userData.phone}\n\nDETTAGLI IMBARCAZIONE:\n- Barca: ${boat.Builder} ${boat.Model} (${boat.YearBuilt})\n- Prezzo: ${boat.SellPriceFormatted}\n- Link: https://www.batoo.it/barche/${boat.BoatID}\n\nSi prega di ricontattare l'utente al più presto per fornire maggiori informazioni.\n\nCordiali saluti,\nTeam Batoo Match`,
            brokerEmail: brokerEmail,
            to: brokerEmail
        };

        const res = await fetch(apiUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'accept': 'application/json',
                // Assuming public endpoint or using same token if needed (but contact usually serves public)
                // 'Authorization': 'Bearer ...' 
            },
            body: JSON.stringify(payload)
        });

        if (!res.ok) {
            const errText = await res.text();
            throw new Error(`API Error ${res.status}: ${errText}`);
        }

        console.log('✅ Contact request sent successfully!');
        return true;

    } catch (error) {
        console.error('💥 Failed to send contact request:', error);
        return false;
    }
}
