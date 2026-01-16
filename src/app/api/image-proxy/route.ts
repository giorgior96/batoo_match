import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
    const searchParams = request.nextUrl.searchParams;
    const imageUrl = searchParams.get('url');

    if (!imageUrl) {
        return new NextResponse('Missing URL', { status: 400 });
    }

    try {
        // Forza HTTP per il server-side fetch per evitare problemi di certificato SSL
        // storage.digibusiness.it ha un certificato invalido scatenando ERR_CERT_COMMON_NAME_INVALID
        const targetUrl = imageUrl.replace('https://', 'http://');

        console.log(`Proxying image: ${targetUrl}`);

        const response = await fetch(targetUrl, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
            }
        });

        if (!response.ok) {
            // Se fallisce in HTTP, prova HTTPS originale
            const retryResponse = await fetch(imageUrl, {
                headers: { 'User-Agent': 'Mozilla/5.0' }
            });

            if (!retryResponse.ok) {
                return new NextResponse('Failed to fetch image', { status: 502 });
            }

            return await serveResponse(retryResponse);
        }

        return await serveResponse(response);

    } catch (error) {
        console.error('Proxy error:', error);
        return new NextResponse('Internal Proxy Error', { status: 500 });
    }
}

async function serveResponse(response: Response) {
    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const headers = new Headers();
    headers.set('Content-Type', response.headers.get('Content-Type') || 'image/jpeg');
    // Disabilitiamo il cache-control aggressivo per evitare che vengano servite immagini sbagliate
    headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    headers.set('Pragma', 'no-cache');
    headers.set('Expires', '0');

    return new NextResponse(buffer, {
        headers
    });
}
