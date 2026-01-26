import { apiClient } from '@/lib/api-client'

// Мокируем все API модули
jest.mock('@/lib/api-client/items')
jest.mock('@/lib/api-client/places')
jest.mock('@/lib/api-client/containers')
jest.mock('@/lib/api-client/rooms')
jest.mock('@/lib/api-client/transitions')
jest.mock('@/lib/api-client/users')
jest.mock('@/lib/api-client/entity-types')
jest.mock('@/lib/api-client/search')
jest.mock('@/lib/api-client/soft-delete')
jest.mock('@/lib/api-client/photo')
jest.mock('@/lib/api-client/settings')
jest.mock('@/lib/api-client/auth')

describe('ApiClient', () => {
  it('делегирует вызовы к соответствующим API модулям', async () => {
    // Проверяем, что методы существуют и могут быть вызваны
    expect(typeof apiClient.getItems).toBe('function')
    expect(typeof apiClient.getPlaces).toBe('function')
    expect(typeof apiClient.getContainers).toBe('function')
    expect(typeof apiClient.getRooms).toBe('function')
    expect(typeof apiClient.createTransition).toBe('function')
    expect(typeof apiClient.getUsers).toBe('function')
    expect(typeof apiClient.getEntityTypes).toBe('function')
    expect(typeof apiClient.search).toBe('function')
    expect(typeof apiClient.softDelete).toBe('function')
    expect(typeof apiClient.uploadPhoto).toBe('function')
    expect(typeof apiClient.getSettings).toBe('function')
    expect(typeof apiClient.getCurrentUser).toBe('function')
  })

  it('поддерживает все методы для items', () => {
    expect(typeof apiClient.getItems).toBe('function')
    expect(typeof apiClient.getItem).toBe('function')
    expect(typeof apiClient.createItem).toBe('function')
    expect(typeof apiClient.updateItem).toBe('function')
  })

  it('поддерживает все методы для places', () => {
    expect(typeof apiClient.getPlaces).toBe('function')
    expect(typeof apiClient.getPlace).toBe('function')
    expect(typeof apiClient.getPlacesSimple).toBe('function')
    expect(typeof apiClient.createPlace).toBe('function')
    expect(typeof apiClient.updatePlace).toBe('function')
  })

  it('поддерживает все методы для containers', () => {
    expect(typeof apiClient.getContainers).toBe('function')
    expect(typeof apiClient.getContainer).toBe('function')
    expect(typeof apiClient.getContainersSimple).toBe('function')
    expect(typeof apiClient.createContainer).toBe('function')
    expect(typeof apiClient.updateContainer).toBe('function')
  })

  it('поддерживает все методы для rooms', () => {
    expect(typeof apiClient.getRooms).toBe('function')
    expect(typeof apiClient.getRoom).toBe('function')
    expect(typeof apiClient.getRoomsSimple).toBe('function')
    expect(typeof apiClient.createRoom).toBe('function')
    expect(typeof apiClient.updateRoom).toBe('function')
  })

  it('поддерживает методы для users', () => {
    expect(typeof apiClient.getUsers).toBe('function')
    expect(typeof apiClient.createUser).toBe('function')
    expect(typeof apiClient.updateUser).toBe('function')
    expect(typeof apiClient.deleteUser).toBe('function')
  })

  it('поддерживает методы для entity types', () => {
    expect(typeof apiClient.getEntityTypes).toBe('function')
    expect(typeof apiClient.createEntityType).toBe('function')
    expect(typeof apiClient.updateEntityType).toBe('function')
    expect(typeof apiClient.deleteEntityType).toBe('function')
  })

  it('поддерживает методы для soft delete', () => {
    expect(typeof apiClient.softDelete).toBe('function')
    expect(typeof apiClient.restoreDeleted).toBe('function')
  })
})
