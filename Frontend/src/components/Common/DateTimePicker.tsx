import React, { useState, useEffect } from "react";
import { Calendar, Clock } from "lucide-react";

interface DateTimePickerProps {
  value: string; // ISO format string YYYY-MM-DDTHH:mm or similar
  onChange: (value: string) => void;
  label?: string;
  className?: string;
}

const TIME_PRESETS = [
  "08:00", "09:00", "10:00", "11:00", "12:00",
  "13:00", "14:00", "15:00", "16:00", "17:00", "18:00", "19:00", "20:00"
];

export default function DateTimePicker({
  value,
  onChange,
  label = "Data e Hora de Entrega / Levantamento",
  className = "",
}: DateTimePickerProps) {
  // Parse date and time from value or default to today + 17:00
  const parseValue = (valStr: string) => {
    let datePart = "";
    let timePart = "15:00";

    if (valStr) {
      if (valStr.includes("T")) {
        const parts = valStr.split("T");
        datePart = parts[0];
        timePart = parts[1]?.substring(0, 5) || "15:00";
      } else if (valStr.includes(" ")) {
        const parts = valStr.split(" ");
        datePart = parts[0];
        timePart = parts[1]?.substring(0, 5) || "15:00";
      } else {
        datePart = valStr;
      }
    }

    if (!datePart) {
      const today = new Date();
      const year = today.getFullYear();
      const month = String(today.getMonth() + 1).padStart(2, "0");
      const day = String(today.getDate()).padStart(2, "0");
      datePart = `${year}-${month}-${day}`;
    }

    return { datePart, timePart };
  };

  const initialParsed = parseValue(value);
  const [dateVal, setDateVal] = useState(initialParsed.datePart);
  const [timeVal, setTimeVal] = useState(initialParsed.timePart);

  useEffect(() => {
    const { datePart, timePart } = parseValue(value);
    setDateVal(datePart);
    setTimeVal(timePart);
  }, [value]);

  const updateCombinedValue = (newDate: string, newTime: string) => {
    setDateVal(newDate);
    setTimeVal(newTime);
    if (newDate) {
      onChange(`${newDate}T${newTime || "12:00"}`);
    }
  };

  return (
    <div className={`space-y-2 text-left ${className}`}>
      {label && (
        <label className="text-xs font-bold text-amber-800 dark:text-amber-300 uppercase flex items-center justify-between">
          <span className="flex items-center gap-1.5">
            <Calendar size={13} className="text-amber-600 dark:text-amber-400" />
            {label}
          </span>
          <span className="text-[10px] text-amber-600 font-semibold">Obrigatório</span>
        </label>
      )}

      {/* Inputs Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {/* Date Input */}
        <div className="relative">
          <input
            type="date"
            value={dateVal}
            onChange={(e) => updateCombinedValue(e.target.value, timeVal)}
            className="w-full bg-white dark:bg-gray-800 border border-amber-300 dark:border-amber-700 rounded-xl px-3 py-2 text-xs font-bold text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500/50"
          />
        </div>

        {/* Time Input */}
        <div className="relative flex items-center gap-1.5">
          <Clock size={14} className="text-amber-600 dark:text-amber-400 shrink-0" />
          <input
            type="time"
            value={timeVal}
            onChange={(e) => updateCombinedValue(dateVal, e.target.value)}
            className="w-full bg-white dark:bg-gray-800 border border-amber-300 dark:border-amber-700 rounded-xl px-3 py-2 text-xs font-bold text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500/50"
          />
        </div>
      </div>

      {/* Time Preset Quick Buttons */}
      <div className="pt-1">
        <span className="text-[10px] font-bold text-amber-700/80 dark:text-amber-400/80 block mb-1">
          Horários Rápidos:
        </span>
        <div className="flex flex-wrap gap-1 max-h-16 overflow-y-auto">
          {TIME_PRESETS.map((t) => {
            const isSelected = timeVal === t;
            return (
              <button
                key={t}
                type="button"
                onClick={() => updateCombinedValue(dateVal, t)}
                className={`px-2 py-0.5 rounded-lg text-[10px] font-extrabold transition-all ${
                  isSelected
                    ? "bg-amber-600 text-white shadow-sm"
                    : "bg-white dark:bg-gray-800 text-amber-900 dark:text-amber-200 border border-amber-200 dark:border-amber-800 hover:bg-amber-100"
                }`}
              >
                {t}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
