import { Router } from "express";
import { requireAuth } from "../../middleware/require-auth";
import * as ctrl from "./tasks.controller";

export const tasksRouter = Router();

tasksRouter.get("/projects/:projectId/tasks", requireAuth, ctrl.list);
tasksRouter.post("/projects/:projectId/tasks", requireAuth, ctrl.create);
tasksRouter.get("/tasks/:taskId", requireAuth, ctrl.get);
tasksRouter.patch("/tasks/:taskId", requireAuth, ctrl.update);
tasksRouter.delete("/tasks/:taskId", requireAuth, ctrl.remove);
