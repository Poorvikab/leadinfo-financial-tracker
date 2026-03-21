import React, { useState, useEffect, useRef } from 'react';
import { format, addMonths, subMonths, startOfMonth, endOfMonth, startOfWeek, endOfWeek, addDays, isSameMonth, isSameDay, isToday } from 'date-fns';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface CustomDatePickerProps {
  selectedDate: Date;
  onChange: (date: Date) => void;
}

export default function CustomDatePicker({ selectedDate, onChange }: CustomDatePickerProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const nextMonth = () => setCurrentMonth(addMonths(currentMonth, 1));
  const prevMonth = () => setCurrentMonth(subMonths(currentMonth, 1));

  const onDateClick = (day: Date) => {
    onChange(day);
    setIsOpen(false);
  };

  const renderHeader = () => {
    return (
      <div className="flex items-center justify-between mb-4 px-2">
        <button onClick={prevMonth} className="p-1 hover:bg-[var(--color-surface-highlight)] rounded-full transition-colors">
          <ChevronLeft className="h-5 w-5 text-[var(--color-text-primary)]" />
        </button>
        <div className="text-[var(--color-text-primary)] font-medium">
          {format(currentMonth, 'MMMM yyyy')}
        </div>
        <button onClick={nextMonth} className="p-1 hover:bg-[var(--color-surface-highlight)] rounded-full transition-colors">
          <ChevronRight className="h-5 w-5 text-[var(--color-text-primary)]" />
        </button>
      </div>
    );
  };

  const renderDays = () => {
    const days = [];
    const dateFormat = "EEEEE";
    const startDate = startOfWeek(currentMonth);

    for (let i = 0; i < 7; i++) {
      days.push(
        <div key={i} className="text-center text-xs font-medium text-[var(--color-text-secondary)] py-1">
          {format(addDays(startDate, i), dateFormat)}
        </div>
      );
    }
    return <div className="grid grid-cols-7 mb-2">{days}</div>;
  };

  const renderCells = () => {
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(monthStart);
    const startDate = startOfWeek(monthStart);
    const endDate = endOfWeek(monthEnd);

    const rows = [];
    let days = [];
    let day = startDate;
    let formattedDate = "";

    while (day <= endDate) {
      for (let i = 0; i < 7; i++) {
        formattedDate = format(day, "d");
        const cloneDay = day;
        
        const isSelected = isSameDay(day, selectedDate);
        const isCurrentMonth = isSameMonth(day, monthStart);

        days.push(
          <div
            key={day.toString()}
            className={cn(
              "p-2 text-center text-sm cursor-pointer rounded-md transition-all relative",
              !isCurrentMonth ? "text-[var(--color-text-secondary)] opacity-30" : "text-[var(--color-text-primary)]",
              isSelected ? "bg-[var(--color-primary)] text-black font-bold shadow-[0_0_10px_rgba(163,255,63,0.3)]" : "hover:bg-[var(--color-surface-highlight)] hover:text-[var(--color-primary)]",
              isToday(day) && !isSelected && "border border-[var(--color-primary)] text-[var(--color-primary)]"
            )}
            onClick={() => onDateClick(cloneDay)}
          >
            {formattedDate}
          </div>
        );
        day = addDays(day, 1);
      }
      rows.push(
        <div key={day.toString()} className="grid grid-cols-7 gap-1">
          {days}
        </div>
      );
      days = [];
    }
    return <div>{rows}</div>;
  };

  return (
    <div className="relative" ref={containerRef}>
      <div 
        className="flex items-center w-full px-3 py-2 border rounded-md border-[var(--color-border)] bg-[var(--color-background)] text-[var(--color-text-primary)] cursor-pointer hover:border-[var(--color-primary)] transition-colors"
        onClick={() => setIsOpen(!isOpen)}
      >
        <CalendarIcon className="mr-2 h-4 w-4 text-[var(--color-text-secondary)]" />
        <span>{format(selectedDate, 'PPP')}</span>
      </div>

      {isOpen && (
        <div className="absolute top-full left-0 mt-2 z-50 p-4 rounded-xl shadow-xl bg-[var(--color-surface)] border border-[var(--color-border)] w-[300px] animate-in fade-in zoom-in-95 duration-200">
          {renderHeader()}
          {renderDays()}
          {renderCells()}
        </div>
      )}
    </div>
  );
}
