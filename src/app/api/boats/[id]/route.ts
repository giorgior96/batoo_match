import { NextRequest, NextResponse } from "next/server";

const BASE_URL = "https://batoo.api.digibusiness.it/Navis2WS/v2/boats";
const TOKEN = "4b84405e-5034-42d2-aac3-6a6275c826d1";

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params;
        const apiUrl = `${BASE_URL}/${id}`;

        console.log(`🌐 Proxying Detail Request for: ${id}`);
        console.log(`🔗 Target URL: ${apiUrl}`);

        // Forward request with auth headers
        const res = await fetch(apiUrl, {
            headers: {
                "Authorization": `Bearer ${TOKEN}`,
                "accept": "application/json"
            },
            cache: 'no-store'
        });

        if (!res.ok) {
            console.error(`❌ API Error: ${res.status} ${res.statusText}`);
            return NextResponse.json({ error: "Failed to fetch boat details" }, { status: res.status });
        }

        const data = await res.json();
        return NextResponse.json(data);

    } catch (error) {
        console.error("💥 Proxy Server Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
