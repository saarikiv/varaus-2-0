export function mapDay(dayin) {
    return (dayin == 0) ? 7 : dayin;
}

export function hasDayPassed(dayNumber) {
    let slotTime = new Date();
    if (dayNumber < mapDay(slotTime.getDay())) {
        return true;
    } else {
        return false;
    }
}

export function hasTimePassed(dayNumber, startTime) {
    let slotTime = getSlotTimeLocal(0, startTime, dayNumber);
    if (slotTime.getTime() < Date.now()) {
        return true;
    } else {
        return false;
    }
}


export function sameDay(dayNumber) {
    let slotTime = new Date();
    if (dayNumber === mapDay(slotTime.getDay())) {
        return true;
    } else {
        return false;
    }
}

export function timeToMoment(startTime) {
    return startTime - Date.now();
}

export function getSlotTimeUTC(weeksForward, timeOfStart, dayNumber) {
    let slotTimeUTC = getSlotTimeLocal(weeksForward, timeOfStart, dayNumber);
    slotTimeUTC.setTime(slotTimeUTC.getTime() + slotTimeUTC.getTimezoneOffset() * 60 * 1000);
}

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

export function daysLeft(time){
    let today = new Date();
    let duration = 0;
    let daysLeft = 0;
    if(time != 0){
      duration = time - today.getTime()
      return Math.round(duration / (24*60*60*1000))
    } else {
      return 0;
    }
  }

export function getDayStrMs(ms) {
    let day = new Date();
    day.setTime(ms);
    return getDayStr(day)
}

export function toMilliseconds(time) {
    let hours = 0;
    let minutes = 0;

    minutes = time % 100
    hours = (time - minutes) / 100

    return (hours * 3600000) + (minutes * 60000)
}

export function toHplusMfromMs(ms) {
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

export function getTimeStrMsBeginnignOfDay(ms) {
    let day = new Date();
    day.setHours(0);
    day.setMinutes(0);
    day.setSeconds(0);
    day.setMilliseconds(0);
    day.setTime(day.getTime() + ms);
    return getTimeStr(day);
}

export function getTimeStrMs(ms) {
    let day = new Date();
    day.setTime(ms)
    return getTimeStr(day)
}

export function getDayStr(day) {
    let month = day.getMonth() + 1
    let weekday = day.getDay();
    let weekdays = ['sunnuntai', 'maanantai', 'tiistai', 'keskiviikko', 'torstai', 'perjantai', 'lauantai']
    return weekdays[weekday] + " " + day.getDate() + "." + month + "." + day.getFullYear()
}

export function getTimeStr(day) {
    return day.toTimeString().slice(0, 5)
}