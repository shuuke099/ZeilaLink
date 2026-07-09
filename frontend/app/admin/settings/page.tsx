'use client';

import React from 'react';
import { motion } from 'framer-motion';
import AdminDashboardPage from '@/components/admin/AdminDashboardPage';
import api from '@/lib/api';
import ProfileAvatarCard from '@/components/account/ProfileAvatarCard';
import { Save, Shield, Mail, Bell, Settings, ArrowRight, CheckCircle2 } from 'lucide-react';

type SystemSettingsState = {
  supportEmail: string;
  maxJobPostsPerEmployer: number;
  autoApproveJobs: boolean;
  enableSmsAlerts: boolean;
};

type EmailTemplateState = {
  verification: string;
  passwordReset: string;
  welcome: string;
};

export default function AdminSettingsPage() {
  const [systemSettings, setSystemSettings] = React.useState<SystemSettingsState>({
    supportEmail: 'support@zeilalink.com',
    maxJobPostsPerEmployer: 10,
    autoApproveJobs: false,
    enableSmsAlerts: true,
  });
  const [templates, setTemplates] = React.useState<EmailTemplateState>({
    verification: 'Hello {{name}}, please verify your email using this link: {{link}}',
    passwordReset: 'Hi {{name}}, reset your password using {{link}}. The link expires in 30 minutes.',
    welcome: 'Welcome to ZeilaLink, {{name}}!',
  });
  const [feedback, setFeedback] = React.useState<string | null>(null);

  const handleSystemSave = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    try {
      await api.put('/admin/settings/system', systemSettings);
      setFeedback('System configuration deployed successfully.');
      setTimeout(() => setFeedback(null), 3000);
    } catch (error) {
      console.error('Failed to save system settings', error);
      setFeedback('Operational error: Unable to save system settings.');
    }
  };

  const handleTemplatesSave = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    try {
      await api.put('/admin/settings/email-templates', templates);
      setFeedback('Communication templates updated.');
      setTimeout(() => setFeedback(null), 3000);
    } catch (error) {
      console.error('Failed to save templates', error);
      setFeedback('Operational error: Unable to save templates.');
    }
  };

  return (
    <AdminDashboardPage
      title="System Infrastructure"
      description="Configure platform-wide policies, internal automation, and global communication standards."
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        className="mb-8"
      >
        <ProfileAvatarCard className="rounded-[2.5rem] border border-slate-100 bg-white p-6 shadow-sm" />
      </motion.div>

      {feedback && (
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className={`mb-8 rounded-2xl border px-6 py-4 text-sm font-bold flex items-center gap-3 shadow-lg 
            ${feedback.includes('error') ? 'border-rose-200 bg-rose-50 text-rose-700' : 'border-emerald-200 bg-emerald-50 text-emerald-700'}`}
        >
          <div className={`w-8 h-8 rounded-full flex items-center justify-center ${feedback.includes('error') ? 'bg-rose-100' : 'bg-emerald-100'}`}>
            {feedback.includes('error') ? <ArrowRight className="rotate-45" size={14} /> : <CheckCircle2 size={14} />}
          </div>
          {feedback}
        </motion.div>
      )}

      <div className="grid gap-12 lg:grid-cols-2">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
        >
          <form
            onSubmit={handleSystemSave}
            className="rounded-[2.5rem] border border-slate-100 bg-white p-10 shadow-sm overflow-hidden relative"
          >
            <div className="absolute top-0 right-0 w-32 h-32 bg-slate-50 rounded-full -mr-16 -mt-16" />

            <div className="flex items-center gap-4 mb-8">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-900 text-white shadow-xl shadow-slate-200">
                <Shield className="h-6 w-6" />
              </div>
              <div>
                <h2 className="text-2xl font-black text-[#0b213f] tracking-tight">Governance Controls</h2>
                <p className="text-sm font-medium text-slate-500">Platform-wide operational rules</p>
              </div>
            </div>

            <div className="space-y-6">
              <div>
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 block">
                  SYSTEM SUPPORT EMAIL
                </label>
                <input
                  type="email"
                  className="w-full rounded-2xl border border-slate-100 bg-slate-50/50 px-6 py-4 text-sm font-bold text-[#0b213f] outline-none transition focus:bg-white focus:ring-4 focus:ring-primary/5"
                  value={systemSettings.supportEmail}
                  onChange={(event) =>
                    setSystemSettings((prev) => ({
                      ...prev,
                      supportEmail: event.target.value,
                    }))
                  }
                />
              </div>

              <div>
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 block">
                  QUOTA: MAX JOB POSTS
                </label>
                <input
                  type="number"
                  className="w-full rounded-2xl border border-slate-100 bg-slate-50/50 px-6 py-4 text-sm font-bold text-[#0b213f] outline-none transition focus:bg-white focus:ring-4 focus:ring-primary/5"
                  value={systemSettings.maxJobPostsPerEmployer}
                  onChange={(event) =>
                    setSystemSettings((prev) => ({
                      ...prev,
                      maxJobPostsPerEmployer: Number(event.target.value),
                    }))
                  }
                />
              </div>

              <div className="space-y-4 pt-4">
                <label className="group flex items-start gap-4 rounded-[1.5rem] border border-slate-100 bg-slate-50/20 p-6 transition-all hover:bg-white hover:shadow-xl hover:shadow-slate-100 cursor-pointer">
                  <div className="relative flex items-center mt-1">
                    <input
                      type="checkbox"
                      className="peer h-5 w-5 appearance-none rounded-lg border-2 border-slate-200 transition-all checked:bg-primary checked:border-primary"
                      checked={systemSettings.autoApproveJobs}
                      onChange={(event) =>
                        setSystemSettings((prev) => ({
                          ...prev,
                          autoApproveJobs: event.target.checked,
                        }))
                      }
                    />
                    <CheckCircle2 className="absolute h-3 w-3 text-white left-1 opacity-0 peer-checked:opacity-100 pointer-events-none transition-opacity" />
                  </div>
                  <div>
                    <span className="font-black text-[#0b213f] block mb-1">Auto-approve Verified Roles</span>
                    <p className="text-xs font-medium text-slate-500 leading-relaxed">
                      Automatically activate job listings from employers with elite trust scores.
                    </p>
                  </div>
                </label>

                <label className="group flex items-start gap-4 rounded-[1.5rem] border border-slate-100 bg-slate-50/20 p-6 transition-all hover:bg-white hover:shadow-xl hover:shadow-slate-100 cursor-pointer">
                  <div className="relative flex items-center mt-1">
                    <input
                      type="checkbox"
                      className="peer h-5 w-5 appearance-none rounded-lg border-2 border-slate-200 transition-all checked:bg-[#0b213f] checked:border-[#0b213f]"
                      checked={systemSettings.enableSmsAlerts}
                      onChange={(event) =>
                        setSystemSettings((prev) => ({
                          ...prev,
                          enableSmsAlerts: event.target.checked,
                        }))
                      }
                    />
                    <Bell className="absolute h-3 w-3 text-white left-1 opacity-0 peer-checked:opacity-100 pointer-events-none transition-opacity" />
                  </div>
                  <div>
                    <span className="font-black text-[#0b213f] block mb-1">Global SMS Dispatch</span>
                    <p className="text-xs font-medium text-slate-500 leading-relaxed">
                      Transmit critical security and application alerts via high-priority SMS gateway.
                    </p>
                  </div>
                </label>
              </div>
            </div>

            <div className="mt-10 flex justify-end">
              <button type="submit" className="group flex items-center gap-3 rounded-2xl bg-[#0b213f] px-10 py-4 text-sm font-black text-white hover:bg-slate-800 transition-all active:scale-95 shadow-xl shadow-[#0b213f]/10">
                <Save className="h-5 w-5" />
                Deploy Changes
              </button>
            </div>
          </form>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3 }}
        >
          <form
            onSubmit={handleTemplatesSave}
            className="rounded-[2.5rem] border border-slate-100 bg-white p-10 shadow-sm"
          >
            <div className="flex items-center gap-4 mb-8">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary text-white shadow-xl shadow-primary/20">
                <Mail className="h-6 w-6" />
              </div>
              <div>
                <h2 className="text-2xl font-black text-[#0b213f] tracking-tight">Communication Flow</h2>
                <p className="text-sm font-medium text-slate-500">Edit automated system interactions</p>
              </div>
            </div>

            <div className="space-y-6">
              {[
                { label: 'VERIFICATION BLUEPRINT', key: 'verification', height: 'h-32' },
                { label: 'PASSWORD RESET BLUEPRINT', key: 'passwordReset', height: 'h-32' },
                { label: 'ONBOARDING WELCOME', key: 'welcome', height: 'h-24' },
              ].map((field) => (
                <div key={field.key}>
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 block">
                    {field.label}
                  </label>
                  <textarea
                    className={`w-full rounded-2xl border border-slate-100 bg-slate-50/50 px-6 py-4 text-sm font-medium text-[#0b213f] outline-none transition focus:bg-white focus:ring-4 focus:ring-primary/5 ${field.height}`}
                    value={templates[field.key as keyof EmailTemplateState]}
                    onChange={(event) =>
                      setTemplates((prev) => ({
                        ...prev,
                        [field.key]: event.target.value,
                      }))
                    }
                  />
                  <div className="mt-2 flex gap-2">
                    {['name', 'link', 'date'].map((v) => (
                      <code key={v} className="rounded-lg bg-slate-100 px-2.5 py-1 text-[9px] font-black text-slate-400">
                        {`{{${v}}}`}
                      </code>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-10 flex justify-end">
              <button type="submit" className="group flex items-center gap-3 rounded-2xl bg-white border-2 border-slate-900 px-10 py-4 text-sm font-black text-slate-900 hover:bg-slate-900 hover:text-white transition-all active:scale-95">
                <Settings className="h-5 w-5" />
                Update Templates
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </AdminDashboardPage>
  );
}
