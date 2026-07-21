"use client";

import React, { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { t } from "@/lib/translations";
import {
  ArrowLeft,
  ChevronDown,
  Eye,
  EyeOff,
  UserPlus,
} from "lucide-react";
import { toast } from "react-toastify";
import {
  extractErrorMessage,
  extractFieldErrors,
  type FieldErrors,
} from "@/lib/error-utils";

type FormField =
  | "firstName"
  | "lastName"
  | "email"
  | "password"
  | "confirmPassword"
  | "role"
  | "organizationName"
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
    organizationName: "",
    phone: "",
    address: "",
    city: "",
    region: "",
    postalCode: "",
    country: "",
  });

  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [loading, setLoading] = useState(false);
  const [acceptedPolicies, setAcceptedPolicies] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [roleDropdownOpen, setRoleDropdownOpen] = useState(false);
  const roleDropdownRef = React.useRef<HTMLDivElement>(null);

  const { register } = useAuth();
  const { language } = useLanguage();
  const router = useRouter();
  const searchParams = useSearchParams();
  const getT = (key: string) => t(key, language);

  const inputClass =
    "h-11 w-full rounded-lg border border-border bg-background px-3 text-base text-foreground outline-none transition placeholder:text-sm placeholder:text-muted-foreground/60 focus:border-primary focus:ring-2 focus:ring-primary/15";

  const labelClass =
    "mb-1.5 block text-sm font-medium tracking-wide text-muted-foreground";

  const errorClass = "mt-1 text-sm font-medium text-red-500";

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

    if (!formData.password || formData.password.length < 12) {
      errors.password = "Minimum 12 characters";
    }

    if (formData.password !== formData.confirmPassword) {
      errors.confirmPassword = "Passwords do not match";
    }

    if (!formData.role) errors.role = "Required";
    if (
      (formData.role === "employer" || formData.role === "provider") &&
      !formData.organizationName.trim()
    ) {
      errors.organizationName =
        formData.role === "employer"
          ? "Company name is required"
          : "Training provider name is required";
    }

    return errors;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!acceptedPolicies) {
      toast.error("Please accept the Terms and Privacy Policy.");
      return;
    }

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
        acceptedTerms: true,
      });

      toast.success("If the address is available, a verification email will arrive shortly.");

      const params = new URLSearchParams({ email: formData.email.trim() });
      router.push(`/verify-email?${params.toString()}`);
    } catch (err: any) {
      setFieldErrors(extractFieldErrors(err));
      toast.error(extractErrorMessage(err, "Registration failed"));

      if (err?.response?.data?.code === "VERIFICATION_DELIVERY_FAILED") {
        const params = new URLSearchParams({ email: formData.email.trim() });
        router.push(`/verify-email?${params.toString()}`);
      }
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

      <div className="w-full max-w-3xl rounded-2xl border border-border bg-card p-5 shadow-sm sm:p-6">
          {/* HEADER */}
          <div className="mb-6 text-center">
            <div className="mx-auto mb-3 flex h-11 w-11 items-center justify-center rounded-full bg-primary/10">
              <UserPlus className="text-primary" size={22} />
            </div>

            <h1 className="text-2xl font-semibold tracking-tight text-foreground">
              {getT("register")}
            </h1>

            <p className="mt-1 text-sm text-muted-foreground">
              Create your account to continue
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-3">
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

            {/* CONTACT ROW */}
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
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
            </div>

            {/* PASSWORD ROW */}
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div>
                <label className={labelClass}>{getT("password")} *</label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    className={`${inputClass} pr-11`}
                    value={formData.password}
                    onChange={(e) => setFieldValue("password", e.target.value)}
                    placeholder={getT("enterPassword")}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((visible) => !visible)}
                    className="absolute inset-y-0 right-0 flex items-center px-3 text-muted-foreground transition hover:text-primary"
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
                {fieldErrors.password && (
                  <p className={errorClass}>{fieldErrors.password}</p>
                )}
              </div>

              <div>
                <label className={labelClass}>
                  {getT("confirmPassword")} *
                </label>
                <div className="relative">
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    className={`${inputClass} pr-11`}
                    value={formData.confirmPassword}
                    onChange={(e) =>
                      setFieldValue("confirmPassword", e.target.value)
                    }
                    placeholder={getT("confirmYourPassword")}
                  />
                  <button
                    type="button"
                    onClick={() =>
                      setShowConfirmPassword((visible) => !visible)
                    }
                    className="absolute inset-y-0 right-0 flex items-center px-3 text-muted-foreground transition hover:text-primary"
                    aria-label={
                      showConfirmPassword
                        ? "Hide confirmation password"
                        : "Show confirmation password"
                    }
                  >
                    {showConfirmPassword ? (
                      <EyeOff size={18} />
                    ) : (
                      <Eye size={18} />
                    )}
                  </button>
                </div>
                {fieldErrors.confirmPassword && (
                  <p className={errorClass}>{fieldErrors.confirmPassword}</p>
                )}
              </div>
            </div>

            {/* ROLE AND ORGANIZATION */}
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div
                ref={roleDropdownRef}
                className={`relative ${
                  formData.role === "employer" || formData.role === "provider"
                    ? ""
                    : "sm:col-span-2"
                }`}
              >
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
                        : "text-sm text-muted-foreground/60"
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

              {(formData.role === "employer" ||
                formData.role === "provider") && (
                <div>
                  <label className={labelClass}>
                    {formData.role === "employer"
                      ? language === "en"
                        ? "Company Name"
                        : "Magaca Shirkadda"
                      : language === "en"
                        ? "Training Provider Name"
                        : "Magaca Bixiyaha Tababarka"}{" "}
                    *
                  </label>
                  <input
                    className={inputClass}
                    value={formData.organizationName}
                    onChange={(event) =>
                      setFieldValue("organizationName", event.target.value)
                    }
                    placeholder={
                      formData.role === "employer"
                        ? "Enter company name"
                        : "Enter training provider name"
                    }
                  />
                  {fieldErrors.organizationName && (
                    <p className={errorClass}>
                      {fieldErrors.organizationName}
                    </p>
                  )}
                </div>
              )}
            </div>

            {/* LOCATION */}
            {/* LOCATION */}
            <div className="border-t border-border pt-4">
              <div className="mb-3">
                <h2 className="text-base font-semibold text-foreground">
                  {getT("locationOptional")}
                </h2>
                <p className="mt-0.5 text-sm text-muted-foreground">
                  This information is optional.
                </p>
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
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

            <label className="flex items-start gap-3 rounded-lg border border-border p-3 text-sm text-muted-foreground">
              <input
                type="checkbox"
                checked={acceptedPolicies}
                onChange={(event) => setAcceptedPolicies(event.target.checked)}
                className="mt-0.5 h-4 w-4 accent-primary"
                required
              />
              <span>
                I agree to the{' '}
                <Link href="/terms" className="font-semibold text-primary hover:underline">
                  Terms
                </Link>{' '}
                and acknowledge the{' '}
                <Link href="/privacy" className="font-semibold text-primary hover:underline">
                  Privacy Policy
                </Link>
                .
              </span>
            </label>

            {/* SUBMIT */}
            <button
              type="submit"
              disabled={loading}
              className="h-11 w-full rounded-lg bg-primary text-base font-semibold text-primary-foreground transition hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? getT("loading") : getT("register")}
            </button>

            <p className="text-center text-sm text-muted-foreground">
              {getT("alreadyHaveAccount")}{" "}
              <Link
                href="/login"
                className="font-medium text-primary hover:underline"
              >
                {getT("login")}
              </Link>
            </p>
          </form>
      </div>
    </div>
  );
}

export default function RegisterPage() {
  return (
    <React.Suspense fallback={null}>
      <RegisterContent />
    </React.Suspense>
  );
}
