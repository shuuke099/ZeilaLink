export const presentResume = <T extends { id: string; s3Url: string }>(resume: T) => ({
  ...resume,
  s3Url: `/api/resumes/${encodeURIComponent(resume.id)}/download`,
});
