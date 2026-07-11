"use client";

import React, { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { t } from "@/lib/translations";
import { ChevronDown, UserPlus } from "lucide-react";
import { toast } from "react-toastify";
import {
  extractErrorMessage,
  extractFieldErrors,
  type FieldErrors,
} from "@/lib/error-utils";
import Navbar from "@/components/Navbar";

type FormField =
  | "firstName"
  | "lastName"
  | "email"
  | "password"
  | "confirmPassword"
  | "role"
  | "phone"
  | "address"
  | "city"
  | "region"
  | "postalCode"
  | "country";

function RegisterContent() {
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    confirmPassword: "",
    role: "",
    phone: "",
    address: "",
    city: "",
    region: "",
    postalCode: "",
    country: "",
  });

  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [loading, setLoading] = useState(false);
  const [roleDropdownOpen, setRoleDropdownOpen] = useState(false);
  const roleDropdownRef = React.useRef<HTMLDivElement>(null);

  const { register } = useAuth();
  const { language } = useLanguage();
  const router = useRouter();
  const searchParams = useSearchParams();
  const getT = (key: string) => t(key, language);

  const inputClass =
    "w-full h-10 rounded-lg border border-border bg-background px-3 text-sm text-foreground outline-none transition placeholder:text-xs placeholder:text-muted-foreground/60 focus:border-primary focus:ring-2 focus:ring-primary/15";

  const labelClass =
    "mb-1.5 block text-xs font-medium tracking-wide text-muted-foreground";

  const errorClass = "mt-1 text-xs font-medium text-red-500";

  useEffect(() => {
    const role = searchParams.get("role");
    if (!role) return;

    const normalizedRole = role === "user" ? "worker" : role;

    if (["worker", "employer", "provider"].includes(normalizedRole)) {
      setFormData((prev) => ({ ...prev, role: normalizedRole }));
    }
  }, [searchParams]);

  useEffect(() => {
    const onClickOutside = (e: MouseEvent) => {
      if (!roleDropdownRef.current) return;

      if (!roleDropdownRef.current.contains(e.target as Node)) {
        setRoleDropdownOpen(false);
      }
    };

    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  const setFieldValue = (field: FormField, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));

    setFieldErrors((prev) => {
      if (!prev[field]) return prev;

      const next = { ...prev };
      delete next[field];
      return next;
    });
  };

  const validateForm = (): FieldErrors => {
    const errors: FieldErrors = {};

    if (!formData.firstName.trim()) errors.firstName = "Required";
    if (!formData.lastName.trim()) errors.lastName = "Required";
    if (!formData.email.trim()) errors.email = "Required";
    if (!formData.phone.trim()) errors.phone = "Required";

    if (!formData.password || formData.password.length < 6) {
      errors.password = "Min 6 chars";
    }

    if (formData.password !== formData.confirmPassword) {
      errors.confirmPassword = "Passwords do not match";
    }

    if (!formData.role) errors.role = "Required";

    return errors;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const errors = validateForm();
    setFieldErrors(errors);

    if (Object.keys(errors).length > 0) {
      toast.error(Object.values(errors)[0]);
      return;
    }

    setLoading(true);

    try {
      await register({
        ...formData,
        name: `${formData.firstName} ${formData.lastName}`,
        preferredLanguage: language,
      });

      toast.success("Registration successful");
      router.push("/");
    } catch (err: any) {
      setFieldErrors(extractFieldErrors(err));
      toast.error(extractErrorMessage(err, "Registration failed"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Navbar />
      çç
      <div className="min-h-screen flex items-center justify-center bg-background px-4 mt-18">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25 }}
          className="w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-sm"
        >
          {/* HEADER */}
          <div className="mb-6 text-center">
            <div className="mx-auto mb-3 flex h-11 w-11 items-center justify-center rounded-full bg-primary/10">
              <UserPlus className="text-primary" size={22} />
            </div>

            <h1 className="text-xl font-semibold tracking-tight text-foreground">
              {getT("register")}
            </h1>

            <p className="mt-1 text-xs text-muted-foreground">
              Create your account to continue
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* NAME ROW */}
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div>
                <label className={labelClass}>{getT("firstName")} *</label>
                <input
                  className={inputClass}
                  value={formData.firstName}
                  onChange={(e) => setFieldValue("firstName", e.target.value)}
                  placeholder={getT("enterFirstName")}
                />
                {fieldErrors.firstName && (
                  <p className={errorClass}>{fieldErrors.firstName}</p>
                )}
              </div>

              <div>
                <label className={labelClass}>{getT("lastName")} *</label>
                <input
                  className={inputClass}
                  value={formData.lastName}
                  onChange={(e) => setFieldValue("lastName", e.target.value)}
                  placeholder={getT("enterLastName")}
                />
                {fieldErrors.lastName && (
                  <p className={errorClass}>{fieldErrors.lastName}</p>
                )}
              </div>
            </div>

            {/* EMAIL */}
            <div>
              <label className={labelClass}>{getT("email")} *</label>
              <input
                type="email"
                className={inputClass}
                value={formData.email}
                onChange={(e) => setFieldValue("email", e.target.value)}
                placeholder={getT("enterEmail")}
              />
              {fieldErrors.email && (
                <p className={errorClass}>{fieldErrors.email}</p>
              )}
            </div>

            {/* PHONE */}
            <div>
              <label className={labelClass}>{getT("phoneNumber")} *</label>
              <input
                className={inputClass}
                value={formData.phone}
                onChange={(e) => setFieldValue("phone", e.target.value)}
                placeholder={getT("enterPhone")}
              />
              {fieldErrors.phone && (
                <p className={errorClass}>{fieldErrors.phone}</p>
              )}
            </div>

            {/* PASSWORD ROW */}
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div>
                <label className={labelClass}>{getT("password")} *</label>
                <input
                  type="password"
                  className={inputClass}
                  value={formData.password}
                  onChange={(e) => setFieldValue("password", e.target.value)}
                  placeholder={getT("enterPassword")}
                />
                {fieldErrors.password && (
                  <p className={errorClass}>{fieldErrors.password}</p>
                )}
              </div>

              <div>
                <label className={labelClass}>
                  {getT("confirmPassword")} *
                </label>
                <input
                  type="password"
                  className={inputClass}
                  value={formData.confirmPassword}
                  onChange={(e) =>
                    setFieldValue("confirmPassword", e.target.value)
                  }
                  placeholder={getT("confirmYourPassword")}
                />
                {fieldErrors.confirmPassword && (
                  <p className={errorClass}>{fieldErrors.confirmPassword}</p>
                )}
              </div>
            </div>

            {/* ROLE */}
            {/* ROLE */}
            <div ref={roleDropdownRef} className="relative">
              <label className={labelClass}>{getT("role")} *</label>

              <button
                type="button"
                onClick={() => setRoleDropdownOpen(!roleDropdownOpen)}
                className={`${inputClass} flex items-center justify-between text-left`}
              >
                <span
                  className={
                    formData.role
                      ? "capitalize text-foreground"
                      : "text-xs text-muted-foreground/60"
                  }
                >
                  {formData.role || "Select role"}
                </span>

                <ChevronDown
                  size={17}
                  className={`text-muted-foreground transition ${
                    roleDropdownOpen ? "rotate-180" : ""
                  }`}
                />
              </button>

              {fieldErrors.role && (
                <p className={errorClass}>{fieldErrors.role}</p>
              )}

              {roleDropdownOpen && (
                <div className="absolute left-0 top-full z-[9999] mt-2 w-full overflow-hidden rounded-xl border border-border bg-background shadow-xl ring-1 ring-black/5">
                  {["worker", "employer", "provider"].map((r) => (
                    <button
                      type="button"
                      key={r}
                      onClick={() => {
                        setFieldValue("role", r);
                        setRoleDropdownOpen(false);
                      }}
                      className={`flex w-full items-center px-3 py-2.5 text-left text-sm capitalize transition ${
                        formData.role === r
                          ? "bg-primary/10 font-medium text-primary"
                          : "text-foreground hover:bg-primary hover:text-primary-foreground"
                      }`}
                    >
                      {r}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* LOCATION */}
            {/* LOCATION */}
            <div className="border-t border-border pt-4">
              <div className="mb-3">
                <h2 className="text-sm font-semibold text-foreground">
                  {getT("locationOptional")}
                </h2>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  This information is optional.
                </p>
              </div>

              <div className="space-y-3">
                <input
                  placeholder={getT("address")}
                  className={inputClass}
                  value={formData.address}
                  onChange={(e) => setFieldValue("address", e.target.value)}
                />

                <input
                  placeholder={getT("city")}
                  className={inputClass}
                  value={formData.city}
                  onChange={(e) => setFieldValue("city", e.target.value)}
                />

                <div className="grid grid-cols-2 gap-2">
                  <input
                    placeholder={getT("region")}
                    className={inputClass}
                    value={formData.region}
                    onChange={(e) => setFieldValue("region", e.target.value)}
                  />

                  <input
                    placeholder={getT("postalCode")}
                    className={inputClass}
                    value={formData.postalCode}
                    onChange={(e) =>
                      setFieldValue("postalCode", e.target.value)
                    }
                  />
                </div>

                <input
                  placeholder={getT("country")}
                  className={inputClass}
                  value={formData.country}
                  onChange={(e) => setFieldValue("country", e.target.value)}
                />
              </div>
            </div>

            {/* SUBMIT */}
            <button
              type="submit"
              disabled={loading}
              className="h-10 w-full rounded-lg bg-primary text-sm font-semibold text-primary-foreground transition hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? getT("loading") : getT("register")}
            </button>

            <p className="text-center text-xs text-muted-foreground">
              {getT("alreadyHaveAccount")}{" "}
              <Link
                href="/login"
                className="font-medium text-primary hover:underline"
              >
                {getT("login")}
              </Link>
            </p>
          </form>
        </motion.div>
      </div>
    </>
  );
}

export default function RegisterPage() {
  return (
    <React.Suspense fallback={null}>
      <RegisterContent />
    </React.Suspense>
  );
}
