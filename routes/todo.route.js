const express = require('express');
const router = express.Router();
const {
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
} = require('../controllers/todo.controller');
const { authenticate } = require('../middlewares/auth.middleware');
const { validateTodo, validateSubtask } = require('../middlewares/todo.validator');

// ============ ALL ROUTES ARE PROTECTED WITH authenticate() ============

// ============ TODO CRUD ROUTES ============

/**
 * @route   POST /api/todos
 * @desc    Create a new todo
 * @access  Private
 */
router.post('/', authenticate, validateTodo, createTodo);

/**
 * @route   GET /api/todos
 * @desc    Get all todos for user (with filtering and sorting)
 * @access  Private
 */
router.get('/', authenticate, getAllTodos);

/**
 * @route   GET /api/todos/:todoId
 * @desc    Get a single todo by ID
 * @access  Private
 */
router.get('/:todoId', authenticate, getTodoById);

/**
 * @route   PATCH /api/todos/:todoId
 * @desc    Update a todo
 * @access  Private
 */
router.patch('/:todoId', authenticate, validateTodo, updateTodo);

/**
 * @route   DELETE /api/todos/:todoId
 * @desc    Soft delete a todo
 * @access  Private
 */
router.delete('/:todoId', authenticate, deleteTodo);

// ============ SUBTASK ROUTES ============

/**
 * @route   POST /api/todos/:todoId/subtasks
 * @desc    Add a subtask to a todo
 * @access  Private
 */
router.post('/:todoId/subtasks', authenticate, validateSubtask, addSubtask);

/**
 * @route   PATCH /api/todos/:todoId/subtasks/:subtaskId
 * @desc    Update a subtask
 * @access  Private
 */
router.patch('/:todoId/subtasks/:subtaskId', authenticate, validateSubtask, updateSubtask);

/**
 * @route   DELETE /api/todos/:todoId/subtasks/:subtaskId
 * @desc    Delete a subtask
 * @access  Private
 */
router.delete('/:todoId/subtasks/:subtaskId', authenticate, deleteSubtask);

// ============ STATUS & COMPLETION ROUTES ============

/**
 * @route   PATCH /api/todos/:todoId/complete
 * @desc    Mark todo as completed
 * @access  Private
 */
router.patch('/:todoId/complete', authenticate, completeTodo);

/**
 * @route   PATCH /api/todos/:todoId/incomplete
 * @desc    Mark todo as incomplete
 * @access  Private
 */
router.patch('/:todoId/incomplete', authenticate, incompleteTodo);

/**
 * @route   GET /api/todos/status/:status
 * @desc    Get todos by status (todo, in-progress, completed, blocked, on-hold)
 * @access  Private
 */
router.get('/status/:status', authenticate, getTodosByStatus);

// ============ PRIORITY & OVERDUE ROUTES ============

/**
 * @route   GET /api/todos/priority/:priority
 * @desc    Get todos by priority (low, medium, high, urgent)
 * @access  Private
 */
router.get('/priority/:priority', authenticate, getTodosByPriority);

/**
 * @route   GET /api/todos/overdue
 * @desc    Get all overdue todos
 * @access  Private
 */
router.get('/overdue', authenticate, getOverdueTodos);

// ============ TIME TRACKING ROUTES ============

/**
 * @route   POST /api/todos/:todoId/time-tracking
 * @desc    Log time spent on a todo
 * @access  Private
 * @body    { timeSpent: number } - time in minutes
 */
router.post('/:todoId/time-tracking', authenticate, logTimeSpent);

// ============ COMMENT ROUTES ============

/**
 * @route   POST /api/todos/:todoId/comments
 * @desc    Add a comment to a todo
 * @access  Private
 * @body    { text: string, mentions: [userId] }
 */
router.post('/:todoId/comments', authenticate, addComment);

/**
 * @route   PATCH /api/todos/:todoId/comments/:commentId
 * @desc    Update a comment
 * @access  Private
 * @body    { text: string }
 */
router.patch('/:todoId/comments/:commentId', authenticate, updateComment);

/**
 * @route   DELETE /api/todos/:todoId/comments/:commentId
 * @desc    Delete a comment
 * @access  Private
 */
router.delete('/:todoId/comments/:commentId', authenticate, deleteComment);

// ============ ATTACHMENT ROUTES ============

/**
 * @route   POST /api/todos/:todoId/attachments
 * @desc    Add attachment to todo
 * @access  Private
 * @body    { url: string, fileName: string, fileType: string, fileSize: number }
 */
