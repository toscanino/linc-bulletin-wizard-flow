
import * as React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { DayPicker, DayProps } from "react-day-picker";
import { cn } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

export interface DateRange {
  from: Date;
  to: Date;
  isHalfDay?: boolean;
}

export interface MultiRangeCalendarProps {
  selectedRanges: DateRange[];
  onRangesChange: (ranges: DateRange[]) => void;
  lockedMonth: Date;
  className?: string;
}

export function MultiRangeCalendar({
  selectedRanges,
  onRangesChange,
  lockedMonth,
  className,
}: MultiRangeCalendarProps) {
  const [currentSelection, setCurrentSelection] = React.useState<{
    from?: Date;
    to?: Date;
  }>({});

  const isWeekend = (date: Date) => {
    const day = date.getDay();
    return day === 0 || day === 6; // Sunday or Saturday
  };

  const isDateInRanges = (date: Date) => {
    return selectedRanges.some(range => 
      date >= range.from && date <= range.to
    );
  };

  const isDateHalfDay = (date: Date) => {
    return selectedRanges.some(range => 
      date >= range.from && date <= range.to && range.isHalfDay
    );
  };

  const handleDayClick = (date: Date) => {
    if (isWeekend(date)) return;

    // If we're starting a new selection
    if (!currentSelection.from) {
      setCurrentSelection({ from: date });
      return;
    }

    // If we're completing a selection
    if (currentSelection.from && !currentSelection.to) {
      const newRange: DateRange = {
        from: currentSelection.from <= date ? currentSelection.from : date,
        to: currentSelection.from <= date ? date : currentSelection.from,
      };
      
      onRangesChange([...selectedRanges, newRange]);
      setCurrentSelection({});
      return;
    }
  };

  const handleDoubleClick = (date: Date) => {
    if (isWeekend(date)) return;

    // Toggle half-day for single date
    const existingRangeIndex = selectedRanges.findIndex(range => 
      range.from.getTime() === date.getTime() && range.to.getTime() === date.getTime()
    );

    if (existingRangeIndex >= 0) {
      const updatedRanges = [...selectedRanges];
      updatedRanges[existingRangeIndex] = {
        ...updatedRanges[existingRangeIndex],
        isHalfDay: !updatedRanges[existingRangeIndex].isHalfDay
      };
      onRangesChange(updatedRanges);
    } else {
      // Create new half-day range
      const newRange: DateRange = {
        from: date,
        to: date,
        isHalfDay: true,
      };
      onRangesChange([...selectedRanges, newRange]);
    }
  };

  const clearRanges = () => {
    onRangesChange([]);
    setCurrentSelection({});
  };

  const CustomDay = ({ date, ...props }: DayProps) => {
    const isSelected = isDateInRanges(date);
    const isHalfDay = isDateHalfDay(date);
    const isWeekendDay = isWeekend(date);
    const isInCurrentSelection = currentSelection.from && 
      ((currentSelection.from <= date && !currentSelection.to) ||
       (currentSelection.from && currentSelection.to && 
        date >= Math.min(currentSelection.from.getTime(), currentSelection.to.getTime()) &&
        date <= Math.max(currentSelection.from.getTime(), currentSelection.to.getTime())));

    return (
      <button
        {...props}
        className={cn(
          buttonVariants({ variant: "ghost" }),
          "h-9 w-9 p-0 font-normal relative",
          isWeekendDay && "text-muted-foreground/50 bg-muted/20 cursor-not-allowed",
          isSelected && !isWeekendDay && "bg-primary text-primary-foreground hover:bg-primary",
          isInCurrentSelection && !isWeekendDay && "bg-primary/50",
          isHalfDay && "bg-primary/70"
        )}
        onClick={() => handleDayClick(date)}
        onDoubleClick={() => handleDoubleClick(date)}
        disabled={isWeekendDay}
      >
        {format(date, "d")}
        {isHalfDay && (
          <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-1 h-1 bg-primary-foreground rounded-full" />
        )}
      </button>
    );
  };

  return (
    <div className={cn("space-y-4", className)}>
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium">
          {format(lockedMonth, "MMMM yyyy", { locale: fr })}
        </h3>
        <button
          onClick={clearRanges}
          className="text-xs text-muted-foreground hover:text-foreground"
        >
          Effacer
        </button>
      </div>
      
      <DayPicker
        mode="single"
        month={lockedMonth}
        className={cn("p-3 pointer-events-auto", className)}
        classNames={{
          months: "flex flex-col sm:flex-row space-y-4 sm:space-x-4 sm:space-y-0",
          month: "space-y-4",
          caption: "flex justify-center pt-1 relative items-center",
          caption_label: "text-sm font-medium",
          nav: "space-x-1 flex items-center opacity-50 pointer-events-none",
          nav_button: cn(
            buttonVariants({ variant: "outline" }),
            "h-7 w-7 bg-transparent p-0 opacity-50"
          ),
          nav_button_previous: "absolute left-1",
          nav_button_next: "absolute right-1",
          table: "w-full border-collapse space-y-1",
          head_row: "flex",
          head_cell: "text-muted-foreground rounded-md w-9 font-normal text-[0.8rem]",
          row: "flex w-full mt-2",
          cell: "h-9 w-9 text-center text-sm p-0 relative",
          day: "h-9 w-9 p-0 font-normal",
          day_hidden: "invisible",
        }}
        components={{
          IconLeft: ({ ...props }) => <ChevronLeft className="h-4 w-4" {...props} />,
          IconRight: ({ ...props }) => <ChevronRight className="h-4 w-4" {...props} />,
          Day: CustomDay,
        }}
        disabled={[
          { before: new Date(lockedMonth.getFullYear(), lockedMonth.getMonth(), 1) },
          { after: new Date(lockedMonth.getFullYear(), lockedMonth.getMonth() + 1, 0) }
        ]}
        showOutsideDays={false}
      />
      
      <div className="text-xs text-muted-foreground space-y-1">
        <p>• Cliquez pour sélectionner une période</p>
        <p>• Double-cliquez pour une demi-journée</p>
        <p>• Les week-ends sont non sélectionnables</p>
      </div>
    </div>
  );
}
