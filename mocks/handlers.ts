import { http, HttpResponse } from 'msw'

const API_BASE_URL = '/api'

export const handlers = [
  // Items
  http.get(`${API_BASE_URL}/items`, () => {
    return HttpResponse.json({
      data: [
        { id: 1, name: 'Тестовая вещь 1', last_location: 'Комната 1' },
        { id: 2, name: 'Тестовая вещь 2', last_location: 'Комната 2' },
      ],
      totalCount: 2,
    })
  }),

  http.get(`${API_BASE_URL}/items/:id`, ({ params }) => {
    const { id } = params
    return HttpResponse.json({
      data: {
        item: {
          id: Number(id),
          name: `Вещь ${id}`,
          last_location: 'Комната 1',
          created_at: new Date().toISOString(),
        },
        transitions: [],
      },
    })
  }),

  http.post(`${API_BASE_URL}/items`, async ({ request }) => {
    const body = await request.json() as { name?: string }
    return HttpResponse.json({
      data: {
        id: Math.floor(Math.random() * 1000),
        name: body.name || 'Новая вещь',
        created_at: new Date().toISOString(),
      },
    })
  }),

  http.put(`${API_BASE_URL}/items/:id`, async ({ params, request }) => {
    const { id } = params
    const body = await request.json()
    return HttpResponse.json({
      data: {
        id: Number(id),
        ...(body as object),
      },
    })
  }),

  // Rooms
  http.get(`${API_BASE_URL}/rooms`, () => {
    return HttpResponse.json({
      data: [
        { id: 1, name: 'Комната 1' },
        { id: 2, name: 'Комната 2' },
      ],
      totalCount: 2,
    })
  }),

  // Places
  http.get(`${API_BASE_URL}/places`, () => {
    return HttpResponse.json({
      data: [
        { id: 1, name: 'Место 1', room_id: 1 },
        { id: 2, name: 'Место 2', room_id: 1 },
      ],
      totalCount: 2,
    })
  }),

  // Containers
  http.get(`${API_BASE_URL}/containers`, () => {
    return HttpResponse.json({
      data: [
        { id: 1, name: 'Контейнер 1' },
        { id: 2, name: 'Контейнер 2' },
      ],
      totalCount: 2,
    })
  }),

  // Search
  http.get(`${API_BASE_URL}/search`, ({ request }) => {
    const url = new URL(request.url)
    const query = url.searchParams.get('query') || ''
    
    return HttpResponse.json({
      data: query
        ? [
            {
              id: 1,
              type: 'item',
              name: `Результат поиска: ${query}`,
              location: 'Комната 1',
            },
          ]
        : [],
    })
  }),

  // Auth
  http.get(`${API_BASE_URL}/auth/me`, () => {
    return HttpResponse.json({
      data: {
        id: '1',
        email: 'test@example.com',
        name: 'Test User',
      },
    })
  }),
]
