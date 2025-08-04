import { ApiResponse } from '@/utils/apiResponse.js'
import { asyncHandler } from '@/utils/errorHandler.js'
import filterService from '@/services/filterService.js'

export default asyncHandler(async function handler(req, res) {
    if (req.method !== 'GET') {
        return res.status(405).json(ApiResponse.error('Method not allowed', 405))
    }

    const { cascading } = req.query
    let filterOptions

    if (cascading === 'true') {
        const existingFilters = { ...req.query }
        delete existingFilters.cascading

        filterOptions = await filterService.getCascadingFilterOptions(existingFilters)
    } else {
        filterOptions = await filterService.getFilterOptions()
    }

    return res.status(200).json(ApiResponse.success(
        filterOptions,
        'Filter options retrieved successfully'
    ))
})