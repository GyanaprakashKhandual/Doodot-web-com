/**
 * Standard API Response class
 * Provides consistent response structure across the application
 */
class ApiResponse {
  constructor(statusCode, data, message = 'Success') {
    this.statusCode = statusCode;
    this.success = statusCode < 400;
    this.message = message;
    this.data = data;
    this.timestamp = new Date().toISOString();
  }
}

/**
 * Success response helper
 */
const successResponse = (res, data, message = 'Success', statusCode = 200) => {
  return res.status(statusCode).json(new ApiResponse(statusCode, data, message));
};

/**
 * Created response helper
 */
const createdResponse = (res, data, message = 'Resource created successfully') => {
  return res.status(201).json(new ApiResponse(201, data, message));
};

/**
 * No content response helper
 */
const noContentResponse = (res) => {
  return res.status(204).send();
};

/**
 * Paginated response helper
 */
const paginatedResponse = (res, data, pagination, message = 'Success') => {
  return res.status(200).json({
    statusCode: 200,
    success: true,
    message,
    data,
    pagination: {
      page: pagination.page,
      limit: pagination.limit,
      totalPages: pagination.totalPages,
      totalItems: pagination.totalItems,
      hasNextPage: pagination.hasNextPage,
      hasPrevPage: pagination.hasPrevPage
    },
    timestamp: new Date().toISOString()
  });
};

module.exports = {
  ApiResponse,
  successResponse,
  createdResponse,
  noContentResponse,
  paginatedResponse
};