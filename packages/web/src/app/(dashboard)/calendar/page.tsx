import { CalendarView } from './components/CalendarView';
import { fetchHolidays, buildHolidayMap } from '@/lib/utils/holidays';
import type { HolidayMap } from '@/types/holiday';

export default async function CalendarPage() {
  // Fetch holidays for current year on server
  const currentYear = new Date().getFullYear();
  const holidays = await fetchHolidays(currentYear);
  const holidayMap: HolidayMap = buildHolidayMap(holidays);

  // Prefetch next year for smooth year navigation
  const nextYearHolidays = await fetchHolidays(currentYear + 1);
  const nextYearHolidayMap: HolidayMap = buildHolidayMap(nextYearHolidays);

  return (
    <div className="h-full flex flex-col">
      <CalendarView
        holidayMap={holidayMap}
        nextYearHolidayMap={nextYearHolidayMap}
      />
    </div>
  );
}
