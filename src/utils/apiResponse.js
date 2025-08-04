export class ApiResponse {
  static success(data, message = 'Success', statusCode = 200) {
    return {
      success: true,
      statusCode,
      message,
      data,
      timestamp: new Date().toISOString()
    }
  }

  static error(message = 'Internal Server Error', statusCode = 500, errors = null) {
    return {
      success: false,
      statusCode,
      message,
      errors,
      timestamp: new Date().toISOString()
    }
  }

  static paginated(data, pagination, message = 'Success') {
    return {
      success: true,
      statusCode: 200,
      message,
      data,
      pagination,
      timestamp: new Date().toISOString()
    }
  }
}