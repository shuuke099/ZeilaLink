"use client";

import React from "react";
import EmployerDashboardPage from "@/components/employer/EmployerDashboardPage";
import { useAuth } from "@/contexts/AuthContext";
import api from "@/lib/api";
import { getSafeStoredUrl } from "@/lib/safeUrl";
import {
  User,
  Lock,
  Image as ImageIcon,
  Bell,
  Trash2,
  MapPin,
} from "lucide-react";

type EmployerNotificationPrefs = {
  applicantSummaries: boolean;
  interviewReminders: boolean;
  platformAnnouncements: boolean;
};

export default function EmployerSettingsPage() {
  const { user, logout, updateUser } = useAuth();
  const [prefs, setPrefs] = React.useState<EmployerNotificationPrefs>({
    applicantSummaries: true,
    interviewReminders: true,
    platformAnnouncements: false,
  });
  const [feedback, setFeedback] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(false);

  // Company Information State
  const [companyInfo, setCompanyInfo] = React.useState({
    name: user?.name || "",
    email: user?.email || "",
    phone: user?.phone || "",
    website: "",
    city: "",
    state: "",
    zipCode: "",
    country: "Somalia",
    address: "",
  });

  // Profile Name State
  const [profileName, setProfileName] = React.useState(user?.name || "");
  const [nameLoading, setNameLoading] = React.useState(false);

  // Password State
  const [passwordData, setPasswordData] = React.useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [passwordLoading, setPasswordLoading] = React.useState(false);

  // Image Upload State
  const [selectedFile, setSelectedFile] = React.useState<File | null>(null);
  const [imagePreview, setImagePreview] = React.useState<string | null>(null);
  const [imageLoading, setImageLoading] = React.useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  // Load company info from profile
  React.useEffect(() => {
    const loadCompanyInfo = async () => {
      if (!user) return;
      try {
        const response = await api.get("/employers/me/profile");
        const data = response.data;
        setCompanyInfo({
          name: data.name || user.name || "",
          email: user.email || "",
          phone: data.phone || user.phone || "",
          website: data.website || "",
          city: data.city || "",
          state: data.state || "",
          zipCode: data.zipCode || "",
          country: data.country || "Somalia",
          address: data.address || "",
        });
        setProfileName(data.name || user.name || "");
      } catch (error) {
        console.error("Failed to load company info", error);
      }
    };
    loadCompanyInfo();
  }, [user]);

  // Update profile name and avatar when user changes
  React.useEffect(() => {
    if (user?.name) {
      setProfileName(user.name);
    }
    if (user?.avatarUrl) {
      setImagePreview(getSafeStoredUrl(user.avatarUrl));
    }
  }, [user?.name, user?.avatarUrl]);

  const handleSavePreferences = async (
    event: React.FormEvent<HTMLFormElement>,
  ) => {
    event.preventDefault();
    if (!user) return;
    try {
      setLoading(true);
      setFeedback(null);
      await api.put(`/employers/${user.id}/preferences`, prefs);
      setFeedback("✅ Notification preferences updated successfully.");
    } catch (error: any) {
      console.error("Failed to save preferences", error);
      const errorMessage =
        error?.response?.data?.error ||
        error?.message ||
        "Unable to save preferences right now.";
      setFeedback("❌ " + errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateCompanyInfo = async () => {
    if (!companyInfo.name.trim()) {
      setFeedback("❌ Company name cannot be empty.");
      return;
    }

    try {
      setNameLoading(true);
      setFeedback(null);

      // Update both profile and employer profile
      await Promise.all([
        api.put("/auth/profile", {
          name: companyInfo.name,
        }),

        api.put("/employers/me/profile", {
          name: companyInfo.name,
          phone: companyInfo.phone,
          website: companyInfo.website,
          address: companyInfo.address,
          city: companyInfo.city,
          state: companyInfo.state,
          zipCode: companyInfo.zipCode,
          country: companyInfo.country,
        }),
      ]);

      // Update user in AuthContext
      updateUser({
        name: companyInfo.name,
        phone: companyInfo.phone,
      });

      setFeedback("✅ Company information updated successfully!");
    } catch (error: any) {
      console.error("Failed to update company info", error);
      const errorMessage =
        error?.response?.data?.error ||
        error?.message ||
        "Unable to update company information.";
      setFeedback("❌ " + errorMessage);
    } finally {
      setNameLoading(false);
    }
  };

  const handlePasswordUpdate = async (e: React.FormEvent) => {
    e.preventDefault();

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setFeedback("❌ New passwords do not match.");
      return;
    }

    if (passwordData.newPassword.length < 6) {
      setFeedback("❌ Password must be at least 6 characters.");
      return;
    }

    try {
      setPasswordLoading(true);
      setFeedback(null);
      await api.put("/auth/change-password", {
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword,
      });
      setFeedback("✅ Password changed successfully!");
      setPasswordData({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
    } catch (error: any) {
      console.error("Failed to update password", error);
      const errorMessage =
        error?.response?.data?.error ||
        error?.message ||
        "Unable to update password.";
      setFeedback("❌ " + errorMessage);
    } finally {
      setPasswordLoading(false);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setFeedback("❌ File size must be less than 5MB");
        return;
      }
      if (!file.type.startsWith("image/")) {
        setFeedback("❌ Please select an image file");
        return;
      }
      setSelectedFile(file);
      setFeedback(null);

      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleImageUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile) {
      setFeedback("❌ Please select an image");
      return;
    }

    try {
      setImageLoading(true);
      setFeedback(null);

      const formData = new FormData();
      formData.append("avatar", selectedFile);

      const response = await api.post("/auth/upload-avatar", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      const avatarUrl = response.data?.avatarUrl;
      const safeAvatarUrl = getSafeStoredUrl(avatarUrl);
      if (!safeAvatarUrl) {
        throw new Error("The server returned an invalid image URL");
      }

      // Update user in context with new avatar URL
      // Update user in context with new avatar URL
      if (avatarUrl) {
        updateUser({
          avatarUrl: safeAvatarUrl,
        });
      }

      setImagePreview(safeAvatarUrl);
      setFeedback("✅ Profile image updated successfully!");
      setSelectedFile(null);
    } catch (error: any) {
      console.error("Failed to upload image", error);
      const errorMessage =
        error?.response?.data?.error ||
        error?.message ||
        "Unable to upload image.";
      setFeedback("❌ " + errorMessage);
    } finally {
      setImageLoading(false);
    }
  };

  const handleDeactivate = async () => {
    if (!user) return;
    const confirmed = window.confirm(
      "Deactivate company account? All active job posts will be closed. You can reactivate later by contacting support.",
    );
    if (!confirmed) return;
    try {
      await api.post(`/employers/${user.id}/deactivate`);
      logout();
      window.location.href = "/";
    } catch (error: any) {
      console.error("Failed to deactivate account", error);
      const errorMessage =
        error?.response?.data?.error ||
        error?.message ||
        "Unable to deactivate account. Please contact support.";
      setFeedback("❌ " + errorMessage);
    }
  };

  return (
    <EmployerDashboardPage title="" description="">
      {/* Company Settings Header */}
      <div className="bg-gradient-to-r from-teal-700 to-teal-600 rounded-t-2xl px-8 py-6 mb-0">
        <div className="flex items-center gap-3">
          <div className="bg-white/20 rounded-xl p-2.5 backdrop-blur-sm">
            <User className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">Company Settings</h1>
            <p className="text-teal-50 text-sm mt-0.5">
              Manage your company information and branding
            </p>
          </div>
        </div>
      </div>

      {feedback && (
        <div
          className={`mx-0 mt-6 mb-6 rounded-xl border p-4 text-sm font-medium ${
            feedback.includes("✅")
              ? "border-green-200 bg-green-50 text-green-800"
              : "border-red-200 bg-red-50 text-red-800"
          }`}
        >
          {feedback}
        </div>
      )}

      {/* Main Form Section */}
      <section className="bg-white rounded-b-2xl border border-t-0 border-gray-200 p-8 mb-6">
        <div className="grid gap-6 lg:grid-cols-2 mb-8">
          {/* Basic Information */}
          <div className="bg-gray-50 rounded-xl p-6">
            <div className="flex items-center gap-2 mb-5">
              <User className="h-5 w-5 text-teal-600" />
              <h3 className="text-base font-bold text-gray-800">
                Basic Information
              </h3>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Company Name <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <User className="h-4 w-4 text-gray-400" />
                  </div>
                  <input
                    type="text"
                    value={companyInfo.name}
                    onChange={(e) => {
                      setCompanyInfo({ ...companyInfo, name: e.target.value });
                      setProfileName(e.target.value);
                    }}
                    className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent text-gray-900"
                    placeholder="Enter company name"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <svg
                      className="h-4 w-4 text-gray-400"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                      />
                    </svg>
                  </div>
                  <input
                    type="email"
                    value={companyInfo.email}
                    onChange={(e) =>
                      setCompanyInfo({ ...companyInfo, email: e.target.value })
                    }
                    className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg bg-gray-100 text-gray-500"
                    disabled
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Phone <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <svg
                      className="h-4 w-4 text-gray-400"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
                      />
                    </svg>
                  </div>
                  <input
                    type="tel"
                    value={companyInfo.phone}
                    onChange={(e) =>
                      setCompanyInfo({ ...companyInfo, phone: e.target.value })
                    }
                    className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent text-gray-900"
                    placeholder="+252..."
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Website <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <svg
                      className="h-4 w-4 text-gray-400"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9"
                      />
                    </svg>
                  </div>
                  <input
                    type="url"
                    value={companyInfo.website}
                    onChange={(e) =>
                      setCompanyInfo({
                        ...companyInfo,
                        website: e.target.value,
                      })
                    }
                    className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent text-gray-900"
                    placeholder="https://www.example.com"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Location Information */}
          <div className="bg-gray-50 rounded-xl p-6">
            <div className="flex items-center gap-2 mb-5">
              <MapPin className="h-5 w-5 text-teal-600" />
              <h3 className="text-base font-bold text-gray-800">
                Location Information
              </h3>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    City <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={companyInfo.city}
                    onChange={(e) =>
                      setCompanyInfo({ ...companyInfo, city: e.target.value })
                    }
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent text-gray-900"
                    placeholder="Mogadishu"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    State <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={companyInfo.state}
                    onChange={(e) =>
                      setCompanyInfo({ ...companyInfo, state: e.target.value })
                    }
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent text-gray-900"
                    placeholder="banadir"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Zip Code <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={companyInfo.zipCode}
                    onChange={(e) =>
                      setCompanyInfo({
                        ...companyInfo,
                        zipCode: e.target.value,
                      })
                    }
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent text-gray-900"
                    placeholder="252"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Country <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={companyInfo.country}
                    onChange={(e) =>
                      setCompanyInfo({
                        ...companyInfo,
                        country: e.target.value,
                      })
                    }
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent text-gray-900 appearance-none bg-white"
                  >
                    <option>Somalia</option>
                    <option>Kenya</option>
                    <option>Ethiopia</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Address <span className="text-red-500">*</span>
                </label>
                <textarea
                  rows={4}
                  value={companyInfo.address}
                  onChange={(e) =>
                    setCompanyInfo({ ...companyInfo, address: e.target.value })
                  }
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent text-gray-900 resize-none"
                  placeholder="near taleh 4 floor dari towhed"
                ></textarea>
              </div>
            </div>
          </div>
        </div>

        {/* Company Logo Section */}
        <div className="bg-gray-50 rounded-xl p-6 mb-6">
          <h3 className="text-base font-bold text-teal-600 text-center mb-4">
            Company Logo
          </h3>

          <form onSubmit={handleImageUpload}>
            <div className="flex flex-col items-center">
              <div className="w-32 h-32 rounded-full overflow-hidden bg-gradient-to-br from-teal-600 to-teal-700 border-4 border-white shadow-lg mb-4">
                {imagePreview ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={imagePreview}
                    alt="Preview"
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      console.error("Failed to load image:", imagePreview);
                      e.currentTarget.style.display = "none";
                    }}
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-4xl font-bold text-white">
                    {companyInfo.name?.charAt(0).toUpperCase() ||
                      user?.name?.charAt(0).toUpperCase() ||
                      "C"}
                  </div>
                )}
              </div>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileSelect}
                className="hidden"
              />

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="px-6 py-2 border-2 border-teal-600 text-teal-600 rounded-lg font-medium hover:bg-teal-600 hover:text-white transition-colors"
                >
                  Choose Image
                </button>

                {selectedFile && (
                  <button
                    type="submit"
                    disabled={imageLoading}
                    className="px-6 py-2 bg-teal-600 text-white rounded-lg font-medium hover:bg-teal-700 transition-colors disabled:opacity-50"
                  >
                    {imageLoading ? "Uploading..." : "Upload"}
                  </button>
                )}
              </div>

              <p className="text-xs text-gray-500 mt-2">
                Max size: 5MB • Formats: JPG, PNG, GIF
              </p>
            </div>
          </form>
        </div>

        {/* Save Changes Button */}
        <div className="flex justify-end">
          <button
            onClick={handleUpdateCompanyInfo}
            disabled={nameLoading || imageLoading}
            className="flex items-center gap-2 px-8 py-3 bg-teal-600 text-white font-semibold rounded-lg hover:bg-teal-700 transition-colors disabled:opacity-50"
          >
            <svg
              className="h-5 w-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4"
              />
            </svg>
            {nameLoading ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </section>

      {/* Change Profile Image */}
      <section className="bg-white rounded-2xl border border-[#e8e8e8] p-6 mb-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="bg-[#10b981] rounded-xl p-2">
            <ImageIcon className="h-5 w-5 text-white" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-[#2d3436]">Profile Image</h2>
            <p className="text-sm text-[#8b8b8b]">
              Upload a new profile picture
            </p>
          </div>
        </div>

        <form onSubmit={handleImageUpload}>
          <div className="flex flex-col md:flex-row gap-6 items-center">
            <div className="flex-shrink-0">
              <div className="w-32 h-32 rounded-full overflow-hidden bg-gradient-to-br from-[#4c6fff] to-[#6b85ff] border-4 border-[#e8e8e8]">
                {imagePreview ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={imagePreview}
                    alt="Preview"
                    className="w-full h-full object-cover"
                  />
                ) : user?.avatarUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={user.avatarUrl}
                    alt="Current"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-4xl font-bold text-white">
                    {user?.name?.charAt(0).toUpperCase() || "U"}
                  </div>
                )}
              </div>
            </div>

            <div className="flex-1 space-y-4 w-full">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileSelect}
                className="hidden"
              />

              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="w-full md:w-auto px-6 py-3 border-2 border-[#4c6fff] text-[#4c6fff] rounded-xl font-semibold hover:bg-[#4c6fff] hover:text-white transition-colors"
              >
                Choose Image
              </button>

              {selectedFile && (
                <button
                  type="submit"
                  disabled={imageLoading}
                  className="w-full md:w-auto px-6 py-3 bg-gradient-to-r from-[#4c6fff] to-[#6b85ff] text-white rounded-xl font-semibold hover:shadow-lg transition-all disabled:opacity-50 ml-0 md:ml-3"
                >
                  {imageLoading ? "Uploading..." : "Upload Image"}
                </button>
              )}

              <p className="text-xs text-[#8b8b8b]">
                Max size: 5MB • Formats: JPG, PNG, GIF
              </p>
            </div>
          </div>
        </form>
      </section>

      {/* Change Password */}
      <section className="bg-white rounded-2xl border border-[#e8e8e8] p-6 mb-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="bg-[#8b5cf6] rounded-xl p-2">
            <Lock className="h-5 w-5 text-white" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-[#2d3436]">
              Change Password
            </h2>
            <p className="text-sm text-[#8b8b8b]">
              Update your account password
            </p>
          </div>
        </div>

        <form onSubmit={handlePasswordUpdate} className="space-y-4 max-w-lg">
          <div>
            <label className="block text-sm font-semibold text-[#2d3436] mb-2">
              Current Password
            </label>
            <input
              type="password"
              value={passwordData.currentPassword}
              onChange={(e) =>
                setPasswordData({
                  ...passwordData,
                  currentPassword: e.target.value,
                })
              }
              className="w-full px-4 py-3 border border-[#e8e8e8] rounded-xl focus:outline-none focus:border-[#4c6fff] text-[#2d3436]"
              placeholder="Enter current password"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-[#2d3436] mb-2">
              New Password
            </label>
            <input
              type="password"
              value={passwordData.newPassword}
              onChange={(e) =>
                setPasswordData({
                  ...passwordData,
                  newPassword: e.target.value,
                })
              }
              className="w-full px-4 py-3 border border-[#e8e8e8] rounded-xl focus:outline-none focus:border-[#4c6fff] text-[#2d3436]"
              placeholder="Enter new password"
              minLength={6}
              required
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-[#2d3436] mb-2">
              Confirm New Password
            </label>
            <input
              type="password"
              value={passwordData.confirmPassword}
              onChange={(e) =>
                setPasswordData({
                  ...passwordData,
                  confirmPassword: e.target.value,
                })
              }
              className="w-full px-4 py-3 border border-[#e8e8e8] rounded-xl focus:outline-none focus:border-[#4c6fff] text-[#2d3436]"
              placeholder="Confirm new password"
              required
            />
          </div>

          <button
            type="submit"
            disabled={passwordLoading}
            className="w-full bg-gradient-to-r from-[#8b5cf6] to-[#a78bfa] text-white font-semibold py-3 px-4 rounded-xl hover:shadow-lg transition-all disabled:opacity-50"
          >
            {passwordLoading ? "Updating..." : "Update Password"}
          </button>
        </form>
      </section>

      {/* Notification Preferences */}
      <section className="bg-white rounded-2xl border border-[#e8e8e8] p-6 mb-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="bg-[#f59e0b] rounded-xl p-2">
            <Bell className="h-5 w-5 text-white" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-[#2d3436]">
              Notification Preferences
            </h2>
            <p className="text-sm text-[#8b8b8b]">
              Choose how you want to stay updated
            </p>
          </div>
        </div>

        <form onSubmit={handleSavePreferences}>
          <div className="space-y-4">
            <label className="flex items-start gap-3 p-4 rounded-xl border border-[#e8e8e8] hover:border-[#4c6fff] transition-colors cursor-pointer">
              <input
                type="checkbox"
                className="mt-1 h-5 w-5 text-[#4c6fff] rounded focus:ring-[#4c6fff]"
                checked={prefs.applicantSummaries}
                onChange={(e) =>
                  setPrefs((prev) => ({
                    ...prev,
                    applicantSummaries: e.target.checked,
                  }))
                }
              />
              <div>
                <span className="font-semibold text-[#2d3436] block">
                  Weekly applicant summaries
                </span>
                <p className="text-sm text-[#8b8b8b] mt-1">
                  Receive a weekly overview of new applicants for each job post.
                </p>
              </div>
            </label>

            <label className="flex items-start gap-3 p-4 rounded-xl border border-[#e8e8e8] hover:border-[#4c6fff] transition-colors cursor-pointer">
              <input
                type="checkbox"
                className="mt-1 h-5 w-5 text-[#4c6fff] rounded focus:ring-[#4c6fff]"
                checked={prefs.interviewReminders}
                onChange={(e) =>
                  setPrefs((prev) => ({
                    ...prev,
                    interviewReminders: e.target.checked,
                  }))
                }
              />
              <div>
                <span className="font-semibold text-[#2d3436] block">
                  Interview reminders
                </span>
                <p className="text-sm text-[#8b8b8b] mt-1">
                  Get reminders 24 hours and 1 hour before scheduled interviews.
                </p>
              </div>
            </label>

            <label className="flex items-start gap-3 p-4 rounded-xl border border-[#e8e8e8] hover:border-[#4c6fff] transition-colors cursor-pointer">
              <input
                type="checkbox"
                className="mt-1 h-5 w-5 text-[#4c6fff] rounded focus:ring-[#4c6fff]"
                checked={prefs.platformAnnouncements}
                onChange={(e) =>
                  setPrefs((prev) => ({
                    ...prev,
                    platformAnnouncements: e.target.checked,
                  }))
                }
              />
              <div>
                <span className="font-semibold text-[#2d3436] block">
                  Platform announcements
                </span>
                <p className="text-sm text-[#8b8b8b] mt-1">
                  Hear about new hiring tools and best practices.
                </p>
              </div>
            </label>
          </div>

          <div className="mt-6">
            <button
              type="submit"
              disabled={loading}
              className="w-full md:w-auto px-8 py-3 bg-gradient-to-r from-[#f59e0b] to-[#fb923c] text-white font-semibold rounded-xl hover:shadow-lg transition-all disabled:opacity-50"
            >
              {loading ? "Saving..." : "Save Preferences"}
            </button>
          </div>
        </form>
      </section>

      {/* Danger Zone */}
      <section className="bg-red-50 rounded-2xl border-2 border-red-200 p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="bg-red-500 rounded-xl p-2">
            <Trash2 className="h-5 w-5 text-white" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-red-700">Danger Zone</h2>
            <p className="text-sm text-red-600">Irreversible account actions</p>
          </div>
        </div>

        <p className="text-sm text-red-600 mb-4">
          Deactivate your account to remove all active job posts. You can
          request reactivation by contacting support.
        </p>
        <button
          className="px-6 py-3 rounded-xl border-2 border-red-500 bg-white text-red-600 font-semibold hover:bg-red-600 hover:text-white transition-colors"
          onClick={handleDeactivate}
        >
          Deactivate Company Account
        </button>
      </section>
    </EmployerDashboardPage>
  );
}
