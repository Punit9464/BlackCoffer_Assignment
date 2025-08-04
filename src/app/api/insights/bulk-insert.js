import { ApiResponse } from '@/utils/apiResponse.js'
import { asyncHandler } from '@/utils/errorHandler.js'
import insightService from '@/services/insightService.js'

export default asyncHandler(async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json(ApiResponse.error('Method not allowed', 405))
  }

  const { data } = req.body

  if (!Array.isArray(data) || data.length === 0) {
    return res.status(400).json(ApiResponse.error('Data must be a non-empty array', 400))
  }

  const result = await insightService.bulkInsertInsights(data)
  
  return res.status(201).json(ApiResponse.success(
    result,
    `Bulk insert completed. ${result.inserted} records inserted.`,
    201
  ))
})