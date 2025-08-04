import dbConnect from '@/lib/mongoDB.js'
import Insight from '@/models/insightModel'

class InsightService {
  constructor() {
    this.model = Insight
  }

  async ensureConnection() {
    await dbConnect()
  }

  async getAllInsights(filters = {}, page = 1, limit = 50) {
    await this.ensureConnection()

    const matchStage = this.model.buildMatchStage(filters)
    const skip = (page - 1) * limit

    const [data, total] = await Promise.all([
      this.model.find(matchStage)
        .skip(skip)
        .limit(limit)
        .sort({ added: -1 })
        .lean(),
      this.model.countDocuments(matchStage)
    ])

    return {
      data,
      pagination: {
        current: page,
        pages: Math.ceil(total / limit),
        total,
        hasNext: page * limit < total,
        hasPrev: page > 1
      }
    }
  }

  async getInsightById(id) {
    await this.ensureConnection()
    return await this.model.findById(id).lean()
  }

  async createInsight(data) {
    await this.ensureConnection()
    const insight = new this.model(data)
    return await insight.save()
  }

  async updateInsight(id, data) {
    await this.ensureConnection()
    return await this.model.findByIdAndUpdate(id, data, { new: true }).lean()
  }

  async deleteInsight(id) {
    await this.ensureConnection()
    return await this.model.findByIdAndDelete(id)
  }

  async bulkInsertInsights(dataArray) {
    await this.ensureConnection()

    try {
      const result = await this.model.insertMany(dataArray, {
        ordered: false,
        rawResult: true
      })
      return {
        success: true,
        inserted: result.insertedCount,
        total: dataArray.length
      }
    } catch (error) {
      const inserted = error.result?.nInserted || 0
      return {
        success: true,
        inserted,
        total: dataArray.length,
        duplicates: dataArray.length - inserted,
        message: `Inserted ${inserted} records, ${dataArray.length - inserted} duplicates skipped`
      }
    }
  }

  async searchInsights(query, filters = {}) {
    await this.ensureConnection()

    const matchStage = {
      ...this.model.buildMatchStage(filters),
      $or: [
        { title: { $regex: query, $options: 'i' } },
        { insight: { $regex: query, $options: 'i' } },
        { topic: { $regex: query, $options: 'i' } },
        { source: { $regex: query, $options: 'i' } }
      ]
    }

    return await this.model.find(matchStage)
      .limit(20)
      .sort({ relevance: -1, intensity: -1 })
      .lean()
  }

  async getInsightsByIds(ids) {
    await this.ensureConnection()
    return await this.model.find({ _id: { $in: ids } }).lean()
  }
}

export default new InsightService();