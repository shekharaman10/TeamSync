import { Router } from "express";
import { requireAuth } from "../../middleware/require-auth";
import { loginRateLimit, signupRateLimit, refreshRateLimit } from "../../middleware/rate-limit";
import * as controller from "./auth.controller";

export const authRouter = Router();

authRouter.post("/signup", signupRateLimit, controller.signup);
authRouter.post("/login", loginRateLimit, controller.login);
authRouter.post("/refresh", refreshRateLimit, controller.refresh);
authRouter.post("/logout", controller.logout);
authRouter.get("/me", requireAuth, controller.me);
