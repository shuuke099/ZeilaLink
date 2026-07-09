'use client';

import React from 'react';
import WorkerDashboardPage from '@/components/worker/WorkerDashboardPage';
import { useAuth } from '@/contexts/AuthContext';
import api from '@/lib/api';

type NotificationPrefs = {
  jobAlerts: boolean;
  applicationUpdates: boolean;
  learningRecommendations: boolean;
};

export default function WorkerSettingsPage() {
  const { user, logout } = useAuth();
  const [passwordState, setPasswordState] = React.useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [notificationPrefs, setNotificationPrefs] = React.useState<NotificationPrefs>({
    jobAlerts: true,
    applicationUpdates: true,
    learningRecommendations: false,
  });
  const [feedback, setFeedback] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(false);

  const handlePasswordUpdate = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!user) return;
    if (passwordState.newPassword !== passwordState.confirmPassword) {
      setFeedback('New passwords do not match.');
      return;
    }

    try {
      setLoading(true);
      await api.post('/auth/update-password', {
        currentPassword: passwordState.currentPassword,
        newPassword: passwordState.newPassword,
      });
      setFeedback('Password updated successfully.');
      setPasswordState({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (error) {
      console.error('Failed to update password', error);
      setFeedback('Unable to update password. Please check your current password.');
    } finally {
      setLoading(false);
    }
  };

  const handleNotificationUpdate = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!user) return;

    try {
      setLoading(true);
      await api.put(`/users/${user.id}/preferences`, notificationPrefs);
      setFeedback('Notification preferences saved.');
    } catch (error) {
      console.error('Failed to update notifications', error);
      setFeedback('Unable to save notification settings right now.');
    } finally {
      setLoading(false);
    }
  };

  const handleAccountDelete = async () => {
    if (!user) return;
    const confirmed = window.confirm(
      'Deleting your account will remove all your applications and data. This action cannot be undone. Continue?',
    );
    if (!confirmed) return;

    try {
      await api.delete(`/users/${user.id}`);
      logout();
      window.location.href = '/';
    } catch (error) {
      console.error('Failed to delete account', error);
      setFeedback('Unable to delete your account. Please contact support.');
    }
  };

  return (
    <WorkerDashboardPage
      title="Settings"
      description="Manage account security, notifications, and privacy preferences."
    >
      {feedback && (
        <div className="rounded-xl border border-primary/20 bg-primary/5 p-4 text-sm text-primary">
          {feedback}
        </div>
      )}

      <section className="grid gap-6 lg:grid-cols-2">
        <form
          onSubmit={handlePasswordUpdate}
          className="rounded-2xl border border-primary/10 bg-white p-6 shadow-lg"
        >
          <h2 className="text-lg font-semibold text-primary-darker">
            Change password
          </h2>
          <p className="mt-2 text-sm text-primary-darker/60">
            Choose a strong password to protect your account.
          </p>

          <div className="mt-4 space-y-4">
            <div>
              <label className="text-sm font-medium text-primary-darker">
                Current password
              </label>
              <input
                type="password"
                className="input-field mt-2"
                value={passwordState.currentPassword}
                onChange={(event) =>
                  setPasswordState((prev) => ({
                    ...prev,
                    currentPassword: event.target.value,
                  }))
                }
                required
              />
            </div>
            <div>
              <label className="text-sm font-medium text-primary-darker">
                New password
              </label>
              <input
                type="password"
                className="input-field mt-2"
                value={passwordState.newPassword}
                onChange={(event) =>
                  setPasswordState((prev) => ({
                    ...prev,
                    newPassword: event.target.value,
                  }))
                }
                minLength={8}
                required
              />
              <p className="mt-1 text-xs text-primary-darker/50">
                Must be at least 8 characters long.
              </p>
            </div>
            <div>
              <label className="text-sm font-medium text-primary-darker">
                Confirm new password
              </label>
              <input
                type="password"
                className="input-field mt-2"
                value={passwordState.confirmPassword}
                onChange={(event) =>
                  setPasswordState((prev) => ({
                    ...prev,
                    confirmPassword: event.target.value,
                  }))
                }
                required
              />
            </div>
          </div>

          <div className="mt-6 flex justify-end">
            <button
              type="submit"
              className="btn-primary"
              disabled={loading}
            >
              {loading ? 'Saving...' : 'Update password'}
            </button>
          </div>
        </form>

        <form
          onSubmit={handleNotificationUpdate}
          className="rounded-2xl border border-primary/10 bg-white p-6 shadow-lg"
        >
          <h2 className="text-lg font-semibold text-primary-darker">
            Notification preferences
          </h2>
          <p className="mt-2 text-sm text-primary-darker/60">
            Decide how we should keep you informed.
          </p>

          <div className="mt-4 space-y-4">
            <label className="flex items-start gap-3 rounded-xl border border-primary/10 bg-primary/5 p-4">
              <input
                type="checkbox"
                className="mt-1 h-4 w-4"
                checked={notificationPrefs.jobAlerts}
                onChange={(event) =>
                  setNotificationPrefs((prev) => ({
                    ...prev,
                    jobAlerts: event.target.checked,
                  }))
                }
              />
              <span>
                <span className="font-semibold text-primary-darker">
                  New job alerts
                </span>
                <p className="text-sm text-primary-darker/60">
                  Receive weekly updates about jobs that match your skills.
                </p>
              </span>
            </label>

            <label className="flex items-start gap-3 rounded-xl border border-primary/10 bg-primary/5 p-4">
              <input
                type="checkbox"
                className="mt-1 h-4 w-4"
                checked={notificationPrefs.applicationUpdates}
                onChange={(event) =>
                  setNotificationPrefs((prev) => ({
                    ...prev,
                    applicationUpdates: event.target.checked,
                  }))
                }
              />
              <span>
                <span className="font-semibold text-primary-darker">
                  Application status updates
                </span>
                <p className="text-sm text-primary-darker/60">
                  Get notified when employers review or respond to your application.
                </p>
              </span>
            </label>

            <label className="flex items-start gap-3 rounded-xl border border-primary/10 bg-primary/5 p-4">
              <input
                type="checkbox"
                className="mt-1 h-4 w-4"
                checked={notificationPrefs.learningRecommendations}
                onChange={(event) =>
                  setNotificationPrefs((prev) => ({
                    ...prev,
                    learningRecommendations: event.target.checked,
                  }))
                }
              />
              <span>
                <span className="font-semibold text-primary-darker">
                  Training & learning tips
                </span>
                <p className="text-sm text-primary-darker/60">
                  Personalized recommendations to improve your employability.
                </p>
              </span>
            </label>
          </div>

          <div className="mt-6 flex justify-end">
            <button
              type="submit"
              className="btn-secondary"
              disabled={loading}
            >
              {loading ? 'Saving...' : 'Save preferences'}
            </button>
          </div>
        </form>
      </section>

      <section className="rounded-2xl border border-red-200 bg-red-50 p-6 shadow-lg">
        <h2 className="text-lg font-semibold text-red-700">
          Danger zone: delete account
        </h2>
        <p className="mt-2 text-sm text-red-600">
          This will permanently remove your profile, applications, and saved jobs. You will need to create a new account if you want to return.
        </p>
        <button
          className="mt-4 rounded-lg border border-red-500 px-4 py-2 text-sm font-semibold text-red-600 hover:bg-red-600 hover:text-white"
          onClick={handleAccountDelete}
        >
          Permanently delete my account
        </button>
      </section>
    </WorkerDashboardPage>
  );
}

