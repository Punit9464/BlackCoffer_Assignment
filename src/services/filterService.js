import dbConnect from '@/lib/mongoDB.js'
import Insight from '@/models/insightModel.js'

class FilterService {
    constructor() {
        this.model = Insight
    }

    async ensureConnection() {
        await dbConnect()
    }

    async getFilterOptions() {
        await this.ensureConnection()
        return await this.model.getFilterOptions()
    }

    async getCascadingFilterOptions(existingFilters = {}) {
        await this.ensureConnection()

        const matchStage = this.model.buildMatchStage(existingFilters)

        const pipeline = [
            { $match: matchStage },
            {
                $group: {
                    _id: null,
                    sectors: { $addToSet: { $cond: [{ $ne: ["$sector", ""] }, "$sector", null] } },
                    topics: { $addToSet: { $cond: [{ $ne: ["$topic", ""] }, "$topic", null] } },
                    regions: { $addToSet: { $cond: [{ $ne: ["$region", ""] }, "$region", null] } },
                    countries: { $addToSet: { $cond: [{ $ne: ["$country", ""] }, "$country", null] } },
                    pestles: { $addToSet: { $cond: [{ $ne: ["$pestle", ""] }, "$pestle", null] } },
                    sources: { $addToSet: { $cond: [{ $ne: ["$source", ""] }, "$source", null] } },
                    cities: { $addToSet: { $cond: [{ $ne: ["$city", ""] }, "$city", null] } },
                    endYears: { $addToSet: { $cond: [{ $and: [{ $ne: ["$end_year", ""] }, { $type: ["$end_year", "number"] }] }, "$end_year", null] } },
                    intensityRange: { $push: "$intensity" },
                    relevanceRange: { $push: "$relevance" },
                    likelihoodRange: { $push: "$likelihood" }
                }
            }
        ]

        const result = await this.model.aggregate(pipeline)
        const options = result[0] || {}

        Object.keys(options).forEach(key => {
            if (Array.isArray(options[key])) {
                if (key.includes('Range')) {
                    const values = options[key].filter(v => v != null)
                    options[key] = {
                        min: Math.min(...values),
                        max: Math.max(...values)
                    }
                } else {
                    options[key] = options[key].filter(item => item !== null).sort()
                }
            }
        })

        return options
    }

    async getFilterStatistics(filters = {}) {
        await this.ensureConnection()

        const matchStage = this.model.buildMatchStage(filters)

        return await this.model.aggregate([
            { $match: matchStage },
            {
                $group: {
                    _id: null,
                    totalRecords: { $sum: 1 },
                    intensityStats: {
                        $push: {
                            avg: { $avg: '$intensity' },
                            min: { $min: '$intensity' },
                            max: { $max: '$intensity' }
                        }
                    },
                    relevanceStats: {
                        $push: {
                            avg: { $avg: '$relevance' },
                            min: { $min: '$relevance' },
                            max: { $max: '$relevance' }
                        }
                    },
                    likelihoodStats: {
                        $push: {
                            avg: { $avg: '$likelihood' },
                            min: { $min: '$likelihood' },
                            max: { $max: '$likelihood' }
                        }
                    }
                }
            }
        ])
    }
}

export default new FilterService();