import { PrismaClient } from "@prisma/client";

export async function seedServiceBookings(
  prisma: PrismaClient,
  users: any,
  services: any,
) {
  const bookings = [
    {
      id: "seed-booking-1",
      serviceId: services.weddingPhotography.id,
      userId: users.hodanAli.id,
      customerName: "Hodan Ali",
      customerEmail: "hodan.ali@example.com",
      customerPhone: "+1-612-555-1002",
      notes: "Please contact me before the appointment.",
      status: "pending",
      serviceDateTime: new Date("2026-09-05T10:00:00"),
      isRemote: false,
      locationAddress: "Minneapolis, MN",
      paymentStatus: "pending",
    },
    {
      id: "seed-booking-2",
      serviceId: services.homeCleaning.id,
      userId: users.fadumoYusuf.id,
      customerName: "Fadumo Yusuf",
      customerEmail: "fadumo.yusuf@example.com",
      customerPhone: "+1-612-555-1003",
      notes: "Please call before arriving.",
      status: "confirmed",
      serviceDateTime: new Date("2026-09-06T13:00:00"),
      isRemote: false,
      locationAddress: "Minneapolis, MN",
      paymentStatus: "pending",
    },
    {
      id: "seed-booking-3",
      serviceId: services.autoRepair.id,
      userId: users.ahmedOmar.id,
      customerName: "Ahmed Omar",
      customerEmail: "ahmed.omar@example.com",
      customerPhone: "+1-612-555-1006",
      notes: "Vehicle needs an inspection.",
      status: "confirmed",
      serviceDateTime: new Date("2026-09-08T15:00:00"),
      isRemote: false,
      locationAddress: "Bloomington, MN",
      paymentStatus: "paid",
    },
    {
      id: "seed-booking-4",
      serviceId: services.taxPreparation.id,
      userId: users.sahraMohamed.id,
      customerName: "Sahra Mohamed",
      customerEmail: "sahra.mohamed@example.com",
      customerPhone: "+1-612-555-1007",
      notes: "Remote appointment preferred.",
      status: "pending",
      serviceDateTime: new Date("2026-09-10T14:00:00"),
      isRemote: true,
      locationAddress: null,
      paymentStatus: "pending",
    },
    {
      id: "seed-booking-5",
      serviceId: services.translation.id,
      userId: users.nimcoAden.id,
      customerName: "Nimco Aden",
      customerEmail: "nimco.aden@example.com",
      customerPhone: "+1-612-555-1009",
      notes: "Somali-English translation needed.",
      status: "completed",
      serviceDateTime: new Date("2026-08-20T11:00:00"),
      isRemote: true,
      locationAddress: null,
      paymentStatus: "paid",
    },
  ];

  for (const booking of bookings) {
    await prisma.serviceBooking.upsert({
      where: {
        id: booking.id,
      },
      update: booking,
      create: booking,
    });
  }
}
