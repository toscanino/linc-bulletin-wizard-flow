
import * as React from "react";
import { ChevronLeft, ChevronRight, Lock } from "lucide-react";
import { DayPicker, DayProps } from "react-day-picker";
import { cn } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

export interface DateRange {
  from: Date;
  to: Date;
  dayType?: "full" | "half-morning" | "half-afternoon";
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

  const getDateRangeInfo = (date: Date) => {
    return selectedRanges.find(range => 
      date >= range.from && date <= range.to
    );
  };

  const handleDayClick = (date: Date) => {
    if (isWeekend(date)) return;

    // Check if this is a single day that already exists
    const existingRangeIndex = selectedRanges.findIndex(range => 
      range.from.getTime() === date.getTime() && range.to.getTime() === date.getTime()
    );

    if (existingRangeIndex >= 0) {
      // Cycle through: full -> half-morning -> half-afternoon -> removed
      const currentRange = selectedRanges[existingRangeIndex];
      const updatedRanges = [...selectedRanges];

      if (!currentRange.dayType || currentRange.dayType === "full") {
        updatedRanges[existingRangeIndex] = { ...currentRange, dayType: "half-morning" };
      } else if (currentRange.dayType === "half-morning") {
        updatedRanges[existingRangeIndex] = { ...currentRange, dayType: "half-afternoon" };
      } else if (currentRange.dayType === "half-afternoon") {
        updatedRanges.splice(existingRangeIndex, 1); // Remove
      }

      onRangesChange(updatedRanges);
      return;
    }

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
        dayType: "full",
      };
      
      onRangesChange([...selectedRanges, newRange]);
      setCurrentSelection({});
      return;
    }
  };

  const clearRanges = () => {
    onRangesChange([]);
    setCurrentSelection({});
  };

  const CustomDay = ({ date, ...props }: DayProps) => {
    const rangeInfo = getDateRangeInfo(date);
    const isSelected = !!rangeInfo;
    const isWeekendDay = isWeekend(date);
    const isInCurrentSelection = currentSelection.from && 
      ((currentSelection.from <= date && !currentSelection.to) ||
       (currentSelection.from && currentSelection.to && 
        date >= new Date(Math.min(currentSelection.from.getTime(), currentSelection.to.getTime())) &&
        date <= new Date(Math.max(currentSelection.from.getTime(), currentSelection.to.getTime()))));

    return (
      <button
        {...props}
        className={cn(
          buttonVariants({ variant: "ghost" }),
          "h-9 w-9 p-0 font-normal relative",
          isWeekendDay && "text-muted-foreground/50 bg-muted/20 cursor-not-allowed",
          isSelected && !isWeekendDay && "bg-primary text-primary-foreground hover:bg-primary",
          isInCurrentSelection && !isWeekendDay && "bg-primary/50",
          rangeInfo?.dayType === "half-morning" && "bg-primary/70",
          rangeInfo?.dayType === "half-afternoon" && "bg-primary/70"
        )}
        onClick={() => handleDayClick(date)}
        disabled={isWeekendDay}
      >
        {format(date, "d")}
        {rangeInfo?.dayType === "half-morning" && (
          <div className="absolute top-1 left-1/2 transform -translate-x-1/2 w-2 h-1 bg-primary-foreground rounded-full" />
        )}
        {rangeInfo?.dayType === "half-afternoon" && (
          <div className="absolute bottom-1 left-1/2 transform -translate-x-1/2 w-2 h-1 bg-primary-foreground rounded-full" />
        )}
      </button>
    );
  };

  return (
    <div className={cn("space-y-4", className)}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Lock className="h-4 w-4 text-muted-foreground" />
          <h3 className="text-sm font-medium">
            {format(lockedMonth, "MMMM yyyy", { locale: fr })}
          </h3>
        </div>
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
        <p>• Cliquez plusieurs fois sur un jour pour demi-journées</p>
        <p>• Les week-ends sont non sélectionnables</p>
      </div>
    </div>
  );
}
