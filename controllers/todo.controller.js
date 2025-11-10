const Todo = require('../models/todo.model');
const User = require('../models/user.model');
const { ApiError } = require('../middlewares/api.error');
const { ApiResponse } = require('../utils/api.response');

/**
 * Create a new todo
 * @route POST /api/todos
 */
const createTodo = async (req, res, next) => {
    try {
        const { title, description, priority, dueDate, category, tags } = req.body;
        const userId = req.userId;

        if (!title) {
            throw new ApiError(400, 'Todo title is required');
        }

        const todo = await Todo.create({
            userId,
            title,
            description: description || '',
            priority: priority || 'medium',
            dueDate: dueDate ? new Date(dueDate) : null,
            category: category || 'general',
            tags: tags || [],
            status: 'todo',
            activityLog: [
                {
                    action: 'created',
                    userId,
                    timestamp: new Date()
                }
            ]
        });

        res.status(201).json(new ApiResponse(
            201,
            todo,
            'Todo created successfully'
        ));
    } catch (error) {
        next(error);
    }
};

/**
 * Add a subtask to a todo
 * @route POST /api/todos/:todoId/subtasks
 */
const addSubtask = async (req, res, next) => {
    try {
        const { todoId } = req.params;
        const { title, description, priority, dueDate } = req.body;
        const userId = req.userId;

        if (!title) {
            throw new ApiError(400, 'Subtask title is required');
        }

        const todo = await Todo.findById(todoId);

        if (!todo) {
            throw new ApiError(404, 'Todo not found');
        }

        // Check permission
        if (todo.userId.toString() !== userId && !todo.sharedWith.some(s => s.userId.toString() === userId)) {
            throw new ApiError(403, 'Permission denied');
        }

        const newSubtask = {
            title,
            description: description || '',
            priority: priority || 'medium',
            dueDate: dueDate ? new Date(dueDate) : null,
            status: 'todo',
            completed: false,
            subtasks: []
        };

        if (!todo.subtasks) {
            todo.subtasks = [];
        }

        todo.subtasks.push(newSubtask);

        // Log activity
        todo.activityLog.push({
            action: 'updated',
            userId,
            changes: { added: 'subtask' },
            timestamp: new Date()
        });

        await todo.save();

        res.status(201).json(new ApiResponse(
            201,
            todo,
            'Subtask added successfully'
        ));
    } catch (error) {
        next(error);
    }
};

// ============ GET TODOS ============

/**
 * Get all todos for a user
 * @route GET /api/todos
 */
const getAllTodos = async (req, res, next) => {
    try {
        const userId = req.userId;
        const { status, priority, category, sortBy = 'createdAt' } = req.query;

        let query = {
            userId,
            isDeleted: false,
            parentId: null // Only get main todos, not subtasks
        };

        // Apply filters
        if (status) query.status = status;
        if (priority) query.priority = priority;
        if (category) query.category = category;

        // Apply sorting
        let sortObj = {};
        if (sortBy === 'dueDate') {
            sortObj = { dueDate: 1 };
        } else if (sortBy === 'priority') {
            sortObj = { priority: -1 };
        } else if (sortBy === 'createdAt') {
            sortObj = { createdAt: -1 };
        }

        const todos = await Todo.find(query)
            .sort(sortObj)
            .populate('assignee', 'name email profilePicture')
            .populate('watchers', 'name email')
            .populate('comments.userId', 'name email profilePicture');

        res.json(new ApiResponse(
            200,
            todos,
            'Todos retrieved successfully'
        ));
    } catch (error) {
        next(error);
    }
};

/**
 * Get a single todo by ID
 * @route GET /api/todos/:todoId
 */
const getTodoById = async (req, res, next) => {
    try {
        const { todoId } = req.params;
        const userId = req.userId;

        const todo = await Todo.findById(todoId)
            .populate('userId', 'name email profilePicture')
            .populate('assignee', 'name email profilePicture')
            .populate('watchers', 'name email')
            .populate('comments.userId', 'name email profilePicture')
            .populate('attachments.uploadedBy', 'name email')
            .populate('sharedWith.userId', 'name email profilePicture');

        if (!todo) {
            throw new ApiError(404, 'Todo not found');
        }

        // Check permission
        if (todo.userId.toString() !== userId && !todo.sharedWith.some(s => s.userId.toString() === userId)) {
            throw new ApiError(403, 'Permission denied');
        }

        res.json(new ApiResponse(
            200,
            todo,
            'Todo retrieved successfully'
        ));
    } catch (error) {
        next(error);
    }
};

/**
 * Get todos by status
 * @route GET /api/todos/status/:status
 */
