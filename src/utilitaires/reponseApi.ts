export class ApiResponse {
  constructor(
    public statusCode: number,
    public message: string,
    public data: any = null,
    public success: boolean = statusCode < 400
  ) {}

  static success(message: string, data: any = null) {
    return new ApiResponse(200, message, data);
  }

  static created(message: string, data: any = null) {
    return new ApiResponse(201, message, data);
  }

  static error(statusCode: number, message: string, errors: any = null) {
    return new ApiResponse(statusCode, message, errors, false);
  }
}