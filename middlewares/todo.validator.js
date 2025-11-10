const { ApiError } = require('../middlewares/api.error');

/**
 * Validate todo creation/update
 * Checks required fields and data types
 */
const validateTodo = (req, res, next) => {
  try {
    const { title, description, priority, status, dueDate, category, tags, estimatedTime } = req.body;

    // Title is required
    if (!title) {
      throw new ApiError(400, 'Todo title is required');
    }

    // Title validation
    if (typeof title !== 'string') {
      throw new ApiError(400, 'Title must be a string');
    }

    if (title.trim().length === 0) {
      throw new ApiError(400, 'Title cannot be empty');
    }

    if (title.length < 3) {
      throw new ApiError(400, 'Title must be at least 3 characters long');
    }

    if (title.length > 200) {
      throw new ApiError(400, 'Title cannot exceed 200 characters');
    }

    // Description validation (optional)
    if (description !== undefined) {
      if (typeof description !== 'string') {
        throw new ApiError(400, 'Description must be a string');
      }

      if (description.length > 2000) {
        throw new ApiError(400, 'Description cannot exceed 2000 characters');
      }
    }

    // Priority validation (optional)
    if (priority !== undefined) {
      const validPriorities = ['low', 'medium', 'high', 'urgent'];
      if (!validPriorities.includes(priority)) {
        throw new ApiError(400, `Priority must be one of: ${validPriorities.join(', ')}`);
      }
    }

    // Status validation (optional)
    if (status !== undefined) {
      const validStatuses = ['todo', 'in-progress', 'completed', 'blocked', 'on-hold'];
      if (!validStatuses.includes(status)) {
        throw new ApiError(400, `Status must be one of: ${validStatuses.join(', ')}`);
      }
    }

    // Due date validation (optional)
    if (dueDate !== undefined) {
      const dueDateObj = new Date(dueDate);
      if (isNaN(dueDateObj.getTime())) {
        throw new ApiError(400, 'Invalid due date format');
      }

      // Due date should not be in the past
      if (dueDateObj < new Date()) {
        throw new ApiError(400, 'Due date cannot be in the past');
      }
    }

    // Category validation (optional)
    if (category !== undefined) {
      if (typeof category !== 'string') {
        throw new ApiError(400, 'Category must be a string');
      }

      if (category.length > 50) {
        throw new ApiError(400, 'Category cannot exceed 50 characters');
      }
    }

    // Tags validation (optional)
    if (tags !== undefined) {
      if (!Array.isArray(tags)) {
        throw new ApiError(400, 'Tags must be an array');
      }

      if (tags.length > 20) {
        throw new ApiError(400, 'Cannot have more than 20 tags');
      }

      // Validate each tag
      tags.forEach((tag, index) => {
        if (typeof tag !== 'string') {
          throw new ApiError(400, `Tag at index ${index} must be a string`);
        }

        if (tag.trim().length === 0) {
          throw new ApiError(400, `Tag at index ${index} cannot be empty`);
        }

        if (tag.length > 50) {
          throw new ApiError(400, `Tag at index ${index} cannot exceed 50 characters`);
        }
      });
    }

    // Estimated time validation (optional, in minutes)
    if (estimatedTime !== undefined) {
      if (typeof estimatedTime !== 'number') {
        throw new ApiError(400, 'Estimated time must be a number');
      }

      if (estimatedTime < 0) {
        throw new ApiError(400, 'Estimated time cannot be negative');
      }

      if (estimatedTime > 525600) { // More than 1 year
        throw new ApiError(400, 'Estimated time seems too large');
      }
    }

    next();
  } catch (error) {
    next(error);
  }
};

/**
 * Validate subtask creation/update
 */
const validateSubtask = (req, res, next) => {
  try {
    const { title, description, priority, dueDate, estimatedTime, status, completed } = req.body;

    // Title is required for subtasks
    if (!title) {
      throw new ApiError(400, 'Subtask title is required');
    }

    // Title validation
    if (typeof title !== 'string') {
      throw new ApiError(400, 'Subtask title must be a string');
    }

    if (title.trim().length === 0) {
      throw new ApiError(400, 'Subtask title cannot be empty');
    }

    if (title.length < 3) {
      throw new ApiError(400, 'Subtask title must be at least 3 characters long');
    }

    if (title.length > 200) {
      throw new ApiError(400, 'Subtask title cannot exceed 200 characters');
    }

    // Description validation (optional)
    if (description !== undefined) {
      if (typeof description !== 'string') {
        throw new ApiError(400, 'Subtask description must be a string');
      }

      if (description.length > 1000) {
        throw new ApiError(400, 'Subtask description cannot exceed 1000 characters');
      }
    }

    // Priority validation (optional)
    if (priority !== undefined) {
      const validPriorities = ['low', 'medium', 'high', 'urgent'];
      if (!validPriorities.includes(priority)) {
        throw new ApiError(400, `Priority must be one of: ${validPriorities.join(', ')}`);
      }
    }

    // Status validation (optional)
    if (status !== undefined) {
      const validStatuses = ['todo', 'in-progress', 'completed', 'blocked', 'on-hold'];
      if (!validStatuses.includes(status)) {
        throw new ApiError(400, `Status must be one of: ${validStatuses.join(', ')}`);
      }
    }

    // Due date validation (optional)
    if (dueDate !== undefined) {
      const dueDateObj = new Date(dueDate);
      if (isNaN(dueDateObj.getTime())) {
        throw new ApiError(400, 'Invalid due date format');
      }
    }

    // Completed status validation (optional)
    if (completed !== undefined) {
      if (typeof completed !== 'boolean') {
        throw new ApiError(400, 'Completed must be a boolean');
      }
    }

    // Estimated time validation (optional)
    if (estimatedTime !== undefined) {
      if (typeof estimatedTime !== 'number') {
        throw new ApiError(400, 'Estimated time must be a number');
      }

      if (estimatedTime < 0) {
        throw new ApiError(400, 'Estimated time cannot be negative');
      }
    }

    next();
  } catch (error) {
    next(error);
  }
};

