export class AppError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly statusCode?: number,
    public readonly details?: unknown
  ) {
    super(message);
    this.name = "AppError";
  }
}

export function toAppError(error: unknown): AppError {
  if (error instanceof AppError) return error;

  if (error instanceof Error) {
    return new AppError(error.message, "INTERNAL_ERROR");
  }

  return new AppError("Unknown error", "UNKNOWN_ERROR");
}

export function errorToToolResult(error: unknown) {
  const appError = toAppError(error);
  return {
    content: [
      {
        type: "text" as const,
        text: JSON.stringify(
          {
            ok: false,
            error: {
              code: appError.code,
              message: appError.message,
              statusCode: appError.statusCode,
              details: appError.details
            }
          },
          null,
          2
        )
      }
    ],
    isError: true
  };
}

function sanitizeDetails(value: unknown): unknown {
  if (!value || typeof value !== "object") return value;
  return JSON.parse(JSON.stringify(value, (_key, item) => {
    if (typeof item === "string" && item.length > 2000) return `${item.slice(0, 2000)}...`;
    return item;
  }));
}
