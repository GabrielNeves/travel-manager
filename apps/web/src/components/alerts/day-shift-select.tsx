import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';

const DAY_SHIFTS = [
  { value: 'MORNING', label: 'Morning', description: '5:00 - 12:00' },
  { value: 'AFTERNOON', label: 'Afternoon', description: '12:00 - 18:00' },
  { value: 'NIGHT', label: 'Night', description: '18:00 - 5:00' },
] as const;

interface DayShiftSelectProps {
  value: string[];
  onChange: (shifts: string[]) => void;
}

export function DayShiftSelect({ value, onChange }: DayShiftSelectProps) {
  const handleToggle = (shift: string, checked: boolean) => {
    if (checked) {
      onChange([...value, shift]);
    } else {
      onChange(value.filter((s) => s !== shift));
    }
  };

  return (
    <div className="flex flex-col gap-3">
      {DAY_SHIFTS.map((shift) => (
        <div key={shift.value} className="flex items-center gap-2">
          <Checkbox
            id={`shift-${shift.value}`}
            checked={value.includes(shift.value)}
            onCheckedChange={(checked) =>
              handleToggle(shift.value, checked === true)
            }
          />
          <Label
            htmlFor={`shift-${shift.value}`}
            className="flex items-center gap-2 text-sm font-normal"
          >
            {shift.label}
            <span className="text-muted-foreground text-xs">
              ({shift.description})
            </span>
          </Label>
        </div>
      ))}
    </div>
  );
}
