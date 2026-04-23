import { useState } from "react";
import { Send, Pencil, Trash2, X, Check } from "lucide-react";
import { useComments, useCreateComment, useUpdateComment, useDeleteComment } from "../api";
import { useAuthStore } from "../../auth/useAuthStore";
import { Skeleton } from "../../../components/ui/Skeleton";
import type { Comment } from "../../../lib/types";

function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60_000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(iso).toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

function initials(name: string) {
  return name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);
}

function CommentRow({
  comment,
  currentUserId,
  taskId,
}: {
  comment: Comment;
  currentUserId: string;
  taskId: string;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(comment.body);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const { mutate: updateComment, isPending: updating } = useUpdateComment(taskId);
  const { mutate: deleteComment, isPending: deleting } = useDeleteComment(taskId);

  const isOwn = comment.author.id === currentUserId;

  function submitEdit() {
    const trimmed = draft.trim();
    if (!trimmed || trimmed === comment.body) { setEditing(false); return; }
    updateComment({ commentId: comment.id, body: trimmed }, { onSuccess: () => setEditing(false) });
  }

  return (
    <div className="group flex gap-3">
      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-zinc-700 text-[10px] font-bold text-zinc-300">
        {initials(comment.author.name)}
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex items-baseline gap-2">
          <span className="text-xs font-semibold text-zinc-300">{comment.author.name}</span>
          <span className="text-[10px] text-zinc-600">{relativeTime(comment.createdAt)}</span>
          {comment.updatedAt !== comment.createdAt && (
            <span className="text-[10px] text-zinc-700">(edited)</span>
          )}
        </div>

        {editing ? (
          <div className="mt-1.5">
            <textarea
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              rows={3}
              aria-label="Edit comment"
              placeholder="Edit your comment…"
              className="w-full resize-none rounded-lg border border-white/10 bg-zinc-800 px-3 py-2 text-xs text-zinc-100 placeholder-zinc-600 focus:border-emerald-500/40 focus:outline-none focus:ring-1 focus:ring-emerald-500/20"
            />
            <div className="mt-1.5 flex gap-2">
              <button
                type="button"
                onClick={submitEdit}
                disabled={updating}
                className="flex items-center gap-1 rounded-md bg-emerald-600 px-2.5 py-1 text-[10px] font-semibold text-white transition-colors hover:bg-emerald-500 disabled:opacity-50"
              >
                <Check size={10} /> Save
              </button>
              <button
                type="button"
                onClick={() => { setEditing(false); setDraft(comment.body); }}
                className="flex items-center gap-1 rounded-md px-2.5 py-1 text-[10px] text-zinc-500 transition-colors hover:text-zinc-300"
              >
                <X size={10} /> Cancel
              </button>
            </div>
          </div>
        ) : (
          <p className="mt-0.5 whitespace-pre-wrap text-xs leading-relaxed text-zinc-400">{comment.body}</p>
        )}
      </div>

      {isOwn && !editing && (
        <div className="flex shrink-0 items-start gap-1 opacity-0 transition-opacity group-hover:opacity-100">
          <button
            type="button"
            onClick={() => setEditing(true)}
            className="rounded p-1 text-zinc-600 transition-colors hover:text-zinc-400"
            title="Edit"
          >
            <Pencil size={11} />
          </button>
          {confirmDelete ? (
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => deleteComment(comment.id)}
                disabled={deleting}
                className="rounded px-1.5 py-0.5 text-[10px] text-red-400 transition-colors hover:text-red-300 disabled:opacity-50"
              >
                Delete?
              </button>
              <button
                type="button"
                onClick={() => setConfirmDelete(false)}
                title="Cancel delete"
                aria-label="Cancel delete"
                className="rounded p-1 text-zinc-600 hover:text-zinc-400"
              >
                <X size={10} />
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setConfirmDelete(true)}
              className="rounded p-1 text-zinc-600 transition-colors hover:text-red-400"
              title="Delete"
            >
              <Trash2 size={11} />
            </button>
          )}
        </div>
      )}
    </div>
  );
}

export function TaskDetailComments({ taskId }: { taskId: string }) {
  const [body, setBody] = useState("");
  const { data: comments, isPending } = useComments(taskId);
  const { mutate: createComment, isPending: posting } = useCreateComment(taskId);
  const user = useAuthStore((s) => s.user);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = body.trim();
    if (!trimmed) return;
    createComment(trimmed, { onSuccess: () => setBody("") });
  }

  return (
    <div className="flex flex-col gap-4">
      <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-500">
        Comments {comments && comments.length > 0 ? `(${comments.length})` : ""}
      </h3>

      {/* Comment list */}
      <div className="flex flex-col gap-4">
        {isPending && (
          <div className="space-y-3">
            {[1, 2].map((i) => <Skeleton key={i} className="h-12 rounded-lg" />)}
          </div>
        )}
        {comments?.length === 0 && (
          <p className="text-xs text-zinc-600">No comments yet. Be the first to add one.</p>
        )}
        {comments?.map((c) => (
          <CommentRow key={c.id} comment={c} currentUserId={user?.id ?? ""} taskId={taskId} />
        ))}
      </div>

      {/* New comment form */}
      <form onSubmit={handleSubmit} className="flex gap-2.5">
        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-emerald-500/20 text-[10px] font-bold text-emerald-300">
          {user ? initials(user.name) : "?"}
        </div>
        <div className="flex flex-1 gap-2">
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="Add a comment…"
            rows={1}
            onKeyDown={(e) => {
              if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
                e.preventDefault();
                handleSubmit(e as unknown as React.FormEvent);
              }
            }}
            className="flex-1 resize-none rounded-lg border border-white/8 bg-zinc-800/60 px-3 py-1.5 text-xs text-zinc-200 placeholder-zinc-600 focus:border-emerald-500/30 focus:outline-none focus:ring-1 focus:ring-emerald-500/15"
          />
          <button
            type="submit"
            disabled={!body.trim() || posting}
            className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-emerald-600 text-white transition-colors hover:bg-emerald-500 disabled:opacity-40"
            title="Submit (⌘Enter)"
          >
            <Send size={12} />
          </button>
        </div>
      </form>
    </div>
  );
}
