import { NextRequest, NextResponse } from 'next/server';

const PLACEHOLDER_SVG = `<svg xmlns="http://www.w3.org/2000/svg" width="100" height="60" viewBox="0 0 100 60"><rect width="100" height="60" fill="#1F2937"/><text x="50" y="36" text-anchor="middle" fill="#7C3AED" font-family="Inter,sans-serif" font-size="20" font-weight="bold">TV</text></svg>`;

export async function OPTIONS() {
  return new NextResponse(null, {
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': '*',
    },
  });
}

export async function GET(req: NextRequest) {
  const url = req.nextUrl.searchParams.get('url');
  if (!url || (!url.startsWith('http://') && !url.startsWith('https://'))) {
    return new NextResponse(PLACEHOLDER_SVG, {
      headers: { 'Content-Type': 'image/svg+xml', 'Access-Control-Allow-Origin': '*', 'Cache-Control': 'public, max-age=86400' },
    });
  }

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);

    const res = await fetch(url, {
      signal: controller.signal,
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' },
    });
    clearTimeout(timeout);

    if (!res.ok) {
      return new NextResponse(PLACEHOLDER_SVG, {
        headers: { 'Content-Type': 'image/svg+xml', 'Access-Control-Allow-Origin': '*', 'Cache-Control': 'public, max-age=86400' },
      });
    }

    const contentType = res.headers.get('content-type') || '';
    const isM3U8 = url.endsWith('.m3u8') || contentType.includes('mpegurl') || contentType.includes('x-mpegurl');
    const proxyBase = `${req.nextUrl.origin}/api/proxy?url=`;

    if (isM3U8) {
      const text = await res.text();
      const rewritten = text.split('\n').map(line => {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith('#') || trimmed.startsWith('#')) return line;
        if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
          return proxyBase + encodeURIComponent(trimmed);
        }
        try {
          const absoluteUrl = new URL(trimmed, url).href;
          if (absoluteUrl.startsWith('http://') || absoluteUrl.startsWith('https://')) {
            return proxyBase + encodeURIComponent(absoluteUrl);
          }
        } catch {}
        return line;
      }).join('\n');

      return new NextResponse(rewritten, {
        headers: {
          'Content-Type': 'application/vnd.apple.mpegurl',
          'Access-Control-Allow-Origin': '*',
          'Cache-Control': 'no-cache',
        },
      });
    }

    const buffer = await res.arrayBuffer();
    return new NextResponse(buffer, {
      headers: {
        'Content-Type': contentType || 'application/octet-stream',
        'Access-Control-Allow-Origin': '*',
        'Cache-Control': 'public, max-age=3600',
      },
    });
  } catch {
    return new NextResponse(PLACEHOLDER_SVG, {
      headers: { 'Content-Type': 'image/svg+xml', 'Access-Control-Allow-Origin': '*', 'Cache-Control': 'public, max-age=86400' },
    });
  }
}
