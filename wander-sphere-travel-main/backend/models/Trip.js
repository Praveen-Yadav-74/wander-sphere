const mongoose = require('mongoose');

const tripSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Trip title is required'],
    trim: true,
    maxlength: [100, 'Trip title cannot exceed 100 characters']
  },
  description: {
    type: String,
    required: [true, 'Trip description is required'],
    maxlength: [2000, 'Description cannot exceed 2000 characters']
  },
  destination: {
    country: {
      type: String,
      required: [true, 'Country is required']
    },
    city: {
      type: String,
      required: [true, 'City is required']
    },
    coordinates: {
      latitude: {
        type: Number,
        required: true
      },
      longitude: {
        type: Number,
        required: true
      }
    },
    address: {
      type: String,
      default: ''
    }
  },
  dates: {
    startDate: {
      type: Date,
      required: [true, 'Start date is required']
    },
    endDate: {
      type: Date,
      required: [true, 'End date is required']
    },
    duration: {
      type: Number, // in days
      required: true
    }
  },
  budget: {
    total: {
      type: Number,
      required: [true, 'Total budget is required'],
      min: [0, 'Budget cannot be negative']
    },
    currency: {
      type: String,
      required: true,
      default: 'USD'
    },
    breakdown: {
      accommodation: {
        type: Number,
        default: 0
      },
      transportation: {
        type: Number,
        default: 0
      },
      food: {
        type: Number,
        default: 0
      },
      activities: {
        type: Number,
        default: 0
      },
      shopping: {
        type: Number,
        default: 0
      },
      miscellaneous: {
        type: Number,
        default: 0
      }
    },
    spent: {
      type: Number,
      default: 0
    }
  },
  organizer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  participants: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    status: {
      type: String,
      enum: ['pending', 'accepted', 'declined'],
      default: 'pending'
    },
    joinedAt: {
      type: Date,
      default: Date.now
    },
    role: {
      type: String,
      enum: ['organizer', 'co-organizer', 'participant'],
      default: 'participant'
    }
  }],
  maxParticipants: {
    type: Number,
    required: [true, 'Maximum participants is required'],
    min: [1, 'At least 1 participant is required'],
    max: [50, 'Cannot exceed 50 participants']
  },
  itinerary: [{
    day: {
      type: Number,
      required: true
    },
    date: {
      type: Date,
      required: true
    },
    activities: [{
      time: {
        type: String,
        required: true
      },
      title: {
        type: String,
        required: true,
        maxlength: [200, 'Activity title cannot exceed 200 characters']
      },
      description: {
        type: String,
        maxlength: [500, 'Activity description cannot exceed 500 characters']
      },
      location: {
        name: String,
        coordinates: {
          latitude: Number,
          longitude: Number
        }
      },
      estimatedCost: {
        type: Number,
        default: 0
      },
      category: {
        type: String,
        enum: ['accommodation', 'transportation', 'food', 'sightseeing', 'activity', 'shopping', 'other'],
        default: 'activity'
      }
    }]
  }],
  images: [{
    url: {
      type: String,
      required: true
    },
    caption: {
      type: String,
      maxlength: [200, 'Caption cannot exceed 200 characters']
    },
    uploadedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    uploadedAt: {
      type: Date,
      default: Date.now
    }
  }],
  tags: [{
    type: String,
    lowercase: true,
    trim: true
  }],
  category: {
    type: String,
    enum: ['adventure', 'relaxation', 'cultural', 'business', 'family', 'romantic', 'solo', 'group'],
    required: true
  },
  difficulty: {
    type: String,
    enum: ['easy', 'moderate', 'challenging', 'extreme'],
    default: 'easy'
  },
  status: {
    type: String,
    enum: ['planning', 'confirmed', 'ongoing', 'completed', 'cancelled'],
    default: 'planning'
  },
  visibility: {
    type: String,
    enum: ['public', 'friends', 'private'],
    default: 'public'
  },
  requirements: {
    ageRestriction: {
      min: {
        type: Number,
        default: 0
      },
      max: {
        type: Number,
        default: 100
      }
    },
    fitnessLevel: {
      type: String,
      enum: ['low', 'moderate', 'high'],
      default: 'low'
    },
    specialRequirements: [{
      type: String
    }]
  },
  social: {
    likes: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
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
      likes: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      }]
    }],
    shares: {
      type: Number,
      default: 0
    },
    views: {
      type: Number,
      default: 0
    }
  },
  isActive: {
    type: Boolean,
    default: true
  },
  featured: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual for participant count
