import dbConnect from '@/lib/mongoDB.js'
import Insight from '@/models/insightModel.js'

class AnalyticsService {
    constructor() {
        this.model = Insight
    }

    async ensureConnection() {
        await dbConnect()
    }

    async getOverviewAnalytics(filters = {}) {
        await this.ensureConnection()

        const matchStage = this.model.buildMatchStage(filters)

        const [overview] = await this.model.aggregate([
            { $match: matchStage },
            {
                $group: {
                    _id: null,
                    totalRecords: { $sum: 1 },
                    avgIntensity: { $avg: '$intensity' },
                    avgRelevance: { $avg: '$relevance' },
                    avgLikelihood: { $avg: '$likelihood' },
                    maxIntensity: { $max: '$intensity' },
                    minIntensity: { $min: '$intensity' },
                    uniqueCountries: { $addToSet: { $cond: [{ $ne: ['$country', ''] }, '$country', null] } },
                    uniqueSectors: { $addToSet: { $cond: [{ $ne: ['$sector', ''] }, '$sector', null] } },
                    uniqueTopics: { $addToSet: { $cond: [{ $ne: ['$topic', ''] }, '$topic', null] } }
                }
            },
            {
                $project: {
                    totalRecords: 1,
                    avgIntensity: { $round: ['$avgIntensity', 2] },
                    avgRelevance: { $round: ['$avgRelevance', 2] },
                    avgLikelihood: { $round: ['$avgLikelihood', 2] },
                    maxIntensity: 1,
                    minIntensity: 1,
                    uniqueCountriesCount: { $size: { $filter: { input: '$uniqueCountries', cond: { $ne: ['$$this', null] } } } },
                    uniqueSectorsCount: { $size: { $filter: { input: '$uniqueSectors', cond: { $ne: ['$$this', null] } } } },
                    uniqueTopicsCount: { $size: { $filter: { input: '$uniqueTopics', cond: { $ne: ['$$this', null] } } } }
                }
            }
        ])

        return overview || {
            totalRecords: 0,
            avgIntensity: 0,
            avgRelevance: 0,
            avgLikelihood: 0,
            maxIntensity: 0,
            minIntensity: 0,
            uniqueCountriesCount: 0,
            uniqueSectorsCount: 0,
            uniqueTopicsCount: 0
        }
    }

    async getIntensityByRegion(filters = {}) {
        await this.ensureConnection()

        const matchStage = this.model.buildMatchStage(filters)

        return await this.model.aggregate([
            { $match: { ...matchStage, region: { $ne: '' } } },
            {
                $group: {
                    _id: '$region',
                    avgIntensity: { $avg: '$intensity' },
                    avgRelevance: { $avg: '$relevance' },
                    avgLikelihood: { $avg: '$likelihood' },
                    count: { $sum: 1 },
                    maxIntensity: { $max: '$intensity' },
                    minIntensity: { $min: '$intensity' }
                }
            },
            {
                $project: {
                    region: '$_id',
                    avgIntensity: { $round: ['$avgIntensity', 1] },
                    avgRelevance: { $round: ['$avgRelevance', 1] },
                    avgLikelihood: { $round: ['$avgLikelihood', 1] },
                    count: 1,
                    maxIntensity: 1,
                    minIntensity: 1
                }
            },
            { $sort: { avgIntensity: -1 } }
        ])
    }

    async getTopicAnalysis(filters = {}) {
        await this.ensureConnection()

        const matchStage = this.model.buildMatchStage(filters)

        return await this.model.aggregate([
            { $match: { ...matchStage, topic: { $ne: '' } } },
            {
                $group: {
                    _id: '$topic',
                    count: { $sum: 1 },
                    avgIntensity: { $avg: '$intensity' },
                    avgRelevance: { $avg: '$relevance' },
                    totalImpact: { $sum: { $cond: [{ $type: ['$impact', 'number'] }, '$impact', 0] } },
                    countries: { $addToSet: { $cond: [{ $ne: ['$country', ''] }, '$country', null] } },
                    sectors: { $addToSet: { $cond: [{ $ne: ['$sector', ''] }, '$sector', null] } }
                }
            },
            {
                $project: {
                    topic: '$_id',
                    count: 1,
                    avgIntensity: { $round: ['$avgIntensity', 1] },
                    avgRelevance: { $round: ['$avgRelevance', 1] },
                    totalImpact: 1,
                    countriesCount: { $size: { $filter: { input: '$countries', cond: { $ne: ['$$this', null] } } } },
                    sectorsCount: { $size: { $filter: { input: '$sectors', cond: { $ne: ['$$this', null] } } } }
                }
            },
            { $sort: { count: -1 } },
            { $limit: 15 }
        ])
    }

