/**
 * Maps JavaScript's Sunday=0 convention to ISO weekday where Monday=1, Sunday=7.
 * @param {number} dayin - JavaScript day number (0=Sunday, 1=Monday, ..., 6=Saturday)
 * @returns {number} ISO day number (1=Monday, ..., 7=Sunday)
 */
export function mapDay(dayin) {
    return (dayin == 0) ? 7 : dayin;
}

/**
 * Checks whether the given ISO weekday has already passed this week.
 * @param {number} dayNumber - ISO day number (1=Monday, ..., 7=Sunday)
 * @returns {boolean} true if the day has passed this week
 */
export function hasDayPassed(dayNumber) {
    let slotTime = new Date();
    if (dayNumber < mapDay(slotTime.getDay())) {
        return true;
    } else {
        return false;
    }
}

/**
 * Checks whether a slot's time has passed for the current week.
 * Computes the local slot time for the current week and compares against now.
 * @param {number} dayNumber - ISO day number (1=Monday, ..., 7=Sunday)
 * @param {number} startTime - Slot start time in milliseconds from midnight
 * @returns {boolean} true if the slot time has already passed
 */
export function hasTimePassed(dayNumber, startTime) {
    let slotTime = getSlotTimeLocal(0, startTime, dayNumber);
    if (slotTime.getTime() < Date.now()) {
        return true;
    } else {
        return false;
    }
}

/**
 * Checks whether the given ISO weekday is today.
 * @param {number} dayNumber - ISO day number (1=Monday, ..., 7=Sunday)
 * @returns {boolean} true if dayNumber matches today's weekday
 */
export function sameDay(dayNumber) {
    let slotTime = new Date();
    if (dayNumber === mapDay(slotTime.getDay())) {
        return true;
    } else {
        return false;
    }
}

/**
 * Calculates the duration in milliseconds from now until the given start time.
 * @param {number} startTime - A timestamp in milliseconds
 * @returns {number} Milliseconds remaining (negative if startTime is in the past)
 */
export function timeToMoment(startTime) {
    return startTime - Date.now();
}

/**
 * Computes the UTC slot time for a given week offset, start time, and day of week.
 * Adjusts the local slot time by the timezone offset to produce a UTC Date.
 * @param {number} weeksForward - Number of weeks ahead (0 = current week)
 * @param {number} timeOfStart - Slot start time in milliseconds from midnight
 * @param {number} dayNumber - ISO day number (1=Monday, ..., 7=Sunday)
 * @returns {Date} The slot time adjusted to UTC
 */
export function getSlotTimeUTC(weeksForward, timeOfStart, dayNumber) {
    let slotTimeUTC = getSlotTimeLocal(weeksForward, timeOfStart, dayNumber);
    slotTimeUTC.setTime(slotTimeUTC.getTime() + slotTimeUTC.getTimezoneOffset() * 60 * 1000);
    return slotTimeUTC;
}

/**
 * Computes the local slot time for a given week offset, start time, and day of week.
 * Combines the current date with the day-of-week offset, weeks forward, and start time in ms.
 * @param {number} weeksForward - Number of weeks ahead (0 = current week)
 * @param {number} timeOfStart - Slot start time in milliseconds from midnight
 * @param {number} dayNumber - ISO day number (1=Monday, ..., 7=Sunday)
 * @returns {Date} The computed local slot time
 */
export function getSlotTimeLocal(weeksForward, timeOfStart, dayNumber) {

    let slotTime = new Date();
    let dayNum = slotTime.getDay()
    dayNum = (dayNum == 0) ? 7 : dayNum;
    let daysToAdd = weeksForward * 7 + dayNumber - dayNum;

    slotTime.setHours(0);
    slotTime.setMinutes(0);
    slotTime.setSeconds(0);
    slotTime.setMilliseconds(0);
    slotTime.setTime(slotTime.getTime() + daysToAdd * 24 * 60 * 60 * 1000 + timeOfStart);

    return slotTime;
}

