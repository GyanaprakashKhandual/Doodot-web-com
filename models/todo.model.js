const mongoose = require('mongoose');

// Sub-todo schema (recursive/nested)
const subTodoSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Sub-todo title is required'],
      trim: true,
      maxlength: [200, 'Sub-todo title cannot exceed 200 characters']
    },
    description: {
      type: String,
      trim: true,
      maxlength: [1000, 'Sub-todo description cannot exceed 1000 characters']
    },
    status: {
      type: String,
      enum: ['todo', 'in-progress', 'completed', 'blocked', 'on-hold'],
      default: 'todo'
    },
    priority: {
      type: String,
      enum: ['low', 'medium', 'high', 'urgent'],
      default: 'medium'
    },
    completed: {
      type: Boolean,
      default: false
    },
    completedAt: {
      type: Date,
      default: null
    },
    dueDate: {
      type: Date,
      default: null
    },
    reminder: {
      type: Date,
      default: null
    },
    estimatedTime: {
      type: Number, // in minutes
      default: 0
    },
    actualTime: {
      type: Number, // in minutes
      default: 0
    },
    tags: [
      {
        type: String,
        trim: true
      }
    ],
    assignee: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null
    },
    attachments: [
      {
        url: String,
        fileName: String,
        fileType: String,
        uploadedAt: {
          type: Date,
          default: Date.now
        }
      }
    ],
    comments: [
      {
        userId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User'
        },
        text: String,
        createdAt: {
          type: Date,
          default: Date.now
        }
      }
    ],
    subtasks: [this], // Recursive reference for infinite nesting
    isArchived: {
      type: Boolean,
      default: false
    },
    order: {
      type: Number,
      default: 0
    }
  },
  { timestamps: true, _id: true }
);

// Main todo schema
const todoSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User ID is required'],
      index: true
    },
    
    title: {
      type: String,
      required: [true, 'Todo title is required'],
      trim: true,
      maxlength: [200, 'Todo title cannot exceed 200 characters']
    },
    
    description: {
      type: String,
      trim: true,
      maxlength: [2000, 'Todo description cannot exceed 2000 characters']
    },
    
    // Status tracking
    status: {
      type: String,
      enum: ['todo', 'in-progress', 'completed', 'blocked', 'on-hold'],
      default: 'todo',
      index: true
    },
    
    // Priority levels
    priority: {
      type: String,
      enum: ['low', 'medium', 'high', 'urgent'],
      default: 'medium',
      index: true
    },
    
    // Completion tracking
    completed: {
      type: Boolean,
      default: false,
      index: true
    },
    
    completedAt: {
      type: Date,
      default: null
    },
    
    // Timeline
    dueDate: {
      type: Date,
      default: null
    },
    
    startDate: {
      type: Date,
      default: null
    },
    
    reminder: {
      type: Date,
      default: null
    },
    
    // Time tracking
    estimatedTime: {
      type: Number, // in minutes
      default: 0
    },
    
    actualTime: {
      type: Number, // in minutes
      default: 0
    },
    
    // Categorization
    category: {
      type: String,
      trim: true,
      default: 'general'
    },
    
    tags: [
      {
        type: String,
        trim: true,
        maxlength: [50, 'Tag cannot exceed 50 characters']
      }
    ],
    
    // Recurring todos
    recurring: {
      isRecurring: {
        type: Boolean,
        default: false
      },
      frequency: {
        type: String,
        enum: ['daily', 'weekly', 'bi-weekly', 'monthly', 'yearly', null],
        default: null
      },
      endDate: Date,
      occurrences: {
        type: Number,
        default: 0
      }
    },
    
    // Collaboration
    assignee: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null
    },
    
    watchers: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      }
    ],
    
    // Attachments
    attachments: [
      {
        url: {
          type: String,
          required: true
        },
        fileName: String,
        fileType: String,
        fileSize: Number, // in bytes
        uploadedBy: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User'
        },
        uploadedAt: {
          type: Date,
          default: Date.now
        }
      }
    ],
    
    // Comments/Notes
    comments: [
      {
        userId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User',
          required: true
        },
        text: {
          type: String,
          required: true,
          maxlength: [1000, 'Comment cannot exceed 1000 characters']
        },
        mentions: [
          {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
          }
        ],
        createdAt: {
          type: Date,
          default: Date.now
        },
        updatedAt: Date
      }
    ],
    
    // Activity log
    activityLog: [
      {
        action: {
          type: String,
          enum: ['created', 'updated', 'commented', 'completed', 'status-changed', 'assigned', 'priority-changed'],
          required: true
        },
        userId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User'
        },
        changes: mongoose.Schema.Types.Mixed,
        timestamp: {
          type: Date,
          default: Date.now
        }
      }
    ],
    
    // Hierarchical subtasks (infinite nesting)
    subtasks: [subTodoSchema],
    
    // Parent task reference (for standalone queries)
    parentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Todo',
      default: null
    },
    
    // Related todos
    relatedTodos: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Todo'
      }
    ],
    
    // Checklist progress
    checklistProgress: {
      total: {
        type: Number,
        default: 0
      },
      completed: {
        type: Number,
        default: 0
      }
    },
    
    // Custom fields (for extensibility)
    customFields: {
      type: Map,
      of: mongoose.Schema.Types.Mixed,
      default: new Map()
    },
    
    // Visibility and sharing
    isPublic: {
      type: Boolean,
      default: false
    },
    
    sharedWith: [
      {
        userId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User'
        },
        permissions: {
          type: String,
          enum: ['view', 'edit', 'admin'],
          default: 'view'
        },
        sharedAt: {
          type: Date,
          default: Date.now
        }
      }
    ],
    
    // Archive and deletion
    isArchived: {
      type: Boolean,
      default: false,
      index: true
    },
    
    isDeleted: {
      type: Boolean,
      default: false,
      index: true
    },
    
    deletedAt: Date,
    
    // Order/Position
    order: {
      type: Number,
      default: 0
    },
    
    // Labels/color coding
    label: {
      type: String,
      enum: ['red', 'blue', 'green', 'yellow', 'purple', 'orange', 'pink', 'gray', null],
      default: null
    },
    
    // Notifications
    notificationSettings: {
      notifyOnDueDate: {
        type: Boolean,
        default: true
      },
      notifyOnStatusChange: {
        type: Boolean,
        default: true
      },
      notifyOnComment: {
        type: Boolean,
        default: true
      }
    }
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

