import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
    const searchParams = request.nextUrl.searchParams;
    const imageUrl = searchParams.get('url');

    if (!imageUrl) {
        return new NextResponse('Missing URL', { status: 400 });
    }

    try {
        // Tenta di scaricare l'immagine originale
        // Usiamo un agente che ignora errori SSL se necessario (in fetch nativa di Node a volte serve config extra, 
        // ma spesso basta fare la richiesta server-side su http o https)

        // Se l'url originale è https ma ha cert invalido, proviamo prima così.
        // Se fallisce, potremmo dover configurare un custom agent, ma Next.js fetch standard è rigida.
        // Trucco: Spesso questi server vecchi rispondono bene in HTTP. Il browser blocca HTTP, ma il server Next.js NO.
        // Quindi se l'url è https, proviamo a forzarlo http se necessario, oppure lo lasciamo così e speriamo che Node accetti il cert.

        // Strategia: Node.js server-side fetch.
        // Importante: Per bypassare SSL error in dev mode si usa process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0'
        // Ma in prod su Vercel/Netlify non possiamo farlo facilmente safe.
        // Proviamo semplicemente a fetchare l'URL.

        const response = await fetch(imageUrl, {
            headers: {
                // Fingiamo di essere un browser per evitare blocchi anti-bot
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
            }
        });

        if (!response.ok) {
            console.error(`Failed to fetch image: ${response.status} ${response.statusText}`);
            return new NextResponse('Failed to fetch image', { status: 502 });
        }

        const arrayBuffer = await response.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        const headers = new Headers();
        headers.set('Content-Type', response.headers.get('Content-Type') || 'image/jpeg');
        headers.set('Cache-Control', 'public, max-age=31536000, immutable');

        return new NextResponse(buffer, {
            headers
        });

    } catch (error) {
        console.error('Proxy error:', error);
        return new NextResponse('Internal Proxy Error', { status: 500 });
    }
}