    async getCountryAnalysis(filters = {}) {
        await this.ensureConnection()

        const matchStage = this.model.buildMatchStage(filters)

        return await this.model.aggregate([
            { $match: { ...matchStage, country: { $ne: '' } } },
            {
                $group: {
                    _id: '$country',
                    count: { $sum: 1 },
                    avgIntensity: { $avg: '$intensity' },
                    avgRelevance: { $avg: '$relevance' },
                    avgLikelihood: { $avg: '$likelihood' },
                    sectors: { $addToSet: { $cond: [{ $ne: ['$sector', ''] }, '$sector', null] } },
                    topics: { $addToSet: { $cond: [{ $ne: ['$topic', ''] }, '$topic', null] } },
                    totalIntensity: { $sum: '$intensity' }
                }
            },
            {
                $project: {
                    country: '$_id',
                    count: 1,
                    avgIntensity: { $round: ['$avgIntensity', 1] },
                    avgRelevance: { $round: ['$avgRelevance', 1] },
                    avgLikelihood: { $round: ['$avgLikelihood', 1] },
                    sectorsCount: { $size: { $filter: { input: '$sectors', cond: { $ne: ['$$this', null] } } } },
                    topicsCount: { $size: { $filter: { input: '$topics', cond: { $ne: ['$$this', null] } } } },
                    totalIntensity: 1
                }
            },
            { $sort: { totalIntensity: -1 } },
            { $limit: 20 }
        ])
    }

    async getYearlyTrends(filters = {}) {
        await this.ensureConnection()

        const matchStage = this.model.buildMatchStage(filters)

        return await this.model.aggregate([
            {
                $match: {
                    ...matchStage,
                    end_year: { $ne: '', $type: 'number' }
                }
            },
            {
                $group: {
                    _id: '$end_year',
                    count: { $sum: 1 },
                    avgIntensity: { $avg: '$intensity' },
                    avgRelevance: { $avg: '$relevance' },
                    avgLikelihood: { $avg: '$likelihood' },
                    maxIntensity: { $max: '$intensity' },
                    sectors: { $addToSet: { $cond: [{ $ne: ['$sector', ''] }, '$sector', null] } }
                }
            },
            {
                $project: {
                    year: '$_id',
                    count: 1,
                    avgIntensity: { $round: ['$avgIntensity', 1] },
                    avgRelevance: { $round: ['$avgRelevance', 1] },
                    avgLikelihood: { $round: ['$avgLikelihood', 1] },
                    maxIntensity: 1,
                    activeSectors: { $size: { $filter: { input: '$sectors', cond: { $ne: ['$$this', null] } } } }
                }
            },
            { $sort: { year: 1 } }
        ])
    }

    async getSectorAnalysis(filters = {}) {
        await this.ensureConnection()

        const matchStage = this.model.buildMatchStage(filters)

        return await this.model.aggregate([
            { $match: { ...matchStage, sector: { $ne: '' } } },
            {
                $group: {
                    _id: '$sector',
                    count: { $sum: 1 },
                    avgIntensity: { $avg: '$intensity' },
                    avgRelevance: { $avg: '$relevance' },
                    avgLikelihood: { $avg: '$likelihood' },
                    topics: { $addToSet: { $cond: [{ $ne: ['$topic', ''] }, '$topic', null] } },
                    countries: { $addToSet: { $cond: [{ $ne: ['$country', ''] }, '$country', null] } },
                    totalIntensity: { $sum: '$intensity' }
                }
            },
            {
                $project: {
                    sector: '$_id',
                    count: 1,
                    avgIntensity: { $round: ['$avgIntensity', 1] },
                    avgRelevance: { $round: ['$avgRelevance', 1] },
                    avgLikelihood: { $round: ['$avgLikelihood', 1] },
                    topicsCount: { $size: { $filter: { input: '$topics', cond: { $ne: ['$$this', null] } } } },
                    countriesCount: { $size: { $filter: { input: '$countries', cond: { $ne: ['$$this', null] } } } },
                    totalIntensity: 1
                }
            },
            { $sort: { totalIntensity: -1 } }
        ])
    }

    async getPestleAnalysis(filters = {}) {
        await this.ensureConnection()

        const matchStage = this.model.buildMatchStage(filters)

        return await this.model.aggregate([
            { $match: { ...matchStage, pestle: { $ne: '' } } },
            {
                $group: {
                    _id: '$pestle',
                    count: { $sum: 1 },
                    avgIntensity: { $avg: '$intensity' },
                    avgRelevance: { $avg: '$relevance' },
                    avgLikelihood: { $avg: '$likelihood' },
                    sectors: { $addToSet: { $cond: [{ $ne: ['$sector', ''] }, '$sector', null] } }
                }
            },
            {
                $project: {
                    pestle: '$_id',
                    count: 1,
                    avgIntensity: { $round: ['$avgIntensity', 1] },
                    avgRelevance: { $round: ['$avgRelevance', 1] },
                    avgLikelihood: { $round: ['$avgLikelihood', 1] },
                    sectorsCount: { $size: { $filter: { input: '$sectors', cond: { $ne: ['$$this', null] } } } }
                }
            },
            { $sort: { avgIntensity: -1 } }
        ])
    }

    async getCorrelationAnalysis(filters = {}) {
        await this.ensureConnection()

        const matchStage = this.model.buildMatchStage(filters)

        const data = await this.model.find(matchStage, {
            intensity: 1,
            relevance: 1,
            likelihood: 1,
            sector: 1,
            region: 1
        }).lean()

        return data.map(item => ({
            intensity: item.intensity,
            relevance: item.relevance,
            likelihood: item.likelihood,
            sector: item.sector || 'Unknown',
            region: item.region || 'Unknown'
        }))
    }
}

export default new AnalyticsService();