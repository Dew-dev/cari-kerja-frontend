import api from './api'

// Get all workers with filters
export const searchWorkers = async (params = {}) => {
  try {
    const response = await api.get('/workers', { params })
    return response.data
  } catch (error) {
    console.error('Error searching workers:', error)
    throw error
  }
}

// Get worker by ID
export const getWorkerById = async (workerId) => {
  try {
    const response = await api.get(`/workers/${workerId}`)
    return response.data
  } catch (error) {
    console.error('Error fetching worker:', error)
    throw error
  }
}

// Get available filter options
export const getWorkerFilters = async () => {
  try {
    const response = await api.get('/workers/filters')
    return response.data
  } catch (error) {
    console.error('Error fetching worker filters:', error)
    throw error
  }
}
