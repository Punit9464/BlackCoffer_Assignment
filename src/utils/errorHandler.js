export function handleApiError(error, req, res) {
    console.error('API Error:', error)

    if (error.name === 'ValidationError') {
        const errors = Object.values(error.errors).map(err => ({
            field: err.path,
            message: err.message
        }))

        return res.status(400).json({
            success: false,
            statusCode: 400,
            message: 'Validation Error',
            errors,
            timestamp: new Date().toISOString()
        })
    }

    if (error.name === 'CastError') {
        return res.status(400).json({
            success: false,
            statusCode: 400,
            message: 'Invalid ID format',
            timestamp: new Date().toISOString()
        })
    }

    if (error.code === 11000) {
        const field = Object.keys(error.keyValue)[0]
        return res.status(409).json({
            success: false,
            statusCode: 409,
            message: `Duplicate value for field: ${field}`,
            timestamp: new Date().toISOString()
        })
    }

    return res.status(500).json({
        success: false,
        statusCode: 500,
        message: 'Internal Server Error',
        timestamp: new Date().toISOString()
    })
}

export function asyncHandler(fn) {
    return (req, res, next) => {
        Promise.resolve(fn(req, res, next)).catch((error) => {
            handleApiError(error, req, res)
        })
    }
}