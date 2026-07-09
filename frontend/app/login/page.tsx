"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { t } from "@/lib/translations";
import { Eye, EyeOff, LogIn } from "lucide-react";
import { toast } from "react-toastify";
import { extractErrorMessage } from "@/lib/error-utils";
import Navbar from "@/components/Navbar";

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
    "w-full h-10 rounded-lg border border-border bg-background px-3 text-sm text-foreground outline-none transition placeholder:text-xs placeholder:text-muted-foreground/60 focus:border-primary focus:ring-2 focus:ring-primary/15";

  const labelClass =
    "mb-1.5 block text-xs font-medium tracking-wide text-muted-foreground";

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
    <>
      <Navbar />
      <div className="min-h-screen flex items-center justify-center bg-background px-4 py-8">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25 }}
          className="w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-sm"
        >
          {/* HEADER */}
          <div className="mb-6 text-center">
            <div className="mx-auto mb-3 flex h-11 w-11 items-center justify-center rounded-full bg-primary/10">
              <LogIn className="text-primary" size={22} />
            </div>

            <h1 className="text-xl font-semibold tracking-tight text-foreground">
              {getT("login")}
            </h1>

            <p className="mt-1 text-xs text-muted-foreground">
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
                className="text-xs font-medium text-primary hover:underline"
              >
                {getT("forgotPassword")}
              </Link>
            </div>

            {/* SUBMIT */}
            <button
              type="submit"
              disabled={loading}
              className="h-10 w-full rounded-lg bg-primary text-sm font-semibold text-primary-foreground transition hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? getT("loading") : getT("login")}
            </button>

            {/* REGISTER LINK */}
            <p className="text-center text-xs text-muted-foreground">
              {getT("dontHaveAccount")}{" "}
              <Link
                href="/register"
                className="font-medium text-primary hover:underline"
              >
                {getT("register")}
              </Link>
            </p>
          </form>
        </motion.div>
      </div>
    </>
  );
}
