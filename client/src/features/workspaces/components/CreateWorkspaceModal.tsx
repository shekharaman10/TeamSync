import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useNavigate } from "react-router-dom";
import { Modal } from "../../../components/ui/Modal";
import { ErrorBanner } from "../../../components/ui/ErrorBanner";
import { CreateWorkspaceSchema, generateSlug } from "../schemas";
import { useCreateWorkspace } from "../api";
import { useWorkspaceStore } from "../store";
import { extractErrorMessage } from "../../../lib/error";
import type { CreateWorkspaceInput } from "../schemas";

type Props = { isOpen: boolean; onClose: () => void };

export function CreateWorkspaceModal({ isOpen, onClose }: Props) {
  const navigate = useNavigate();
  const { setLastWorkspaceId } = useWorkspaceStore();
  const { mutate, isPending } = useCreateWorkspace();

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    setError,
    formState: { errors },
  } = useForm<CreateWorkspaceInput>({ resolver: zodResolver(CreateWorkspaceSchema) });

  const nameValue = watch("name", "");

  useEffect(() => {
    setValue("slug", generateSlug(nameValue));
  }, [nameValue, setValue]);

  useEffect(() => {
    if (!isOpen) reset();
  }, [isOpen, reset]);

  function onSubmit(data: CreateWorkspaceInput) {
    mutate(data, {
      onSuccess: (workspace) => {
        setLastWorkspaceId(workspace.id);
        onClose();
        navigate(`/app/workspaces/${workspace.id}/board`);
      },
      onError: (err) => setError("root", { message: extractErrorMessage(err) }),
    });
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Create workspace">
      {errors.root && (
        <ErrorBanner message={errors.root.message ?? ""} className="mb-4" />
      )}
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <label className="mb-1.5 block text-xs font-medium text-zinc-400" htmlFor="ws-name">
            Name
          </label>
          <input
            id="ws-name"
            type="text"
            placeholder="Acme Corp"
            {...register("name")}
            className="w-full rounded-lg border border-white/8 bg-white/5 px-4 py-2.5 text-sm text-white placeholder-zinc-600 focus:border-teal-500/40 focus:outline-none"
          />
          {errors.name && <p className="mt-1 text-xs text-red-400">{errors.name.message}</p>}
        </div>

        <div>
          <label className="mb-1.5 block text-xs font-medium text-zinc-400" htmlFor="ws-slug">
            Slug
          </label>
          <div className="flex items-center rounded-lg border border-white/8 bg-white/5 px-4 py-2.5 focus-within:border-teal-500/40">
            <span className="mr-1 text-xs text-zinc-600">teamsync.app/</span>
            <input
              id="ws-slug"
              type="text"
              {...register("slug")}
              className="flex-1 bg-transparent text-sm text-white placeholder-zinc-600 focus:outline-none"
            />
          </div>
          {errors.slug && <p className="mt-1 text-xs text-red-400">{errors.slug.message}</p>}
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-white/10 px-4 py-2 text-xs font-medium text-zinc-400 transition-colors hover:bg-white/5"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isPending}
            className="rounded-lg bg-teal-400 px-4 py-2 text-xs font-semibold text-black transition-colors hover:bg-teal-300 disabled:opacity-50"
          >
            {isPending ? "Creating…" : "Create workspace"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
