/**
 * Format weekly timetable into a structured grid
 * Returns data suitable for calendar/timetable UI
 */
const formatWeeklyTimetable = (timetableData) => {
  const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  
  const formatted = days.map(day => ({
    day,
    classes: timetableData[day] || [],
    hasClasses: (timetableData[day] || []).length > 0,
    classCount: (timetableData[day] || []).length
  }));

  return formatted;
};

/**
 * Format daily schedule with time slots
 */
const formatDailySchedule = (classes, day) => {
  return {
    day,
    date: new Date().toISOString().split('T')[0],
    classes: classes.map(cls => ({
      ...cls,
      timeRange: `${cls.labStartTime} - ${cls.labEndTime}`,
      durationMinutes: cls.labDuration
    })),
    totalClasses: classes.length,
    totalDuration: classes.reduce((sum, cls) => sum + (cls.labDuration || 0), 0)
  };
};

/**
 * Group classes by day
 */
const groupByDay = (classes) => {
  const grouped = {};
  
  classes.forEach(cls => {
    const day = cls.labDay;
    if (!grouped[day]) {
      grouped[day] = [];
    }
    grouped[day].push(cls);
  });

  return grouped;
};

/**
 * Sort classes by time
 */
const sortByTime = (classes) => {
  return classes.sort((a, b) => {
    if (!a.labStartTime) return 1;
    if (!b.labStartTime) return -1;
    return a.labStartTime.localeCompare(b.labStartTime);
  });
};

/**
 * Get time slot label
 * Converts 24-hour time to readable format
 */
const getTimeSlotLabel = (startTime, endTime) => {
  const formatTime = (time) => {
    if (!time) return "";
    const [hours, minutes] = time.split(":");
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? "PM" : "AM";
    const displayHour = hour > 12 ? hour - 12 : (hour === 0 ? 12 : hour);
    return `${displayHour}:${minutes} ${ampm}`;
  };

  return `${formatTime(startTime)} - ${formatTime(endTime)}`;
};

/**
 * Calculate total weekly hours
 */
const calculateWeeklyHours = (timetable) => {
  let totalMinutes = 0;

  Object.values(timetable).forEach(dayClasses => {
    dayClasses.forEach(cls => {
      totalMinutes += cls.labDuration || 0;
    });
  });

  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  return {
    totalMinutes,
    hours,
    minutes,
    formatted: `${hours}h ${minutes}m`
  };
};

/**
 * Get current day's classes
 */
const getCurrentDayClasses = (timetable) => {
  const daysOfWeek = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  const today = new Date();
  const currentDay = daysOfWeek[today.getDay()];

  return {
    day: currentDay,
    classes: timetable[currentDay] || [],
    hasClasses: (timetable[currentDay] || []).length > 0
  };
};

/**
 * Get next class
 * Returns the next upcoming class based on current time
 */
const getNextClass = (timetable) => {
  const now = new Date();
  const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
  const daysOfWeek = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  const currentDay = daysOfWeek[now.getDay()];

  // Check today's classes first
  const todayClasses = timetable[currentDay] || [];
  for (const cls of todayClasses) {
    const startTime = cls.labStartTime || cls.startTime;
    if (startTime && startTime > currentTime) {
      return {
        ...cls,
        name: cls.className || cls.name,
        startTime: cls.labStartTime || cls.startTime,
        endTime: cls.labEndTime || cls.endTime,
        isToday: true,
        day: currentDay
      };
    }
  }

  // Check next 7 days
  for (let i = 1; i <= 7; i++) {
    const futureDate = new Date(now);
    futureDate.setDate(now.getDate() + i);
    const dayName = daysOfWeek[futureDate.getDay()];
    
    const dayClasses = timetable[dayName] || [];
    if (dayClasses.length > 0) {
      const firstClass = dayClasses[0];
      return {
        ...firstClass,
        name: firstClass.className || firstClass.name,
        startTime: firstClass.labStartTime || firstClass.startTime,
        endTime: firstClass.labEndTime || firstClass.endTime,
        isToday: false,
        day: dayName,
        daysUntil: i
      };
    }
  }

  return null; // No upcoming classes
};

/**
 * Format class for display
 */
const formatClassForDisplay = (classData) => {
  return {
    id: classData.classId,
    title: classData.courseName,
    subtitle: classData.courseCode,
    time: getTimeSlotLabel(classData.labStartTime, classData.labEndTime),
    duration: `${classData.labDuration} min`,
    venue: classData.venue || "TBA",
    faculty: classData.mainFaculty,
    day: classData.labDay,
    startTime: classData.labStartTime,
    endTime: classData.labEndTime
  };
};

module.exports = {
  formatWeeklyTimetable,
  formatDailySchedule,
  groupByDay,
  sortByTime,
  getTimeSlotLabel,
  calculateWeeklyHours,
  getCurrentDayClasses,
  getNextClass,
  formatClassForDisplay
};