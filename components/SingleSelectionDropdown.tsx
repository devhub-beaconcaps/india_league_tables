'use client'

import { useEffect, useRef, useState } from "react";

interface Option {
  value: string | number;
  label: string;
}

interface OptionGroup {
  label: string;
  options: Option[];
}

interface SingleSelectionDropdownProps {
  label?: string;
  options: Option[] | OptionGroup[];
  value: string | number;
  onChange: (value: string | number) => void;
  width?: string;
  menuClassName?: string;
  placeholder?: string;
}

export default function SingleSelectionDropdown({
  label,
  options,
  value,
  onChange,
  width = "w-[7rem]",
  menuClassName = "",
  placeholder = "Select",
}: SingleSelectionDropdownProps) {
  const [open, setOpen] = useState<boolean>(false);
  const [hoveredGroup, setHoveredGroup] = useState<string | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const isGrouped =
    options.length > 0 &&
    "options" in (options[0] as any);

  const flatOptions: Option[] =
    options.length > 0 && "options" in options[0]
      ? (options as OptionGroup[]).flatMap(group => group.options)
      : (options as Option[]);

  const selectedOption = flatOptions.find(opt => opt.value === value);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div ref={dropdownRef} className="w-full sm:w-auto relative">
      {label && (
        <label className="text-[10px] text-gray-400 text-center block mb-1">{label}</label>
      )}

      <div
        onClick={() => setOpen(!open)}
        className={`text-xs border border-gray-200 dark:border-gray-600 rounded-[12px] w-full sm:${width} px-3 py-1.5 bg-white dark:bg-[#1a1a2e] text-gray-700 dark:text-gray-200 cursor-pointer flex justify-between items-center`}
      >
        <span className="truncate">{selectedOption?.label ?? placeholder ?? "Select"}</span>

        <span className={`ml-2 text-gray-400 transition-transform ${open ? "rotate-180" : ""}`}>
          ▾
        </span>
      </div>

      {open && (
        <ul
          className={`absolute z-50 mt-1 w-[140px] bg-white dark:bg-[#1a1a2e] border border-gray-200 dark:border-gray-600 rounded-xl shadow-lg overflow-visible text-[11px] ${menuClassName}`}
        onMouseLeave={() => setHoveredGroup(null)}
        >
          {options.length > 0 && "options" in options[0] ? (
            (options as OptionGroup[]).map(group => (

  <div
    key={group.label}
    className="relative"
    onMouseEnter={() => setHoveredGroup(group.label)}
  >

    {/* Parent Item */}

    <div
      className="
        flex
        justify-between
        items-center
        px-4
        py-3
        cursor-pointer
        hover:bg-gray-100
        dark:hover:bg-gray-700
      "
    >
      <span>{group.label}</span>

      <svg
        width="14"
        height="14"
        viewBox="0 0 24 24"
        fill="none"
      >
        <path
          d="M9 6L15 12L9 18"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>

    </div>

    {/* Fly-out submenu */}

    {hoveredGroup === group.label && (

      <div
        className="
          absolute
          top-0
          left-full
          w-36
          bg-white
          dark:bg-[#1a1a2e]
          border
          border-gray-200
          dark:border-gray-700
          rounded-xl
          shadow-xl
          overflow-hidden
          z-[99999]
        "
      >

        {group.options.map(option => (

          <div
            key={option.value}
            onClick={() => {
              onChange(option.value);
              setOpen(false);
              setHoveredGroup(null);
            }}
            className="
              px-4
              py-3
              whitespace-nowrap
              cursor-pointer
              hover:bg-gray-100
              dark:hover:bg-gray-700
            "
          >
            {option.label}
          </div>

        ))}

      </div>

    )}

  </div>

))
          ) : (
            (options as Option[]).map(opt => (
              <li
                key={opt.value}
                onClick={() => {
                  onChange(opt.value);
                  setOpen(false);
                  setHoveredGroup(null);
                }}
                className="px-3 py-1.5 cursor-pointer text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 truncate"
                title={String(opt.label)}
              >
                {opt.label}
              </li>
            ))
          )}
        </ul>
      )}
    </div>
  );
}
