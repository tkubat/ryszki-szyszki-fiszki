import { useCallback, useId, useMemo, useRef, useState, type FormEvent } from "react";
import { z } from "zod";

import type { LoginCommand } from "@/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { login, normalizeAuthError } from "@/lib/auth/auth.api";
import type { AuthErrorVM, FieldErrorsVM } from "@/lib/auth/auth.types";

interface LoginFormProps {
  onSuccess: (dto: Awaited<ReturnType<typeof login>>) => void;
  onError: (error: AuthErrorVM) => void;
}

const emailSchema = z.string().trim().email("Podaj poprawny adres email");
const passwordSchema = z.string().min(8, "Hasło musi mieć co najmniej 8 znaków");

export function LoginForm({ onSuccess, onError }: LoginFormProps) {
  const emailId = useId();
  const passwordId = useId();
  const emailRef = useRef<HTMLInputElement>(null);
  const passwordRef = useRef<HTMLInputElement>(null);

  const [values, setValues] = useState<LoginCommand>({ email: "", password: "" });
  const [errors, setErrors] = useState<FieldErrorsVM>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const canSubmit = useMemo(() => {
    return Boolean(values.email.trim()) && values.password.length >= 8;
  }, [values.email, values.password]);

  const setFieldValue = useCallback((field: "email" | "password", value: string) => {
    setValues((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: undefined, form: undefined }));
  }, []);

  const handleSubmit = useCallback(
    async (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault();

      const nextErrors: FieldErrorsVM = {};
      const emailResult = emailSchema.safeParse(values.email);
      if (!emailResult.success) {
        nextErrors.email = emailResult.error.issues[0]?.message ?? "Podaj poprawny adres email";
      }

      const passwordResult = passwordSchema.safeParse(values.password);
      if (!passwordResult.success) {
        nextErrors.password = passwordResult.error.issues[0]?.message ?? "Hasło musi mieć co najmniej 8 znaków";
      }

      if (Object.keys(nextErrors).length > 0) {
        setErrors(nextErrors);
        if (nextErrors.email) {
          emailRef.current?.focus();
        } else if (nextErrors.password) {
          passwordRef.current?.focus();
        }
        return;
      }

      setIsSubmitting(true);
      try {
        const payload: LoginCommand = {
          email: values.email.trim(),
          password: values.password,
        };
        const dto = await login(payload);
        onSuccess(dto);
      } catch (error) {
        const authError = normalizeAuthError(error);
        onError(authError);
        setErrors(buildErrorsFromAuthError(authError));
      } finally {
        setIsSubmitting(false);
      }
    },
    [onError, onSuccess, values.email, values.password]
  );

  return (
    <form className="space-y-4" onSubmit={handleSubmit} noValidate data-testid="login-form">
      {errors.form ? (
        <Alert variant="destructive">
          <AlertDescription>{errors.form}</AlertDescription>
        </Alert>
      ) : null}

      <div className="space-y-2">
        <Label htmlFor={emailId}>Email</Label>
        <Input
          ref={emailRef}
          id={emailId}
          type="email"
          placeholder="twoj@email.pl"
          value={values.email}
          onChange={(event) => setFieldValue("email", event.target.value)}
          aria-invalid={Boolean(errors.email)}
          aria-describedby={errors.email ? `${emailId}-error` : undefined}
          disabled={isSubmitting}
          autoComplete="email"
          data-testid="login-email"
        />
        {errors.email ? (
          <p id={`${emailId}-error`} className="text-sm text-destructive">
            {errors.email}
          </p>
        ) : null}
      </div>

      <div className="space-y-2">
        <Label htmlFor={passwordId}>Hasło</Label>
        <Input
          ref={passwordRef}
          id={passwordId}
          type="password"
          placeholder="********"
          value={values.password}
          onChange={(event) => setFieldValue("password", event.target.value)}
          aria-invalid={Boolean(errors.password)}
          aria-describedby={errors.password ? `${passwordId}-error` : undefined}
          disabled={isSubmitting}
          autoComplete="current-password"
          data-testid="login-password"
        />
        {errors.password ? (
          <p id={`${passwordId}-error`} className="text-sm text-destructive">
            {errors.password}
          </p>
        ) : null}
      </div>

      <Button type="submit" className="w-full" disabled={!canSubmit || isSubmitting} data-testid="login-submit">
        {isSubmitting ? "Logowanie..." : "Zaloguj"}
      </Button>
    </form>
  );
}

function buildErrorsFromAuthError(error: AuthErrorVM): FieldErrorsVM {
  if (error.kind === "validation") {
    const fieldErrors = mapIssuesToFieldErrors(error.details);
    if (Object.keys(fieldErrors).length > 0) {
      return fieldErrors;
    }
  }

  return { form: error.message };
}

function mapIssuesToFieldErrors(details: unknown): FieldErrorsVM {
  const issues = extractIssues(details);
  if (!issues) {
    return {};
  }

  return issues.reduce<FieldErrorsVM>((acc, issue) => {
    const field = issue.path?.[0];
    if (field === "email") {
      acc.email = issue.message;
    }
    if (field === "password") {
      acc.password = issue.message;
    }
    return acc;
  }, {});
}

function extractIssues(details: unknown): { message: string; path?: (string | number)[] }[] | null {
  if (!details || typeof details !== "object") {
    return null;
  }

  const issues = (details as { issues?: unknown }).issues;
  if (!Array.isArray(issues)) {
    return null;
  }

  return issues.filter((issue): issue is { message: string; path?: (string | number)[] } => {
    return Boolean(issue && typeof issue === "object" && "message" in issue);
  });
}
