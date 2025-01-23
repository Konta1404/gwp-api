import { Request, Response, NextFunction } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import { PrismaClient } from "@prisma/client";
import { AppError } from "../lib/appError";
import catchAsync from "../lib/catchAsync";

const prisma = new PrismaClient();

const signToken = (id: number, role: string) => {
    return jwt.sign({ id, role }, process.env.JWT_SECRET!, {
        expiresIn: process.env.JWT_EXPIRES,
    });
};

export const register = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { name, email, password } = req.body;

        if (!name || !email || !password) {
            return next(new AppError("Please provide name, email, and password", 400));
        }

        const hashedPassword = await bcrypt.hash(password, 12);

        const newUser = await prisma.user.create({
            data: { name, email, password: hashedPassword },
        });

        const token = signToken(newUser.id, newUser.role);

        res.status(201).setHeader("Authorization", `Bearer ${token}`).json({
            status: "success",
            data: { user: newUser },
        });
    } catch (err) {
        next(err);
    }
};

// export const login = async (req: Request, res: Response, next: NextFunction) => {
//     try {
//         const { email, password } = req.body;
//
//         if (!email || !password) {
//             return next(new AppError("Please provide email and password", 400));
//         }
//
//         const user = await prisma.user.findUnique({ where: { email } });
//
//         if (!user || !(await bcrypt.compare(password, user.password))) {
//             return next(new AppError("Incorrect email or password", 401));
//         }
//
//         const token = signToken(user.id, user.role);
//
//         res.status(200).setHeader("Authorization", `Bearer ${token}`).json({
//             status: "success",
//             data: { user },
//         });
//     } catch (err) {
//         next(err);
//     }
// };

export const login = catchAsync(
    async (req: Request, res: Response, next: NextFunction) => {
        const { email, password }: { email: string; password: string } = req.body;

        if (!email || !password) {
            return next(new AppError("Unesite email i lozinku", 400));
        }

        const user = await prisma.user.findUnique({ where: { email } });

        if (!user || !(await bcrypt.compare(password, user.password))) {
            return next(new AppError("Incorrect email or password", 401));
        }

        const token = signToken(user.id, user.role);

        res.status(200).setHeader("Authorization", `Bearer ${token}`).json({
            status: "success",
            data: { user },
        });
    }
);

export const resetPassword = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { token, newPassword } = req.body;

        if (!token || !newPassword) {
            return next(new AppError("Invalid request", 400));
        }

        const hashedToken = crypto.createHash("sha256").update(token).digest("hex");

        const user = await prisma.user.findFirst({
            where: {
                resetPasswordToken: hashedToken,
                resetPasswordExpires: {
                    gt: new Date(),
                },
            },
        });

        if (!user) {
            return next(new AppError("Token is invalid or has expired", 400));
        }

        const hashedPassword = await bcrypt.hash(newPassword, 12);

        await prisma.user.update({
            where: { id: user.id },
            data: {
                password: hashedPassword,
                resetPasswordToken: null,
                resetPasswordExpires: null,
                passwordChangedAt: new Date(),
            },
        });

        res.status(200).json({
            status: "success",
            message: "Password reset successfully",
        });
    } catch (err) {
        next(err);
    }
};

export const updatePassword = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { currentPassword, newPassword } = req.body;

        if (!currentPassword || !newPassword) {
            return next(new AppError("Please provide current and new password", 400));
        }

        const user = await prisma.user.findUnique({ where: { id: res.locals.user.id } });

        if (!user) {
            return next(new AppError("User not found", 404));
        }

        if (!(await bcrypt.compare(currentPassword, user.password))) {
            return next(new AppError("Current password is incorrect", 401));
        }

        const hashedPassword = await bcrypt.hash(newPassword, 12);

        await prisma.user.update({
            where: { id: user.id },
            data: {
                password: hashedPassword,
                passwordChangedAt: new Date(),
            },
        });

        res.status(200).json({
            status: "success",
            message: "Password updated successfully",
        });
    } catch (err) {
        next(err);
    }
};
