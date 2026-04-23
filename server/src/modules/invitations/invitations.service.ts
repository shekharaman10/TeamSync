import crypto from "node:crypto";
import { prisma } from "../../config/prisma";
import { HttpError } from "../../utils/http-error";
import { sendInvitationEmail } from "../../utils/email";
import { env } from "../../config/env";
import type { InviteInput } from "./invitations.schemas";

const INVITE_TTL_MS = 7 * 24 * 60 * 60 * 1000;

export async function listInvitations(workspaceId: string) {
  return prisma.invitation.findMany({
    where: { workspaceId, acceptedAt: null, expiresAt: { gt: new Date() } },
    select: {
      id: true,
      email: true,
      role: true,
      expiresAt: true,
      createdAt: true,
      invitedBy: { select: { id: true, name: true } },
    },
    orderBy: { createdAt: "desc" },
  });
}

export async function createInvitation(workspaceId: string, invitedById: string, input: InviteInput) {
  // Check if already a member
  const existingUser = await prisma.user.findUnique({ where: { email: input.email } });
  if (existingUser) {
    const membership = await prisma.membership.findUnique({
      where: { userId_workspaceId: { userId: existingUser.id, workspaceId } },
    });
    if (membership) throw new HttpError(409, "User is already a member of this workspace");
  }

  // Revoke any existing pending invitation for this email+workspace
  await prisma.invitation.updateMany({
    where: { email: input.email, workspaceId, acceptedAt: null },
    data: { expiresAt: new Date() },
  });

  const token = crypto.randomBytes(32).toString("hex");

  // Fetch inviter name and workspace name for the email (run in parallel)
  const [inviter, workspace] = await Promise.all([
    prisma.user.findUnique({ where: { id: invitedById }, select: { name: true } }),
    prisma.workspace.findUnique({ where: { id: workspaceId }, select: { name: true } }),
  ]);

  const invitation = await prisma.invitation.create({
    data: {
      email: input.email,
      workspaceId,
      role: input.role,
      token,
      invitedById,
      expiresAt: new Date(Date.now() + INVITE_TTL_MS),
    },
    select: {
      id: true,
      email: true,
      role: true,
      expiresAt: true,
      createdAt: true,
      invitedBy: { select: { id: true, name: true } },
    },
  });

  // Fire-and-forget — never blocks the response
  if (inviter && workspace) {
    sendInvitationEmail(input.email, workspace.name, inviter.name, token, env.CLIENT_URL);
  }

  return invitation;
}

export async function revokeInvitation(workspaceId: string, invitationId: string) {
  const inv = await prisma.invitation.findUnique({ where: { id: invitationId } });
  if (!inv || inv.workspaceId !== workspaceId) throw new HttpError(404, "Invitation not found");

  await prisma.invitation.delete({ where: { id: invitationId } });
}

export async function acceptInvitation(token: string, userId: string) {
  const inv = await prisma.invitation.findUnique({
    where: { token },
    include: { workspace: { select: { id: true, name: true } } },
  });

  if (!inv) throw new HttpError(404, "Invitation not found or already used");
  if (inv.acceptedAt) throw new HttpError(409, "Invitation already accepted");
  if (inv.expiresAt < new Date()) throw new HttpError(410, "Invitation has expired");

  // Verify the authenticated user's email matches
  const user = await prisma.user.findUniqueOrThrow({
    where: { id: userId },
    select: { email: true },
  });
  if (user.email.toLowerCase() !== inv.email.toLowerCase()) {
    throw new HttpError(403, "This invitation was sent to a different email address");
  }

  // Check if already a member
  const existing = await prisma.membership.findUnique({
    where: { userId_workspaceId: { userId, workspaceId: inv.workspaceId } },
  });
  if (existing) throw new HttpError(409, "Already a member of this workspace");

  // Create membership + mark accepted atomically
  await prisma.$transaction(async (tx) => {
    await tx.membership.create({
      data: { userId, workspaceId: inv.workspaceId, role: inv.role },
    });
    await tx.invitation.update({
      where: { id: inv.id },
      data: { acceptedAt: new Date() },
    });
  });

  return { id: inv.workspace.id, name: inv.workspace.name };
}
