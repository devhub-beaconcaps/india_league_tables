'use client'

import { useEffect, useRef, useState } from "react";

interface Option {
  value: string | number;
  label: string;
}

interface CustomDropdownProps {
  label?: string;
  options: Option[];
  value: string | number;
  onChange: (value: string | number) => void;
  width?: string;
}

export default function CustomDropdown({
  label,
  options,
  value,
  onChange,
  width = "w-[7rem]",
}: CustomDropdownProps) {
  const [open, setOpen] = useState<boolean>(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const selectedOption = options.find((opt) => opt.value === value);

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
        <label className="text-[9px] text-gray-400 block mb-1">{label}</label>
      )}

      <div
        onClick={() => setOpen(!open)}
        className={`text-[9px] border border-gray-200 dark:border-gray-600 rounded-[12px] w-full sm:${width} px-3 py-1.5 bg-white dark:bg-[#1a1a2e] text-gray-700 dark:text-gray-200 cursor-pointer flex justify-between items-center`}
      >
        {selectedOption?.label ?? "Select"}

        <span className={`ml-2 text-gray-400 transition-transform ${open ? "rotate-180" : ""}`}>
          ▾
        </span>
      </div>

      {open && (
        <ul className={`absolute z-50 mt-1 w-full sm:${width} bg-white dark:bg-[#1a1a2e] border border-gray-200 dark:border-gray-600 rounded-[12px] shadow-lg max-h-40 overflow-y-auto text-[9px]`}>
          {options.map((opt) => (
            <li
              key={opt.value}
              onClick={() => {
                onChange(opt.value);
                setOpen(false);
              }}
              className="px-3 py-1.5 cursor-pointer text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-[8px]"
            >
              {opt.label}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}