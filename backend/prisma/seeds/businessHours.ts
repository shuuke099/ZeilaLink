import { PrismaClient } from "@prisma/client";

type SeedBusinesses = {
  safariRestaurant: { id: string };
  hodanPhotography: { id: string };
  barwaaqoCleaning: { id: string };
  abdiAutoRepair: { id: string };
  somaliTaxServices: { id: string };
  zeilaWebSolutions: { id: string };
  amanTransportation: { id: string };
  nurHomeCare: { id: string };
  somaliTranslation: { id: string };
  hornMoving: { id: string };
};

export async function seedBusinessHours(
  prisma: PrismaClient,
  businesses: SeedBusinesses,
) {
  const businessHours = [
    // Safari Restaurant
    {
      businessId: businesses.safariRestaurant.id,
      dayOfWeek: 0,
      openTime: "09:00",
      closeTime: "21:00",
      closed: false,
    },
    {
      businessId: businesses.safariRestaurant.id,
      dayOfWeek: 1,
      openTime: "08:00",
      closeTime: "22:00",
      closed: false,
    },
    {
      businessId: businesses.safariRestaurant.id,
      dayOfWeek: 2,
      openTime: "08:00",
      closeTime: "22:00",
      closed: false,
    },
    {
      businessId: businesses.safariRestaurant.id,
      dayOfWeek: 3,
      openTime: "08:00",
      closeTime: "22:00",
      closed: false,
    },
    {
      businessId: businesses.safariRestaurant.id,
      dayOfWeek: 4,
      openTime: "08:00",
      closeTime: "22:00",
      closed: false,
    },
    {
      businessId: businesses.safariRestaurant.id,
      dayOfWeek: 5,
      openTime: "08:00",
      closeTime: "23:00",
      closed: false,
    },
    {
      businessId: businesses.safariRestaurant.id,
      dayOfWeek: 6,
      openTime: "09:00",
      closeTime: "23:00",
      closed: false,
    },

    // Hodan Photography
    {
      businessId: businesses.hodanPhotography.id,
      dayOfWeek: 0,
      openTime: "10:00",
      closeTime: "18:00",
      closed: false,
    },
    {
      businessId: businesses.hodanPhotography.id,
      dayOfWeek: 1,
      openTime: "09:00",
      closeTime: "18:00",
      closed: false,
    },
    {
      businessId: businesses.hodanPhotography.id,
      dayOfWeek: 2,
      openTime: "09:00",
      closeTime: "18:00",
      closed: false,
    },
    {
      businessId: businesses.hodanPhotography.id,
      dayOfWeek: 3,
      openTime: "09:00",
      closeTime: "18:00",
      closed: false,
    },
    {
      businessId: businesses.hodanPhotography.id,
      dayOfWeek: 4,
      openTime: "09:00",
      closeTime: "18:00",
      closed: false,
    },
    {
      businessId: businesses.hodanPhotography.id,
      dayOfWeek: 5,
      openTime: "09:00",
      closeTime: "19:00",
      closed: false,
    },
    {
      businessId: businesses.hodanPhotography.id,
      dayOfWeek: 6,
      openTime: "10:00",
      closeTime: "19:00",
      closed: false,
    },

    // Barwaaqo Cleaning Services
    {
      businessId: businesses.barwaaqoCleaning.id,
      dayOfWeek: 0,
      openTime: null,
      closeTime: null,
      closed: true,
    },
    {
      businessId: businesses.barwaaqoCleaning.id,
      dayOfWeek: 1,
      openTime: "08:00",
      closeTime: "18:00",
      closed: false,
    },
    {
      businessId: businesses.barwaaqoCleaning.id,
      dayOfWeek: 2,
      openTime: "08:00",
      closeTime: "18:00",
      closed: false,
    },
    {
      businessId: businesses.barwaaqoCleaning.id,
      dayOfWeek: 3,
      openTime: "08:00",
      closeTime: "18:00",
      closed: false,
    },
    {
      businessId: businesses.barwaaqoCleaning.id,
      dayOfWeek: 4,
      openTime: "08:00",
      closeTime: "18:00",
      closed: false,
    },
    {
      businessId: businesses.barwaaqoCleaning.id,
      dayOfWeek: 5,
      openTime: "08:00",
      closeTime: "18:00",
      closed: false,
    },
    {
      businessId: businesses.barwaaqoCleaning.id,
      dayOfWeek: 6,
      openTime: "09:00",
      closeTime: "15:00",
      closed: false,
    },

    // Abdi Auto Repair
    {
      businessId: businesses.abdiAutoRepair.id,
      dayOfWeek: 0,
      openTime: null,
      closeTime: null,
      closed: true,
    },
    {
      businessId: businesses.abdiAutoRepair.id,
      dayOfWeek: 1,
      openTime: "08:00",
      closeTime: "18:00",
      closed: false,
    },
    {
      businessId: businesses.abdiAutoRepair.id,
      dayOfWeek: 2,
      openTime: "08:00",
      closeTime: "18:00",
      closed: false,
    },
    {
      businessId: businesses.abdiAutoRepair.id,
      dayOfWeek: 3,
      openTime: "08:00",
      closeTime: "18:00",
      closed: false,
    },
    {
      businessId: businesses.abdiAutoRepair.id,
      dayOfWeek: 4,
      openTime: "08:00",
      closeTime: "18:00",
      closed: false,
    },
    {
      businessId: businesses.abdiAutoRepair.id,
      dayOfWeek: 5,
      openTime: "08:00",
      closeTime: "18:00",
      closed: false,
    },
    {
      businessId: businesses.abdiAutoRepair.id,
      dayOfWeek: 6,
      openTime: "09:00",
      closeTime: "15:00",
      closed: false,
    },

    // Somali Tax Services
    {
      businessId: businesses.somaliTaxServices.id,
      dayOfWeek: 0,
      openTime: null,
      closeTime: null,
      closed: true,
    },
    {
      businessId: businesses.somaliTaxServices.id,
      dayOfWeek: 1,
      openTime: "09:00",
      closeTime: "17:00",
      closed: false,
    },
    {
      businessId: businesses.somaliTaxServices.id,
      dayOfWeek: 2,
      openTime: "09:00",
      closeTime: "17:00",
      closed: false,
    },
    {
      businessId: businesses.somaliTaxServices.id,
      dayOfWeek: 3,
      openTime: "09:00",
      closeTime: "17:00",
      closed: false,
    },
    {
      businessId: businesses.somaliTaxServices.id,
      dayOfWeek: 4,
      openTime: "09:00",
      closeTime: "17:00",
      closed: false,
    },
    {
      businessId: businesses.somaliTaxServices.id,
      dayOfWeek: 5,
      openTime: "09:00",
      closeTime: "17:00",
      closed: false,
    },
    {
      businessId: businesses.somaliTaxServices.id,
      dayOfWeek: 6,
      openTime: "10:00",
      closeTime: "14:00",
      closed: false,
    },

    // Zeila Web Solutions
    {
      businessId: businesses.zeilaWebSolutions.id,
      dayOfWeek: 0,
      openTime: null,
      closeTime: null,
      closed: true,
    },
    {
      businessId: businesses.zeilaWebSolutions.id,
      dayOfWeek: 1,
      openTime: "09:00",
      closeTime: "18:00",
      closed: false,
    },
    {
      businessId: businesses.zeilaWebSolutions.id,
      dayOfWeek: 2,
      openTime: "09:00",
      closeTime: "18:00",
      closed: false,
    },
    {
      businessId: businesses.zeilaWebSolutions.id,
      dayOfWeek: 3,
      openTime: "09:00",
      closeTime: "18:00",
      closed: false,
    },
    {
      businessId: businesses.zeilaWebSolutions.id,
      dayOfWeek: 4,
      openTime: "09:00",
      closeTime: "18:00",
      closed: false,
    },
    {
      businessId: businesses.zeilaWebSolutions.id,
      dayOfWeek: 5,
      openTime: "09:00",
      closeTime: "17:00",
      closed: false,
    },
    {
      businessId: businesses.zeilaWebSolutions.id,
      dayOfWeek: 6,
      openTime: null,
      closeTime: null,
      closed: true,
    },

    // Aman Transportation
    {
      businessId: businesses.amanTransportation.id,
      dayOfWeek: 0,
      openTime: "06:00",
      closeTime: "23:00",
      closed: false,
    },
    {
      businessId: businesses.amanTransportation.id,
      dayOfWeek: 1,
      openTime: "06:00",
      closeTime: "23:00",
      closed: false,
    },
    {
      businessId: businesses.amanTransportation.id,
      dayOfWeek: 2,
      openTime: "06:00",
      closeTime: "23:00",
      closed: false,
    },
    {
      businessId: businesses.amanTransportation.id,
      dayOfWeek: 3,
      openTime: "06:00",
      closeTime: "23:00",
      closed: false,
    },
    {
      businessId: businesses.amanTransportation.id,
      dayOfWeek: 4,
      openTime: "06:00",
      closeTime: "23:00",
      closed: false,
    },
    {
      businessId: businesses.amanTransportation.id,
      dayOfWeek: 5,
      openTime: "06:00",
      closeTime: "23:59",
      closed: false,
    },
    {
      businessId: businesses.amanTransportation.id,
      dayOfWeek: 6,
      openTime: "06:00",
      closeTime: "23:59",
      closed: false,
    },

    // Nur Home Care
    {
      businessId: businesses.nurHomeCare.id,
      dayOfWeek: 0,
      openTime: "08:00",
      closeTime: "20:00",
      closed: false,
    },
    {
      businessId: businesses.nurHomeCare.id,
      dayOfWeek: 1,
      openTime: "08:00",
      closeTime: "20:00",
      closed: false,
    },
    {
      businessId: businesses.nurHomeCare.id,
      dayOfWeek: 2,
      openTime: "08:00",
      closeTime: "20:00",
      closed: false,
    },
    {
      businessId: businesses.nurHomeCare.id,
      dayOfWeek: 3,
      openTime: "08:00",
      closeTime: "20:00",
      closed: false,
    },
    {
      businessId: businesses.nurHomeCare.id,
      dayOfWeek: 4,
      openTime: "08:00",
      closeTime: "20:00",
      closed: false,
    },
    {
      businessId: businesses.nurHomeCare.id,
      dayOfWeek: 5,
      openTime: "08:00",
      closeTime: "20:00",
      closed: false,
    },
    {
      businessId: businesses.nurHomeCare.id,
      dayOfWeek: 6,
      openTime: "08:00",
      closeTime: "20:00",
      closed: false,
    },

    // Somali Translation Services
    {
      businessId: businesses.somaliTranslation.id,
      dayOfWeek: 0,
      openTime: null,
      closeTime: null,
      closed: true,
    },
    {
      businessId: businesses.somaliTranslation.id,
      dayOfWeek: 1,
      openTime: "09:00",
      closeTime: "18:00",
      closed: false,
    },
    {
      businessId: businesses.somaliTranslation.id,
      dayOfWeek: 2,
      openTime: "09:00",
      closeTime: "18:00",
      closed: false,
    },
    {
      businessId: businesses.somaliTranslation.id,
      dayOfWeek: 3,
      openTime: "09:00",
      closeTime: "18:00",
      closed: false,
    },
    {
      businessId: businesses.somaliTranslation.id,
      dayOfWeek: 4,
      openTime: "09:00",
      closeTime: "18:00",
      closed: false,
    },
    {
      businessId: businesses.somaliTranslation.id,
      dayOfWeek: 5,
      openTime: "09:00",
      closeTime: "17:00",
      closed: false,
    },
    {
      businessId: businesses.somaliTranslation.id,
      dayOfWeek: 6,
      openTime: "10:00",
      closeTime: "14:00",
      closed: false,
    },

    // Horn Moving Services
    {
      businessId: businesses.hornMoving.id,
      dayOfWeek: 0,
      openTime: "09:00",
      closeTime: "16:00",
      closed: false,
    },
    {
      businessId: businesses.hornMoving.id,
      dayOfWeek: 1,
      openTime: "07:00",
      closeTime: "19:00",
      closed: false,
    },
    {
      businessId: businesses.hornMoving.id,
      dayOfWeek: 2,
      openTime: "07:00",
      closeTime: "19:00",
      closed: false,
    },
    {
      businessId: businesses.hornMoving.id,
      dayOfWeek: 3,
      openTime: "07:00",
      closeTime: "19:00",
      closed: false,
    },
    {
      businessId: businesses.hornMoving.id,
      dayOfWeek: 4,
      openTime: "07:00",
      closeTime: "19:00",
      closed: false,
    },
    {
      businessId: businesses.hornMoving.id,
      dayOfWeek: 5,
      openTime: "07:00",
      closeTime: "19:00",
      closed: false,
    },
    {
      businessId: businesses.hornMoving.id,
      dayOfWeek: 6,
      openTime: "08:00",
      closeTime: "18:00",
      closed: false,
    },
  ];

  for (const hours of businessHours) {
    await prisma.businessHours.upsert({
      where: {
        businessId_dayOfWeek: {
          businessId: hours.businessId,
          dayOfWeek: hours.dayOfWeek,
        },
      },
      update: {
        openTime: hours.openTime,
        closeTime: hours.closeTime,
        closed: hours.closed,
      },
      create: hours,
    });
  }

  return businessHours;
}
