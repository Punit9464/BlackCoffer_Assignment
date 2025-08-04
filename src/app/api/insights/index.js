import { ApiResponse } from '@/utils/apiResponse.js'
import { validateFilters, validateInsight } from '@/utils/validation.js'
import { asyncHandler } from '@/utils/errorHandler.js'
import insightService from '@/services/insightService.js'

export default asyncHandler(async function handler(req, res) {
    switch (req.method) {
        case 'GET':
            return await getInsights(req, res)
        case 'POST':
            return await createInsight(req, res)
        default:
            return res.status(405).json(ApiResponse.error('Method not allowed', 405))
    }
})

export const config = {
    api: {
        bodyParser: {
            sizeLimit: '5mb',
        },
    },
}

async function getInsights(req, res) {
    const { error, value: filters } = validateFilters(req.query)

    if (error) {
        return res.status(400).json(ApiResponse.error('Invalid filters', 400, error.details))
    }

    const { page, limit, ...filterParams } = filters
    const result = await insightService.getAllInsights(filterParams, page, limit)

    return res.status(200).json(ApiResponse.paginated(
        result.data,
        result.pagination,
        'Insights retrieved successfully'
    ))
}

async function createInsight(req, res) {
    const { error, value } = validateInsight(req.body)

    if (error) {
        return res.status(400).json(ApiResponse.error('Validation failed', 400, error.details))
    }

    const insight = await insightService.createInsight(value)
    return res.status(201).json(ApiResponse.success(insight, 'Insight created successfully', 201))
}