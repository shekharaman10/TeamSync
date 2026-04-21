import type { Request, Response } from "express";
import { SignupSchema, LoginSchema } from "./auth.schemas";
import * as service from "./auth.service";
import { setAuthCookies, clearAuthCookies } from "../../utils/cookies";

// Express 5 propagates async errors automatically — no try/catch needed here.

export async function signup(req: Request, res: Response): Promise<void> {
  const body = SignupSchema.parse(req.body);
  const { user, accessToken, refreshToken } = await service.signup(body);
  setAuthCookies(res, accessToken, refreshToken);
  res.status(201).json({ user });
}

export async function login(req: Request, res: Response): Promise<void> {
  const body = LoginSchema.parse(req.body);
  const { user, accessToken, refreshToken } = await service.login(body);
  setAuthCookies(res, accessToken, refreshToken);
  res.json({ user });
}

export async function refresh(req: Request, res: Response): Promise<void> {
  const rawToken: string | undefined = req.cookies?.refresh_token;
  if (!rawToken) {
    res.status(401).json({ message: "No refresh token" });
    return;
  }
  const { accessToken, refreshToken } = await service.refreshTokens(rawToken);
  setAuthCookies(res, accessToken, refreshToken);
  res.json({ message: "Refreshed" });
}

export async function logout(req: Request, res: Response): Promise<void> {
  const rawToken: string | undefined = req.cookies?.refresh_token;
  if (rawToken) {
    await service.logout(rawToken);
  }
  clearAuthCookies(res);
  res.status(204).send();
}

export async function me(req: Request, res: Response): Promise<void> {
  const user = await service.getMe(req.user!.id);
  res.json({ user });
}
