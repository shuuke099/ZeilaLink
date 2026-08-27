import { PrismaClient } from "@prisma/client";

export async function seedResumes(prisma: PrismaClient, users: any) {
  const resumes = [
    {
      id: "seed-resume-1",
      userId: users.hodanAli.id,
      s3Url:
        "https://zeilalink-uploads.sfo2.digitaloceanspaces.com/demo/resumes/hodan-ali-resume.pdf",
      parsedText:
        "Professional photographer experienced in weddings, portraits, and community events.",
      skillsExtracted: ["Photography", "Photo Editing", "Customer Service"],
    },
    {
      id: "seed-resume-2",
      userId: users.fadumoYusuf.id,
      s3Url:
        "https://zeilalink-uploads.sfo2.digitaloceanspaces.com/demo/resumes/fadumo-yusuf-resume.pdf",
      parsedText:
        "Cleaning professional with residential cleaning and customer service experience.",
      skillsExtracted: [
        "Residential Cleaning",
        "Customer Service",
        "Organization",
      ],
    },
    {
      id: "seed-resume-3",
      userId: users.ahmedOmar.id,
      s3Url:
        "https://zeilalink-uploads.sfo2.digitaloceanspaces.com/demo/resumes/ahmed-omar-resume.pdf",
      parsedText:
        "Web developer experienced with modern web technologies and responsive applications.",
      skillsExtracted: ["JavaScript", "TypeScript", "Web Development"],
    },
    {
      id: "seed-resume-4",
      userId: users.sahraMohamed.id,
      s3Url:
        "https://zeilalink-uploads.sfo2.digitaloceanspaces.com/demo/resumes/sahra-mohamed-resume.pdf",
      parsedText:
        "Bilingual Somali-English interpreter with community service experience.",
      skillsExtracted: ["Somali", "English", "Translation", "Interpretation"],
    },
    {
      id: "seed-resume-5",
      userId: users.nimcoAden.id,
      s3Url:
        "https://zeilalink-uploads.sfo2.digitaloceanspaces.com/demo/resumes/nimco-aden-resume.pdf",
      parsedText:
        "Community support professional experienced in connecting families with local resources.",
      skillsExtracted: [
        "Community Support",
        "Communication",
        "Case Coordination",
      ],
    },
  ];

  const results = [];

  for (const resume of resumes) {
    results.push(
      await prisma.resume.upsert({
        where: { id: resume.id },
        update: resume,
        create: resume,
      }),
    );
  }

  return results;
}
