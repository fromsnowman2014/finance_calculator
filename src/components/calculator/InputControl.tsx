import React, { useState, useEffect } from 'react';
import { clsx } from 'clsx';

interface InputControlProps {
  label: string;
  value: number;
  onChange: (value: number) => void;
  min: number;
  max: number;
  step?: number;
  prefix?: string;
  suffix?: string;
  description?: string;
}

export const InputControl: React.FC<InputControlProps> = ({
  label,
  value,
  onChange,
  min,
  max,
  step = 1,
  prefix,
  suffix,
  description,
}) => {
  const [localValue, setLocalValue] = useState(value.toString());

  useEffect(() => {
    const numericLocal = localValue === '' ? 0 : parseFloat(localValue);
    // Only update local value if the prop value is different from the current parsed local value
    // This prevents overriding valid user input like "1." or "" with "1" or "0"
    if (numericLocal !== value) {
      setLocalValue(value.toString());
    }
    // We only want to sync when 'value' prop changes, not on every local edit
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVal = e.target.value;
    setLocalValue(newVal);

    if (newVal === '') {
      onChange(0);
    } else {
      const parsed = parseFloat(newVal);
      if (!isNaN(parsed)) {
        onChange(parsed);
      }
    }
  };

  return (
    <div className="mb-6">
      <div className="flex justify-between items-center mb-2">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-200">
          {label}
        </label>
        <div className="relative rounded-md shadow-sm">
          {prefix && (
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
              <span className="text-gray-500 dark:text-gray-400 sm:text-sm">{prefix}</span>
            </div>
          )}
          <input
            type="number"
            className={clsx(
              "block w-full rounded-md border-gray-300 py-1.5 text-gray-900 dark:text-white ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6",
              "dark:bg-gray-700 dark:border-gray-600 dark:ring-gray-600 dark:placeholder-gray-400",
              prefix && "pl-7",
              suffix && "pr-8"
            )}
            value={localValue}
            onChange={handleInputChange}
            min={min}
            max={max}
            step={step}
          />
          {suffix && (
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3">
              <span className="text-gray-500 dark:text-gray-400 sm:text-sm">{suffix}</span>
            </div>
          )}
        </div>
      </div>
      
      {description && (
        <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">{description}</p>
      )}

      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        className="w-full h-2 bg-gray-200 dark:bg-gray-600 rounded-lg appearance-none cursor-pointer accent-indigo-600"
      />
    </div>
  );
};
