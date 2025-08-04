import { ApiResponse } from '@/utils/apiResponse.js'
import { validateInsight } from '@/utils/validation.js'
import { asyncHandler } from '@/utils/errorHandler.js'
import insightService from '@/services/insightService.js'

export default asyncHandler(async function handler(req, res) {
    const { id } = req.query

    switch (req.method) {
        case 'GET':
            return await getInsight(req, res, id)
        case 'PUT':
            return await updateInsight(req, res, id)
        case 'DELETE':
            return await deleteInsight(req, res, id)
        default:
            return res.status(405).json(ApiResponse.error('Method not allowed', 405))
    }
})

async function getInsight(req, res, id) {
    const insight = await insightService.getInsightById(id)

    if (!insight) {
        return res.status(404).json(ApiResponse.error('Insight not found', 404))
    }

    return res.status(200).json(ApiResponse.success(insight, 'Insight retrieved successfully'))
}

async function updateInsight(req, res, id) {
    const { error, value } = validateInsight(req.body)

    if (error) {
        return res.status(400).json(ApiResponse.error('Validation failed', 400, error.details))
    }

    const insight = await insightService.updateInsight(id, value)

    if (!insight) {
        return res.status(404).json(ApiResponse.error('Insight not found', 404))
    }

    return res.status(200).json(ApiResponse.success(insight, 'Insight updated successfully'))
}

async function deleteInsight(req, res, id) {
    const insight = await insightService.deleteInsight(id)

    if (!insight) {
        return res.status(404).json(ApiResponse.error('Insight not found', 404))
    }

    return res.status(200).json(ApiResponse.success(null, 'Insight deleted successfully'))
}