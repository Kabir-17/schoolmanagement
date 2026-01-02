import { ErrorRequestHandler, NextFunction, Request, Response } from "express";
import config from "../config";
import { AppError } from "../errors/AppError";
import { handleCastError } from "../errors/handleCastError";
import { handleDuplicateError } from "../errors/handleDuplicateError";
import { handleValidationError } from "../errors/handleValidationError";
import { handleZodErrors } from "../errors/handleZodErrors";
import { TErrorSources } from "../interface/error";

const globalErrorHandler: ErrorRequestHandler = (
  err,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  // Set default values
  let statusCode = 500;
  let message = "Something went wrong!";
  let errorSources: TErrorSources = [
    {
      path: "",
      message: "Something went wrong!",
    },
  ];

  // Handle different error types
  if (err?.name === "ValidationError") {
    const handled = handleValidationError(err);
    // Send the first error message if available, otherwise the generic message
    const firstErrorMsg = handled.errorSources?.[0]?.message || handled.message;
    return res.status(handled.statusCode).json({
      success: false,
      message: firstErrorMsg,
      errorSources: handled.errorSources,
      err,
      stack: err.stack,
    });
  } else if (err?.name === "CastError") {
    const simplifiedError = handleCastError(err);
    statusCode = simplifiedError?.statusCode;
    message = simplifiedError?.message;
    errorSources = simplifiedError?.errorSources;
  } else if (err?.code === 11000) {
    const simplifiedError = handleDuplicateError(err);
    statusCode = simplifiedError?.statusCode;
    message = simplifiedError?.message;
    errorSources = simplifiedError?.errorSources;
  } else if (err?.name === "ZodError") {
    const simplifiedError = handleZodErrors(err);
    statusCode = simplifiedError?.statusCode;
    message = simplifiedError?.message;
    errorSources = simplifiedError?.errorSources;
  } else if (err instanceof AppError) {
    statusCode = err?.statusCode;
    message = err.message;
    errorSources = [
      {
        path: "",
        message: err?.message,
      },
    ];
  } else if (err instanceof Error) {
    message = err.message;
    errorSources = [
      {
        path: "",
        message: err?.message,
      },
    ];
  }

  // Log error in development
  if (config.node_env === "development") {
    console.error("🚨 Error Details:", {
      statusCode,
      message,
      errorSources,
      stack: err?.stack,
    });
  }

  // Return error response
  return res.status(statusCode).json({
    success: false,
    message,
    errorSources,
    err,
    stack: config.node_env === "development" ? err?.stack : null,
  });
};

export { globalErrorHandler };
