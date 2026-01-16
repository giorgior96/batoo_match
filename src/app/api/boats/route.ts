import { NextRequest, NextResponse } from 'next/server';

const API_URL = 'https://batoo.api.digibusiness.it/Navis2WS/v2/boats';
const TOKEN = '4b84405e-5034-42d2-aac3-6a6275c826d1';

export async function GET(request: NextRequest) {
    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get('page') || '1');
    const pageSize = parseInt(searchParams.get('pageSize') || '50');

    // Navisnet API uses 'start' (offset) and 'limit'
    // We calculate them here, but we DON'T add them to 'filters' to avoid duplication if they passed them differently
    const start = (page - 1) * pageSize;
    const limit = pageSize;

    // --- SMART PROXYING ---
    // Instead of hardcoding keys, we forward ALL search parameters except our internal pagination control
    // This allows flexible usage of Navisnet API (priceFrom, lengthFrom, etc.) without changing this file
    const params = new URLSearchParams();

    // 1. Add Pagination (converted to Navisnet format)
    params.set('start', start.toString());
    params.set('limit', limit.toString());

    // 2. Forward all other parameters
    searchParams.forEach((value, key) => {
        // Skip page/pageSize as we already handled them
        if (key !== 'page' && key !== 'pageSize') {
            params.set(key, value);
        }
    });

    console.log(`🔵 API Route: page=${page} → start=${start}, limit=${limit}`);
    console.log(`  » Forwarding params:`, params.toString());

    try {
        const apiUrl = `${API_URL}?${params.toString()}`;

        const res = await fetch(apiUrl, {
            headers: {
                'Authorization': `Bearer ${TOKEN}`,
                'accept': 'application/json'
            },
            cache: 'no-store'
        });

        if (!res.ok) {
            console.error(`❌ API error: ${res.status}`);
            return NextResponse.json({ error: 'API error', status: res.status }, { status: res.status });
        }

        const data = await res.json();
        const count = data.Results?.length || 0;
        console.log(`✅ API Route: Success! Received ${count} boats.`);

        return NextResponse.json(data);
    } catch (error) {
        console.error('💥 Failed to fetch boats:', error);
        return NextResponse.json({ error: 'Failed to fetch boats' }, { status: 500 });
    }
}
