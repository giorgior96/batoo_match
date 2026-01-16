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
        const targetUrl = imageUrl.startsWith('https://storage.digibusiness.it')
            ? imageUrl.replace('https://', 'http://')
            : imageUrl;

        // Fetch con cache di Next.js disabilitata forzatamente per il download verso il server proxy
        // Ma passeremo gli header di cache al BROWSER dell'utente final.
        const response = await fetch(targetUrl, {
            headers: { 'User-Agent': 'Mozilla/5.0' }
        });

        if (!response.ok) {
            return new NextResponse('Failed to fetch image', { status: 502 });
        }

        const arrayBuffer = await response.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        const headers = new Headers();
        headers.set('Content-Type', response.headers.get('Content-Type') || 'image/jpeg');
        // CACHE PER IL BROWSER: Importante impostare public e max-age.
        // Questo permetterà al browser di non richiedere più l'immagine per lo stesso URL.
        headers.set('Cache-Control', 'public, max-age=31536000, immutable');
        headers.set('Vary', 'Accept-Encoding'); // Aiuta i CDN a differenziare le richieste

        return new NextResponse(buffer, {
            headers
        });

    } catch (error) {
        console.error('Proxy error:', error);
        return new NextResponse('Internal Proxy Error', { status: 500 });
    }
}
