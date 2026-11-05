// useAuthInit() - check the saved session before showing protected routes.
import { useCallback, useEffect, useState } from "react";
import { me } from "@/api/auth.api";
import { getErrorMessage } from "@/api/client";
import { useAuthStore } from "@/store/auth";

type CheckResult = {
  token: string;
  attempt: number;
  error: string | null;
};

// Call once in App; returns loading, error and manual retry controls.
export const useAuthInit = () => {
  const token = useAuthStore((state) => state.token);
  const [attempt, setAttempt] = useState(0);
  const [result, setResult] = useState<CheckResult | null>(null);

  useEffect(() => {
    // No saved token means there is no session to check.
    if (!token) {
      setResult(null);
      return;
    }

    const controller = new AbortController();

    const checkSession = async () => {
      try {
        const user = await me(controller.signal);

        // Ignore responses from an old session or an unmounted component.
        if (controller.signal.aborted || useAuthStore.getState().token !== token) return;

        useAuthStore.getState().login(token, user);
        setResult({ token, attempt, error: null });
      } catch (error) {
        if (controller.signal.aborted || useAuthStore.getState().token !== token) return;

        // Axios logs out invalid/blocked sessions; other failures allow retry.
        setResult({ token, attempt, error: getErrorMessage(error) });
      }
    };

    void checkSession();

    // Cancel when the token changes, on retry or when App unmounts.
    return () => controller.abort();
  }, [token, attempt]);

  const retry = useCallback(() => {
    setAttempt((value) => value + 1);
  }, []);

  // Block the first render too, before the effect starts the request.
  const isFinished = result?.token === token && result?.attempt === attempt;

  return {
    isChecking: Boolean(token && !isFinished),
    error: token && isFinished ? result?.error ?? null : null,
    retry,
  };
};
