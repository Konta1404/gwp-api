export class AppError extends Error {
    private statusCode: number;
    private status: string;
    private isOperational: boolean;

    constructor(message: string, statusCode = 500) {
        super(message);

        this.statusCode = statusCode;
        this.status = `${statusCode}`.startsWith("4") ? "fail" : "error";
        this.isOperational = true;

        Error.captureStackTrace(this, this.constructor);
    }

    print() {
        console.log(this.statusCode, this.isOperational, this.status);
    }
}
