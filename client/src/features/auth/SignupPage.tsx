import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useNavigate, Link } from "react-router-dom";
import { SignupSchema } from "./auth.schemas";
import { extractErrorMessage } from "../../lib/error";
import type { SignupInput } from "./auth.schemas";
import { useSignup } from "./auth.api";
import { useAuthStore } from "./useAuthStore";

function GoogleIcon() {
  return (
    <svg className="h-4 w-4 shrink-0" viewBox="0 0 24 24">
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
    </svg>
  );
}

function ArrowIcon() {
  return (
    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M5 12h14M12 5l7 7-7 7" />
    </svg>
  );
}

export function SignupPage() {
  const navigate = useNavigate();
  const { setUser } = useAuthStore();
  const { mutate: signup, isPending } = useSignup();

  const {
    register,
    handleSubmit,
    formState: { errors },
    setError,
  } = useForm<SignupInput>({
    resolver: zodResolver(SignupSchema),
  });

  function onSubmit(data: SignupInput) {
    signup(data, {
      onSuccess: ({ user }) => {
        setUser(user);
        navigate("/app", { replace: true });
      },
      onError: (err) => {
        setError("root", { message: extractErrorMessage(err) });
      },
    });
  }

  return (
    <div className="auth-bg relative flex min-h-screen items-center justify-center px-4">
      <div className="absolute inset-0 bg-black/62" />
      <div className="auth-card relative z-10 w-full max-w-md overflow-hidden rounded-2xl shadow-2xl shadow-black/80">

        {/* Glass header */}
        <div className="relative overflow-hidden px-8 pb-7 pt-8">
          <div className="absolute inset-0 bg-linear-to-b from-zinc-600 to-zinc-800" />
          <div className="absolute inset-0 bg-linear-to-br from-teal-400/25 via-teal-700/10 to-transparent" />
          <div className="absolute inset-0 bg-linear-to-b from-white/10 via-transparent to-transparent" />
          <div className="relative">
            <h1 className="text-[28px] font-bold tracking-tight text-white">Create account</h1>
            <p className="mt-1 text-sm text-zinc-300/80">Start your TeamSync journey</p>
          </div>
        </div>

        {/* Form body */}
        <div className="bg-zinc-900 px-8 pb-8 pt-6">
          {errors.root && (
            <div className="mb-5 rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-400">
              {errors.root.message}
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-3">
            <div>
              <div className="rounded-full border border-white/8 bg-white/5 px-5 py-3 transition-colors focus-within:border-teal-500/40">
                <span className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500">Name</span>
                <input
                  type="text"
                  autoComplete="name"
                  {...register("name")}
                  className="block w-full bg-transparent text-sm text-white placeholder-zinc-600 focus:outline-none"
                />
              </div>
              {errors.name && (
                <p className="ml-4 mt-1.5 text-xs text-red-400">{errors.name.message}</p>
              )}
            </div>

            <div>
              <div className="rounded-full border border-white/8 bg-white/5 px-5 py-3 transition-colors focus-within:border-teal-500/40">
                <span className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500">Email</span>
                <input
                  type="email"
                  autoComplete="email"
                  {...register("email")}
                  className="block w-full bg-transparent text-sm text-white placeholder-zinc-600 focus:outline-none"
                />
              </div>
              {errors.email && (
                <p className="ml-4 mt-1.5 text-xs text-red-400">{errors.email.message}</p>
              )}
            </div>

            <div>
              <div className="rounded-full border border-white/8 bg-white/5 px-5 py-3 transition-colors focus-within:border-teal-500/40">
                <span className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500">Password</span>
                <input
                  type="password"
                  autoComplete="new-password"
                  {...register("password")}
                  className="block w-full bg-transparent text-sm text-white placeholder-zinc-600 focus:outline-none"
                />
              </div>
              {errors.password && (
                <p className="ml-4 mt-1.5 text-xs text-red-400">{errors.password.message}</p>
              )}
            </div>

            <button
              type="submit"
              disabled={isPending}
              className="flex w-full items-center justify-center gap-2 rounded-full bg-teal-400 py-3.5 text-sm font-semibold text-black transition-colors hover:bg-teal-300 disabled:opacity-50"
            >
              {isPending ? (
                <>
                  <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Creating account…
                </>
              ) : (
                "Create account"
              )}
            </button>
          </form>

          <div className="my-5 flex items-center gap-3">
            <div className="h-px flex-1 bg-white/8" />
            <span className="text-xs font-medium text-zinc-600">OR</span>
            <div className="h-px flex-1 bg-white/8" />
          </div>

          <button
            type="button"
            className="flex w-full items-center gap-3 rounded-full border border-white/8 bg-white/5 px-5 py-3 text-sm text-zinc-300 transition-colors hover:bg-white/10"
          >
            <GoogleIcon />
            <span className="flex-1 text-left">Continue with Google</span>
            <span className="text-zinc-600"><ArrowIcon /></span>
          </button>

          <p className="mt-7 text-center text-sm text-zinc-600">
            Already have an account?{" "}
            <Link to="/login" className="font-semibold text-teal-400 hover:text-teal-300">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