// ============ VIRTUAL FIELDS ============

// Calculate total subtasks
todoSchema.virtual('totalSubtasks').get(function() {
  const countSubtasks = (tasks) => {
    let count = tasks.length;
    tasks.forEach(task => {
      if (task.subtasks && task.subtasks.length > 0) {
        count += countSubtasks(task.subtasks);
      }
    });
    return count;
  };
  return countSubtasks(this.subtasks);
});

// Calculate completion percentage
todoSchema.virtual('completionPercentage').get(function() {
  if (this.checklistProgress.total === 0) return 0;
  return Math.round((this.checklistProgress.completed / this.checklistProgress.total) * 100);
});

// Check if overdue
todoSchema.virtual('isOverdue').get(function() {
  if (!this.dueDate) return false;
  return this.dueDate < new Date() && !this.completed;
});

// Days until due
todoSchema.virtual('daysUntilDue').get(function() {
  if (!this.dueDate) return null;
  const diff = this.dueDate - new Date();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
});

// ============ INDEXES ============

todoSchema.index({ userId: 1, status: 1 });
todoSchema.index({ userId: 1, priority: 1 });
todoSchema.index({ userId: 1, dueDate: 1 });
todoSchema.index({ userId: 1, isArchived: 1 });
todoSchema.index({ userId: 1, createdAt: -1 });
todoSchema.index({ assignee: 1 });
todoSchema.index({ parentId: 1 });
todoSchema.index({ 'tags': 1 });

// ============ MIDDLEWARE ============

// Before saving, calculate checklist progress
todoSchema.pre('save', function(next) {
  const calculateProgress = (tasks) => {
    let total = 0;
    let completed = 0;
    
    tasks.forEach(task => {
      total++;
      if (task.completed) completed++;
      
      if (task.subtasks && task.subtasks.length > 0) {
        const progress = calculateProgress(task.subtasks);
        total += progress.total;
        completed += progress.completed;
      }
    });
    
    return { total, completed };
  };
  
  const progress = calculateProgress(this.subtasks);
  this.checklistProgress = progress;
  
  next();
});

// Log activity on save
todoSchema.pre('save', function(next) {
  if (this.isModified() && !this.isNew) {
    if (!this.activityLog) this.activityLog = [];
    
    this.activityLog.push({
      action: 'updated',
      userId: this.userId,
      timestamp: new Date()
    });
  }
  next();
});

// ============ INSTANCE METHODS ============

// Mark todo as completed
todoSchema.methods.complete = function() {
  this.completed = true;
  this.status = 'completed';
  this.completedAt = new Date();
  return this.save();
};

// Mark todo as incomplete
todoSchema.methods.incomplete = function() {
  this.completed = false;
  this.status = 'todo';
  this.completedAt = null;
  return this.save();
};

// Add subtask
todoSchema.methods.addSubtask = function(subtaskData) {
  if (!this.subtasks) this.subtasks = [];
  this.subtasks.push(subtaskData);
  return this.save();
};

// Get all subtasks recursively
todoSchema.methods.getAllSubtasks = function(tasks = this.subtasks, result = []) {
  tasks.forEach(task => {
    result.push(task);
    if (task.subtasks && task.subtasks.length > 0) {
      this.getAllSubtasks(task.subtasks, result);
    }
  });
  return result;
};

// ============ STATIC METHODS ============

// Find todos by user and status
todoSchema.statics.findByUserAndStatus = function(userId, status) {
  return this.find({ userId, status, isDeleted: false });
};

// Find overdue todos
todoSchema.statics.findOverdue = function(userId) {
  return this.find({
    userId,
    dueDate: { $lt: new Date() },
    completed: false,
    isDeleted: false
  });
};

// Find todos by priority
todoSchema.statics.findByPriority = function(userId, priority) {
  return this.find({ userId, priority, isDeleted: false });
};

// Soft delete
todoSchema.statics.softDelete = function(todoId) {
  return this.findByIdAndUpdate(
    todoId,
    { isDeleted: true, deletedAt: new Date() },
    { new: true }
  );
};

// ============ CREATE MODEL ============

const Todo = mongoose.model('Todo', todoSchema);

module.exports = Todo;