"use client";

import * as React from "react";
import { format } from "date-fns";
import { DateRange } from "react-day-picker";

import { cn } from "@/lib/utils";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

interface DateRangePickerProps extends React.HTMLAttributes<HTMLDivElement> {
  date?: DateRange | undefined;
  onDateChange?: (date: DateRange | undefined) => void;
}

export default function DateRangePicker({
  className,
  date,
  onDateChange,
}: DateRangePickerProps) {
  const [startDate, setStartDate] = React.useState<Date | undefined>(
    date?.from
  );
  const [endDate, setEndDate] = React.useState<Date | undefined>(date?.to);

  // Update internal state when controlled date changes
  React.useEffect(() => {
    setStartDate(date?.from);
    setEndDate(date?.to);
  }, [date]);

  const handleStartDateChange = (selectedDate: Date | undefined) => {
    const newStartDate = selectedDate;
    setStartDate(newStartDate);

    // If end date is before new start date, clear end date
    if (newStartDate && endDate && newStartDate > endDate) {
      setEndDate(undefined);
      onDateChange?.({ from: newStartDate, to: undefined });
    } else {
      onDateChange?.({ from: newStartDate, to: endDate });
    }
  };

  const handleEndDateChange = (selectedDate: Date | undefined) => {
    const newEndDate = selectedDate;
    setEndDate(newEndDate);

    // Ensure end date is not before start date
    if (newEndDate && startDate && newEndDate < startDate) {
      // This shouldn't happen due to disabled prop, but handle it just in case
      return;
    }

    onDateChange?.({ from: startDate, to: newEndDate });
  };

  return (
    <div className={cn("flex flex-col sm:flex-row gap-2", className)}>
      {/* Start Date Picker */}
      <div className="flex flex-col">
        <label
          htmlFor="start-date"
          className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-1"
        >
          Start Date
        </label>
        <Popover>
          <PopoverTrigger asChild>
            <button
              id="start-date"
              className={cn(
                "btn px-2.5 min-w-[10rem] bg-white border-gray-200 hover:border-gray-300 dark:border-gray-700/60 dark:hover:border-gray-600 dark:bg-gray-800 text-gray-600 hover:text-gray-800 dark:text-gray-300 dark:hover:text-gray-100 font-medium text-left justify-start",
                !startDate && "text-muted-foreground"
              )}
            >
              <svg
                className="fill-current text-gray-400 dark:text-gray-500 ml-1 mr-2"
                width="16"
                height="16"
                viewBox="0 0 16 16"
              >
                <path d="M5 4a1 1 0 0 0 0 2h6a1 1 0 1 0 0-2H5Z"></path>
                <path d="M4 0a4 4 0 0 0-4 4v8a4 4 0 0 0 4 4h8a4 4 0 0 0 4-4V4a4 4 0 0 0-4-4H4ZM2 4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V4Z"></path>
              </svg>
              {startDate ? (
                format(startDate, "LLL dd, y")
              ) : (
                <span className="text-gray-400 dark:text-gray-500">
                  Select start date
                </span>
              )}
            </button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="single"
              selected={startDate}
              onSelect={handleStartDateChange}
              disabled={(date) => {
                // Disable dates after end date if end date is set
                if (endDate) {
                  return date > endDate;
                }
                return false;
              }}
            />
          </PopoverContent>
        </Popover>
      </div>

      {/* End Date Picker */}
      <div className="flex flex-col">
        <label
          htmlFor="end-date"
          className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-1"
        >
          End Date
        </label>
        <Popover>
          <PopoverTrigger asChild>
            <button
              id="end-date"
              className={cn(
                "btn px-2.5 min-w-[10rem] bg-white border-gray-200 hover:border-gray-300 dark:border-gray-700/60 dark:hover:border-gray-600 dark:bg-gray-800 text-gray-600 hover:text-gray-800 dark:text-gray-300 dark:hover:text-gray-100 font-medium text-left justify-start",
                !endDate && "text-muted-foreground"
              )}
            >
              <svg
                className="fill-current text-gray-400 dark:text-gray-500 ml-1 mr-2"
                width="16"
                height="16"
                viewBox="0 0 16 16"
              >
                <path d="M5 4a1 1 0 0 0 0 2h6a1 1 0 1 0 0-2H5Z"></path>
                <path d="M4 0a4 4 0 0 0-4 4v8a4 4 0 0 0 4 4h8a4 4 0 0 0 4-4V4a4 4 0 0 0-4-4H4ZM2 4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V4Z"></path>
              </svg>
              {endDate ? (
                format(endDate, "LLL dd, y")
              ) : (
                <span className="text-gray-400 dark:text-gray-500">
                  Select end date
                </span>
              )}
            </button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="single"
              selected={endDate}
              onSelect={handleEndDateChange}
              disabled={(date) => {
                // Disable dates before start date if start date is set
                if (startDate) {
                  return date < startDate;
                }
                return false;
              }}
            />
          </PopoverContent>
        </Popover>
      </div>
    </div>
  );
}
