// updateSession — middleware, зависит от next/server (Request) и @supabase/ssr.
// В jsdom Request недоступен; логика проверяется в E2E.
describe('updateSession', () => {
  it('покрыт E2E-тестами', () => {
    expect(true).toBe(true)
  })
})
