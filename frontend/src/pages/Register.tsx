// Sign-up: email, password, name, role choice (CLIENT/FREELANCER).

import { RegisterBody } from "@/types/api";
import { useForm, type SubmitHandler } from "react-hook-form";
import AuthLayout from "@/components/layout/AuthLayout";
import {
  BriefcaseIcon,
  ChevronDownIcon,
  LockIcon,
  MailIcon,
  UserIcon,
} from "@/components/ui/icons";
import { Link, useNavigate } from "react-router-dom";
import { useState } from "react";
import { registerUser } from "@/api/auth.api";
import { useAuthStore } from "@/store/auth";
import { getErrorMessage } from "@/api/client";

export default function Register() {
  const login = useAuthStore((state) => state.login);
  const navigate = useNavigate();
  const [serverError, setServerError] = useState("");
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegisterBody>();

  const handleRegister: SubmitHandler<RegisterBody> = async (data) => {
    setServerError("");
    try {
      const userData = await registerUser(data);
      login(userData.token, userData.user);
      navigate("/");
    } catch (error) {
      setServerError(getErrorMessage(error));
    }
  };

  return (
    <AuthLayout>
      <h2 className="text-3xl font-extrabold tracking-tight text-gray-900 sm:text-[32px]">
        Create your account
      </h2>
      <p className="mt-2 text-[15px] text-gray-500">
        Join FreelanceHub to post orders or find your next project.
      </p>

      <form onSubmit={handleSubmit(handleRegister)} className="mt-8 space-y-5">
        <div>
          <label htmlFor="register-name" className="field-label">
            Full name
          </label>
          <div className="relative">
            <span className="input-icon">
              <UserIcon />
            </span>
            <input
              id="register-name"
              type="text"
              placeholder="Anna Hakobyan"
              aria-invalid={errors.name ? true : undefined}
              className="input pl-11"
              {...register("name", {
                required: "Please enter your name",
                minLength: { value: 2, message: "At least 2 characters" },
              })}
            />
          </div>
          {errors.name && <p className="field-error">{errors.name.message}</p>}
        </div>

        <div>
          <label htmlFor="register-email" className="field-label">
            Email
          </label>
          <div className="relative">
            <span className="input-icon">
              <MailIcon />
            </span>
            <input
              id="register-email"
              type="text"
              placeholder="you@example.com"
              aria-invalid={errors.email ? true : undefined}
              className="input pl-11"
              {...register("email", {
                required: "Please Enter your email",
                minLength: { value: 6, message: "At least 6 characters" },
              })}
            />
          </div>
          {errors.email && (
            <p className="field-error">{errors.email.message}</p>
          )}
        </div>

        <div>
          <label htmlFor="register-password" className="field-label">
            Password
          </label>
          <div className="relative">
            <span className="input-icon">
              <LockIcon />
            </span>
            <input
              id="register-password"
              type="password"
              placeholder="Create a password"
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

        <div>
          <label htmlFor="register-role" className="field-label">
            I want to join as
          </label>
          <div className="relative">
            <span className="input-icon">
              <BriefcaseIcon />
            </span>
            <select
              id="register-role"
              defaultValue=""
              aria-invalid={errors.role ? true : undefined}
              className="input pl-11"
              {...register("role", { required: "Please choose your role" })}
            >
              <option value="" disabled hidden>
                Select your role
              </option>
              <option value="CLIENT">Client — hiring for a project</option>
              <option value="FREELANCER">Freelancer — looking for work</option>
            </select>
            <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3.5 text-gray-400">
              <ChevronDownIcon />
            </span>
          </div>
          {errors.role && <p className="field-error">{errors.role.message}</p>}
        </div>

        {serverError && <div role="alert" className="alert-error">{serverError}</div>}

        <div className="pt-1">
          <button
            type="submit"
            disabled={isSubmitting}
            className="btn btn-primary btn-lg w-full"
          >
            {isSubmitting ? "Registering..." : "Register"}
          </button>
        </div>
      </form>

      <p className="mt-8 text-center text-sm text-gray-600">
        Already have an account?{" "}
        <Link to="/login" className="link">
          Log in
        </Link>
      </p>
    </AuthLayout>
  );
}