tripSchema.virtual('participantCount').get(function() {
  return this.participants.filter(p => p.status === 'accepted').length;
});

// Virtual for like count
tripSchema.virtual('likeCount').get(function() {
  return this.social.likes.length;
});

// Virtual for comment count
tripSchema.virtual('commentCount').get(function() {
  return this.social.comments.length;
});

// Virtual for availability
tripSchema.virtual('spotsAvailable').get(function() {
  return this.maxParticipants - this.participantCount;
});

// Virtual for trip status based on dates
tripSchema.virtual('currentStatus').get(function() {
  const now = new Date();
  const startDate = new Date(this.dates.startDate);
  const endDate = new Date(this.dates.endDate);
  
  if (this.status === 'cancelled') return 'cancelled';
  if (now < startDate) return 'upcoming';
  if (now >= startDate && now <= endDate) return 'ongoing';
  if (now > endDate) return 'completed';
  return this.status;
});

// Indexes for better query performance
tripSchema.index({ 'destination.country': 1, 'destination.city': 1 });
tripSchema.index({ 'dates.startDate': 1, 'dates.endDate': 1 });
tripSchema.index({ organizer: 1 });
tripSchema.index({ status: 1 });
tripSchema.index({ category: 1 });
tripSchema.index({ tags: 1 });
tripSchema.index({ featured: 1, createdAt: -1 });
tripSchema.index({ 'destination.coordinates': '2dsphere' });
tripSchema.index({ createdAt: -1 });

// Pre-save middleware to calculate duration
tripSchema.pre('save', function(next) {
  if (this.isModified('dates.startDate') || this.isModified('dates.endDate')) {
    const start = new Date(this.dates.startDate);
    const end = new Date(this.dates.endDate);
    this.dates.duration = Math.ceil((end - start) / (1000 * 60 * 60 * 24)) + 1;
  }
  next();
});

// Method to add participant
tripSchema.methods.addParticipant = function(userId, role = 'participant') {
  const existingParticipant = this.participants.find(p => p.user.toString() === userId.toString());
  
  if (existingParticipant) {
    throw new Error('User is already a participant');
  }
  
  if (this.participantCount >= this.maxParticipants) {
    throw new Error('Trip is full');
  }
  
  this.participants.push({
    user: userId,
    status: 'accepted',
    role: role
  });
  
  return this.save();
};

// Method to remove participant
tripSchema.methods.removeParticipant = function(userId) {
  this.participants = this.participants.filter(p => p.user.toString() !== userId.toString());
  return this.save();
};

// Method to update participant status
tripSchema.methods.updateParticipantStatus = function(userId, status) {
  const participant = this.participants.find(p => p.user.toString() === userId.toString());
  
  if (!participant) {
    throw new Error('Participant not found');
  }
  
  participant.status = status;
  return this.save();
};

// Method to add like
tripSchema.methods.addLike = function(userId) {
  if (!this.social.likes.includes(userId)) {
    this.social.likes.push(userId);
  }
  return this.save();
};

// Method to remove like
tripSchema.methods.removeLike = function(userId) {
  this.social.likes = this.social.likes.filter(id => id.toString() !== userId.toString());
  return this.save();
};

// Method to add comment
tripSchema.methods.addComment = function(userId, content) {
  this.social.comments.push({
    user: userId,
    content: content
  });
  return this.save();
};

// Method to increment views
tripSchema.methods.incrementViews = function() {
  this.social.views += 1;
  return this.save();
};

module.exports = mongoose.model('Trip', tripSchema);