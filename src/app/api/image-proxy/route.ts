import { NextRequest, NextResponse } from 'next/server';

// Rimuoviamo force-dynamic per permettere il caching a livello di Edge
export const revalidate = 3600; // Cache a livello server per 1 ora

export async function GET(request: NextRequest) {
    const searchParams = request.nextUrl.searchParams;
    const imageUrl = searchParams.get('url');

    if (!imageUrl) {
        return new NextResponse('Missing URL', { status: 400 });
    }

    try {
        // Proviamo direttamente l'URL originale ma via HTTP se possibile per saltare i problemi SSL
        // Molti server storage supportano entrambi. Il proxy può fare HTTP anche se il sito è HTTPS.
        const targetUrl = imageUrl.startsWith('https://storage.digibusiness.it')
            ? imageUrl.replace('https://', 'http://')
            : imageUrl;

        const response = await fetch(targetUrl, {
            headers: {
                'User-Agent': 'Mozilla/5.0'
            },
            // Prestazioni: no-cache rimosso per permettere a Node/Edge di usare la sua cache
        });

        if (!response.ok) {
            return new NextResponse('Failed to fetch image', { status: 502 });
        }

        const arrayBuffer = await response.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        const headers = new Headers();
        headers.set('Content-Type', response.headers.get('Content-Type') || 'image/jpeg');
        // CACHE AGGRESSIVA: Le immagini delle barche non cambiano quasi mai.
        // Questo renderà il caricamento istantaneo dopo la prima volta.
        headers.set('Cache-Control', 'public, max-age=31536000, immutable');

        return new NextResponse(buffer, {
            headers
        });

    } catch (error) {
        console.error('Proxy error:', error);
        return new NextResponse('Internal Proxy Error', { status: 500 });
    }
}