const getTodosByStatus = async (req, res, next) => {
    try {
        const { status } = req.params;
        const userId = req.userId;

        const validStatuses = ['todo', 'in-progress', 'completed', 'blocked', 'on-hold'];
        if (!validStatuses.includes(status)) {
            throw new ApiError(400, 'Invalid status');
        }

        const todos = await Todo.findByUserAndStatus(userId, status)
            .sort({ createdAt: -1 })
            .populate('assignee', 'name email');

        res.json(new ApiResponse(
            200,
            todos,
            `${status} todos retrieved successfully`
        ));
    } catch (error) {
        next(error);
    }
};

/**
 * Get overdue todos
 * @route GET /api/todos/overdue
 */
const getOverdueTodos = async (req, res, next) => {
    try {
        const userId = req.userId;

        const todos = await Todo.findOverdue(userId)
            .sort({ dueDate: 1 })
            .populate('assignee', 'name email');

        res.json(new ApiResponse(
            200,
            todos,
            'Overdue todos retrieved successfully'
        ));
    } catch (error) {
        next(error);
    }
};

/**
 * Get todos by priority
 * @route GET /api/todos/priority/:priority
 */
const getTodosByPriority = async (req, res, next) => {
    try {
        const { priority } = req.params;
        const userId = req.userId;

        const validPriorities = ['low', 'medium', 'high', 'urgent'];
        if (!validPriorities.includes(priority)) {
            throw new ApiError(400, 'Invalid priority');
        }

        const todos = await Todo.findByPriority(userId, priority)
            .sort({ dueDate: 1 });

        res.json(new ApiResponse(
            200,
            todos,
            `${priority} priority todos retrieved successfully`
        ));
    } catch (error) {
        next(error);
    }
};

/**
 * Get archived todos
 * @route GET /api/todos/archived
 */
const getArchivedTodos = async (req, res, next) => {
    try {
        const userId = req.userId;

        const todos = await Todo.find({
            userId,
            isArchived: true,
            isDeleted: false
        }).sort({ updatedAt: -1 });

        res.json(new ApiResponse(
            200,
            todos,
            'Archived todos retrieved successfully'
        ));
    } catch (error) {
        next(error);
    }
};

// ============ UPDATE TODOS ============

/**
 * Update a todo
 * @route PATCH /api/todos/:todoId
 */
const updateTodo = async (req, res, next) => {
    try {
        const { todoId } = req.params;
        const { title, description, status, priority, dueDate, category, tags, label } = req.body;
        const userId = req.userId;

        const todo = await Todo.findById(todoId);

        if (!todo) {
            throw new ApiError(404, 'Todo not found');
        }

        // Check permission
        if (todo.userId.toString() !== userId) {
            throw new ApiError(403, 'Permission denied');
        }

        // Store old values for activity log
        const changes = {};

        if (title && title !== todo.title) {
            changes.title = { old: todo.title, new: title };
            todo.title = title;
        }

        if (description !== undefined && description !== todo.description) {
            changes.description = { old: todo.description, new: description };
            todo.description = description;
        }

        if (status && status !== todo.status) {
            changes.status = { old: todo.status, new: status };
            todo.status = status;
        }

        if (priority && priority !== todo.priority) {
            changes.priority = { old: todo.priority, new: priority };
            todo.priority = priority;
        }

        if (dueDate) {
            changes.dueDate = { old: todo.dueDate, new: new Date(dueDate) };
            todo.dueDate = new Date(dueDate);
        }

        if (category && category !== todo.category) {
            changes.category = { old: todo.category, new: category };
            todo.category = category;
        }

        if (tags) {
            changes.tags = { old: todo.tags, new: tags };
            todo.tags = tags;
        }

        if (label !== undefined && label !== todo.label) {
            changes.label = { old: todo.label, new: label };
            todo.label = label;
        }

        // Log activity
        if (Object.keys(changes).length > 0) {
            todo.activityLog.push({
                action: 'updated',
                userId,
                changes,
                timestamp: new Date()
            });
        }

        await todo.save();

        res.json(new ApiResponse(
            200,
            todo,
            'Todo updated successfully'
        ));
    } catch (error) {
        next(error);
    }
};

/**
 * Update a subtask
 * @route PATCH /api/todos/:todoId/subtasks/:subtaskId
 */
