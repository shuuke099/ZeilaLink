import { PrismaClient } from "@prisma/client";

export async function seedUserCertifications(
  prisma: PrismaClient,
  users: any,
  courses: any,
  skills: any,
) {
  const certifications = [
    {
      id: "seed-certification-1",
      userId: users.hodanAli.id,
      courseId: courses.customerService.id,
      skillId: skills.customerService.id,
      issuedAt: new Date("2026-03-15"),
      expiryDate: null,
      certificateUrl:
        "https://zeilalink-uploads.sfo2.digitaloceanspaces.com/demo/certificates/hodan-customer-service.pdf",
    },
    {
      id: "seed-certification-2",
      userId: users.ahmedOmar.id,
      courseId: courses.webDevelopmentFoundations.id,
      skillId: skills.javascript.id,
      issuedAt: new Date("2026-04-20"),
      expiryDate: null,
      certificateUrl:
        "https://zeilalink-uploads.sfo2.digitaloceanspaces.com/demo/certificates/ahmed-web-development.pdf",
    },
    {
      id: "seed-certification-3",
      userId: users.sahraMohamed.id,
      courseId: courses.somaliEnglishInterpretation.id,
      skillId: skills.interpretation.id,
      issuedAt: new Date("2026-05-10"),
      expiryDate: null,
      certificateUrl:
        "https://zeilalink-uploads.sfo2.digitaloceanspaces.com/demo/certificates/sahra-interpretation.pdf",
    },
    {
      id: "seed-certification-4",
      userId: users.fadumoYusuf.id,
      courseId: courses.customerService.id,
      skillId: skills.customerService.id,
      issuedAt: new Date("2026-06-05"),
      expiryDate: null,
      certificateUrl:
        "https://zeilalink-uploads.sfo2.digitaloceanspaces.com/demo/certificates/fadumo-customer-service.pdf",
    },
    {
      id: "seed-certification-5",
      userId: users.nimcoAden.id,
      courseId: courses.warehouseOperations.id,
      skillId: skills.warehouseOperations.id,
      issuedAt: new Date("2026-07-12"),
      expiryDate: null,
      certificateUrl:
        "https://zeilalink-uploads.sfo2.digitaloceanspaces.com/demo/certificates/nimco-warehouse.pdf",
    },
  ];

  for (const certification of certifications) {
    await prisma.userCertification.upsert({
      where: {
        id: certification.id,
      },
      update: certification,
      create: certification,
    });
  }
}
