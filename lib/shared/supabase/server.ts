import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import {
  fetchWithTimeout,
  DEFAULT_REQUEST_TIMEOUT_MS,
} from '@/lib/shared/api/fetch-with-timeout'

const supabaseFetch = (input: RequestInfo | URL, init?: RequestInit) =>
  fetchWithTimeout(DEFAULT_REQUEST_TIMEOUT_MS, input, init)

export async function createClient() {
  const cookieStore = await cookies()

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      global: {
        fetch: supabaseFetch,
      },
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options))
          } catch {
            // The `setAll` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing
            // user sessions.
          }
        },
      },
    }
  )
}
