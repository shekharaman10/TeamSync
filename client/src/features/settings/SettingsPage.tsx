import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useWorkspace, useUpdateWorkspace } from "../workspaces/api";
import { UpdateWorkspaceSchema, generateSlug } from "../workspaces/schemas";
import { ErrorBanner } from "../../components/ui/ErrorBanner";
import { extractErrorMessage } from "../../lib/error";
import type { UpdateWorkspaceInput } from "../workspaces/schemas";

function Toggle({ id, label, defaultChecked }: { id: string; label: string; defaultChecked: boolean }) {
  const [checked, setChecked] = useState(defaultChecked);
  return (
    <div className="flex items-center justify-between">
      <label htmlFor={id} className="cursor-pointer text-sm text-zinc-300">{label}</label>
      <button
        id={id}
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => setChecked((v) => !v)}
        className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${checked ? "bg-teal-400" : "bg-zinc-700"}`}
      >
        <span className={`inline-block h-3.5 w-3.5 translate-x-0.5 rounded-full bg-white shadow transition-transform ${checked ? "translate-x-4" : ""}`} />
      </button>
    </div>
  );
}

export function SettingsPage() {
  const { workspaceId } = useParams<{ workspaceId: string }>();
  const { data: workspace } = useWorkspace(workspaceId!);
  const { mutate: updateWorkspace, isPending } = useUpdateWorkspace(workspaceId!);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    setError,
    formState: { errors, isSubmitSuccessful },
  } = useForm<UpdateWorkspaceInput>({
    resolver: zodResolver(UpdateWorkspaceSchema),
    defaultValues: { name: "", slug: "" },
  });

  const nameValue = watch("name", "");

  // Populate form when workspace data loads
  useEffect(() => {
    if (workspace) reset({ name: workspace.name, slug: workspace.slug });
  }, [workspace, reset]);

  // Auto-generate slug only when user changes name manually (not on load)
  const [slugManuallyEdited, setSlugManuallyEdited] = useState(false);
  useEffect(() => {
    if (!slugManuallyEdited && nameValue && workspace && nameValue !== workspace.name) {
      setValue("slug", generateSlug(nameValue));
    }
  }, [nameValue, slugManuallyEdited, workspace, setValue]);

  function onSubmit(data: UpdateWorkspaceInput) {
    updateWorkspace(data, {
      onError: (err) => setError("root", { message: extractErrorMessage(err) }),
    });
  }

  const inputCls =
    "w-full rounded-lg border border-white/8 bg-white/5 px-4 py-2.5 text-sm text-white placeholder-zinc-600 focus:border-teal-500/40 focus:outline-none";

  return (
    <div className="flex h-full flex-col overflow-hidden">
      <div className="flex shrink-0 items-center border-b border-white/5 px-6 py-4">
        <div>
          <h1 className="text-base font-semibold text-white">Settings</h1>
          <p className="text-xs text-zinc-500">Manage your workspace preferences</p>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-6 py-6">
        <div className="mx-auto max-w-xl space-y-6">
          <section className="rounded-xl border border-white/8 bg-zinc-800/40 p-6">
            <h2 className="mb-4 text-sm font-semibold text-white">General</h2>
            {errors.root && <ErrorBanner message={errors.root.message ?? ""} className="mb-4" />}
            {isSubmitSuccessful && !errors.root && (
              <p className="mb-4 text-xs text-teal-400">Changes saved.</p>
            )}
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div>
                <label className="mb-1.5 block text-xs font-medium text-zinc-400" htmlFor="ws-name">
                  Workspace name
                </label>
                <input id="ws-name" type="text" {...register("name")} className={inputCls} />
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
                    {...register("slug", {
                      onChange: () => setSlugManuallyEdited(true),
                    })}
                    className="flex-1 bg-transparent text-sm text-white focus:outline-none"
                  />
                </div>
                {errors.slug && <p className="mt-1 text-xs text-red-400">{errors.slug.message}</p>}
              </div>

              <div className="flex items-center gap-3">
                <button
                  type="submit"
                  disabled={isPending}
                  className="rounded-lg bg-teal-400 px-4 py-2 text-xs font-semibold text-black transition-colors hover:bg-teal-300 disabled:opacity-50"
                >
                  {isPending ? "Saving…" : "Save changes"}
                </button>
              </div>
            </form>
          </section>

          <section className="rounded-xl border border-white/8 bg-zinc-800/40 p-6">
            <h2 className="mb-4 text-sm font-semibold text-white">Notifications</h2>
            <div className="space-y-3">
              {[
                { id: "notif-assign",  label: "Task assigned to me",  defaultOn: true },
                { id: "notif-mention", label: "Mentions",             defaultOn: true },
                { id: "notif-status",  label: "Task status changes",  defaultOn: false },
                { id: "notif-invite",  label: "New member joins",     defaultOn: false },
              ].map(({ id, label, defaultOn }) => (
                <Toggle key={id} id={id} label={label} defaultChecked={defaultOn} />
              ))}
            </div>
          </section>

          <section className="rounded-xl border border-red-500/20 bg-red-500/5 p-6">
            <h2 className="mb-1 text-sm font-semibold text-red-400">Danger zone</h2>
            <p className="mb-4 text-xs text-zinc-500">These actions are permanent and cannot be undone.</p>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-zinc-300">Delete workspace</p>
                  <p className="text-xs text-zinc-600">Permanently deletes all data.</p>
                </div>
                <button
                  type="button"
                  className="rounded-lg border border-red-500/30 px-3 py-1.5 text-xs font-medium text-red-400 transition-colors hover:bg-red-500/10"
                >
                  Delete
                </button>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
