const mongoose = require('mongoose');

const communityReportSchema = new mongoose.Schema({
  author: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Author is required']
  },
  title: {
    type: String,
    required: [true, 'Title is required'],
    trim: true,
    maxlength: [200, 'Title cannot exceed 200 characters']
  },
  content: {
    type: String,
    required: [true, 'Content is required'],
    maxlength: [5000, 'Content cannot exceed 5000 characters']
  },
  category: {
    type: String,
    required: [true, 'Category is required'],
    enum: [
      'treatment_experience',
      'recovery_story',
      'symptom_management',
      'medication_review',
      'lifestyle_tips',
      'doctor_review',
      'product_review',
      'general_health',
      'mental_health',
      'chronic_condition',
      'clinical_insights',
      'research_findings',
      'case_study',
      'diagnosis_insights',
      'other'
    ]
  },
  condition: {
    type: String,
    required: [true, 'Condition is required'],
    trim: true
  },
  tags: [{
    type: String,
    trim: true,
    lowercase: true
  }],
  images: [{
    url: String,
    caption: String,
    uploadedAt: {
      type: Date,
      default: Date.now
    }
  }],
  rating: {
    overall: {
      type: Number,
      min: 1,
      max: 5,
      required: true
    },
    effectiveness: {
      type: Number,
      min: 1,
      max: 5
    },
    sideEffects: {
      type: Number,
      min: 1,
      max: 5,
      description: '1 = severe side effects, 5 = no side effects'
    },
    cost: {
      type: Number,
      min: 1,
      max: 5,
      description: '1 = very expensive, 5 = very affordable'
    }
  },
  treatmentDetails: {
    duration: {
      type: String,
      enum: ['days', 'weeks', 'months', 'years'],
      required: false,
      validate: {
        validator: function(v) {
          return !v || ['days', 'weeks', 'months', 'years'].includes(v);
        },
        message: 'Duration must be one of: days, weeks, months, years'
      }
    },
    durationValue: {
      type: Number,
      min: 1,
      required: false
    },
    cost: {
      type: Number,
      min: 0,
      required: false
    },
    sideEffects: [String],
    improvements: [String],
    challenges: [String]
  },
  doctorReview: {
    doctor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Doctor'
    },
    rating: {
      type: Number,
      min: 1,
      max: 5
    },
    communication: {
      type: Number,
      min: 1,
      max: 5
    },
    expertise: {
      type: Number,
      min: 1,
      max: 5
    },
    bedsideManner: {
      type: Number,
      min: 1,
      max: 5
    },
    comments: String
  },
  productReview: {
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product'
    },
    rating: {
      type: Number,
      min: 1,
      max: 5
    },
    quality: {
      type: Number,
      min: 1,
      max: 5
    },
    value: {
      type: Number,
      min: 1,
      max: 5
    },
    effectiveness: {
      type: Number,
      min: 1,
      max: 5
    },
    comments: String
  },
  status: {
    type: String,
    enum: ['draft', 'pending', 'approved', 'rejected', 'flagged'],
    default: 'pending'
  },
  moderation: {
    moderatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    moderatedAt: Date,
    moderationNotes: String,
    flags: [{
      type: {
        type: String,
        enum: ['inappropriate', 'misleading', 'spam', 'fake', 'other']
      },
      reason: String,
      flaggedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      },
      flaggedAt: {
        type: Date,
        default: Date.now
      }
    }]
  },
  engagement: {
    likes: [{
      user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      },
      likedAt: {
        type: Date,
        default: Date.now
      }
    }],
    comments: [{
      user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
      },
      content: {
        type: String,
        required: true,
        maxlength: [500, 'Comment cannot exceed 500 characters']
      },
      createdAt: {
        type: Date,
        default: Date.now
      },
      isEdited: {
        type: Boolean,
        default: false
      },
      editedAt: Date,
      replies: [{
        user: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User',
          required: true
        },
        content: {
          type: String,
          required: true,
          maxlength: [300, 'Reply cannot exceed 300 characters']
        },
        createdAt: {
          type: Date,
          default: Date.now
        }
      }]
    }],
    shares: [{
      user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      },
      sharedAt: {
        type: Date,
        default: Date.now
      }
    }],
    views: {
      type: Number,
      default: 0
    }
  },
  isAnonymous: {
    type: Boolean,
    default: false
  },
  isVerified: {
    type: Boolean,
    default: false
  },
  verificationDetails: {
    verifiedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    verifiedAt: Date,
    verificationMethod: {
      type: String,
      enum: ['medical_record', 'doctor_confirmation', 'admin_review']
    }
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual for like count
communityReportSchema.virtual('likeCount').get(function() {
  return this.engagement?.likes?.length || 0;
});

// Virtual for comment count
communityReportSchema.virtual('commentCount').get(function() {
  return this.engagement?.comments?.length || 0;
});

// Virtual for share count
communityReportSchema.virtual('shareCount').get(function() {
  return this.engagement?.shares?.length || 0;
});

// Virtual for average rating
communityReportSchema.virtual('averageRating').get(function() {
  const ratings = [
    this.rating.overall,
    this.rating.effectiveness,
    this.rating.sideEffects,
    this.rating.cost
  ].filter(rating => rating !== undefined);
  
  if (ratings.length === 0) return 0;
  
  return ratings.reduce((sum, rating) => sum + rating, 0) / ratings.length;
});

// Index for better query performance
communityReportSchema.index({ author: 1, createdAt: -1 });
communityReportSchema.index({ category: 1, status: 1 });
communityReportSchema.index({ condition: 1 });
communityReportSchema.index({ tags: 1 });
communityReportSchema.index({ status: 1, createdAt: -1 });
communityReportSchema.index({ 'rating.overall': -1 });
communityReportSchema.index({ 'engagement.views': -1 });

// Pre-save middleware to validate data
communityReportSchema.pre('save', function(next) {
  // Validate rating consistency
  if (this.rating.overall && (this.rating.overall < 1 || this.rating.overall > 5)) {
    return next(new Error('Overall rating must be between 1 and 5'));
  }
  
  // Clean up treatmentDetails - remove if empty or invalid
  if (this.treatmentDetails) {
    // If duration is empty or invalid, remove the entire treatmentDetails
    if (!this.treatmentDetails.duration || 
        !['days', 'weeks', 'months', 'years'].includes(this.treatmentDetails.duration)) {
      this.treatmentDetails = undefined;
    } else {
      // Clean up empty values
      if (!this.treatmentDetails.durationValue || this.treatmentDetails.durationValue <= 0) {
        this.treatmentDetails.durationValue = undefined;
      }
      if (!this.treatmentDetails.cost || this.treatmentDetails.cost <= 0) {
        this.treatmentDetails.cost = undefined;
      }
      if (!this.treatmentDetails.sideEffects || this.treatmentDetails.sideEffects.length === 0) {
        this.treatmentDetails.sideEffects = undefined;
      }
      if (!this.treatmentDetails.improvements || this.treatmentDetails.improvements.length === 0) {
        this.treatmentDetails.improvements = undefined;
      }
      if (!this.treatmentDetails.challenges || this.treatmentDetails.challenges.length === 0) {
        this.treatmentDetails.challenges = undefined;
      }
    }
  }
  
  // Validate treatment duration
  if (this.treatmentDetails && this.treatmentDetails.duration && this.treatmentDetails.durationValue) {
    if (this.treatmentDetails.durationValue < 1) {
      return next(new Error('Treatment duration value must be at least 1'));
    }
  }
  
  next();
});

// Static method to get trending reports
communityReportSchema.statics.getTrendingReports = function(limit = 10) {
  return this.aggregate([
    {
      $match: {
        status: 'approved',
        createdAt: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } // Last 30 days
      }
    },
    {
      $addFields: {
        engagementScore: {
          $add: [
            { $multiply: [{ $size: '$engagement.likes' }, 2] },
            { $multiply: [{ $size: '$engagement.comments' }, 3] },
            { $multiply: [{ $size: '$engagement.shares' }, 1] },
            { $multiply: ['$engagement.views', 0.1] }
          ]
        }
      }
    },
    {
      $sort: { engagementScore: -1 }
    },
    {
      $limit: limit
    },
    {
      $lookup: {
        from: 'users',
        localField: 'author',
        foreignField: '_id',
        as: 'author'
      }
    },
    {
      $unwind: '$author'
    }
  ]);
};

// Instance method to add like
communityReportSchema.methods.addLike = function(userId) {
  const existingLike = this.engagement.likes.find(like => like.user.toString() === userId.toString());
  
  if (existingLike) {
    this.engagement.likes = this.engagement.likes.filter(like => like.user.toString() !== userId.toString());
    return false; // Like removed
  } else {
    this.engagement.likes.push({ user: userId });
    return true; // Like added
  }
};

// Instance method to add comment
communityReportSchema.methods.addComment = function(userId, content) {
  this.engagement.comments.push({
    user: userId,
    content: content
  });
  return this.engagement.comments[this.engagement.comments.length - 1];
};

module.exports = mongoose.model('CommunityReport', communityReportSchema);
