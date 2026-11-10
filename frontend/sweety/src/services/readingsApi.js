import api from './api'

export const readingsApi = {
  // Get readings by specific date (YYYY-MM-DD) or range
  getByDate: async (dateStr) => {
    const { data } = await api.get('/readings', { params: { date: dateStr } })
    return data.readings
  },

  getByRange: async (startDate, endDate) => {
    const { data } = await api.get('/readings', { params: { startDate, endDate } })
    return data.readings
  },

  // Add new reading
  create: async ({ reading_date, slot, value }) => {
    const { data } = await api.post('/readings', {
      reading_date,
      slot,
      value: Number(value),
    })
    return data.reading
  },

  // Update existing reading
  update: async (id, { reading_date, slot, value }) => {
    const { data } = await api.put(`/readings/${id}`, {
      reading_date,
      slot,
      value: Number(value),
    })
    return data.reading
  },

  // Delete reading
  delete: async (id) => {
    const { data } = await api.delete(`/readings/${id}`)
    return data.id
  },

  // Get Daily, Month-to-date, and Monthly reports
  getReports: async (selectedDate) => {
    const { data } = await api.get('/readings/reports', {
      params: { selectedDate },
    })
    return data
  },
}
