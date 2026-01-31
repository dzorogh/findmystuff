import { NextResponse } from 'next/server'
// The client you created from the Server-Side Auth instructions
import { createClient } from "@/lib/shared/supabase/server"

export async function GET(request: Request) {
  const requestUrl = new URL(request.url)
  const { searchParams, origin } = requestUrl
  const code = searchParams.get('code')
  // if "next" is in param, use it as the redirect URL
  let next = searchParams.get('next') ?? '/'
  if (!next.startsWith('/')) {
    // if "next" is not a relative URL, use the default
    next = '/'
  }

  // Логирование для отладки
  const host = request.headers.get('host')
  const forwardedHost = request.headers.get('x-forwarded-host')
  const forwardedProto = request.headers.get('x-forwarded-proto')
  const referer = request.headers.get('referer')
  
  console.log('🔍 Callback route called:', {
    origin,
    host,
    forwardedHost,
    forwardedProto,
    referer,
    requestUrl: requestUrl.toString(),
    allHeaders: Object.fromEntries(request.headers.entries()),
  })

  if (code) {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) {
      // Определяем правильный URL для редиректа
      let redirectUrl: string;
      
      // Приоритет 1: x-forwarded-host (для dev tunnels, прокси, load balancers)
      if (forwardedHost) {
        const protocol = forwardedProto || 'https'
        redirectUrl = `${protocol}://${forwardedHost}${next}`
        console.log('✅ Using x-forwarded-host:', redirectUrl)
      } 
      // Приоритет 2: host из заголовков (может быть dev tunnels домен)
      else if (host && !host.includes('localhost') && !host.includes('127.0.0.1')) {
        const protocol = forwardedProto || (host.includes('devtunnels.ms') ? 'https' : 'http')
        redirectUrl = `${protocol}://${host}${next}`
        console.log('✅ Using host header:', redirectUrl)
      }
      // Приоритет 3: referer (откуда пришел запрос)
      else if (referer) {
        try {
          const refererUrl = new URL(referer)
          if (!refererUrl.origin.includes('localhost')) {
            redirectUrl = `${refererUrl.origin}${next}`
            console.log('✅ Using referer:', redirectUrl)
          } else {
            throw new Error('Referer is localhost')
          }
        } catch {
          // Если не удалось распарсить referer или это localhost, используем переменную окружения
          const baseUrl = process.env.NEXT_PUBLIC_APP_URL
          if (baseUrl && !baseUrl.includes('localhost')) {
            redirectUrl = baseUrl.startsWith('http') ? `${baseUrl}${next}` : `https://${baseUrl}${next}`
            console.log('✅ Using NEXT_PUBLIC_APP_URL:', redirectUrl)
          } else {
            redirectUrl = `${origin}${next}`
            console.log('⚠️ Fallback to origin:', redirectUrl)
          }
        }
      }
      // Приоритет 4: origin (если не localhost)
      else if (origin && !origin.includes('localhost') && !origin.includes('127.0.0.1')) {
        redirectUrl = `${origin}${next}`
        console.log('✅ Using origin:', redirectUrl)
      }
      // Приоритет 5: переменная окружения
      else {
        const baseUrl = process.env.NEXT_PUBLIC_APP_URL
        if (baseUrl && !baseUrl.includes('localhost')) {
          redirectUrl = baseUrl.startsWith('http') ? `${baseUrl}${next}` : `https://${baseUrl}${next}`
          console.log('✅ Using NEXT_PUBLIC_APP_URL (fallback):', redirectUrl)
        } else {
          redirectUrl = `${origin}${next}`
          console.log('⚠️ Final fallback to origin:', redirectUrl)
        }
      }
      
      console.log('🚀 Redirecting to:', redirectUrl)
      return NextResponse.redirect(redirectUrl)
    } else {
      console.error('Supabase exchangeCodeForSession error:', error)
    }
  }

  // return the user to an error page with instructions
  // Используем ту же логику для определения URL ошибки
  let errorRedirectUrl: string
  if (forwardedHost) {
    errorRedirectUrl = `${forwardedProto || 'https'}://${forwardedHost}/auth/auth-code-error`
  } else if (host && !host.includes('localhost')) {
    errorRedirectUrl = `https://${host}/auth/auth-code-error`
  } else {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL
    if (baseUrl && !baseUrl.includes('localhost')) {
      errorRedirectUrl = baseUrl.startsWith('http') ? `${baseUrl}/auth/auth-code-error` : `https://${baseUrl}/auth/auth-code-error`
    } else {
      errorRedirectUrl = `${origin}/auth/auth-code-error`
    }
  }
  
  console.log('❌ Error redirect to:', errorRedirectUrl)
  return NextResponse.redirect(errorRedirectUrl)
}