const updateSubtask = async (req, res, next) => {
    try {
        const { todoId, subtaskId } = req.params;
        const { title, description, status, priority, dueDate, completed } = req.body;
        const userId = req.userId;

        const todo = await Todo.findById(todoId);

        if (!todo) {
            throw new ApiError(404, 'Todo not found');
        }

        // Check permission
        if (todo.userId.toString() !== userId) {
            throw new ApiError(403, 'Permission denied');
        }

        // Find subtask recursively
        const findAndUpdateSubtask = (subtasks, id) => {
            for (let i = 0; i < subtasks.length; i++) {
                if (subtasks[i]._id.toString() === id) {
                    if (title) subtasks[i].title = title;
                    if (description !== undefined) subtasks[i].description = description;
                    if (status) subtasks[i].status = status;
                    if (priority) subtasks[i].priority = priority;
                    if (dueDate) subtasks[i].dueDate = new Date(dueDate);
                    if (completed !== undefined) {
                        subtasks[i].completed = completed;
                        if (completed) {
                            subtasks[i].completedAt = new Date();
                        }
                    }
                    return true;
                }

                if (subtasks[i].subtasks && subtasks[i].subtasks.length > 0) {
                    if (findAndUpdateSubtask(subtasks[i].subtasks, id)) {
                        return true;
                    }
                }
            }
            return false;
        };

        const found = findAndUpdateSubtask(todo.subtasks, subtaskId);

        if (!found) {
            throw new ApiError(404, 'Subtask not found');
        }

        todo.activityLog.push({
            action: 'updated',
            userId,
            changes: { updated: 'subtask' },
            timestamp: new Date()
        });

        await todo.save();

        res.json(new ApiResponse(
            200,
            todo,
            'Subtask updated successfully'
        ));
    } catch (error) {
        next(error);
    }
};

/**
 * Mark todo as completed
 * @route PATCH /api/todos/:todoId/complete
 */
const completeTodo = async (req, res, next) => {
    try {
        const { todoId } = req.params;
        const userId = req.userId;

        const todo = await Todo.findById(todoId);

        if (!todo) {
            throw new ApiError(404, 'Todo not found');
        }

        // Check permission
        if (todo.userId.toString() !== userId) {
            throw new ApiError(403, 'Permission denied');
        }

        await todo.complete();

        todo.activityLog.push({
            action: 'completed',
            userId,
            timestamp: new Date()
        });

        await todo.save();

        res.json(new ApiResponse(
            200,
            todo,
            'Todo marked as completed'
        ));
    } catch (error) {
        next(error);
    }
};

/**
 * Mark todo as incomplete
 * @route PATCH /api/todos/:todoId/incomplete
 */
const incompleteTodo = async (req, res, next) => {
    try {
        const { todoId } = req.params;
        const userId = req.userId;

        const todo = await Todo.findById(todoId);

        if (!todo) {
            throw new ApiError(404, 'Todo not found');
        }

        // Check permission
        if (todo.userId.toString() !== userId) {
            throw new ApiError(403, 'Permission denied');
        }

        await todo.incomplete();

        res.json(new ApiResponse(
            200,
            todo,
            'Todo marked as incomplete'
        ));
    } catch (error) {
        next(error);
    }
};

// ============ TIME TRACKING ============

/**
 * Log time spent on a todo
 * @route POST /api/todos/:todoId/time-tracking
 */
const logTimeSpent = async (req, res, next) => {
    try {
        const { todoId } = req.params;
        const { timeSpent } = req.body; // in minutes
        const userId = req.userId;

        if (!timeSpent || timeSpent <= 0) {
            throw new ApiError(400, 'Time spent must be greater than 0');
        }

        const todo = await Todo.findById(todoId);

        if (!todo) {
            throw new ApiError(404, 'Todo not found');
        }

        // Check permission
        if (todo.userId.toString() !== userId) {
            throw new ApiError(403, 'Permission denied');
        }

        todo.actualTime += timeSpent;

        todo.activityLog.push({
            action: 'updated',
            userId,
            changes: { timeLogged: timeSpent },
            timestamp: new Date()
        });

        await todo.save();

        res.json(new ApiResponse(
            200,
            todo,
            `${timeSpent} minutes logged successfully`
        ));
    } catch (error) {
        next(error);
    }
};

// ============ COMMENTS ============

/**
 * Add a comment to a todo
 * @route POST /api/todos/:todoId/comments
 */
const addComment = async (req, res, next) => {
    try {
        const { todoId } = req.params;
        const { text, mentions = [] } = req.body;
        const userId = req.userId;

        if (!text || text.trim().length === 0) {
            throw new ApiError(400, 'Comment text is required');
        }

        const todo = await Todo.findById(todoId);

        if (!todo) {
            throw new ApiError(404, 'Todo not found');
        }

        // Check permission
        if (todo.userId.toString() !== userId && !todo.sharedWith.some(s => s.userId.toString() === userId)) {
            throw new ApiError(403, 'Permission denied');
        }

        const newComment = {
            userId,
            text,
            mentions: mentions || [],
            createdAt: new Date()
        };

        if (!todo.comments) {
            todo.comments = [];
        }

        todo.comments.push(newComment);

        todo.activityLog.push({
            action: 'commented',
            userId,
            timestamp: new Date()
        });

        await todo.save();

        const populatedTodo = await Todo.findById(todoId).populate('comments.userId', 'name email profilePicture');

        res.status(201).json(new ApiResponse(
            201,
            populatedTodo,
            'Comment added successfully'
        ));
    } catch (error) {
        next(error);
    }
};

