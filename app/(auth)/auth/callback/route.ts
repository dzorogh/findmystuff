import { NextResponse } from 'next/server'
// The client you created from the Server-Side Auth instructions
import { createClient } from "@/lib/shared/supabase/server"

function getForwardedUrl(next: string, forwardedHost: string | null, forwardedProto: string | null) {
  if (!forwardedHost) return null;
  const protocol = forwardedProto || 'https';
  return `${protocol}://${forwardedHost}${next}`;
}

function getHostUrl(next: string, host: string | null, forwardedProto: string | null) {
  if (!host || host.includes('localhost') || host.includes('127.0.0.1')) return null;
  const protocol = forwardedProto || (host.includes('devtunnels.ms') ? 'https' : 'http');
  return `${protocol}://${host}${next}`;
}

function getRefererUrl(next: string, referer: string | null) {
  if (!referer) return null;
  try {
    const refererUrl = new URL(referer);
    if (!refererUrl.origin.includes('localhost')) {
      return `${refererUrl.origin}${next}`;
    }
  } catch {
    // fallback
  }
  return null;
}

function getOriginUrl(next: string, origin: string | null) {
  if (!origin || origin.includes('localhost') || origin.includes('127.0.0.1')) return null;
  return `${origin}${next}`;
}

function getBaseAppUrl(next: string) {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL;
  if (!baseUrl || baseUrl.includes('localhost')) return null;
  return baseUrl.startsWith('http') ? `${baseUrl}${next}` : `https://${baseUrl}${next}`;
}

function logRedirect(source: string, url: string) {
  if (process.env.NODE_ENV === "development") {
    console.log(`✅ Using ${source}:`, url);
  }
}

function resolveRedirectUrl(
  next: string,
  origin: string,
  forwardedHost: string | null,
  forwardedProto: string | null,
  host: string | null,
  referer: string | null
): string {
  const forwarded = getForwardedUrl(next, forwardedHost, forwardedProto);
  if (forwarded) {
    logRedirect('x-forwarded-host', forwarded);
    return forwarded;
  }

  const hostUrl = getHostUrl(next, host, forwardedProto);
  if (hostUrl) {
    logRedirect('host header', hostUrl);
    return hostUrl;
  }

  const refererUrl = getRefererUrl(next, referer);
  if (refererUrl) {
    logRedirect('referer', refererUrl);
    return refererUrl;
  }

  const originUrl = getOriginUrl(next, origin);
  if (originUrl) {
    logRedirect('origin', originUrl);
    return originUrl;
  }

  const baseUrl = getBaseAppUrl(next);
  if (baseUrl) {
    logRedirect('NEXT_PUBLIC_APP_URL', baseUrl);
    return baseUrl;
  }

  const fallback = `${origin}${next}`;
  if (process.env.NODE_ENV === "development") console.log('⚠️ Fallback to origin:', fallback);
  return fallback;
}

function resolveErrorRedirectUrl(
  origin: string,
  forwardedHost: string | null,
  forwardedProto: string | null,
  host: string | null
): string {
  if (forwardedHost) {
    return `${forwardedProto || 'https'}://${forwardedHost}/auth/auth-code-error`
  }
  if (host && !host.includes('localhost')) {
    return `https://${host}/auth/auth-code-error`
  }
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL
  if (baseUrl && !baseUrl.includes('localhost')) {
    return baseUrl.startsWith('http') ? `${baseUrl}/auth/auth-code-error` : `https://${baseUrl}/auth/auth-code-error`
  }
  return `${origin}/auth/auth-code-error`
}

export async function GET(request: Request) {
  const requestUrl = new URL(request.url)
  const { searchParams, origin } = requestUrl
  const code = searchParams.get('code')

  let next = searchParams.get('next') ?? '/'
  if (!next.startsWith('/')) {
    next = '/'
  }

  const host = request.headers.get('host')
  const forwardedHost = request.headers.get('x-forwarded-host')
  const forwardedProto = request.headers.get('x-forwarded-proto')
  const referer = request.headers.get('referer')

  if (process.env.NODE_ENV === "development") {
    console.log('🔍 Callback route called:', {
      origin,
      host,
      forwardedHost,
      forwardedProto,
      referer,
      requestUrl: requestUrl.toString(),
      allHeaders: Object.fromEntries(request.headers.entries()),
    });
  }

  if (code) {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) {
      const redirectUrl = resolveRedirectUrl(next, origin, forwardedHost, forwardedProto, host, referer);
      if (process.env.NODE_ENV === "development") console.log('🚀 Redirecting to:', redirectUrl);
      return NextResponse.redirect(redirectUrl)
    } else {
      console.error('Supabase exchangeCodeForSession error:', error)
    }
  }

  const errorRedirectUrl = resolveErrorRedirectUrl(origin, forwardedHost, forwardedProto, host);
  if (process.env.NODE_ENV === "development") console.log('❌ Error redirect to:', errorRedirectUrl);
  return NextResponse.redirect(errorRedirectUrl)
}