/**
 * Calculates the number of days remaining until the given expiry timestamp.
 * Returns 0 if the input is 0 (no expiry set).
 * @param {number} time - Expiry timestamp in milliseconds since epoch
 * @returns {number} Number of days remaining (negative if expired)
 */
export function daysRemaining(time){
    let today = new Date();
    let duration = 0;
    if(time != 0){
      duration = time - today.getTime()
      return Math.round(duration / (24*60*60*1000))
    } else {
      return 0;
    }
}

/**
 * @deprecated Use daysRemaining instead
 * @param {number} time - Expiry timestamp in milliseconds since epoch
 * @returns {number} Number of days remaining (negative if expired)
 */
export const daysLeft = daysRemaining;

/**
 * Formats a millisecond timestamp as a Finnish day string using getDayStr.
 * @param {number} ms - Timestamp in milliseconds since epoch
 * @returns {string} Finnish formatted day string (e.g., "maanantai 15.1.2024")
 */
export function getDayStrMs(ms) {
    let day = new Date();
    day.setTime(ms);
    return getDayStr(day)
}

/**
 * Converts an HHMM integer (e.g. 1430 for 14:30) to milliseconds from midnight.
 * @param {number} time - Time as HHMM integer (e.g. 930 for 09:30, 1430 for 14:30)
 * @returns {number} Equivalent time in milliseconds from midnight
 */
export function toMilliseconds(time) {
    let hours = 0;
    let minutes = 0;

    minutes = time % 100
    hours = (time - minutes) / 100

    return (hours * 3600000) + (minutes * 60000)
}

/**
 * Converts milliseconds from midnight to an HHMM integer (e.g. 14:30 → 1430).
 * @param {number} ms - Time in milliseconds from midnight
 * @returns {number} Time as HHMM integer
 */
export function msToHHMM(ms) {
    let hours = 0;
    let hoursMs = 0;
    let minutes = 0;
    let minutesMs = 0;
    minutesMs = ms % 3600000
    hoursMs = ms - minutesMs
    minutes = minutesMs / 60000
    hours = hoursMs / 3600000
    return hours * 100 + minutes
}

/**
 * @deprecated Use msToHHMM instead
 * @param {number} ms - Time in milliseconds from midnight
 * @returns {number} Time as HHMM integer
 */
export const toHplusMfromMs = msToHHMM;

/**
 * Formats a millisecond offset from midnight as an "HH:MM" time string.
 * @param {number} ms - Milliseconds from midnight
 * @returns {string} Time formatted as "HH:MM"
 */
export function getTimeStrMsBeginnignOfDay(ms) {
    let day = new Date();
    day.setHours(0);
    day.setMinutes(0);
    day.setSeconds(0);
    day.setMilliseconds(0);
    day.setTime(day.getTime() + ms);
    return getTimeStr(day);
}

/**
 * Formats a millisecond timestamp as an "HH:MM" time string.
 * @param {number} ms - Timestamp in milliseconds since epoch
 * @returns {string} Time formatted as "HH:MM"
 */
export function getTimeStrMs(ms) {
    let day = new Date();
    day.setTime(ms)
    return getTimeStr(day)
}

/**
 * Formats a Date as a Finnish day string: weekday name followed by "D.M.YYYY".
 * @param {Date} day - The date to format
 * @returns {string} Finnish formatted string (e.g., "maanantai 15.1.2024")
 */
export function getDayStr(day) {
    let month = day.getMonth() + 1
    let weekday = day.getDay();
    let weekdays = ['sunnuntai', 'maanantai', 'tiistai', 'keskiviikko', 'torstai', 'perjantai', 'lauantai']
    return weekdays[weekday] + " " + day.getDate() + "." + month + "." + day.getFullYear()
}

/**
 * Formats a Date as an "HH:MM" time string.
 * @param {Date} day - The date to extract time from
 * @returns {string} Time formatted as "HH:MM" (e.g., "14:30")
 */
export function getTimeStr(day) {
    return day.toTimeString().slice(0, 5)
}
