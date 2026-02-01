import { signOut } from '@/lib/auth/sign-out'

const mockSignOut = jest.fn().mockResolvedValue(undefined)

jest.mock('@/lib/shared/supabase/client', () => ({
  createClient: () => ({
    auth: {
      signOut: mockSignOut,
    },
  }),
}))

describe('signOut', () => {
  beforeEach(() => {
    mockSignOut.mockClear()
  })

  it('вызывает supabase.auth.signOut', async () => {
    await signOut()

    expect(mockSignOut).toHaveBeenCalledTimes(1)
  })
})
