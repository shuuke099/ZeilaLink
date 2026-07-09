'use client';

import React, { useState } from 'react';
import { useParams } from 'next/navigation';
import Navbar from '@/components/Navbar';
import api from '@/lib/api';

export default function ApplyPage() {
  const params = useParams();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [coverLetter, setCoverLetter] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resumeFile) {
      setError('Please upload your resume');
      return;
    }
    try {
      setSubmitting(true);
      setError('');

      // 1) Upload the resume to the resumes service to create a Resume record
      const resumeForm = new FormData();
      resumeForm.append('resume', resumeFile);
      const upload = await api.post('/resumes/upload', resumeForm);
      const resumeId: string | undefined = upload.data?.id;
      if (!resumeId) {
        throw new Error('Upload failed: missing resume id');
      }

      // 2) Apply to the job using the created resume id
      await api.post(`/jobs/${params?.id}/apply`, {
        coverLetter,
        resumeId,
      });

      setSubmitted(true);
    } catch (e: any) {
      setError(e?.response?.data?.error || e?.response?.data?.message || 'Failed to submit application');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="max-w-2xl mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold text-primary-darker mb-6">Apply for Job</h1>

        {submitted ? (
          <div className="card">
            <h2 className="text-xl font-semibold text-primary-darker mb-2">Application Submitted</h2>
            <p className="text-primary-darker/80">Thank you for applying. We have sent a confirmation to your email.</p>
          </div>
        ) : (
          <form onSubmit={onSubmit} className="card space-y-4">
            {error && <div className="text-red-600 text-sm">{error}</div>}

            <div>
              <label className="block text-sm font-medium text-primary-darker mb-2">Full Name</label>
              <input
                type="text"
                className="input-field"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-primary-darker mb-2">Email</label>
              <input
                type="email"
                className="input-field"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-primary-darker mb-2">Resume (PDF/DOC)</label>
              <input
                type="file"
                accept=".pdf,.doc,.docx"
                onChange={(e) => setResumeFile(e.target.files?.[0] || null)}
                className="block w-full text-sm"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-primary-darker mb-2">Cover Letter</label>
              <textarea
                className="input-field min-h-[120px]"
                value={coverLetter}
                onChange={(e) => setCoverLetter(e.target.value)}
                placeholder="Briefly introduce yourself and why you fit"
              />
            </div>

            <button type="submit" className="btn-primary w-full" disabled={submitting}>
              {submitting ? 'Submitting...' : 'Submit Application'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}


