
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
  const [isSelecting, setIsSelecting] = React.useState(false);
  const [rangeStart, setRangeStart] = React.useState<Date | null>(null);
  const [previewRange, setPreviewRange] = React.useState<DateRange | null>(null);

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

  const isDateInPreview = (date: Date) => {
    if (!previewRange) return false;
    return date >= previewRange.from && date <= previewRange.to;
  };

  const handleMouseDown = (date: Date) => {
    if (isWeekend(date)) return;
    
    setIsSelecting(true);
    setRangeStart(date);
    setPreviewRange({ from: date, to: date });
  };

  const handleMouseEnter = (date: Date) => {
    if (!isSelecting || !rangeStart || isWeekend(date)) return;
    
    const from = rangeStart <= date ? rangeStart : date;
    const to = rangeStart <= date ? date : rangeStart;
    
    setPreviewRange({ from, to });
  };

  const handleMouseUp = () => {
    if (!isSelecting || !rangeStart || !previewRange) return;
    
    // Add the selected range
    const newRange: DateRange = {
      from: previewRange.from,
      to: previewRange.to,
      dayType: "full",
    };
    
    onRangesChange([...selectedRanges, newRange]);
    
    // Reset selection state
    setIsSelecting(false);
    setRangeStart(null);
    setPreviewRange(null);
  };

  const handleDayClick = (date: Date) => {
    if (isWeekend(date) || isSelecting) return;

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

    // Add new single day (not a range)
    const newRange: DateRange = {
      from: date,
      to: date,
      dayType: "full",
    };
    
    onRangesChange([...selectedRanges, newRange]);
  };

  // Add global mouse up listener
  React.useEffect(() => {
    const handleGlobalMouseUp = () => {
      if (isSelecting) {
        handleMouseUp();
      }
    };

    document.addEventListener('mouseup', handleGlobalMouseUp);
    return () => document.removeEventListener('mouseup', handleGlobalMouseUp);
  }, [isSelecting, rangeStart, previewRange]);

  const clearRanges = () => {
    onRangesChange([]);
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
    const isInPreview = isDateInPreview(date);

    return (
      <button
        {...props}
        className={cn(
          buttonVariants({ variant: "ghost" }),
          "h-9 w-9 p-0 font-normal relative overflow-hidden select-none",
          isWeekendDay && "text-muted-foreground/50 bg-muted/20 cursor-not-allowed",
          !isWeekendDay && "hover:bg-muted/50",
          isSelecting && !isWeekendDay && "cursor-grabbing"
        )}
        onClick={() => handleDayClick(date)}
        onMouseDown={() => handleMouseDown(date)}
        onMouseEnter={() => handleMouseEnter(date)}
        disabled={isWeekendDay}
      >
        {/* Preview range background */}
        {isInPreview && !isSelected && (
          <div className="absolute inset-0 bg-primary/30"></div>
        )}

        {/* Background fills for different day types */}
        {rangeInfo?.dayType === "half-morning" && (
          <>
            <div className="absolute inset-0 bg-slate-800" style={{clipPath: "polygon(0 0, 100% 0, 100% 50%, 0 50%)"}}></div>
            <div className="absolute inset-0 bg-muted/20" style={{clipPath: "polygon(0 50%, 100% 50%, 100% 100%, 0 100%)"}}></div>
          </>
        )}
        {rangeInfo?.dayType === "half-afternoon" && (
          <>
            <div className="absolute inset-0 bg-muted/20" style={{clipPath: "polygon(0 0, 100% 0, 100% 50%, 0 50%)"}}></div>
            <div className="absolute inset-0 bg-slate-800" style={{clipPath: "polygon(0 50%, 100% 50%, 100% 100%, 0 100%)"}}></div>
          </>
        )}
        {rangeInfo?.dayType === "full" && (
          <div className="absolute inset-0 bg-slate-800"></div>
        )}
        
        {/* Day number */}
        <span className={cn(
          "relative z-10 font-medium",
          (isSelected || isInPreview) ? "text-white" : "text-foreground"
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
        <p>• Cliquez pour sélectionner une journée</p>
        <p>• Maintenez et glissez pour sélectionner une plage</p>
        <p>• Cliquez plusieurs fois sur un jour pour demi-journées</p>
        <p>• Les week-ends sont non sélectionnables</p>
      </div>
    </div>
  );
}
