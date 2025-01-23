import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { PrismaClient } from "@prisma/client";
import { AppError } from "../lib/appError";

const prisma = new PrismaClient();

export const protect = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            return next(new AppError("You are not logged in. Please log in to access.", 401));
        }

        const token = authHeader.split(" ")[1];

        const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { id: number; role: string };

        const user = await prisma.user.findUnique({ where: { id: decoded.id } });

        if (!user) {
            return next(new AppError("User not found.", 404));
        }

        res.locals.user = user;
        next();
    } catch (err) {
        next(new AppError("Invalid or expired token. Please log in again.", 401));
    }
};
