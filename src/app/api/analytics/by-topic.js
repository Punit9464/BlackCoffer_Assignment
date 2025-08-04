import { ApiResponse } from '@/utils/apiResponse.js'
import { validateFilters } from '@/utils/validation.js'
import { asyncHandler } from '@/utils/errorHandler.js'
import analyticsService from '@/services/analyticsService.js'

export default asyncHandler(async function handler(req, res) {
    if (req.method !== 'GET') {
        return res.status(405).json(ApiResponse.error('Method not allowed', 405))
    }

    const { error, value: filters } = validateFilters(req.query)

    if (error) {
        return res.status(400).json(ApiResponse.error('Invalid filters', 400, error.details))
    }

    const topicData = await analyticsService.getTopicAnalysis(filters)

    return res.status(200).json(ApiResponse.success(
        topicData,
        'Topic analysis retrieved successfully'
    ))
})