/**
 * Update a comment
 * @route PATCH /api/todos/:todoId/comments/:commentId
 */
const updateComment = async (req, res, next) => {
    try {
        const { todoId, commentId } = req.params;
        const { text } = req.body;
        const userId = req.userId;

        if (!text || text.trim().length === 0) {
            throw new ApiError(400, 'Comment text is required');
        }

        const todo = await Todo.findById(todoId);

        if (!todo) {
            throw new ApiError(404, 'Todo not found');
        }

        // Check permission
        if (todo.userId.toString() !== userId) {
            throw new ApiError(403, 'Permission denied');
        }

        const comment = todo.comments.find(c => c._id.toString() === commentId);

        if (!comment) {
            throw new ApiError(404, 'Comment not found');
        }

        if (comment.userId.toString() !== userId) {
            throw new ApiError(403, 'You can only edit your own comments');
        }

        comment.text = text;
        comment.updatedAt = new Date();

        await todo.save();

        res.json(new ApiResponse(
            200,
            todo,
            'Comment updated successfully'
        ));
    } catch (error) {
        next(error);
    }
};

/**
 * Delete a comment
 * @route DELETE /api/todos/:todoId/comments/:commentId
 */
const deleteComment = async (req, res, next) => {
    try {
        const { todoId, commentId } = req.params;
        const userId = req.userId;

        const todo = await Todo.findById(todoId);

        if (!todo) {
            throw new ApiError(404, 'Todo not found');
        }

        // Check permission
        if (todo.userId.toString() !== userId) {
            throw new ApiError(403, 'Permission denied');
        }

        const comment = todo.comments.find(c => c._id.toString() === commentId);

        if (!comment) {
            throw new ApiError(404, 'Comment not found');
        }

        if (comment.userId.toString() !== userId) {
            throw new ApiError(403, 'You can only delete your own comments');
        }

        todo.comments = todo.comments.filter(c => c._id.toString() !== commentId);

        await todo.save();

        res.json(new ApiResponse(
            200,
            todo,
            'Comment deleted successfully'
        ));
    } catch (error) {
        next(error);
    }
};

// ============ ATTACHMENTS ============

/**
 * Add attachment to todo
 * @route POST /api/todos/:todoId/attachments
 */
const addAttachment = async (req, res, next) => {
    try {
        const { todoId } = req.params;
        const { url, fileName, fileType, fileSize } = req.body;
        const userId = req.userId;

        if (!url || !fileName) {
            throw new ApiError(400, 'URL and file name are required');
        }

        const todo = await Todo.findById(todoId);

        if (!todo) {
            throw new ApiError(404, 'Todo not found');
        }

        // Check permission
        if (todo.userId.toString() !== userId) {
            throw new ApiError(403, 'Permission denied');
        }

        const attachment = {
            url,
            fileName,
            fileType: fileType || 'file',
            fileSize: fileSize || 0,
            uploadedBy: userId,
            uploadedAt: new Date()
        };

        if (!todo.attachments) {
            todo.attachments = [];
        }

        todo.attachments.push(attachment);

        await todo.save();

        res.status(201).json(new ApiResponse(
            201,
            todo,
            'Attachment added successfully'
        ));
    } catch (error) {
        next(error);
    }
};

/**
 * Delete attachment from todo
 * @route DELETE /api/todos/:todoId/attachments/:attachmentId
 */
const deleteAttachment = async (req, res, next) => {
    try {
        const { todoId, attachmentId } = req.params;
        const userId = req.userId;

        const todo = await Todo.findById(todoId);

        if (!todo) {
            throw new ApiError(404, 'Todo not found');
        }

        // Check permission
        if (todo.userId.toString() !== userId) {
            throw new ApiError(403, 'Permission denied');
        }

        todo.attachments = todo.attachments.filter(a => a._id.toString() !== attachmentId);

        await todo.save();

        res.json(new ApiResponse(
            200,
            todo,
            'Attachment deleted successfully'
        ));
    } catch (error) {
        next(error);
    }
};

// ============ SHARING ============

/**
 * Share todo with another user
 * @route POST /api/todos/:todoId/share
 */