/**
 * Validate comment
 */
const validateComment = (req, res, next) => {
  try {
    const { text } = req.body;

    if (!text) {
      throw new ApiError(400, 'Comment text is required');
    }

    if (typeof text !== 'string') {
      throw new ApiError(400, 'Comment must be a string');
    }

    if (text.trim().length === 0) {
      throw new ApiError(400, 'Comment cannot be empty');
    }

    if (text.length < 2) {
      throw new ApiError(400, 'Comment must be at least 2 characters long');
    }

    if (text.length > 1000) {
      throw new ApiError(400, 'Comment cannot exceed 1000 characters');
    }

    next();
  } catch (error) {
    next(error);
  }
};

/**
 * Validate attachment data
 */
const validateAttachment = (req, res, next) => {
  try {
    const { url, fileName, fileType, fileSize } = req.body;

    if (!url) {
      throw new ApiError(400, 'File URL is required');
    }

    if (typeof url !== 'string') {
      throw new ApiError(400, 'File URL must be a string');
    }

    // Validate URL format
    try {
      new URL(url);
    } catch (error) {
      throw new ApiError(400, 'Invalid file URL format');
    }

    if (!fileName) {
      throw new ApiError(400, 'File name is required');
    }

    if (typeof fileName !== 'string') {
      throw new ApiError(400, 'File name must be a string');
    }

    if (fileName.trim().length === 0) {
      throw new ApiError(400, 'File name cannot be empty');
    }

    if (fileName.length > 255) {
      throw new ApiError(400, 'File name cannot exceed 255 characters');
    }

    // File type validation (optional)
    if (fileType !== undefined) {
      if (typeof fileType !== 'string') {
        throw new ApiError(400, 'File type must be a string');
      }

      const validTypes = ['image', 'document', 'video', 'audio', 'archive', 'code', 'file'];
      if (!validTypes.includes(fileType)) {
        throw new ApiError(400, `File type must be one of: ${validTypes.join(', ')}`);
      }
    }

    // File size validation (optional, in bytes)
    if (fileSize !== undefined) {
      if (typeof fileSize !== 'number') {
        throw new ApiError(400, 'File size must be a number');
      }

      if (fileSize < 0) {
        throw new ApiError(400, 'File size cannot be negative');
      }

      const maxFileSize = 100 * 1024 * 1024; // 100MB
      if (fileSize > maxFileSize) {
        throw new ApiError(400, 'File size cannot exceed 100MB');
      }
    }

    next();
  } catch (error) {
    next(error);
  }
};

/**
 * Validate time tracking data
 */
const validateTimeTracking = (req, res, next) => {
  try {
    const { timeSpent } = req.body;

    if (timeSpent === undefined) {
      throw new ApiError(400, 'Time spent is required');
    }

    if (typeof timeSpent !== 'number') {
      throw new ApiError(400, 'Time spent must be a number (in minutes)');
    }

    if (timeSpent <= 0) {
      throw new ApiError(400, 'Time spent must be greater than 0');
    }

    if (timeSpent > 1440) { // 24 hours
      throw new ApiError(400, 'Time spent cannot exceed 24 hours (1440 minutes)');
    }

    if (!Number.isInteger(timeSpent)) {
      throw new ApiError(400, 'Time spent must be a whole number');
    }

    next();
  } catch (error) {
    next(error);
  }
};

/**
 * Validate todo assignment
 */
const validateAssignment = (req, res, next) => {
  try {
    const { assigneeId } = req.body;

    if (!assigneeId) {
      throw new ApiError(400, 'Assignee ID is required');
    }

    if (typeof assigneeId !== 'string') {
      throw new ApiError(400, 'Assignee ID must be a string');
    }

    if (assigneeId.trim().length === 0) {
      throw new ApiError(400, 'Assignee ID cannot be empty');
    }

    // Validate MongoDB ObjectId format
    if (!assigneeId.match(/^[0-9a-fA-F]{24}$/)) {
      throw new ApiError(400, 'Invalid assignee ID format');
    }

    next();
  } catch (error) {
    next(error);
  }
};

