'use client';

import React from 'react';
import { Plus, Upload, X, Trash2 } from 'lucide-react';
import WorkerDashboardPage from '@/components/worker/WorkerDashboardPage';
import { useAuth } from '@/contexts/AuthContext';
import api from '@/lib/api';

type ResumeRecord = {
  id: string;
  s3Url: string;
  createdAt: string;
};

type ApplicationOption = {
  id: string;
  label: string;
};

type ExperienceInput = {
  jobTitle: string;
  company: string;
  startDate: string;
  endDate: string;
  isCurrent: boolean;
  achievements: string;
  applicationId?: string;
};

type EducationInput = {
  degreeLevel: string;
  institution: string;
  fieldOfStudy: string;
  certificationName: string;
  certificateUrl?: string;
  startDate: string;
  endDate: string;
};

type LanguageInput = {
  language: string;
  level: string;
};

type PreferenceInput = {
  employmentType: string;
  shiftPreference: string;
  desiredSalaryMin: string;
  desiredSalaryMax: string;
};

type ProfileFormState = {
  name: string;
  email: string;
  location: string;
  bio: string;
  skills: string[];
  profilePhoto?: string;
  resumeFile?: string;
  experiences: ExperienceInput[];
  educations: EducationInput[];
  languages: LanguageInput[];
  preferences: PreferenceInput;
};

const cloneProfileState = (state: ProfileFormState): ProfileFormState =>
  JSON.parse(JSON.stringify(state));

const formatDate = (value: string) =>
  new Date(value).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });

const emptyExperience = (): ExperienceInput => ({
  jobTitle: '',
  company: '',
  startDate: '',
  endDate: '',
  isCurrent: false,
  achievements: '',
  applicationId: '',
});

const emptyEducation = (): EducationInput => ({
  degreeLevel: '',
  institution: '',
  fieldOfStudy: '',
  certificationName: '',
  certificateUrl: '',
  startDate: '',
  endDate: '',
});

const emptyLanguage = (): LanguageInput => ({
  language: '',
  level: 'Basic',
});

const emptyPreferences = (): PreferenceInput => ({
  employmentType: '',
  shiftPreference: '',
  desiredSalaryMin: '',
  desiredSalaryMax: '',
});

