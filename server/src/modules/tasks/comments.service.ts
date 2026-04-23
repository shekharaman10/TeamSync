import { prisma } from "../../config/prisma";
import { HttpError } from "../../utils/http-error";

const commentSelect = {
  id: true,
  taskId: true,
  body: true,
  createdAt: true,
  updatedAt: true,
  author: { select: { id: true, name: true, avatarUrl: true } },
} as const;

async function assertCommentAccess(commentId: string, userId: string) {
  const comment = await prisma.comment.findUnique({
    where: { id: commentId },
    select: {
      id: true,
      authorId: true,
      task: { select: { project: { select: { workspaceId: true } } } },
    },
  });
  if (!comment) throw new HttpError(404, "Comment not found");

  const membership = await prisma.membership.findUnique({
    where: {
      userId_workspaceId: {
        userId,
        workspaceId: comment.task.project.workspaceId,
      },
    },
    select: { role: true },
  });
  if (!membership) throw new HttpError(404, "Comment not found");

  return { comment, membership };
}

export async function listComments(taskId: string, userId: string) {
  const task = await prisma.task.findUnique({
    where: { id: taskId },
    select: { id: true, project: { select: { workspaceId: true } } },
  });
  if (!task) throw new HttpError(404, "Task not found");

  const membership = await prisma.membership.findUnique({
    where: { userId_workspaceId: { userId, workspaceId: task.project.workspaceId } },
    select: { id: true },
  });
  if (!membership) throw new HttpError(404, "Task not found");

  return prisma.comment.findMany({
    where: { taskId },
    select: commentSelect,
    orderBy: { createdAt: "asc" },
  });
}

export async function createComment(taskId: string, userId: string, body: string) {
  const task = await prisma.task.findUnique({
    where: { id: taskId },
    select: { id: true, project: { select: { workspaceId: true } } },
  });
  if (!task) throw new HttpError(404, "Task not found");

  const membership = await prisma.membership.findUnique({
    where: { userId_workspaceId: { userId, workspaceId: task.project.workspaceId } },
    select: { id: true },
  });
  if (!membership) throw new HttpError(404, "Task not found");

  return prisma.comment.create({
    data: { taskId, authorId: userId, body },
    select: commentSelect,
  });
}

export async function updateComment(commentId: string, userId: string, body: string) {
  const { comment, membership } = await assertCommentAccess(commentId, userId);

  const isAuthor = comment.authorId === userId;
  const isPrivileged = membership.role === "OWNER" || membership.role === "ADMIN";
  if (!isAuthor && !isPrivileged) throw new HttpError(403, "Not allowed");

  return prisma.comment.update({
    where: { id: commentId },
    data: { body },
    select: commentSelect,
  });
}

export async function deleteComment(commentId: string, userId: string) {
  const { comment, membership } = await assertCommentAccess(commentId, userId);

  const isAuthor = comment.authorId === userId;
  const isPrivileged = membership.role === "OWNER" || membership.role === "ADMIN";
  if (!isAuthor && !isPrivileged) throw new HttpError(403, "Not allowed");

  await prisma.comment.delete({ where: { id: commentId } });
}
