import { ApiResponse } from '@/utils/apiResponse.js'
import { validateFilters } from '@/utils/validation.js'
import { asyncHandler } from '@/utils/errorHandler.js'
import insightService from '@/services/insightService.js'

export default asyncHandler(async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json(ApiResponse.error('Method not allowed', 405))
  }

  const { q: query, ...filterParams } = req.query

  if (!query || query.trim().length < 2) {
    return res.status(400).json(ApiResponse.error('Query must be at least 2 characters long', 400))
  }

  const { error, value: filters } = validateFilters(filterParams)
  
  if (error) {
    return res.status(400).json(ApiResponse.error('Invalid filters', 400, error.details))
  }

  const results = await insightService.searchInsights(query.trim(), filters)
  
  return res.status(200).json(ApiResponse.success(
    results,
    `Found ${results.length} results for "${query}"`
  ))
})