const shareTodo = async (req, res, next) => {
    try {
        const { todoId } = req.params;
        const { userId: shareWithUserId, permissions = 'view' } = req.body;
        const currentUserId = req.userId;

        if (!shareWithUserId) {
            throw new ApiError(400, 'User ID is required');
        }

        const validPermissions = ['view', 'edit', 'admin'];
        if (!validPermissions.includes(permissions)) {
            throw new ApiError(400, 'Invalid permissions');
        }

        const todo = await Todo.findById(todoId);

        if (!todo) {
            throw new ApiError(404, 'Todo not found');
        }

        // Check permission
        if (todo.userId.toString() !== currentUserId) {
            throw new ApiError(403, 'Permission denied');
        }

        // Check if already shared
        const alreadyShared = todo.sharedWith.some(s => s.userId.toString() === shareWithUserId);

        if (alreadyShared) {
            throw new ApiError(400, 'Todo already shared with this user');
        }

        // Check if user exists
        const user = await User.findById(shareWithUserId);
        if (!user) {
            throw new ApiError(404, 'User not found');
        }

        todo.sharedWith.push({
            userId: shareWithUserId,
            permissions,
            sharedAt: new Date()
        });

        await todo.save();

        res.json(new ApiResponse(
            200,
            todo,
            'Todo shared successfully'
        ));
    } catch (error) {
        next(error);
    }
};

/**
 * Revoke todo sharing
 * @route DELETE /api/todos/:todoId/share/:shareWithUserId
 */
const revokeTodoShare = async (req, res, next) => {
    try {
        const { todoId, shareWithUserId } = req.params;
        const currentUserId = req.userId;

        const todo = await Todo.findById(todoId);

        if (!todo) {
            throw new ApiError(404, 'Todo not found');
        }

        // Check permission
        if (todo.userId.toString() !== currentUserId) {
            throw new ApiError(403, 'Permission denied');
        }

        todo.sharedWith = todo.sharedWith.filter(s => s.userId.toString() !== shareWithUserId);

        await todo.save();

        res.json(new ApiResponse(
            200,
            todo,
            'Todo sharing revoked successfully'
        ));
    } catch (error) {
        next(error);
    }
};

// ============ ARCHIVING & DELETION ============

/**
 * Archive a todo
 * @route PATCH /api/todos/:todoId/archive
 */
const archiveTodo = async (req, res, next) => {
    try {
        const { todoId } = req.params;
        const userId = req.userId;

        const todo = await Todo.findById(todoId);

        if (!todo) {
            throw new ApiError(404, 'Todo not found');
        }

        // Check permission
        if (todo.userId.toString() !== userId) {
            throw new ApiError(403, 'Permission denied');
        }

        todo.isArchived = true;

        await todo.save();

        res.json(new ApiResponse(
            200,
            todo,
            'Todo archived successfully'
        ));
    } catch (error) {
        next(error);
    }
};

/**
 * Unarchive a todo
 * @route PATCH /api/todos/:todoId/unarchive
 */
const unarchiveTodo = async (req, res, next) => {
    try {
        const { todoId } = req.params;
        const userId = req.userId;

        const todo = await Todo.findById(todoId);

        if (!todo) {
            throw new ApiError(404, 'Todo not found');
        }

        // Check permission
        if (todo.userId.toString() !== userId) {
            throw new ApiError(403, 'Permission denied');
        }

        todo.isArchived = false;

        await todo.save();

        res.json(new ApiResponse(
            200,
            todo,
            'Todo unarchived successfully'
        ));
    } catch (error) {
        next(error);
    }
};

/**
 * Soft delete a todo
 * @route DELETE /api/todos/:todoId
 */
const deleteTodo = async (req, res, next) => {
    try {
        const { todoId } = req.params;
        const userId = req.userId;

        const todo = await Todo.findById(todoId);

        if (!todo) {
            throw new ApiError(404, 'Todo not found');
        }

        // Check permission
        if (todo.userId.toString() !== userId) {
            throw new ApiError(403, 'Permission denied');
        }

        await Todo.softDelete(todoId);

        res.json(new ApiResponse(
            200,
            null,
            'Todo deleted successfully'
        ));
    } catch (error) {
        next(error);
    }
};

/**
 * Delete a subtask
 * @route DELETE /api/todos/:todoId/subtasks/:subtaskId
 */
