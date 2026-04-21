// Augments Express Request so req.user is available after requireAuth middleware.
declare namespace Express {
  interface Request {
    user?: { id: string };
  }
}
