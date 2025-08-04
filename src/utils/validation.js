import Joi from 'joi'

export const insightValidationSchema = Joi.object({
    intensity: Joi.number().min(0).max(100).required(),
    likelihood: Joi.number().min(1).max(5).required(),
    relevance: Joi.number().min(1).max(5).required(),
    sector: Joi.string().allow(''),
    topic: Joi.string().allow(''),
    region: Joi.string().allow(''),
    country: Joi.string().allow(''),
    city: Joi.string().allow(''),
    pestle: Joi.string().allow(''),
    insight: Joi.string().required(),
    title: Joi.string().required(),
    url: Joi.string().uri().allow(''),
    source: Joi.string().allow(''),
    added: Joi.string().required(),
    published: Joi.string().allow(''),
    end_year: Joi.alternatives().try(Joi.number(), Joi.string().allow('')),
    start_year: Joi.alternatives().try(Joi.number(), Joi.string().allow('')),
    impact: Joi.alternatives().try(Joi.number(), Joi.string().allow(''))
})

export const filterValidationSchema = Joi.object({
    endYear: Joi.alternatives().try(Joi.number(), Joi.string().allow('')),
    sector: Joi.string().allow(''),
    topic: Joi.string().allow(''),
    region: Joi.string().allow(''),
    country: Joi.string().allow(''),
    pestle: Joi.string().allow(''),
    source: Joi.string().allow(''),
    city: Joi.string().allow(''),
    minIntensity: Joi.number().min(0).max(100),
    maxIntensity: Joi.number().min(0).max(100),
    page: Joi.number().min(1).default(1),
    limit: Joi.number().min(1).max(100).default(50)
})

export function validateInsight(data) {
    return insightValidationSchema.validate(data)
}

export function validateFilters(filters) {
    return filterValidationSchema.validate(filters)
}