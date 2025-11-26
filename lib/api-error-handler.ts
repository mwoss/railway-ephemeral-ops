import { NextResponse } from "next/server"
import { logger } from "./logger"

export function withErrorHandler<T extends any[]>(handler: (...args: T) => Promise<Response>) {
  return async (...args: T): Promise<Response> => {
    try {
      return await handler(...args)
    } catch (error) {
      logger.error({ err: error }, "Uncaught API error")

      const gqlError = (error as any)?.response?.errors?.[0]
      if (gqlError) {
        return NextResponse.json(
          {
            success: false,
            error: "Railway API Error",
            details: gqlError.message,
          },
          { status: 500 }
        )
      }

      const message = error instanceof Error ? error.message : "Unknown error occurred"
      return NextResponse.json(
        {
          success: false,
          error: "Internal Server Error",
          details: message,
        },
        { status: 500 }
      )
    }
  }
}