const deleteSubtask = async (req, res, next) => {
    try {
        const { todoId, subtaskId } = req.params;
        const userId = req.userId;

        const todo = await Todo.findById(todoId);

        if (!todo) {
            throw new ApiError(404, 'Todo not found');
        }

        // Check permission
        if (todo.userId.toString() !== userId) {
            throw new ApiError(403, 'Permission denied');
        }

        // Delete subtask recursively
        const deleteSubtaskHelper = (subtasks, id) => {
            for (let i = 0; i < subtasks.length; i++) {
                if (subtasks[i]._id.toString() === id) {
                    subtasks.splice(i, 1);
                    return true;
                }

                if (subtasks[i].subtasks && subtasks[i].subtasks.length > 0) {
                    if (deleteSubtaskHelper(subtasks[i].subtasks, id)) {
                        return true;
                    }
                }
            }
            return false;
        };

        const deleted = deleteSubtaskHelper(todo.subtasks, subtaskId);

        if (!deleted) {
            throw new ApiError(404, 'Subtask not found');
        }

        await todo.save();

        res.json(new ApiResponse(
            200,
            todo,
            'Subtask deleted successfully'
        ));
    } catch (error) {
        next(error);
    }
};

// ============ STATISTICS ============

/**
 * Get todo statistics for a user
 * @route GET /api/todos/stats
 */
const getTodoStats = async (req, res, next) => {
    try {
        const userId = req.userId;

        const stats = await Promise.all([
            Todo.countDocuments({ userId, status: 'todo', isDeleted: false }),
            Todo.countDocuments({ userId, status: 'in-progress', isDeleted: false }),
            Todo.countDocuments({ userId, status: 'completed', isDeleted: false }),
            Todo.countDocuments({ userId, status: 'blocked', isDeleted: false }),
            Todo.findOverdue(userId),
            Todo.find({ userId, priority: 'urgent', completed: false, isDeleted: false })
        ]);

        const [
            todoCount,
            inProgressCount,
            completedCount,
            blockedCount,
            overdueCount,
            urgentTodos
        ] = stats;

        const totalTodos = todoCount + inProgressCount + completedCount + blockedCount;
        const completionPercentage = totalTodos === 0 ? 0 : Math.round((completedCount / totalTodos) * 100);

        res.json(new ApiResponse(
            200,
            {
                summary: {
                    total: totalTodos,
                    todo: todoCount,
                    inProgress: inProgressCount,
                    completed: completedCount,
                    blocked: blockedCount,
                    completionPercentage
                },
                overdue: overdueCount.length,
                urgent: urgentTodos.length
            },
            'Todo statistics retrieved successfully'
        ));
    } catch (error) {
        next(error);
    }
};

/**
 * Get today's todos
 * @route GET /api/todos/today
 */
const getTodayTodos = async (req, res, next) => {
    try {
        const userId = req.userId;

        const startOfDay = new Date();
        startOfDay.setHours(0, 0, 0, 0);

        const endOfDay = new Date();
        endOfDay.setHours(23, 59, 59, 999);

        const todos = await Todo.find({
            userId,
            dueDate: {
                $gte: startOfDay,
                $lte: endOfDay
            },
            isDeleted: false
        }).sort({ priority: -1 });

        res.json(new ApiResponse(
            200,
            todos,
            "Today's todos retrieved successfully"
        ));
    } catch (error) {
        next(error);
    }
};

/**
 * Get todos by tag
 * @route GET /api/todos/tags/:tag
 */
const getTodosByTag = async (req, res, next) => {
    try {
        const { tag } = req.params;
        const userId = req.userId;

        const todos = await Todo.find({
            userId,
            tags: tag,
            isDeleted: false
        }).sort({ createdAt: -1 });

        res.json(new ApiResponse(
            200,
            todos,
            `Todos with tag "${tag}" retrieved successfully`
        ));
    } catch (error) {
        next(error);
    }
};

/**
 * Get all tags for user
 * @route GET /api/todos/all-tags
 */
const getAllTags = async (req, res, next) => {
    try {
        const userId = req.userId;

        const tags = await Todo.distinct('tags', {
            userId,
            isDeleted: false
        });

        res.json(new ApiResponse(
            200,
            tags,
            'All tags retrieved successfully'
        ));
    } catch (error) {
        next(error);
    }
};

/**
 * Search todos
 * @route GET /api/todos/search/:query
 */
const searchTodos = async (req, res, next) => {
    try {
        const { query } = req.params;
        const userId = req.userId;

        if (!query || query.trim().length < 2) {
            throw new ApiError(400, 'Search query must be at least 2 characters');
        }

        const todos = await Todo.find({
            userId,
            isDeleted: false,
            $or: [
                { title: { $regex: query, $options: 'i' } },
                { description: { $regex: query, $options: 'i' } },
                { tags: { $regex: query, $options: 'i' } }
            ]
        }).sort({ createdAt: -1 });

        res.json(new ApiResponse(
            200,
            todos,
            `Search results for "${query}"`
        ));
    } catch (error) {
        next(error);
    }
};

