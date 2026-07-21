"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { t } from "@/lib/translations";
import { ArrowLeft, Eye, EyeOff, LogIn } from "lucide-react";
import { toast } from "react-toastify";
import { extractErrorMessage } from "@/lib/error-utils";
import api from "@/lib/api";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const { login } = useAuth();
  const { language } = useLanguage();
  const router = useRouter();
  const getT = (key: string) => t(key, language);

  const inputClass =
    "h-11 w-full rounded-lg border border-border bg-background px-3 text-base text-foreground outline-none transition placeholder:text-sm placeholder:text-muted-foreground/60 focus:border-primary focus:ring-2 focus:ring-primary/15";

  const labelClass =
    "mb-1.5 block text-sm font-medium tracking-wide text-muted-foreground";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      await login(email, password);

      toast.success(
        language === "en" ? "Login successful" : "Galiddu way guulaysatay",
      );

      router.push("/");
    } catch (err: any) {
      const loginErrorCode = err?.response?.data?.code;
      const loginErrorMessage = err?.response?.data?.error;
      const requiresEmailVerification =
        loginErrorCode === "EMAIL_VERIFICATION_REQUIRED" ||
        (err?.response?.status === 403 &&
          typeof loginErrorMessage === "string" &&
          /email not verified/i.test(loginErrorMessage));

      if (requiresEmailVerification) {
        const normalizedEmail = email.trim().toLowerCase();

        try {
          await api.post("/auth/resend-verification", {
            email: normalizedEmail,
          });
          toast.info(
            language === "en"
              ? "If verification is required, a new code will arrive shortly."
              : "Haddii xaqiijin loo baahan yahay, lambar cusub ayaa iman doona wax yar kadib.",
          );
        } catch (resendError: any) {
          toast.error(
            extractErrorMessage(
              resendError,
              language === "en"
                ? "The code could not be sent. Use Resend Code on the verification page."
                : "Lambarka lama diri karin. Bogga xaqiijinta ka dooro Dib u dir lambarka.",
            ),
          );
        }

        router.replace(
          `/verify-email?email=${encodeURIComponent(normalizedEmail)}`,
        );
        return;
      }

      toast.error(
        extractErrorMessage(
          err,
          language === "en" ? "Login failed" : "Galiddu way fashilantay",
        ),
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center bg-background px-4 py-16">
        <Link
          href="/"
          className="absolute left-4 top-4 inline-flex h-11 items-center gap-2 rounded-lg px-3 text-base font-medium text-foreground transition hover:bg-muted sm:left-6 sm:top-6"
          aria-label={language === "en" ? "Back to home" : "Ku laabo bogga hore"}
        >
          <ArrowLeft size={20} aria-hidden="true" />
          <span>{language === "en" ? "Back" : "Dib u noqo"}</span>
        </Link>

        <div className="w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-sm">
          {/* HEADER */}
          <div className="mb-6 text-center">
            <div className="mx-auto mb-3 flex h-11 w-11 items-center justify-center rounded-full bg-primary/10">
              <LogIn className="text-primary" size={22} />
            </div>

            <h1 className="text-2xl font-semibold tracking-tight text-foreground">
              {getT("login")}
            </h1>

            <p className="mt-1 text-sm text-muted-foreground">
              Sign in to continue to your account
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* EMAIL */}
            <div>
              <label className={labelClass}>{getT("email")}</label>

              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={inputClass}
                placeholder={getT("enterEmail")}
                required
              />
            </div>

            {/* PASSWORD */}
            <div>
              <label className={labelClass}>{getT("password")}</label>

              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className={`${inputClass} pr-11`}
                  placeholder={getT("enterPassword")}
                  required
                />

                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  className="absolute inset-y-0 right-0 flex items-center px-3 text-muted-foreground transition hover:text-primary"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                </button>
              </div>
            </div>

            {/* FORGOT PASSWORD */}
            <div className="flex items-center justify-end">
              <Link
                href={
                  email.trim()
                    ? `/forgot-password?email=${encodeURIComponent(email.trim())}`
                    : "/forgot-password"
                }
                className="text-sm font-medium text-primary hover:underline"
              >
                {getT("forgotPassword")}
              </Link>
            </div>

            {/* SUBMIT */}
            <button
              type="submit"
              disabled={loading}
              className="h-11 w-full rounded-lg bg-primary text-base font-semibold text-primary-foreground transition hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? getT("loading") : getT("login")}
            </button>

            {/* REGISTER LINK */}
            <p className="text-center text-sm text-muted-foreground">
              {getT("dontHaveAccount")}{" "}
              <Link
                href="/register"
                className="font-medium text-primary hover:underline"
              >
                {getT("register")}
              </Link>
            </p>
          </form>
        </div>
    </div>
  );
}
