import * as React from "react";
import { ChevronLeft, ChevronRight, Lock, RotateCcw } from "lucide-react";
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
  const [firstClickDate, setFirstClickDate] = React.useState<Date | null>(null);

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

    // Check if this exact date exists as a single day range
    const exactSingleDayIndex = selectedRanges.findIndex(range => 
      range.from.getTime() === date.getTime() && range.to.getTime() === date.getTime()
    );

    if (exactSingleDayIndex >= 0) {
      // This is a single day range, cycle through day types
      const currentRange = selectedRanges[exactSingleDayIndex];
      const updatedRanges = [...selectedRanges];

      if (!currentRange.dayType || currentRange.dayType === "full") {
        updatedRanges[exactSingleDayIndex] = { ...currentRange, dayType: "half-morning" };
      } else if (currentRange.dayType === "half-morning") {
        updatedRanges[exactSingleDayIndex] = { ...currentRange, dayType: "half-afternoon" };
      } else if (currentRange.dayType === "half-afternoon") {
        updatedRanges.splice(exactSingleDayIndex, 1); // Remove
      }

      onRangesChange(updatedRanges);
      setFirstClickDate(null);
      return;
    }

    // Check if this date is part of a multi-day range
    const multiDayRangeIndex = selectedRanges.findIndex(range => 
      date >= range.from && date <= range.to && range.from.getTime() !== range.to.getTime()
    );

    if (multiDayRangeIndex >= 0) {
      // Remove the multi-day range and add this date as a single day
      const updatedRanges = [...selectedRanges];
      updatedRanges.splice(multiDayRangeIndex, 1);
      
      // Add the clicked date as a new single day range
      const newRange: DateRange = {
        from: date,
        to: date,
        dayType: "full",
      };
      updatedRanges.push(newRange);
      
      onRangesChange(updatedRanges);
      setFirstClickDate(null);
      return;
    }

    // If we have a first click date and this is a different date
    if (firstClickDate && firstClickDate.getTime() !== date.getTime()) {
      // If the second click is later than the first, create a range
      if (date > firstClickDate) {
        const newRange: DateRange = {
          from: firstClickDate,
          to: date,
          dayType: "full",
        };
        onRangesChange([...selectedRanges, newRange]);
        setFirstClickDate(null);
        return;
      } else {
        // If second click is earlier, reset and treat as new single day
        const newRange: DateRange = {
          from: date,
          to: date,
          dayType: "full",
        };
        onRangesChange([...selectedRanges, newRange]);
        setFirstClickDate(null);
        return;
      }
    }

    // If no first click date or same date, add as single day
    const newRange: DateRange = {
      from: date,
      to: date,
      dayType: "full",
    };
    
    onRangesChange([...selectedRanges, newRange]);
    setFirstClickDate(date); // Set for potential range creation
  };

  const clearRanges = () => {
    onRangesChange([]);
    setFirstClickDate(null);
  };

  const formatSelectedDays = () => {
    const details: string[] = [];
    
    selectedRanges.forEach(range => {
      if (range.from.getTime() === range.to.getTime()) {
        // Single day
        const dayText = format(range.from, "EEEE d MMMM", { locale: fr });
        if (range.dayType === "half-morning") {
          details.push(`${dayText} (matin)`);
        } else if (range.dayType === "half-afternoon") {
          details.push(`${dayText} (après-midi)`);
        } else {
          details.push(dayText);
        }
      } else {
        // Range of days
        const fromText = format(range.from, "d MMMM", { locale: fr });
        const toText = format(range.to, "d MMMM", { locale: fr });
        details.push(`Du ${fromText} au ${toText}`);
      }
    });
    
    return details;
  };

  const CustomDay = ({ date, ...props }: DayProps) => {
    const rangeInfo = getDateRangeInfo(date);
    const isSelected = !!rangeInfo;
    const isWeekendDay = isWeekend(date);
    const isFirstClick = firstClickDate && firstClickDate.getTime() === date.getTime();

    return (
      <button
        {...props}
        className={cn(
          buttonVariants({ variant: "ghost" }),
          "h-9 w-9 p-0 font-normal relative overflow-hidden",
          isWeekendDay && "text-muted-foreground/50 bg-muted/20 cursor-not-allowed",
          !isWeekendDay && "hover:bg-muted/50",
          isFirstClick && "ring-2 ring-primary ring-offset-1"
        )}
        onClick={() => handleDayClick(date)}
        disabled={isWeekendDay}
      >
        {/* Background fills for different day types */}
        {rangeInfo?.dayType === "half-morning" && (
          <>
            <div className="absolute inset-0 bg-slate-800 opacity-100" style={{clipPath: "polygon(0 0, 100% 0, 100% 50%, 0 50%)"}}></div>
            <div className="absolute inset-0 bg-muted/20" style={{clipPath: "polygon(0 50%, 100% 50%, 100% 100%, 0 100%)"}}></div>
          </>
        )}
        {rangeInfo?.dayType === "half-afternoon" && (
          <>
            <div className="absolute inset-0 bg-muted/20" style={{clipPath: "polygon(0 0, 100% 0, 100% 50%, 0 50%)"}}></div>
            <div className="absolute inset-0 bg-slate-800 opacity-100" style={{clipPath: "polygon(0 50%, 100% 50%, 100% 100%, 0 100%)"}}></div>
          </>
        )}
        {rangeInfo?.dayType === "full" && (
          <div className="absolute inset-0 bg-slate-800 opacity-100"></div>
        )}
        
        {/* Day number */}
        <span className={cn(
          "relative z-10 font-medium",
          isSelected ? "text-white" : "text-foreground"
        )}>
          {format(date, "d")}
        </span>
      </button>
    );
  };

  return (
    <div className={cn("space-y-4", className)}>
      {/* Clear button above calendar */}
      <div className="flex justify-center">
        <button
          onClick={clearRanges}
          className={cn(
            buttonVariants({ variant: "outline", size: "sm" }),
            "text-sm px-4 py-2"
          )}
        >
          <RotateCcw className="h-4 w-4 mr-2" />
          Effacer
        </button>
      </div>
      
      <div className="flex gap-6">
        <div className="flex-shrink-0">
          <DayPicker
            mode="single"
            month={lockedMonth}
            className={cn("p-3 pointer-events-auto")}
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
        </div>
        
        {selectedRanges.length > 0 && (
          <div className="flex-1 min-w-0">
            <h4 className="text-sm font-medium mb-3 text-muted-foreground">Jours sélectionnés</h4>
            <ul className="space-y-1 text-sm">
              {formatSelectedDays().map((day, index) => (
                <li key={index} className="flex items-start gap-2">
                  <span className="text-muted-foreground mt-1.5 block w-1 h-1 bg-muted-foreground rounded-full flex-shrink-0"></span>
                  <span className="break-words">{day}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
      
      <div className="text-xs text-muted-foreground space-y-1">
        <p>• Cliquez pour sélectionner une journée ou commencer une plage</p>
        <p>• Cliquez une seconde fois plus tard pour créer une plage</p>
        <p>• Cliquez plusieurs fois sur un jour seul pour demi-journées</p>
        <p>• Cliquez sur une plage existante pour la supprimer</p>
        <p>• Les week-ends sont non sélectionnables</p>
      </div>
    </div>
  );
}
