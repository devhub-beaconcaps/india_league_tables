'use client'

import { useEffect, useRef, useState } from "react";
import { Check, X, ChevronDown } from "lucide-react";

interface Option {
  value: string | number;
  label: string;
}

interface OptionGroup {
  label: string;
  options: Option[];
}

interface CustomDropdownProps {
  label?: string;
  options: Option[] | OptionGroup[];
  value: string | string[] | number | number[];
  onChange: (value: (string | number)[]) => void;
  width?: string;
  menuClassName?: string;
  placeholder?: string;
  multiSelect?: boolean;
}

export default function CustomDropdown({
  label,
  options,
  value,
  onChange,
  width = "w-[7rem]",
  menuClassName = "",
  placeholder = "Select",
  multiSelect = true,
}: CustomDropdownProps) {
  const [open, setOpen] = useState<boolean>(false);
  const [hoveredGroup, setHoveredGroup] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState<string>("");
  const dropdownRef = useRef<HTMLDivElement>(null);

  const isGrouped =
    options.length > 0 &&
    "options" in (options[0] as any);

  const flatOptions: Option[] =
    options.length > 0 && "options" in options[0]
      ? (options as OptionGroup[]).flatMap(group => group.options)
      : (options as Option[]);

  // Normalize value to string array for consistent comparisons
  const selectedValues: string[] = Array.isArray(value)
    ? (value as (string | number)[]).map(String)
    : value
    ? [String(value)]
    : [];

  const selectedOptions = flatOptions.filter(opt => 
    selectedValues.includes(String(opt.value))
  );

  const filteredOptions = flatOptions.filter(opt =>
    opt.label.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const toggleOption = (optValue: string | number) => {
    const strValue = String(optValue);
    if (selectedValues.includes(strValue)) {
      onChange(selectedValues.filter(v => v !== strValue));
    } else {
      onChange([...selectedValues, strValue]);
    }
  };

  const clearSelection = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange([]);
  };

  const selectAll = () => {
    onChange(filteredOptions.map(opt => String(opt.value)));
  };

  const clearAll = () => {
    onChange([]);
  };

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setOpen(false);
        setSearchTerm("");
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Display text for the trigger
  const getDisplayText = () => {
    if (selectedOptions.length === 0) return placeholder;
    if (selectedOptions.length === 1) return selectedOptions[0].label;
    return `${selectedOptions.length} selected`;
  };

  return (
    <div ref={dropdownRef} className="w-full sm:w-auto relative">
      {label && (
        <label className="text-[10px] text-gray-400 text-center block mb-1">{label}</label>
      )}

      <div
        onClick={() => setOpen(!open)}
        className={`text-xs border border-gray-200 dark:border-gray-600 rounded-[12px] w-full sm:${width} px-3 py-1.5 bg-white dark:bg-[#1a1a2e] text-gray-700 dark:text-gray-200 cursor-pointer flex justify-between items-center gap-2 hover:border-gray-300 dark:hover:border-gray-500 transition-colors`}
      >
        <span className="truncate flex-1">{getDisplayText()}</span>

        <div className="flex items-center gap-1 flex-shrink-0">
          {selectedOptions.length > 0 && (
            <button
              onClick={clearSelection}
              className="p-0.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors"
            >
              <X className="w-3 h-3 text-gray-400" />
            </button>
          )}
          <ChevronDown 
            className={`w-3.5 h-3.5 text-gray-400 transition-transform duration-200 ${open ? "rotate-180" : ""}`} 
          />
        </div>
      </div>

      {open && (
        <div
          className={`absolute z-50 mt-1 bg-white dark:bg-[#1a1a2e] border border-gray-200 dark:border-gray-600 rounded-xl shadow-lg overflow-hidden text-[11px] ${menuClassName} min-w-[180px]`}
          onMouseLeave={() => setHoveredGroup(null)}
        >
          {/* Search bar */}
          {multiSelect && flatOptions.length > 5 && (
            <div className="px-3 py-2 border-b border-gray-100 dark:border-gray-800">
              <div className="relative">
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search..."
                  className="w-full px-3 py-1.5 pl-7 text-[11px] bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-700 dark:text-gray-200 placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  onClick={(e) => e.stopPropagation()}
                />
                <svg className="w-3.5 h-3.5 text-gray-400 absolute left-2 top-1/2 -translate-y-1/2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
            </div>
          )}

          {/* Select All / Clear All */}
          {multiSelect && (
            <div className="flex items-center justify-between px-3 py-1.5 border-b border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/50">
              <button
                onClick={(e) => { e.stopPropagation(); selectAll(); }}
                className="text-[10px] text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 font-medium transition-colors"
              >
                Select All
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); clearAll(); }}
                className="text-[10px] text-red-500 dark:text-red-400 hover:text-red-600 font-medium transition-colors"
              >
                Clear All
              </button>
            </div>
          )}

          {/* Options list */}
          <div className="max-h-56 overflow-y-auto">
            {filteredOptions.length === 0 ? (
              <div className="px-3 py-2 text-[11px] text-gray-400 text-center">
                No options found
              </div>
            ) : (
              filteredOptions.map(opt => (
                <div
                  key={opt.value}
                  onClick={() => {
                    if (multiSelect) {
                      toggleOption(opt.value);
                    } else {
                      onChange([String(opt.value)] as string[]);
                      setOpen(false);
                    }
                  }}
                  className="flex items-center gap-2 px-3 py-2 cursor-pointer text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                >
                  {multiSelect && (
                    <div className={`w-4 h-4 rounded border flex items-center justify-center flex-shrink-0 transition-colors ${
                      selectedValues.includes(String(opt.value))
                        ? 'bg-indigo-600 border-indigo-600'
                        : 'border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800'
                    }`}>
                      {selectedValues.includes(String(opt.value)) && (
                        <Check className="w-2.5 h-2.5 text-white" />
                      )}
                    </div>
                  )}
                  <span className="truncate">{opt.label}</span>
                </div>
              ))
            )}
          </div>

          {/* Selected count footer */}
          {multiSelect && selectedOptions.length > 0 && (
            <div className="px-3 py-1.5 border-t border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/50">
              <span className="text-[10px] text-gray-500 dark:text-gray-400">
                {selectedOptions.length} of {flatOptions.length} selected
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}