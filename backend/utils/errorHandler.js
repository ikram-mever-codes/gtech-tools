class ErrorHandler extends Error {
  constructor(message, statusCode) {
    super(message);
    this.statusCode = statusCode;
    this.stack = this.stack;
  }

  // Method to send error response
  sendError(res) {
    return res.status(this.statusCode).json({
      success: false,
      message: this.message,
    });
  }
}

export default ErrorHandler;
