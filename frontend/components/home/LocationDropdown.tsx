"use client";

import { useEffect, useRef, useState } from "react";
import { Check, ChevronDown, MapPin, Search, X } from "lucide-react";

export interface LocationDropdownProps {
  value: string;
  onChange: (value: string) => void;
  isSomali?: boolean;
  className?: string;
}

const DEFAULT_LOCATIONS = [
  // Somalia & Horn of Africa
  "Mogadishu, Somalia",
  "Hargeisa, Somaliland",
  "Garowe, Puntland",
  "Kismayo, Jubaland",
  "Baidoa, Southwest",
  "Bosaso, Puntland",
  "Berbera, Somaliland",
  "Beledweyne, Hirshabelle",
  "Galkayo, Somalia",
  "Jigjiga, Somali Region",
  "Nairobi, Kenya",

  // North America
  "Minneapolis, MN",
  "St. Paul, MN",
  "Bloomington, MN",
  "Columbus, OH",
  "Seattle, WA",
  "San Diego, CA",
  "Toronto, ON",

  // Europe & International
  "London, UK",
  "Dubai, UAE",
  "Online / Remote",
];

export default function LocationDropdown({
  value,
  onChange,
  isSomali = false,
  className = "",
}: LocationDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [filterQuery, setFilterQuery] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const allLocationsLabel = isSomali ? "Dhammaan goobaha" : "All Locations";
  const searchPlaceholder = isSomali ? "Raadi goobta..." : "Search location...";

  // Close dropdown on click outside or Escape key
  useEffect(() => {
    const handleOutsideClick = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleOutsideClick);
      document.addEventListener("keydown", handleKeyDown);
    }

    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  // Auto-focus search input when opened
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 50);
    } else {
      setFilterQuery("");
    }
  }, [isOpen]);

  const filteredLocations = DEFAULT_LOCATIONS.filter((loc) =>
    loc.toLowerCase().includes(filterQuery.trim().toLowerCase()),
  );

  const displayLabel = value
    ? value
    : allLocationsLabel;

  const handleSelect = (locValue: string) => {
    onChange(locValue);
    setIsOpen(false);
  };

  return (
    <div ref={containerRef} className={`relative flex-1 min-w-0 ${className}`}>
      {/* TRIGGER BUTTON */}
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        aria-expanded={isOpen}
        aria-haspopup="listbox"
        aria-label={isSomali ? "Xoogo goobta" : "Select location"}
        className="
          flex
          h-[42px]
          w-full
          items-center
          justify-between
          rounded-lg
          border
          border-slate-200
          bg-white
          px-3
          text-[12px]
          font-medium
          text-slate-700
          shadow-sm
          transition
          hover:border-primary/40
          focus:border-primary
          focus:outline-none
          focus:ring-2
          focus:ring-primary/15
          dark:border-slate-700
          dark:bg-slate-950
          dark:text-slate-200
        "
      >
        <div className="flex min-w-0 items-center gap-2 truncate">
          <MapPin
            size={16}
            strokeWidth={1.8}
            className="shrink-0 text-primary"
          />
          <span className="truncate">{displayLabel}</span>
        </div>

        <ChevronDown
          size={14}
          className={`shrink-0 text-slate-400 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}
        />
      </button>

      {/* DROPDOWN POPOVER */}
      {isOpen && (
        <div
          className="
            absolute
            left-0
            top-[calc(100%+6px)]
            z-50
            w-full
            min-w-[240px]
            max-w-[320px]
            overflow-hidden
            rounded-xl
            border
            border-slate-200
            bg-white
            p-2
            shadow-[0_12px_36px_rgba(15,23,42,0.16)]
            animate-in
            fade-in-50
            slide-in-from-top-1
            dark:border-slate-800
            dark:bg-slate-900
          "
        >
          {/* SEARCH INPUT AT TOP OF DROPDOWN */}
          <div className="relative mb-2 flex items-center">
            <Search
              size={14}
              className="absolute left-3 text-slate-400 pointer-events-none"
            />
            <input
              ref={searchInputRef}
              type="text"
              value={filterQuery}
              onChange={(e) => setFilterQuery(e.target.value)}
              placeholder={searchPlaceholder}
              aria-label={searchPlaceholder}
              className="
                h-9
                w-full
                rounded-lg
                border
                border-slate-200
                bg-slate-50
                pl-8
                pr-8
                text-[12px]
                text-slate-900
                outline-none
                focus:border-primary
                focus:bg-white
                dark:border-slate-700
                dark:bg-slate-950
                dark:text-white
              "
            />
            {filterQuery && (
              <button
                type="button"
                onClick={() => setFilterQuery("")}
                className="absolute right-2.5 grid h-5 w-5 place-items-center rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                aria-label="Clear filter"
              >
                <X size={12} />
              </button>
            )}
          </div>

          {/* LIST OF OPTIONS */}
          <div className="max-h-[220px] overflow-y-auto space-y-0.5 scrollbar-thin">
            {/* ALL LOCATIONS OPTION */}
            {!filterQuery && (
              <button
                type="button"
                onClick={() => handleSelect("")}
                className={`
                  flex
                  w-full
                  items-center
                  justify-between
                  rounded-lg
                  px-3
                  py-2
                  text-left
                  text-[12px]
                  font-bold
                  transition
                  ${
                    !value
                      ? "bg-primary/10 text-primary"
                      : "text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800/70"
                  }
                `}
              >
                <span>{allLocationsLabel}</span>
                {!value && <Check size={14} className="shrink-0 text-primary" />}
              </button>
            )}

            {/* MATCHED LOCATIONS */}
            {filteredLocations.map((loc) => {
              const isSelected = value === loc;

              return (
                <button
                  key={loc}
                  type="button"
                  onClick={() => handleSelect(loc)}
                  className={`
                    flex
                    w-full
                    items-center
                    justify-between
                    rounded-lg
                    px-3
                    py-2
                    text-left
                    text-[12px]
                    font-medium
                    transition
                    ${
                      isSelected
                        ? "bg-primary/10 font-bold text-primary"
                        : "text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800/70"
                    }
                  `}
                >
                  <span className="truncate">{loc}</span>
                  {isSelected && <Check size={14} className="shrink-0 text-primary" />}
                </button>
              );
            })}

            {/* CUSTOM FILTER VALUE IF NOT IN LIST */}
            {filterQuery.trim() &&
              !DEFAULT_LOCATIONS.some(
                (loc) => loc.toLowerCase() === filterQuery.trim().toLowerCase(),
              ) && (
                <button
                  type="button"
                  onClick={() => handleSelect(filterQuery.trim())}
                  className="
                    flex
                    w-full
                    items-center
                    justify-between
                    rounded-lg
                    px-3
                    py-2
                    text-left
                    text-[12px]
                    font-bold
                    text-primary
                    hover:bg-primary/10
                  "
                >
                  <span className="truncate">
                    {isSomali ? "Isticmaal" : "Use"} “{filterQuery.trim()}”
                  </span>
                  <MapPin size={14} className="shrink-0" />
                </button>
              )}
          </div>
        </div>
      )}
    </div>
  );
}
