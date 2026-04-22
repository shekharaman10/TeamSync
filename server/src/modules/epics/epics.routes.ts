import { Router } from "express";
import { requireAuth } from "../../middleware/require-auth";
import * as ctrl from "./epics.controller";

export const epicsRouter = Router();

epicsRouter.get("/projects/:projectId/epics", requireAuth, ctrl.list);
epicsRouter.post("/projects/:projectId/epics", requireAuth, ctrl.create);
epicsRouter.delete("/epics/:epicId", requireAuth, ctrl.remove);
