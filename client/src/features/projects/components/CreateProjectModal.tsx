import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useNavigate, useParams } from "react-router-dom";
import { Modal } from "../../../components/ui/Modal";
import { ErrorBanner } from "../../../components/ui/ErrorBanner";
import { CreateProjectSchema, generateProjectKey } from "../schemas";
import { useCreateProject } from "../api";
import { extractErrorMessage } from "../../../lib/error";
import type { CreateProjectInput } from "../schemas";

type Props = { isOpen: boolean; onClose: () => void };

export function CreateProjectModal({ isOpen, onClose }: Props) {
  const { workspaceId } = useParams<{ workspaceId: string }>();
  const navigate = useNavigate();
  const { mutate, isPending } = useCreateProject(workspaceId!);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    setError,
    formState: { errors },
  } = useForm<CreateProjectInput>({ resolver: zodResolver(CreateProjectSchema) });

  const nameValue = watch("name", "");

  useEffect(() => {
    setValue("key", generateProjectKey(nameValue));
  }, [nameValue, setValue]);

  useEffect(() => {
    if (!isOpen) reset();
  }, [isOpen, reset]);

  function onSubmit(data: CreateProjectInput) {
    mutate(data, {
      onSuccess: (project) => {
        onClose();
        navigate(`/app/workspaces/${workspaceId}/projects/${project.id}/epics`);
      },
      onError: (err) => setError("root", { message: extractErrorMessage(err) }),
    });
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Create project">
      {errors.root && <ErrorBanner message={errors.root.message ?? ""} className="mb-4" />}
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <label className="mb-1.5 block text-xs font-medium text-zinc-400" htmlFor="proj-name">
            Name
          </label>
          <input
            id="proj-name"
            type="text"
            placeholder="My Project"
            {...register("name")}
            className="w-full rounded-lg border border-white/8 bg-white/5 px-4 py-2.5 text-sm text-white placeholder-zinc-600 focus:border-teal-500/40 focus:outline-none"
          />
          {errors.name && <p className="mt-1 text-xs text-red-400">{errors.name.message}</p>}
        </div>

        <div>
          <label className="mb-1.5 block text-xs font-medium text-zinc-400" htmlFor="proj-key">
            Key <span className="text-zinc-600">(e.g. SYNC, APP)</span>
          </label>
          <input
            id="proj-key"
            type="text"
            placeholder="PROJ"
            {...register("key")}
            className="w-full rounded-lg border border-white/8 bg-white/5 px-4 py-2.5 font-mono text-sm uppercase text-white placeholder-zinc-600 focus:border-teal-500/40 focus:outline-none"
          />
          {errors.key && <p className="mt-1 text-xs text-red-400">{errors.key.message}</p>}
        </div>

        <div>
          <label className="mb-1.5 block text-xs font-medium text-zinc-400" htmlFor="proj-desc">
            Description <span className="text-zinc-600">(optional)</span>
          </label>
          <textarea
            id="proj-desc"
            rows={2}
            {...register("description")}
            className="w-full resize-none rounded-lg border border-white/8 bg-white/5 px-4 py-2.5 text-sm text-white placeholder-zinc-600 focus:border-teal-500/40 focus:outline-none"
          />
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-white/10 px-4 py-2 text-xs font-medium text-zinc-400 hover:bg-white/5"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isPending}
            className="rounded-lg bg-teal-400 px-4 py-2 text-xs font-semibold text-black hover:bg-teal-300 disabled:opacity-50"
          >
            {isPending ? "Creating…" : "Create project"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
