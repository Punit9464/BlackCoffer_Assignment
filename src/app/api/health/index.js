import { ApiResponse } from '@/utils/apiResponse.js'
import { asyncHandler } from '@/utils/errorHandler.js'
import dbConnect from '@/lib/mongoDB.js'

export default asyncHandler(async function handler(req, res) {
    if (req.method !== 'GET') {
        return res.status(405).json(ApiResponse.error('Method not allowed', 405))
    }

    try {
        await dbConnect()

        const healthStatus = {
            status: 'healthy',
            timestamp: new Date().toISOString(),
            version: '1.0.0',
            environment: process.env.NODE_ENV || 'development',
            services: {
                database: 'connected',
                api: 'operational'
            },
            uptime: process.uptime()
        }

        return res.status(200).json(ApiResponse.success(
            healthStatus,
            'System is healthy'
        ))
    } catch (error) {
        const healthStatus = {
            status: 'unhealthy',
            timestamp: new Date().toISOString(),
            error: error.message,
            services: {
                database: 'disconnected',
                api: 'operational'
            }
        }

        return res.status(503).json(ApiResponse.error(
            'System is unhealthy',
            503,
            healthStatus
        ))
    }
})