export class ApiResponse<T = any> {
  constructor(
    public statusCode: number,
    public message: string,
    public data: T | null = null,
    public success: boolean = statusCode < 400
  ) {}

  static success<T>(message: string, data: T | null = null) {
    return new ApiResponse<T>(200, message, data);
  }

  static created<T>(message: string, data: T | null = null) {
    return new ApiResponse<T>(201, message, data);
  }

  static error<T>(statusCode: number, message: string, errors: T | null = null) {
    return new ApiResponse<T>(statusCode, message, errors, false);
  }
}