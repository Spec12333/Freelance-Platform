import { LoginBody } from "@/types/api";
import { SubmitHandler, useForm } from "react-hook-form";
import { Link, useNavigate } from "react-router-dom";
import AuthLayout from "@/components/layout/AuthLayout";
import { LockIcon, MailIcon } from "@/components/ui/icons";
import { useState } from "react";
import { useAuthStore } from "@/store/auth";
import { loginUser } from "@/api/auth.api";
import { getErrorMessage } from "@/api/client";

// Email + password sign-in.
export default function Login() {
  const navigate = useNavigate();
  const login = useAuthStore((state) => state.login);
  const [serverError, setServerError] = useState("");
  const {
    register,
    formState: { errors, isSubmitting },
    handleSubmit,
  } = useForm<LoginBody>();
  const handleLogin: SubmitHandler<LoginBody> = async (data) => {
    setServerError("");
    try {
      const user = await loginUser(data);
      login(user.token, user.user);
      navigate("/");
    } catch (error) {
      setServerError(getErrorMessage(error));
    }
  };

  return (
    <AuthLayout>
      <h2 className="text-3xl font-extrabold tracking-tight text-gray-900 sm:text-[32px]">
        Welcome back
      </h2>
      <p className="mt-2 text-[15px] text-gray-500">
        Log in to manage your orders and proposals.
      </p>

      <form onSubmit={handleSubmit(handleLogin)} className="mt-8 space-y-5">
        <div>
          <label htmlFor="login-email" className="field-label">
            Email
          </label>
          <div className="relative">
            <span className="input-icon">
              <MailIcon />
            </span>
            <input
              id="login-email"
              type="text"
              placeholder="you@example.com"
              aria-invalid={errors.email ? true : undefined}
              className="input pl-11"
              {...register("email", { required: "Please enter your email" })}
            />
          </div>
          {errors.email && (
            <p className="field-error">{errors.email.message}</p>
          )}
        </div>

        <div>
          <label htmlFor="login-password" className="field-label">
            Password
          </label>
          <div className="relative">
            <span className="input-icon">
              <LockIcon />
            </span>
            <input
              id="login-password"
              type="password"
              placeholder="Your password"
              aria-invalid={errors.password ? true : undefined}
              className="input pl-11"
              {...register("password", {
                required: "Please enter your password",
              })}
            />
          </div>
          {errors.password && (
            <p className="field-error">{errors.password.message}</p>
          )}
        </div>

        {serverError && <div role="alert" className="alert-error">{serverError}</div>}

        <div className="pt-1">
          <button
            type="submit"
            disabled={isSubmitting}
            className="btn btn-primary btn-lg w-full"
          >
            {isSubmitting ? "Logging in…" : "Log in"}
          </button>
        </div>
      </form>

      <p className="mt-8 text-center text-sm text-gray-600">
        Don't have an account?{" "}
        <Link to="/register" className="link">
          Sign up
        </Link>
      </p>

      {/* Seed accounts, so an interviewer can try the app without registering. */}
      <div className="card mt-8 p-4">
        <p className="text-xs font-bold tracking-wide text-gray-500 uppercase">
          Demo accounts
        </p>
        <dl className="mt-3 space-y-2 text-sm">
          <div className="flex items-center justify-between gap-3">
            <dt className="font-semibold text-gray-800">Client</dt>
            <dd className="truncate font-mono text-xs text-gray-600">
              client@freelancehub.dev / client123
            </dd>
          </div>
          <div className="flex items-center justify-between gap-3">
            <dt className="font-semibold text-gray-800">Freelancer</dt>
            <dd className="truncate font-mono text-xs text-gray-600">
              anna@freelancehub.dev / anna123
            </dd>
          </div>
        </dl>
      </div>
    </AuthLayout>
  );
}
