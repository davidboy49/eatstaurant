export interface MenuSchedule {
    id: string;
    name: string;
    daysOfWeek: number[]; // 0=Sunday, 1=Monday, ... 6=Saturday
    startTime: string; // format: "HH:MM" 24hr, e.g. "08:00"
    endTime: string; // format: "HH:MM" 24hr, e.g. "14:00"
    menuItemIds: string[]; // IDs of menu items active during this schedule
    isActive: boolean;
}

export function getActiveMenuItems(
    allActiveItems: any[],
    schedules: MenuSchedule[],
    currentDate: Date = new Date()
) {
    const activeSchedules = schedules.filter(s => s.isActive);

    // If no schedules are created or active, fallback to showing all items
    if (activeSchedules.length === 0) return allActiveItems;

    const currentDay = currentDate.getDay();
    const currentHour = currentDate.getHours().toString().padStart(2, '0');
    const currentMinute = currentDate.getMinutes().toString().padStart(2, '0');
    const currentTimeStr = `${currentHour}:${currentMinute}`;

    // Find schedules that apply to the current day and time
    const matchingSchedules = activeSchedules.filter(s => {
        if (!s.daysOfWeek.includes(currentDay)) return false;
        if (currentTimeStr < s.startTime || currentTimeStr > s.endTime) return false;
        return true;
    });

    // If no schedules match right now, plan says fallback to all items (default behavior)
    if (matchingSchedules.length === 0) {
        return allActiveItems;
    }

    // Union of all item IDs across all currently matching schedules
    const includedItemIds = new Set<string>();
    matchingSchedules.forEach(s => {
        s.menuItemIds.forEach(id => includedItemIds.add(id));
    });

    // Filter the full list of active items down to only those in the allowed set
    return allActiveItems.filter(item => includedItemIds.has(item.id));
}