// ============ BULK OPERATIONS ============

/**
 * Bulk update todos
 * @route PATCH /api/todos/bulk/update
 */
const bulkUpdateTodos = async (req, res, next) => {
    try {
        const { todoIds, updates } = req.body;
        const userId = req.userId;

        if (!todoIds || !Array.isArray(todoIds) || todoIds.length === 0) {
            throw new ApiError(400, 'Todo IDs array is required');
        }

        if (!updates || Object.keys(updates).length === 0) {
            throw new ApiError(400, 'Updates object is required');
        }

        // Verify ownership of all todos
        const todos = await Todo.find({ _id: { $in: todoIds }, userId });

        if (todos.length !== todoIds.length) {
            throw new ApiError(403, 'Some todos do not belong to you');
        }

        // Perform bulk update
        const result = await Todo.updateMany(
            { _id: { $in: todoIds }, userId },
            {
                $set: updates,
                $push: {
                    activityLog: {
                        action: 'updated',
                        userId,
                        changes: updates,
                        timestamp: new Date()
                    }
                }
            }
        );

        res.json(new ApiResponse(
            200,
            { modifiedCount: result.modifiedCount },
            `${result.modifiedCount} todos updated successfully`
        ));
    } catch (error) {
        next(error);
    }
};

/**
 * Bulk delete todos
 * @route DELETE /api/todos/bulk/delete
 */
const bulkDeleteTodos = async (req, res, next) => {
    try {
        const { todoIds } = req.body;
        const userId = req.userId;

        if (!todoIds || !Array.isArray(todoIds) || todoIds.length === 0) {
            throw new ApiError(400, 'Todo IDs array is required');
        }

        // Verify ownership of all todos
        const todos = await Todo.find({ _id: { $in: todoIds }, userId });

        if (todos.length !== todoIds.length) {
            throw new ApiError(403, 'Some todos do not belong to you');
        }

        // Soft delete todos
        const result = await Todo.updateMany(
            { _id: { $in: todoIds }, userId },
            {
                $set: {
                    isDeleted: true,
                    deletedAt: new Date()
                }
            }
        );

        res.json(new ApiResponse(
            200,
            { deletedCount: result.modifiedCount },
            `${result.modifiedCount} todos deleted successfully`
        ));
    } catch (error) {
        next(error);
    }
};

/**
 * Assign todo to user
 * @route PATCH /api/todos/:todoId/assign
 */
const assignTodo = async (req, res, next) => {
    try {
        const { todoId } = req.params;
        const { assigneeId } = req.body;
        const userId = req.userId;

        if (!assigneeId) {
            throw new ApiError(400, 'Assignee ID is required');
        }

        const todo = await Todo.findById(todoId);

        if (!todo) {
            throw new ApiError(404, 'Todo not found');
        }

        // Check permission
        if (todo.userId.toString() !== userId) {
            throw new ApiError(403, 'Permission denied');
        }

        // Check if assignee exists
        const assignee = await User.findById(assigneeId);
        if (!assignee) {
            throw new ApiError(404, 'Assignee not found');
        }

        const oldAssignee = todo.assignee;
        todo.assignee = assigneeId;

        todo.activityLog.push({
            action: 'assigned',
            userId,
            changes: { from: oldAssignee, to: assigneeId },
            timestamp: new Date()
        });

        await todo.save();

        const populatedTodo = await Todo.findById(todoId).populate('assignee', 'name email profilePicture');

        res.json(new ApiResponse(
            200,
            populatedTodo,
            'Todo assigned successfully'
        ));
    } catch (error) {
        next(error);
    }
};

/**
 * Unassign todo
 * @route PATCH /api/todos/:todoId/unassign
 */
const unassignTodo = async (req, res, next) => {
    try {
        const { todoId } = req.params;
        const userId = req.userId;

        const todo = await Todo.findById(todoId);

        if (!todo) {
            throw new ApiError(404, 'Todo not found');
        }

        // Check permission
        if (todo.userId.toString() !== userId) {
            throw new ApiError(403, 'Permission denied');
        }

        todo.assignee = null;

        todo.activityLog.push({
            action: 'updated',
            userId,
            changes: { assignee: 'unassigned' },
            timestamp: new Date()
        });

        await todo.save();

        res.json(new ApiResponse(
            200,
            todo,
            'Todo unassigned successfully'
        ));
    } catch (error) {
        next(error);
    }
};

/**
 * Add watcher to todo
 * @route POST /api/todos/:todoId/watchers
 */
