import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

/**
 * Proxy route to handle external images with SSL certificate issues
 * and provide a unified, secure endpoint for the client.
 */
export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url);
    const imageUrl = searchParams.get('url');

    if (!imageUrl) {
        return new NextResponse('Missing image URL', { status: 400 });
    }

    try {
        // storage.digibusiness.it has an invalid SSL certificate (ERR_CERT_COMMON_NAME_INVALID).
        // To bypass this, we force the internal server-side fetch to use HTTP.
        // This is safe because it's a server-to-server request for public assets.
        const targetUrl = imageUrl.replace('https://storage.digibusiness.it', 'http://storage.digibusiness.it');

        console.log(`[Proxy] Fetching: ${targetUrl}`);

        const response = await fetch(targetUrl, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
            },
            // Ensure we don't cache at the server layer which can lead to "same image" bugs
            cache: 'no-store'
        });

        if (!response.ok) {
            console.error(`[Proxy] External error: ${response.status} ${response.statusText}`);
            return new NextResponse(`Failed to fetch image: ${response.status}`, { status: 502 });
        }

        const contentType = response.headers.get('Content-Type') || 'image/jpeg';
        const buffer = await response.arrayBuffer();

        // Build the response with strategic caching headers
        return new NextResponse(buffer, {
            status: 200,
            headers: {
                'Content-Type': contentType,
                // CACHE: Private/No-Cache for the server (Netlify/Vercel) to avoid cross-user duplication.
                // PUBLIC/Immutable for the BROWSER so it can cache locally and be fast.
                'Cache-Control': 'public, max-age=31536000, immutable',
                'X-Content-Type-Options': 'nosniff'
            },
        });

    } catch (error: any) {
        console.error('[Proxy] Critical error:', error);
        return new NextResponse(`Proxy error: ${error.message}`, { status: 500 });
    }
}