export default function WorkerProfilePage() {
  const { user, updateUser } = useAuth();
  const initialState: ProfileFormState = {
    name: user?.name ?? '',
    email: user?.email ?? '',
    location: '',
    bio: '',
    skills: [],
    profilePhoto: user?.avatarUrl ?? undefined,
    experiences: [],
    educations: [],
    languages: [],
    preferences: emptyPreferences(),
  };
  const [formState, setFormState] = React.useState<ProfileFormState>(initialState);
  const [savedSnapshot, setSavedSnapshot] = React.useState<ProfileFormState>(cloneProfileState(initialState));
  const [newSkill, setNewSkill] = React.useState('');
  const [saving, setSaving] = React.useState(false);
  const [message, setMessage] = React.useState<string | null>(null);
  const [resumes, setResumes] = React.useState<ResumeRecord[]>([]);
  const [resumesLoading, setResumesLoading] = React.useState(true);
  const [applications, setApplications] = React.useState<ApplicationOption[]>([]);

  React.useEffect(() => {
    let active = true;

    const loadData = async () => {
      if (!user) return;
      try {
        setResumesLoading(true);
        const [profileResponse, resumeResponse, applicationResponse] = await Promise.all([
          api.get(`/auth/users/${user.id}/profile`).catch(() => ({ data: null })),
          api.get(`/resumes/users/${user.id}`).catch(() => ({ data: [] })),
          api.get(`/users/${user.id}/applications`).catch(() => ({ data: [] })),
        ]);

        if (!active) return;

        const profile = profileResponse.data;
        const resumeRecords = Array.isArray(resumeResponse.data) ? resumeResponse.data : [];
        const applicationRecords = Array.isArray(applicationResponse.data) ? applicationResponse.data : [];

        setResumes(resumeRecords);
        setApplications(
          applicationRecords.map((app: any) => ({
            id: app.id,
            label: `${app.job?.title ?? 'Applied Role'} (${app.job?.employer?.name ?? 'Unknown Employer'})`,
          })),
        );

        const nextState: ProfileFormState = {
          ...formState,
          name: profile?.name ?? formState.name,
          email: profile?.email ?? formState.email,
          location: profile?.location ?? '',
          bio: profile?.bio ?? '',
          profilePhoto: profile?.avatarUrl ?? formState.profilePhoto,
          resumeFile: resumeRecords[0]?.s3Url ?? formState.resumeFile,
          experiences: Array.isArray(profile?.workerExperiences)
            ? profile.workerExperiences.map((exp: any) => ({
                jobTitle: exp.jobTitle ?? '',
                company: exp.company ?? '',
                startDate: exp.startDate ? String(exp.startDate).slice(0, 10) : '',
                endDate: exp.endDate ? String(exp.endDate).slice(0, 10) : '',
                isCurrent: Boolean(exp.isCurrent),
                achievements: exp.achievements ?? '',
                applicationId: exp.applicationId ?? '',
              }))
            : [],
          educations: Array.isArray(profile?.workerEducations)
            ? profile.workerEducations.map((edu: any) => ({
                degreeLevel: edu.degreeLevel ?? '',
                institution: edu.institution ?? '',
                fieldOfStudy: edu.fieldOfStudy ?? '',
                certificationName: edu.certificationName ?? '',
                certificateUrl: edu.certificateUrl ?? '',
                startDate: edu.startDate ? String(edu.startDate).slice(0, 10) : '',
                endDate: edu.endDate ? String(edu.endDate).slice(0, 10) : '',
              }))
            : [],
          languages: Array.isArray(profile?.workerLanguages)
            ? profile.workerLanguages.map((lang: any) => ({
                language: lang.language ?? '',
                level: lang.level ?? 'Basic',
              }))
            : [],
          preferences: {
            employmentType: profile?.workerPreference?.employmentType ?? '',
            shiftPreference: profile?.workerPreference?.shiftPreference ?? '',
            desiredSalaryMin: profile?.workerPreference?.desiredSalaryMin?.toString?.() ?? '',
            desiredSalaryMax: profile?.workerPreference?.desiredSalaryMax?.toString?.() ?? '',
          },
        };

        setFormState(nextState);
        setSavedSnapshot(cloneProfileState(nextState));
      } catch (error) {
        console.error('Failed to load profile data', error);
      } finally {
        if (active) setResumesLoading(false);
      }
    };

    loadData();
    return () => {
      active = false;
    };
  }, [user]);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!user) return;

    try {
      setSaving(true);
      setMessage(null);

      const response = await api.put(`/auth/users/${user.id}`, {
        name: formState.name,
        email: formState.email,
        location: formState.location,
        bio: formState.bio,
        skills: formState.skills,
        avatarUrl: formState.profilePhoto,
        resumeUrl: formState.resumeFile,
        experiences: formState.experiences,
        educations: formState.educations,
        languages: formState.languages,
        preferences: {
          employmentType: formState.preferences.employmentType,
          shiftPreference: formState.preferences.shiftPreference,
          desiredSalaryMin: formState.preferences.desiredSalaryMin || null,
          desiredSalaryMax: formState.preferences.desiredSalaryMax || null,
        },
      });

      if (response?.data) {
        updateUser(response.data);
      }

      setSavedSnapshot(cloneProfileState(formState));
      setMessage('Profile updated successfully.');
    } catch (error) {
      console.error('Failed to update profile', error);
      setMessage('Failed to save profile. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleSkillAdd = () => {
    if (!newSkill.trim()) return;
    setFormState((prev) => ({
      ...prev,
      skills: [...prev.skills, newSkill.trim()],
    }));
    setNewSkill('');
  };

  const handleSkillRemove = (skill: string) => {
    setFormState((prev) => ({
      ...prev,
      skills: prev.skills.filter((item) => item !== skill),
    }));
  };

  const handleFileUpload = async (file: File, key: 'profilePhoto' | 'resumeFile') => {
    try {
      if (key === 'profilePhoto') {
        const formData = new FormData();
        formData.append('file', file);
        const response = await api.post('/uploads', formData);
        const uploadedUrl = response.data.url ?? response.data.publicUrl;
        if (!uploadedUrl) throw new Error('Upload response missing URL');
        setFormState((prev) => ({ ...prev, profilePhoto: uploadedUrl }));
        setMessage('Profile photo uploaded successfully.');
        return;
      }

      const formData = new FormData();
      formData.append('resume', file);
      const response = await api.post('/resumes/upload', formData);
      const uploadedResume = response.data as ResumeRecord;
      if (!uploadedResume?.s3Url) throw new Error('Upload response missing resume URL');
      setFormState((prev) => ({ ...prev, resumeFile: uploadedResume.s3Url }));
      setResumes((prev) => [uploadedResume, ...prev]);
      setMessage('Resume uploaded successfully.');
    } catch (error) {
      console.error('Upload failed', error);
      setMessage('Failed to upload file. Please try again.');
    }
  };

  const handleCertificateUpload = async (index: number, file: File) => {
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('folder', 'certificates');
      const response = await api.post('/uploads', formData);
      const uploadedUrl = response.data.url ?? response.data.publicUrl;
      if (!uploadedUrl) throw new Error('Upload response missing URL');

      setFormState((prev) => ({
        ...prev,
        educations: prev.educations.map((item, itemIndex) =>
          itemIndex === index ? { ...item, certificateUrl: uploadedUrl } : item,
        ),
      }));
      setMessage('Certificate uploaded successfully.');
    } catch (error) {
      console.error('Certificate upload failed', error);
      setMessage('Failed to upload certificate.');
    }
  };

  const handleCancel = () => {
    setFormState(cloneProfileState(savedSnapshot));
    setMessage('Changes discarded.');
  };

  return (
    <WorkerDashboardPage
      title="My Profile"
      description="Build a complete profile so the matchmaker can connect you to the right jobs and training."
      headerActions={
        <button type="submit" form="worker-profile-form" className="btn-primary" disabled={saving}>
          {saving ? 'Saving...' : 'Save Changes'}
        </button>
      }
    >
      {message && (
        <div className="rounded-xl border border-primary/20 bg-primary/5 p-4 text-sm text-primary">
          {message}
        </div>
      )}

      <form id="worker-profile-form" className="space-y-6" onSubmit={handleSubmit}>
        <section className="grid gap-6 lg:grid-cols-[320px,1fr]">
          <article className="rounded-2xl border border-primary/10 bg-white p-6 shadow-lg">
            <h2 className="text-lg font-semibold text-primary-darker">Profile photo</h2>
            <p className="mt-2 text-sm text-primary-darker/60">
              Show employers who you are. Use a clear, professional photo.
            </p>

            <div className="mt-6 flex flex-col items-center gap-4">
              {formState.profilePhoto ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={formState.profilePhoto} alt="Profile preview" className="h-32 w-32 rounded-full object-cover shadow-md" />
              ) : (
                <div className="flex h-32 w-32 items-center justify-center rounded-full border border-dashed border-primary/40 text-sm text-primary">
                  No photo yet
                </div>
              )}
              <label className="btn-secondary cursor-pointer">
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(event) => {
                    const file = event.target.files?.[0];
                    if (file) handleFileUpload(file, 'profilePhoto');
                  }}
                />
                Upload photo
              </label>
            </div>
          </article>

          <article className="rounded-2xl border border-primary/10 bg-white p-6 shadow-lg">
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="text-sm font-medium text-primary-darker">Full name</label>
                <input
                  type="text"
                  className="input-field mt-2"
                  value={formState.name}
                  onChange={(event) => setFormState((prev) => ({ ...prev, name: event.target.value }))}
                  required
                />
              </div>

              <div>
                <label className="text-sm font-medium text-primary-darker">Email address</label>
                <input
                  type="email"
                  className="input-field mt-2"
                  value={formState.email}
                  onChange={(event) => setFormState((prev) => ({ ...prev, email: event.target.value }))}
                  required
                />
              </div>

              <div>
                <label className="text-sm font-medium text-primary-darker">Location</label>
                <input
                  type="text"
                  className="input-field mt-2"
                  placeholder="Mogadishu, Somalia"
                  value={formState.location}
                  onChange={(event) => setFormState((prev) => ({ ...prev, location: event.target.value }))}
                />
              </div>

              <div>
                <label className="text-sm font-medium text-primary-darker">Resume (PDF)</label>
                <div className="mt-2 flex flex-wrap items-center gap-3">
                  <label className="input-field flex cursor-pointer items-center gap-2">
                    <Upload className="h-4 w-4 text-primary" />
                    <span className="text-sm text-primary-darker/70">Upload or replace CV</span>
                    <input
                      type="file"
                      accept="application/pdf"
                      className="hidden"
                      onChange={(event) => {
                        const file = event.target.files?.[0];
                        if (file) handleFileUpload(file, 'resumeFile');
                      }}
                    />
                  </label>
                  {formState.resumeFile && (
                    <a href={formState.resumeFile} target="_blank" rel="noopener noreferrer" className="text-sm font-semibold text-primary hover:underline">
                      View latest
                    </a>
                  )}
                </div>
                {resumesLoading ? (
                  <p className="mt-3 text-xs text-primary-darker/50">Loading resumes...</p>
                ) : resumes.length > 0 ? (
                  <ul className="mt-3 space-y-2 text-sm text-primary-darker">
                    {resumes.map((resume, index) => (
                      <li key={resume.id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-primary/10 bg-primary/5 px-3 py-2">
                        <div>
                          <p className="font-medium text-primary-darker">Resume {index + 1}</p>
                          <p className="text-xs text-primary-darker/60">Uploaded {formatDate(resume.createdAt)}</p>
                        </div>
                        <a href={resume.s3Url} target="_blank" rel="noopener noreferrer" className="text-sm font-semibold text-primary hover:underline">
                          View
                        </a>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="mt-3 text-sm text-primary-darker/60">
                    No resume uploaded yet. Share your CV to stand out with employers.
                  </p>
                )}
                <p className="mt-2 text-xs text-primary-darker/50">PDF only, max size 5MB.</p>
              </div>
            </div>

            <div className="mt-5">
              <label className="text-sm font-medium text-primary-darker">Bio</label>
              <textarea
                className="input-field mt-2 h-32 resize-none"
                placeholder="Tell employers about your experience, strengths, and goals."
                value={formState.bio}
                onChange={(event) => setFormState((prev) => ({ ...prev, bio: event.target.value }))}
              />
            </div>
          </article>
        </section>

        <section className="rounded-2xl border border-primary/10 bg-white p-6 shadow-lg">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold text-primary-darker">Skills</h2>
              <p className="text-sm text-primary-darker/60">
                Highlight what you are great at. Employers use this to find relevant candidates.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <input className="input-field" placeholder="Add a skill" value={newSkill} onChange={(event) => setNewSkill(event.target.value)} />
              <button type="button" className="btn-secondary flex items-center gap-2" onClick={handleSkillAdd}>
                <Plus className="h-4 w-4" />
                Add
              </button>
            </div>
          </div>

          {formState.skills.length > 0 ? (
            <div className="mt-4 flex flex-wrap gap-2">
              {formState.skills.map((skill) => (
                <span key={skill} className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-3 py-1 text-sm font-medium text-primary">
                  {skill}
                  <button type="button" className="text-primary/60 transition hover:text-primary" aria-label={`Remove ${skill}`} onClick={() => handleSkillRemove(skill)}>
                    <X className="h-3 w-3" />
                  </button>
                </span>
              ))}
            </div>
          ) : (
            <p className="mt-4 text-sm text-primary-darker/60">No skills added yet. Add at least 5 to increase your match score.</p>
          )}
        </section>

        <section className="rounded-2xl border border-primary/10 bg-white p-6 shadow-lg space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-primary-darker">Work Experience & Employment History</h2>
              <p className="text-sm text-primary-darker/60">Structured history helps match by years of experience and role relevance.</p>
            </div>
            <button type="button" className="btn-secondary flex items-center gap-2" onClick={() => setFormState((prev) => ({ ...prev, experiences: [...prev.experiences, emptyExperience()] }))}>
              <Plus className="h-4 w-4" />
              Add Experience
            </button>
          </div>

          {formState.experiences.map((experience, index) => (
            <div key={`experience-${index}`} className="rounded-xl border border-primary/10 bg-primary/5 p-4 space-y-3">
              <div className="grid gap-3 md:grid-cols-2">
                <input className="input-field" placeholder="Job title" value={experience.jobTitle} onChange={(event) => setFormState((prev) => ({ ...prev, experiences: prev.experiences.map((item, itemIndex) => itemIndex === index ? { ...item, jobTitle: event.target.value } : item) }))} />
                <input className="input-field" placeholder="Company" value={experience.company} onChange={(event) => setFormState((prev) => ({ ...prev, experiences: prev.experiences.map((item, itemIndex) => itemIndex === index ? { ...item, company: event.target.value } : item) }))} />
                <input type="date" className="input-field" value={experience.startDate} onChange={(event) => setFormState((prev) => ({ ...prev, experiences: prev.experiences.map((item, itemIndex) => itemIndex === index ? { ...item, startDate: event.target.value } : item) }))} />
                <input type="date" className="input-field" value={experience.endDate} disabled={experience.isCurrent} onChange={(event) => setFormState((prev) => ({ ...prev, experiences: prev.experiences.map((item, itemIndex) => itemIndex === index ? { ...item, endDate: event.target.value } : item) }))} />
              </div>
              <label className="inline-flex items-center gap-2 text-sm text-primary-darker">
                <input type="checkbox" checked={experience.isCurrent} onChange={(event) => setFormState((prev) => ({ ...prev, experiences: prev.experiences.map((item, itemIndex) => itemIndex === index ? { ...item, isCurrent: event.target.checked, endDate: event.target.checked ? '' : item.endDate } : item) }))} />
                I currently work here
              </label>
              <select className="input-field" value={experience.applicationId ?? ''} onChange={(event) => setFormState((prev) => ({ ...prev, experiences: prev.experiences.map((item, itemIndex) => itemIndex === index ? { ...item, applicationId: event.target.value } : item) }))}>
                <option value="">Link to an application (optional)</option>
                {applications.map((application) => (
                  <option key={application.id} value={application.id}>
                    {application.label}
                  </option>
                ))}
              </select>
              <textarea className="input-field h-24 resize-none" placeholder="Key achievements and measurable impact" value={experience.achievements} onChange={(event) => setFormState((prev) => ({ ...prev, experiences: prev.experiences.map((item, itemIndex) => itemIndex === index ? { ...item, achievements: event.target.value } : item) }))} />
              <button type="button" className="text-sm text-red-600 inline-flex items-center gap-1" onClick={() => setFormState((prev) => ({ ...prev, experiences: prev.experiences.filter((_, itemIndex) => itemIndex !== index) }))}>
                <Trash2 className="h-4 w-4" />
                Remove
              </button>
            </div>
          ))}
        </section>

        <section className="rounded-2xl border border-primary/10 bg-white p-6 shadow-lg space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-primary-darker">Education & Professional Certifications</h2>
              <p className="text-sm text-primary-darker/60">Track degree level and upload certification evidence for admin verification.</p>
            </div>
            <button type="button" className="btn-secondary flex items-center gap-2" onClick={() => setFormState((prev) => ({ ...prev, educations: [...prev.educations, emptyEducation()] }))}>
              <Plus className="h-4 w-4" />
              Add Education/Cert
            </button>
          </div>

          {formState.educations.map((education, index) => (
            <div key={`education-${index}`} className="rounded-xl border border-primary/10 bg-primary/5 p-4 space-y-3">
              <div className="grid gap-3 md:grid-cols-2">
                <select className="input-field" value={education.degreeLevel} onChange={(event) => setFormState((prev) => ({ ...prev, educations: prev.educations.map((item, itemIndex) => itemIndex === index ? { ...item, degreeLevel: event.target.value } : item) }))}>
                  <option value="">Degree level</option>
                  <option value="High School">High School</option>
                  <option value="Diploma">Diploma</option>
                  <option value="University">University</option>
                  <option value="Vocational">Vocational</option>
                  <option value="Other">Other</option>
                </select>
                <input className="input-field" placeholder="Institution" value={education.institution} onChange={(event) => setFormState((prev) => ({ ...prev, educations: prev.educations.map((item, itemIndex) => itemIndex === index ? { ...item, institution: event.target.value } : item) }))} />
                <input className="input-field" placeholder="Field of study" value={education.fieldOfStudy} onChange={(event) => setFormState((prev) => ({ ...prev, educations: prev.educations.map((item, itemIndex) => itemIndex === index ? { ...item, fieldOfStudy: event.target.value } : item) }))} />
                <input className="input-field" placeholder="Certification name (e.g. OSHA 10, CDL)" value={education.certificationName} onChange={(event) => setFormState((prev) => ({ ...prev, educations: prev.educations.map((item, itemIndex) => itemIndex === index ? { ...item, certificationName: event.target.value } : item) }))} />
                <input type="date" className="input-field" value={education.startDate} onChange={(event) => setFormState((prev) => ({ ...prev, educations: prev.educations.map((item, itemIndex) => itemIndex === index ? { ...item, startDate: event.target.value } : item) }))} />
                <input type="date" className="input-field" value={education.endDate} onChange={(event) => setFormState((prev) => ({ ...prev, educations: prev.educations.map((item, itemIndex) => itemIndex === index ? { ...item, endDate: event.target.value } : item) }))} />
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <label className="btn-secondary cursor-pointer inline-flex items-center gap-2">
                  <Upload className="h-4 w-4" />
                  Upload certificate
                  <input
                    type="file"
                    accept=".pdf,image/*"
                    className="hidden"
                    onChange={(event) => {
                      const file = event.target.files?.[0];
                      if (file) handleCertificateUpload(index, file);
                    }}
                  />
                </label>
                {education.certificateUrl && (
                  <a href={education.certificateUrl} target="_blank" rel="noopener noreferrer" className="text-sm font-semibold text-primary hover:underline">
                    View uploaded certificate
                  </a>
                )}
              </div>
              <button type="button" className="text-sm text-red-600 inline-flex items-center gap-1" onClick={() => setFormState((prev) => ({ ...prev, educations: prev.educations.filter((_, itemIndex) => itemIndex !== index) }))}>
                <Trash2 className="h-4 w-4" />
                Remove
              </button>
            </div>
          ))}
        </section>

        <section className="rounded-2xl border border-primary/10 bg-white p-6 shadow-lg space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-primary-darker">Language Proficiency</h2>
              <p className="text-sm text-primary-darker/60">Add all spoken languages. This powers bilingual candidate search.</p>
            </div>
            <button type="button" className="btn-secondary flex items-center gap-2" onClick={() => setFormState((prev) => ({ ...prev, languages: [...prev.languages, emptyLanguage()] }))}>
              <Plus className="h-4 w-4" />
              Add Language
            </button>
          </div>

          {formState.languages.map((language, index) => (
            <div key={`language-${index}`} className="rounded-xl border border-primary/10 bg-primary/5 p-4 grid gap-3 md:grid-cols-[1fr,220px,auto] items-center">
              <input className="input-field" placeholder="Language name (Somali, English, Arabic...)" value={language.language} onChange={(event) => setFormState((prev) => ({ ...prev, languages: prev.languages.map((item, itemIndex) => itemIndex === index ? { ...item, language: event.target.value } : item) }))} />
              <select className="input-field" value={language.level} onChange={(event) => setFormState((prev) => ({ ...prev, languages: prev.languages.map((item, itemIndex) => itemIndex === index ? { ...item, level: event.target.value } : item) }))}>
                <option value="Basic">Basic</option>
                <option value="Intermediate">Intermediate</option>
                <option value="Fluent">Fluent</option>
                <option value="Native">Native</option>
              </select>
              <button type="button" className="text-sm text-red-600 inline-flex items-center gap-1 justify-self-start md:justify-self-end" onClick={() => setFormState((prev) => ({ ...prev, languages: prev.languages.filter((_, itemIndex) => itemIndex !== index) }))}>
                <Trash2 className="h-4 w-4" />
                Remove
              </button>
            </div>
          ))}
        </section>

        <section className="rounded-2xl border border-primary/10 bg-white p-6 shadow-lg space-y-4">
          <div>
            <h2 className="text-lg font-semibold text-primary-darker">Availability & Job Preferences</h2>
            <p className="text-sm text-primary-darker/60">Control recommendations using employment type, shift, and salary expectations.</p>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <select className="input-field" value={formState.preferences.employmentType} onChange={(event) => setFormState((prev) => ({ ...prev, preferences: { ...prev.preferences, employmentType: event.target.value } }))}>
              <option value="">Employment type</option>
              <option value="full-time">Full-time</option>
              <option value="part-time">Part-time</option>
              <option value="contract">Contract</option>
            </select>

            <select className="input-field" value={formState.preferences.shiftPreference} onChange={(event) => setFormState((prev) => ({ ...prev, preferences: { ...prev.preferences, shiftPreference: event.target.value } }))}>
              <option value="">Shift preference</option>
              <option value="morning">Morning</option>
              <option value="evening">Evening</option>
              <option value="night">Night</option>
            </select>

            <input type="number" className="input-field" placeholder="Desired salary min" value={formState.preferences.desiredSalaryMin} onChange={(event) => setFormState((prev) => ({ ...prev, preferences: { ...prev.preferences, desiredSalaryMin: event.target.value } }))} />
            <input type="number" className="input-field" placeholder="Desired salary max" value={formState.preferences.desiredSalaryMax} onChange={(event) => setFormState((prev) => ({ ...prev, preferences: { ...prev.preferences, desiredSalaryMax: event.target.value } }))} />
          </div>
        </section>

        <section className="rounded-2xl border border-primary/10 bg-white p-4 shadow-lg">
          <div className="flex justify-end gap-3">
            <button
              type="button"
              className="btn-secondary"
              onClick={handleCancel}
              disabled={saving}
            >
              Cancel
            </button>
            <button type="submit" className="btn-primary" disabled={saving}>
              {saving ? 'Saving...' : 'Save'}
            </button>
          </div>
        </section>
      </form>
    </WorkerDashboardPage>
  );
}
