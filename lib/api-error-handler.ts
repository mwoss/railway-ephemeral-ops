import { NextResponse } from "next/server"
import { logger } from "./logger"

interface ErrorInfo {
  error: "Railway API Error" | "Internal Server Error"
  details: string
}

interface GraphqlError {
  response: {
    errors: Array<{ message?: unknown }>
  }
}

function isGraphqlError(error: unknown): error is GraphqlError {
  return (
    typeof error === "object" &&
    error !== null &&
    "response" in error &&
    typeof error.response === "object" &&
    error.response !== null &&
    "errors" in error.response &&
    Array.isArray(error.response.errors)
  )
}

function getErrorInfo(error: unknown): ErrorInfo {
  if (isGraphqlError(error)) {
    const gqlError = error.response.errors[0]
    if (gqlError && typeof gqlError === "object" && "message" in gqlError) {
      return {
        error: "Railway API Error",
        details: String(gqlError.message),
      }
    }
  }

  if (error instanceof Error) {
    return {
      error: "Internal Server Error",
      details: error.message,
    }
  }

  return {
    error: "Internal Server Error",
    details: "Unknown error occurred",
  }
}

export function withErrorHandler<T extends any[]>(handler: (...args: T) => Promise<Response>) {
  return async (...args: T): Promise<Response> => {
    try {
      return await handler(...args)
    } catch (error) {
      logger.error({ err: error }, "Uncaught API error")
      const { error: errorMessage, details } = getErrorInfo(error)
      return NextResponse.json(
        {
          success: false,
          error: errorMessage,
          details,
        },
        { status: 500 }
      )
    }
  }
}
