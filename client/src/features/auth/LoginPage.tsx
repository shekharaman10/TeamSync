import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useNavigate, Link } from "react-router-dom";
import { isAxiosError } from "axios";
import { LoginSchema } from "./auth.schemas";
import type { LoginInput } from "./auth.schemas";
import { useLogin } from "./auth.api";
import { useAuthStore } from "./useAuthStore";

function ArrowIcon() {
  return (
    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M5 12h14M12 5l7 7-7 7" />
    </svg>
  );
}

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

function XIcon() {
  return (
    <svg className="h-4 w-4 shrink-0 fill-current text-zinc-300" viewBox="0 0 24 24">
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.743l7.73-8.835L1.254 2.25H8.08l4.258 5.63 5.906-5.63zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  );
}

export function LoginPage() {
  const navigate = useNavigate();
  const { setUser } = useAuthStore();
  const { mutate: login, isPending } = useLogin();

  const {
    register,
    handleSubmit,
    formState: { errors },
    setError,
  } = useForm<LoginInput>({
    resolver: zodResolver(LoginSchema),
  });

  function onSubmit(data: LoginInput) {
    login(data, {
      onSuccess: ({ user }) => {
        setUser(user);
        navigate("/app", { replace: true });
      },
      onError: (err) => {
        const message = isAxiosError(err)
          ? (err.response?.data?.message as string | undefined) ??
            (err.code === "ERR_NETWORK"
              ? "Cannot reach the server. Make sure the backend is running."
              : "Something went wrong. Please try again.")
          : "Something went wrong. Please try again.";
        setError("root", { message });
      },
    });
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-black px-4">
      <div className="relative w-full max-w-sm overflow-hidden rounded-3xl border border-white/10 bg-linear-to-br from-zinc-800/80 via-zinc-900 to-black p-10 shadow-2xl">
        {/* Teal glow */}
        <div className="pointer-events-none absolute -left-24 -top-24 h-80 w-80 rounded-full bg-teal-500/20 blur-3xl" />

        <div className="relative">
          <h1 className="text-4xl font-bold tracking-tight text-white">Welcome back</h1>
          <p className="mt-1.5 text-sm text-zinc-400">Sign in to your account</p>

          {errors.root && (
            <div className="mt-5 rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-400">
              {errors.root.message}
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} noValidate className="mt-7 space-y-3">
            <div>
              <div className="flex items-center gap-3 rounded-full border border-white/10 bg-white/5 px-5 py-3 focus-within:border-teal-500/40 transition-colors">
                <div className="flex min-w-0 flex-1 flex-col">
                  <span className="text-[10px] font-medium uppercase tracking-wider text-zinc-500">Email</span>
                  <input
                    type="email"
                    autoComplete="email"
                    placeholder="username@gmail.com"
                    {...register("email")}
                    className="bg-transparent text-sm text-white placeholder-zinc-600 focus:outline-none"
                  />
                </div>
                <button
                  type="submit"
                  disabled={isPending}
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-teal-400 text-black transition-colors hover:bg-teal-300 disabled:opacity-60"
                >
                  {isPending ? (
                    <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                  ) : (
                    <ArrowIcon />
                  )}
                </button>
              </div>
              {errors.email && (
                <p className="ml-4 mt-1.5 text-xs text-red-400">{errors.email.message}</p>
              )}
            </div>

            <div>
              <div className="rounded-full border border-white/10 bg-white/5 px-5 py-3 focus-within:border-teal-500/40 transition-colors">
                <span className="text-[10px] font-medium uppercase tracking-wider text-zinc-500">Password</span>
                <input
                  type="password"
                  autoComplete="current-password"
                  {...register("password")}
                  className="block w-full bg-transparent text-sm text-white placeholder-zinc-600 focus:outline-none"
                />
              </div>
              {errors.password && (
                <p className="ml-4 mt-1.5 text-xs text-red-400">{errors.password.message}</p>
              )}
            </div>
          </form>

          <div className="my-6 flex items-center gap-3">
            <div className="h-px flex-1 bg-white/10" />
            <span className="text-xs font-medium text-zinc-500">OR</span>
            <div className="h-px flex-1 bg-white/10" />
          </div>

          <div className="space-y-3">
            <button
              type="button"
              className="flex w-full items-center gap-3 rounded-full border border-white/10 bg-white/5 px-5 py-3.5 text-sm text-zinc-300 transition-colors hover:bg-white/10"
            >
              <GoogleIcon />
              <span className="flex-1 text-left">Continue with Google</span>
              <span className="text-zinc-500"><ArrowIcon /></span>
            </button>

            <button
              type="button"
              className="flex w-full items-center gap-3 rounded-full border border-white/10 bg-white/5 px-5 py-3.5 text-sm text-zinc-300 transition-colors hover:bg-white/10"
            >
              <XIcon />
              <span className="flex-1 text-left">Continue with X</span>
              <span className="text-zinc-500"><ArrowIcon /></span>
            </button>
          </div>

          <p className="mt-8 text-center text-sm text-zinc-500">
            Don&apos;t have an account?{" "}
            <Link to="/signup" className="font-medium text-teal-400 hover:text-teal-300">
              Sign up
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
