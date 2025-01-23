import { Request, Response, NextFunction } from 'express';

const errorHandler = (err: any, req: Request, res: Response, next: NextFunction) => {
    const statusCode = err.statusCode || 500; // Default to 500 if statusCode is missing
    const status = err.status || "error"; // Default to "error"

    res.status(statusCode).json({
        status, // Either "fail" or "error"
        message: err.message,
    });
};

export default errorHandler;