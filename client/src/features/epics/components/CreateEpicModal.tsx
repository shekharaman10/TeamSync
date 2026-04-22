import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Modal } from "../../../components/ui/Modal";
import { ErrorBanner } from "../../../components/ui/ErrorBanner";
import { CreateEpicSchema } from "../schemas";
import { useCreateEpic } from "../api";
import { extractErrorMessage } from "../../../lib/error";
import type { CreateEpicInput } from "../schemas";

type Props = { projectId: string; isOpen: boolean; onClose: () => void };

export function CreateEpicModal({ projectId, isOpen, onClose }: Props) {
  const { mutate, isPending } = useCreateEpic(projectId);

  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors },
  } = useForm<CreateEpicInput>({ resolver: zodResolver(CreateEpicSchema) });

  useEffect(() => {
    if (!isOpen) reset();
  }, [isOpen, reset]);

  function onSubmit(data: CreateEpicInput) {
    mutate(data, {
      onSuccess: () => { reset(); onClose(); },
      onError: (err) => setError("root", { message: extractErrorMessage(err) }),
    });
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Create epic">
      {errors.root && <ErrorBanner message={errors.root.message ?? ""} className="mb-4" />}
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <label className="mb-1.5 block text-xs font-medium text-zinc-400" htmlFor="epic-title">
            Title
          </label>
          <input
            id="epic-title"
            type="text"
            placeholder="Epic title"
            {...register("title")}
            className="w-full rounded-lg border border-white/8 bg-white/5 px-4 py-2.5 text-sm text-white placeholder-zinc-600 focus:border-teal-500/40 focus:outline-none"
          />
          {errors.title && <p className="mt-1 text-xs text-red-400">{errors.title.message}</p>}
        </div>

        <div>
          <label className="mb-1.5 block text-xs font-medium text-zinc-400" htmlFor="epic-desc">
            Description <span className="text-zinc-600">(optional)</span>
          </label>
          <textarea
            id="epic-desc"
            rows={3}
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
            {isPending ? "Creating…" : "Create epic"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
