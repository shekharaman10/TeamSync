import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ErrorBanner } from "../../../components/ui/ErrorBanner";
import { InviteSchema } from "../schemas";
import { useInviteUser } from "../api";
import { extractErrorMessage } from "../../../lib/error";
import type { InviteInput } from "../schemas";

type Props = { workspaceId: string };

export function InviteForm({ workspaceId }: Props) {
  const { mutate, isPending } = useInviteUser(workspaceId);

  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors, isSubmitSuccessful },
  } = useForm<InviteInput>({
    resolver: zodResolver(InviteSchema),
    defaultValues: { role: "MEMBER" },
  });

  function onSubmit(data: InviteInput) {
    mutate(data, {
      onSuccess: () => reset(),
      onError: (err) => setError("root", { message: extractErrorMessage(err) }),
    });
  }

  return (
    <div className="rounded-xl border border-white/8 bg-zinc-800/40 p-5">
      <h2 className="mb-1 text-sm font-semibold text-white">Invite a team member</h2>
      <p className="mb-4 text-xs text-zinc-500">
        They'll receive an email with a link to join this workspace.
      </p>

      {errors.root && (
        <ErrorBanner message={errors.root.message ?? ""} className="mb-3" />
      )}
      {isSubmitSuccessful && !errors.root && (
        <p className="mb-3 text-xs text-teal-400">Invitation sent!</p>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="flex gap-2">
        <input
          type="email"
          placeholder="colleague@company.com"
          {...register("email")}
          className="flex-1 rounded-lg border border-white/8 bg-white/5 px-4 py-2 text-sm text-white placeholder-zinc-600 focus:border-teal-500/40 focus:outline-none"
        />
        <select
          aria-label="Role"
          {...register("role")}
          className="rounded-lg border border-white/8 bg-zinc-900 px-3 py-2 text-xs text-zinc-300 focus:outline-none"
        >
          <option value="MEMBER">Member</option>
          <option value="ADMIN">Admin</option>
        </select>
        <button
          type="submit"
          disabled={isPending}
          className="rounded-lg bg-teal-400 px-4 py-2 text-xs font-semibold text-black transition-colors hover:bg-teal-300 disabled:opacity-50"
        >
          {isPending ? "Sending…" : "Send invite"}
        </button>
      </form>
      {errors.email && <p className="mt-1 text-xs text-red-400">{errors.email.message}</p>}
    </div>
  );
}