router.post('/:todoId/attachments', authenticate, addAttachment);

/**
 * @route   DELETE /api/todos/:todoId/attachments/:attachmentId
 * @desc    Delete attachment from todo
 * @access  Private
 */
router.delete('/:todoId/attachments/:attachmentId', authenticate, deleteAttachment);

// ============ SHARING ROUTES ============

/**
 * @route   POST /api/todos/:todoId/share
 * @desc    Share todo with another user
 * @access  Private
 * @body    { userId: string, permissions: 'view' | 'edit' | 'admin' }
 */
router.post('/:todoId/share', authenticate, shareTodo);

/**
 * @route   DELETE /api/todos/:todoId/share/:shareWithUserId
 * @desc    Revoke todo sharing
 * @access  Private
 */
router.delete('/:todoId/share/:shareWithUserId', authenticate, revokeTodoShare);

// ============ ARCHIVE ROUTES ============

/**
 * @route   PATCH /api/todos/:todoId/archive
 * @desc    Archive a todo
 * @access  Private
 */
router.patch('/:todoId/archive', authenticate, archiveTodo);

/**
 * @route   PATCH /api/todos/:todoId/unarchive
 * @desc    Unarchive a todo
 * @access  Private
 */
router.patch('/:todoId/unarchive', authenticate, unarchiveTodo);

/**
 * @route   GET /api/todos/archived
 * @desc    Get all archived todos
 * @access  Private
 */
router.get('/archived', authenticate, getArchivedTodos);

// ============ TAG ROUTES ============

/**
 * @route   GET /api/todos/tags/:tag
 * @desc    Get todos by tag
 * @access  Private
 */
router.get('/tags/:tag', authenticate, getTodosByTag);

/**
 * @route   GET /api/todos/all-tags
 * @desc    Get all tags for user
 * @access  Private
 */
router.get('/all-tags', authenticate, getAllTags);

// ============ SEARCH ROUTES ============

/**
 * @route   GET /api/todos/search/:query
 * @desc    Search todos by title, description, or tags
 * @access  Private
 */
router.get('/search/:query', authenticate, searchTodos);

// ============ ASSIGNMENT ROUTES ============

/**
 * @route   PATCH /api/todos/:todoId/assign
 * @desc    Assign todo to a user
 * @access  Private
 * @body    { assigneeId: string }
 */
router.patch('/:todoId/assign', authenticate, assignTodo);

/**
 * @route   PATCH /api/todos/:todoId/unassign
 * @desc    Unassign todo
 * @access  Private
 */
router.patch('/:todoId/unassign', authenticate, unassignTodo);

// ============ WATCHER ROUTES ============

/**
 * @route   POST /api/todos/:todoId/watchers
 * @desc    Add watcher to todo
 * @access  Private
 * @body    { watcherId: string }
 */
router.post('/:todoId/watchers', authenticate, addWatcher);

/**
 * @route   DELETE /api/todos/:todoId/watchers/:watcherId
 * @desc    Remove watcher from todo
 * @access  Private
 */
router.delete('/:todoId/watchers/:watcherId', authenticate, removeWatcher);

// ============ ACTIVITY LOG ROUTES ============

/**
 * @route   GET /api/todos/:todoId/activity
 * @desc    Get activity log for a todo
 * @access  Private
 */
router.get('/:todoId/activity', authenticate, getActivityLog);

// ============ STATISTICS ROUTES ============

/**
 * @route   GET /api/todos/stats
 * @desc    Get todo statistics for user
 * @access  Private
 */
router.get('/stats', authenticate, getTodoStats);

/**
 * @route   GET /api/todos/today
 * @desc    Get today's todos
 * @access  Private
 */
router.get('/today', authenticate, getTodayTodos);

// ============ BULK OPERATION ROUTES ============

/**
 * @route   PATCH /api/todos/bulk/update
 * @desc    Bulk update todos
 * @access  Private
 * @body    { todoIds: [string], updates: object }
 */
router.patch('/bulk/update', authenticate, bulkUpdateTodos);

/**
 * @route   DELETE /api/todos/bulk/delete
 * @desc    Bulk delete todos
 * @access  Private
 * @body    { todoIds: [string] }
 */
router.delete('/bulk/delete', authenticate, bulkDeleteTodos);

// ============ UTILITY ROUTES ============

/**
 * @route   POST /api/todos/:todoId/duplicate
 * @desc    Duplicate a todo
 * @access  Private
 */
router.post('/:todoId/duplicate', authenticate, duplicateTodo);

module.exports = router;