/**
 * Validate todo sharing
 */
const validateSharing = (req, res, next) => {
  try {
    const { userId, permissions } = req.body;

    if (!userId) {
      throw new ApiError(400, 'User ID is required');
    }

    if (typeof userId !== 'string') {
      throw new ApiError(400, 'User ID must be a string');
    }

    // Validate MongoDB ObjectId format
    if (!userId.match(/^[0-9a-fA-F]{24}$/)) {
      throw new ApiError(400, 'Invalid user ID format');
    }

    // Permissions validation (optional, defaults to 'view')
    if (permissions !== undefined) {
      const validPermissions = ['view', 'edit', 'admin'];
      if (!validPermissions.includes(permissions)) {
        throw new ApiError(400, `Permissions must be one of: ${validPermissions.join(', ')}`);
      }
    }

    next();
  } catch (error) {
    next(error);
  }
};

/**
 * Validate bulk operations
 */
const validateBulkUpdate = (req, res, next) => {
  try {
    const { todoIds, updates } = req.body;

    if (!todoIds) {
      throw new ApiError(400, 'Todo IDs are required');
    }

    if (!Array.isArray(todoIds)) {
      throw new ApiError(400, 'Todo IDs must be an array');
    }

    if (todoIds.length === 0) {
      throw new ApiError(400, 'At least one todo ID is required');
    }

    if (todoIds.length > 100) {
      throw new ApiError(400, 'Cannot update more than 100 todos at once');
    }

    // Validate each todo ID
    todoIds.forEach((id, index) => {
      if (typeof id !== 'string') {
        throw new ApiError(400, `Todo ID at index ${index} must be a string`);
      }

      if (!id.match(/^[0-9a-fA-F]{24}$/)) {
        throw new ApiError(400, `Invalid todo ID format at index ${index}`);
      }
    });

    if (!updates) {
      throw new ApiError(400, 'Updates object is required');
    }

    if (typeof updates !== 'object' || Array.isArray(updates)) {
      throw new ApiError(400, 'Updates must be an object');
    }

    if (Object.keys(updates).length === 0) {
      throw new ApiError(400, 'At least one field must be updated');
    }

    // Validate allowed update fields
    const allowedFields = ['title', 'description', 'status', 'priority', 'category', 'tags', 'dueDate', 'label'];
    for (const key of Object.keys(updates)) {
      if (!allowedFields.includes(key)) {
        throw new ApiError(400, `Invalid field to update: ${key}`);
      }
    }

    next();
  } catch (error) {
    next(error);
  }
};

/**
 * Validate bulk delete
 */
const validateBulkDelete = (req, res, next) => {
  try {
    const { todoIds } = req.body;

    if (!todoIds) {
      throw new ApiError(400, 'Todo IDs are required');
    }

    if (!Array.isArray(todoIds)) {
      throw new ApiError(400, 'Todo IDs must be an array');
    }

    if (todoIds.length === 0) {
      throw new ApiError(400, 'At least one todo ID is required');
    }

    if (todoIds.length > 100) {
      throw new ApiError(400, 'Cannot delete more than 100 todos at once');
    }

    // Validate each todo ID
    todoIds.forEach((id, index) => {
      if (typeof id !== 'string') {
        throw new ApiError(400, `Todo ID at index ${index} must be a string`);
      }

      if (!id.match(/^[0-9a-fA-F]{24}$/)) {
        throw new ApiError(400, `Invalid todo ID format at index ${index}`);
      }
    });

    next();
  } catch (error) {
    next(error);
  }
};

/**
 * Validate search query
 */
const validateSearch = (req, res, next) => {
  try {
    const { query } = req.params;

    if (!query) {
      throw new ApiError(400, 'Search query is required');
    }

    if (typeof query !== 'string') {
      throw new ApiError(400, 'Search query must be a string');
    }

    if (query.trim().length < 2) {
      throw new ApiError(400, 'Search query must be at least 2 characters long');
    }

    if (query.length > 100) {
      throw new ApiError(400, 'Search query cannot exceed 100 characters');
    }

    next();
  } catch (error) {
    next(error);
  }
};

/**
 * Validate watcher
 */
const validateWatcher = (req, res, next) => {
  try {
    const { watcherId } = req.body;

    if (!watcherId) {
      throw new ApiError(400, 'Watcher ID is required');
    }

    if (typeof watcherId !== 'string') {
      throw new ApiError(400, 'Watcher ID must be a string');
    }

    // Validate MongoDB ObjectId format
    if (!watcherId.match(/^[0-9a-fA-F]{24}$/)) {
      throw new ApiError(400, 'Invalid watcher ID format');
    }

    next();
  } catch (error) {
    next(error);
  }
};

module.exports = {
  validateTodo,
  validateSubtask,
  validateComment,
  validateAttachment,
  validateTimeTracking,
  validateAssignment,
  validateSharing,
  validateBulkUpdate,
  validateBulkDelete,
  validateSearch,
  validateWatcher
};