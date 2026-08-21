export class MediaError extends Error {
  constructor(message: string, readonly cause?: unknown) {
    super(message)
    this.name = "MediaError"
  }
}

export class StorageError extends MediaError {
  constructor(message: string, cause?: unknown) {
    super(message, cause)
    this.name = "StorageError"
  }
}

export class ValidationError extends MediaError {
  constructor(message: string, cause?: unknown) {
    super(message, cause)
    this.name = "ValidationError"
  }
}

export class TranscodeError extends MediaError {
  constructor(message: string, cause?: unknown) {
    super(message, cause)
    this.name = "TranscodeError"
  }
}

export class GPUError extends MediaError {
  constructor(message: string, cause?: unknown) {
    super(message, cause)
    this.name = "GPUError"
  }
}

export class TimeoutError extends MediaError {
  constructor(message: string, cause?: unknown) {
    super(message, cause)
    this.name = "TimeoutError"
  }
}
