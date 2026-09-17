"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

type DeviceCoordinates = {
  latitude: number;
  longitude: number;
};

type LocationStatus = "idle" | "requesting" | "granted" | "denied" | "unavailable";

type DeviceLocationContextValue = {
  coordinates: DeviceCoordinates | null;
  status: LocationStatus;
  requestLocation: () => void;
};

const STORAGE_KEY = "zeilalink-device-location";

const DeviceLocationContext = createContext<DeviceLocationContextValue | null>(null);

export function DeviceLocationProvider({ children }: { children: ReactNode }) {
  const [coordinates, setCoordinates] = useState<DeviceCoordinates | null>(null);
  const [status, setStatus] = useState<LocationStatus>("idle");

  const requestLocation = useCallback(() => {
    if (!navigator.geolocation) {
      setStatus("unavailable");
      return;
    }

    setStatus("requesting");
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        const nextCoordinates = {
          latitude: coords.latitude,
          longitude: coords.longitude,
        };
        setCoordinates(nextCoordinates);
        setStatus("granted");
        try {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(nextCoordinates));
        } catch {
          // Location still remains available for the current page session.
        }
      },
      (error) => {
        setStatus(error.code === error.PERMISSION_DENIED ? "denied" : "unavailable");
      },
      { enableHighAccuracy: true, timeout: 12000, maximumAge: 300000 },
    );
  }, []);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as Partial<DeviceCoordinates>;
        if (typeof parsed.latitude === "number" && typeof parsed.longitude === "number") {
          setCoordinates({ latitude: parsed.latitude, longitude: parsed.longitude });
        }
      }
    } catch {
      // Ignore invalid or unavailable browser storage.
    }

    requestLocation();
  }, [requestLocation]);

  const value = useMemo(
    () => ({ coordinates, status, requestLocation }),
    [coordinates, status, requestLocation],
  );

  return (
    <DeviceLocationContext.Provider value={value}>
      {children}
    </DeviceLocationContext.Provider>
  );
}

export function useDeviceLocation() {
  const context = useContext(DeviceLocationContext);
  if (!context) {
    throw new Error("useDeviceLocation must be used inside DeviceLocationProvider");
  }
  return context;
}
