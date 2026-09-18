export type BusinessHour = {
  dayOfWeek: number;
  openTime: string | null;
  closeTime: string | null;
  closed: boolean;
};

const clockTime = (value: string): string | null => {
  const match = value.trim().match(/^(\d{1,2})(?::(\d{2}))?\s*(am|pm)?$/i);
  if (!match) return null;
  let hour = Number(match[1]);
  const minute = Number(match[2] || 0);
  if (minute > 59 || (match[3] ? hour < 1 || hour > 12 : hour > 23)) return null;
  if (match[3]) hour = hour % 12 + (match[3].toLowerCase() === "pm" ? 12 : 0);
  return `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
};

export const parseBusinessHours = (value: string): Omit<BusinessHour, "dayOfWeek"> => {
  if (/^closed$/i.test(value.trim())) return { openTime: null, closeTime: null, closed: true };
  if (/^(24\s*\/\s*7|open 24 hours|24 hours)$/i.test(value.trim())) {
    return { openTime: "00:00", closeTime: "00:00", closed: false };
  }
  const range = value.trim().split(/\s*(?:[-–—]|\bto\b)\s*/i);
  const openTime = range.length === 2 ? clockTime(range[0]) : null;
  const closeTime = range.length === 2 ? clockTime(range[1]) : null;
  return { openTime, closeTime, closed: false };
};

const formatClockTime = (time: string | null): string | null => {
  if (!time) return null;
  const match = time.trim().match(/^(\d{1,2}):(\d{2})$/);
  if (!match) return time;
  let hour = Number(match[1]);
  const minute = match[2];
  const period = hour >= 12 ? "PM" : "AM";
  hour = hour % 12 || 12;
  return `${hour}:${minute} ${period}`;
};

export const formatBusinessHours = (hour?: BusinessHour): string => {
  if (!hour) return "";
  if (hour.closed) return "Closed";
  if (!hour.closeTime) {
    if (hour.openTime) {
      const parsed = parseBusinessHours(hour.openTime);
      if (parsed.closed) return "Closed";
      if (parsed.openTime && parsed.closeTime) {
        return `${formatClockTime(parsed.openTime)} – ${formatClockTime(parsed.closeTime)}`;
      }
      return formatClockTime(hour.openTime) || hour.openTime;
    }
    return "";
  }
  if (
    hour.openTime === "00:00" &&
    (hour.closeTime === "00:00" || hour.closeTime === "24:00")
  ) {
    return "Open 24 Hours";
  }
  const formattedOpen = formatClockTime(hour.openTime);
  const formattedClose = formatClockTime(hour.closeTime);
  return `${formattedOpen} – ${formattedClose}`;
};

// Normalizes legacy and admin business hour records across all 7 days of the week.
export const normalizeBusinessHours = (hours: BusinessHour[]): BusinessHour[] => {
  if (!hours || hours.length === 0) return [];

  // Step 1: Normalize individual entries where openTime might store a full range string
  const normalizedEntries = hours.map((hour) => {
    if (!hour.closed && hour.openTime) {
      const isRangeString = /[-–—]|\bto\b/i.test(hour.openTime);
      if (isRangeString || !hour.closeTime) {
        const parsed = parseBusinessHours(hour.openTime);
        if (parsed.openTime || parsed.closed) {
          return {
            ...hour,
            openTime: parsed.openTime,
            closeTime: parsed.closeTime ?? hour.closeTime,
            closed: parsed.closed,
          };
        }
      }
    }
    return hour;
  });

  // Step 2: Ensure all 7 days of the week (0..6) are present
  const daysPresent = new Set(normalizedEntries.map((h) => h.dayOfWeek));
  if (daysPresent.size < 7) {
    const mondayEntry = normalizedEntries.find((h) => h.dayOfWeek === 1) || normalizedEntries[0];
    const saturdayEntry =
      normalizedEntries.find((h) => h.dayOfWeek === 6) ||
      normalizedEntries.find((h) => h.dayOfWeek === 0) ||
      mondayEntry;

    return Array.from({ length: 7 }, (_, dayOfWeek) => {
      const existing = normalizedEntries.find((h) => h.dayOfWeek === dayOfWeek);
      if (existing) return existing;

      const template = dayOfWeek === 0 || dayOfWeek === 6 ? saturdayEntry : mondayEntry;
      return {
        ...template,
        dayOfWeek,
      };
    });
  }

  return normalizedEntries;
};

type BusinessStatus = "OPEN" | "CLOSING_SOON" | "CLOSED" | "HOURS_UNAVAILABLE";

type BusinessStatusResult = {
  status: BusinessStatus;
  statusLabel: string;
  closesAt: string | null;
};

const parseTime = (time: string): number | null => {
  const [hours, minutes] = time.split(":").map(Number);

  if (
    !Number.isInteger(hours) ||
    !Number.isInteger(minutes) ||
    hours < 0 ||
    hours > 23 ||
    minutes < 0 ||
    minutes > 59
  ) {
    return null;
  }

  return hours * 60 + minutes;
};

const getCurrentBusinessTime = (timezone: string, now: Date) => {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: timezone,
    weekday: "short",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(now);

  const weekday = parts.find((part) => part.type === "weekday")?.value;
  const hourValue = parts.find((part) => part.type === "hour")?.value;
  const minuteValue = parts.find((part) => part.type === "minute")?.value;

  const dayMap: Record<string, number> = {
    Sun: 0,
    Mon: 1,
    Tue: 2,
    Wed: 3,
    Thu: 4,
    Fri: 5,
    Sat: 6,
  };

  if (
    !weekday ||
    hourValue === undefined ||
    minuteValue === undefined ||
    dayMap[weekday] === undefined
  ) {
    return null;
  }

  const hour = Number(hourValue);
  const minute = Number(minuteValue);

  if (!Number.isFinite(hour) || !Number.isFinite(minute)) {
    return null;
  }

  return {
    dayOfWeek: dayMap[weekday],
    currentMinutes: hour * 60 + minute,
  };
};

export const getBusinessStatus = (
  hours: BusinessHour[],
  timezone: string | null,
  now = new Date(),
): BusinessStatusResult => {
  hours = normalizeBusinessHours(hours);
  if (!timezone || hours.length === 0) {
    return {
      status: "HOURS_UNAVAILABLE",
      statusLabel: "Hours unavailable",
      closesAt: null,
    };
  }

  try {
    const currentTime = getCurrentBusinessTime(timezone, now);

    if (!currentTime) {
      return {
        status: "HOURS_UNAVAILABLE",
        statusLabel: "Hours unavailable",
        closesAt: null,
      };
    }

    const { dayOfWeek, currentMinutes } = currentTime;

    const todayHours = hours.find((hour) => hour.dayOfWeek === dayOfWeek);

    const previousDay = dayOfWeek === 0 ? 6 : dayOfWeek - 1;

    const previousDayHours = hours.find(
      (hour) => hour.dayOfWeek === previousDay,
    );

    if (
      previousDayHours &&
      !previousDayHours.closed &&
      previousDayHours.openTime &&
      previousDayHours.closeTime
    ) {
      const previousOpen = parseTime(previousDayHours.openTime);
      const previousClose = parseTime(previousDayHours.closeTime);

      if (
        previousOpen !== null &&
        previousClose !== null &&
        previousClose <= previousOpen &&
        currentMinutes < previousClose
      ) {
        const minutesUntilClosing = previousClose - currentMinutes;

        if (minutesUntilClosing <= 60) {
          return {
            status: "CLOSING_SOON",
            statusLabel: "Closing Soon",
            closesAt: previousDayHours.closeTime,
          };
        }

        return {
          status: "OPEN",
          statusLabel: "Open",
          closesAt: previousDayHours.closeTime,
        };
      }
    }

    if (
      !todayHours ||
      todayHours.closed
    ) {
      return {
        status: "CLOSED",
        statusLabel: "Closed",
        closesAt: null,
      };
    }

    const openingMinutes = parseTime(todayHours.openTime || "");
    const closingMinutes = parseTime(todayHours.closeTime || "");

    if (openingMinutes === null || closingMinutes === null) {
      return {
        status: "HOURS_UNAVAILABLE",
        statusLabel: "Hours unavailable",
        closesAt: null,
      };
    }

    const isOvernight = closingMinutes <= openingMinutes;

    if (!isOvernight) {
      if (currentMinutes < openingMinutes || currentMinutes >= closingMinutes) {
        return {
          status: "CLOSED",
          statusLabel: "Closed",
          closesAt: null,
        };
      }

      const minutesUntilClosing = closingMinutes - currentMinutes;

      if (minutesUntilClosing <= 60) {
        return {
          status: "CLOSING_SOON",
          statusLabel: "Closing Soon",
          closesAt: todayHours.closeTime,
        };
      }

      return {
        status: "OPEN",
        statusLabel: "Open",
        closesAt: todayHours.closeTime,
      };
    }

    if (currentMinutes >= openingMinutes) {
      const minutesUntilClosing = 24 * 60 - currentMinutes + closingMinutes;

      if (minutesUntilClosing <= 60) {
        return {
          status: "CLOSING_SOON",
          statusLabel: "Closing Soon",
          closesAt: todayHours.closeTime,
        };
      }

      return {
        status: "OPEN",
        statusLabel: "Open",
        closesAt: todayHours.closeTime,
      };
    }

    return {
      status: "CLOSED",
      statusLabel: "Closed",
      closesAt: null,
    };
  } catch (error) {
    console.error("Failed to calculate business status:", error);

    return {
      status: "HOURS_UNAVAILABLE",
      statusLabel: "Hours unavailable",
      closesAt: null,
    };
  }
};

