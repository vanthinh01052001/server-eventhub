const errorMiddlewareHandler = (err, _req, res, next) => {
  const statusCode = res.statusCode ? res.statusCode : 500;

  res.status(statusCode).json({
    message: err.message,
    statusCode: statusCode,
    // stack: err.stack,
  });
};

module.exports = errorMiddlewareHandler;