const addWatcher = async (req, res, next) => {
    try {
        const { todoId } = req.params;
        const { watcherId } = req.body;
        const userId = req.userId;

        if (!watcherId) {
            throw new ApiError(400, 'Watcher ID is required');
        }

        const todo = await Todo.findById(todoId);

        if (!todo) {
            throw new ApiError(404, 'Todo not found');
        }

        // Check permission
        if (todo.userId.toString() !== userId && !todo.sharedWith.some(s => s.userId.toString() === userId)) {
            throw new ApiError(403, 'Permission denied');
        }

        // Check if watcher exists
        const watcher = await User.findById(watcherId);
        if (!watcher) {
            throw new ApiError(404, 'Watcher not found');
        }

        // Check if already watching
        if (todo.watchers.includes(watcherId)) {
            throw new ApiError(400, 'User is already watching this todo');
        }

        todo.watchers.push(watcherId);

        await todo.save();

        const populatedTodo = await Todo.findById(todoId).populate('watchers', 'name email');

        res.json(new ApiResponse(
            200,
            populatedTodo,
            'Watcher added successfully'
        ));
    } catch (error) {
        next(error);
    }
};

/**
 * Remove watcher from todo
 * @route DELETE /api/todos/:todoId/watchers/:watcherId
 */
const removeWatcher = async (req, res, next) => {
    try {
        const { todoId, watcherId } = req.params;
        const userId = req.userId;

        const todo = await Todo.findById(todoId);

        if (!todo) {
            throw new ApiError(404, 'Todo not found');
        }

        // Check permission
        if (todo.userId.toString() !== userId && !todo.sharedWith.some(s => s.userId.toString() === userId)) {
            throw new ApiError(403, 'Permission denied');
        }

        todo.watchers = todo.watchers.filter(w => w.toString() !== watcherId);

        await todo.save();

        res.json(new ApiResponse(
            200,
            todo,
            'Watcher removed successfully'
        ));
    } catch (error) {
        next(error);
    }
};

/**
 * Get activity log for a todo
 * @route GET /api/todos/:todoId/activity
 */
const getActivityLog = async (req, res, next) => {
    try {
        const { todoId } = req.params;
        const userId = req.userId;

        const todo = await Todo.findById(todoId)
            .select('activityLog')
            .populate('activityLog.userId', 'name email profilePicture');

        if (!todo) {
            throw new ApiError(404, 'Todo not found');
        }

        // Check permission
        if (todo.userId.toString() !== userId) {
            throw new ApiError(403, 'Permission denied');
        }

        res.json(new ApiResponse(
            200,
            todo.activityLog,
            'Activity log retrieved successfully'
        ));
    } catch (error) {
        next(error);
    }
};

/**
 * Duplicate a todo
 * @route POST /api/todos/:todoId/duplicate
 */
const duplicateTodo = async (req, res, next) => {
    try {
        const { todoId } = req.params;
        const userId = req.userId;

        const originalTodo = await Todo.findById(todoId);

        if (!originalTodo) {
            throw new ApiError(404, 'Todo not found');
        }

        // Check permission
        if (originalTodo.userId.toString() !== userId) {
            throw new ApiError(403, 'Permission denied');
        }

        // Create duplicate
        const duplicateTodoData = {
            userId,
            title: `${originalTodo.title} (Copy)`,
            description: originalTodo.description,
            priority: originalTodo.priority,
            category: originalTodo.category,
            tags: originalTodo.tags,
            estimatedTime: originalTodo.estimatedTime,
            subtasks: JSON.parse(JSON.stringify(originalTodo.subtasks)),
            activityLog: [
                {
                    action: 'created',
                    userId,
                    timestamp: new Date()
                }
            ]
        };

        const newTodo = await Todo.create(duplicateTodoData);

        res.status(201).json(new ApiResponse(
            201,
            newTodo,
            'Todo duplicated successfully'
        ));
    } catch (error) {
        next(error);
    }
};

module.exports = {
    createTodo,
    addSubtask,
    getAllTodos,
    getTodoById,
    getTodosByStatus,
    getOverdueTodos,
    getTodosByPriority,
    getArchivedTodos,
    updateTodo,
    updateSubtask,
    completeTodo,
    incompleteTodo,
    logTimeSpent,
    addComment,
    updateComment,
    deleteComment,
    addAttachment,
    deleteAttachment,
    shareTodo,
    revokeTodoShare,
    archiveTodo,
    unarchiveTodo,
    deleteTodo,
    deleteSubtask,
    getTodoStats,
    getTodayTodos,
    getTodosByTag,
    getAllTags,
    searchTodos,
    bulkUpdateTodos,
    bulkDeleteTodos,
    assignTodo,
    unassignTodo,
    addWatcher,
    removeWatcher,
    getActivityLog,
    duplicateTodo
};
