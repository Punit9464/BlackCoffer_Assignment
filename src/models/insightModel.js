import mongoose from 'mongoose'
import { SECTORS, REGIONS, PESTLE_CATEGORIES } from '../lib/constants.js'

const InsightSchema = new mongoose.Schema({
  end_year: {
    type: mongoose.Schema.Types.Mixed,
    default: ""
  },
  start_year: {
    type: mongoose.Schema.Types.Mixed,
    default: ""
  },
  intensity: {
    type: Number,
    required: true,
    min: 0,
    max: 100
  },
  likelihood: {
    type: Number,
    required: true,
    min: 1,
    max: 5
  },
  relevance: {
    type: Number,
    required: true,
    min: 1,
    max: 5
  },
  impact: {
    type: mongoose.Schema.Types.Mixed,
    default: ""
  },
  sector: {
    type: String,
    default: "",
    enum: SECTORS
  },
  topic: {
    type: String,
    default: "",
    index: true
  },
  region: {
    type: String,
    default: "",
    enum: REGIONS
  },
  country: {
    type: String,
    default: "",
    index: true
  },
  city: {
    type: String,
    default: "",
    index: true
  },
  pestle: {
    type: String,
    default: "",
    enum: PESTLE_CATEGORIES
  },
  insight: {
    type: String,
    required: true,
    trim: true
  },
  title: {
    type: String,
    required: true,
    trim: true
  },
  url: {
    type: String,
    default: "",
    validate: {
      validator: function(v) {
        return v === "" || /^https?:\/\/.+/.test(v);
      },
      message: 'URL must be a valid HTTP/HTTPS URL'
    }
  },
  source: {
    type: String,
    default: "",
    index: true
  },
  added: {
    type: String,
    required: true
  },
  published: {
    type: String,
    default: ""
  }
}, {
  timestamps: true,
  collection: 'insights'
})

InsightSchema.index({ sector: 1, region: 1 })
InsightSchema.index({ country: 1, topic: 1 })
InsightSchema.index({ intensity: 1, relevance: 1, likelihood: 1 })
InsightSchema.index({ pestle: 1, sector: 1 })
InsightSchema.index({ end_year: 1, sector: 1 })


InsightSchema.statics.getFilterOptions = async function() {
  const pipeline = [
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
        endYears: { $addToSet: { $cond: [{ $and: [{ $ne: ["$end_year", ""] }, { $type: ["$end_year", "number"] }] }, "$end_year", null] } }
      }
    }
  ]
  
  const result = await this.aggregate(pipeline)
  const options = result[0] || {}
  
 
  Object.keys(options).forEach(key => {
    if (Array.isArray(options[key])) {
      options[key] = options[key].filter(item => item !== null).sort()
    }
  })
  
  return options
}

InsightSchema.statics.buildMatchStage = function(filters) {
  const match = {}
  
  if (filters.endYear && filters.endYear !== '') {
    match.end_year = parseInt(filters.endYear)
  }
  if (filters.sector && filters.sector !== '') match.sector = filters.sector
  if (filters.topic && filters.topic !== '') {
    match.topic = { $regex: filters.topic, $options: 'i' }
  }
  if (filters.region && filters.region !== '') match.region = filters.region
  if (filters.country && filters.country !== '') match.country = filters.country
  if (filters.pestle && filters.pestle !== '') match.pestle = filters.pestle
  if (filters.source && filters.source !== '') match.source = filters.source
  if (filters.city && filters.city !== '') match.city = filters.city
  
  if (filters.minIntensity !== undefined) {
    match.intensity = { $gte: parseInt(filters.minIntensity) }
  }
  if (filters.maxIntensity !== undefined) {
    match.intensity = { ...match.intensity, $lte: parseInt(filters.maxIntensity) }
  }
  
  return match
}

export default mongoose.models.Insight || mongoose.model('Insight', InsightSchema)