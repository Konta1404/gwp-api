import express from "express";
import {
    me,
    register,
    login,
    resetPassword,
    updatePassword,
} from "../controllers/auth.controller";
import { protect } from "../middleware/authMiddleware";

const router = express.Router();

router.get("/me", protect, me);
router.post("/register", register);
router.post("/login", login);
router.post("/resetPassword", resetPassword);
router.patch("/updatePassword", protect, updatePassword);

export default router;
