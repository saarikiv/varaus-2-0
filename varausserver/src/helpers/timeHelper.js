var JHLP = {}

module.exports = {
    getSlotTimeLocal: (weeksForward, timeOfStart, dayNumber) => {

        JHLP.slotTime = new Date();
        JHLP.dayNumber = JHLP.slotTime.getDay()
        JHLP.dayNumber = (JHLP.dayNumber == 0) ? 7 : JHLP.dayNumber;
        JHLP.daysToAdd = weeksForward * 7 + dayNumber - JHLP.dayNumber;

        JHLP.slotTime.setHours(0);
        JHLP.slotTime.setMinutes(0);
        JHLP.slotTime.setSeconds(0);
        JHLP.slotTime.setMilliseconds(0);
        JHLP.slotTime.setTime(JHLP.slotTime.getTime() + JHLP.daysToAdd * 24 * 60 * 60 * 1000 + timeOfStart);

        return JHLP.slotTime;
    },
    getDayStr: (day) => {
        var month = 1+day.getMonth()
        return day.getDate() + "." + month + "." + day.getFullYear()
    },
    getTimeStr: (day) => {
        return day.toTimeString()
    },
    getUntilEndOfDayMsFromNow: (now) => {
        JHLP.nowTime = new Date();
        JHLP.nowTime.setTime(now);
        JHLP.nowTime.setHours(23);
        JHLP.nowTime.setMinutes(59);
        JHLP.nowTime.setSeconds(59);
        JHLP.nowTime.setMilliseconds(999);
        return (JHLP.nowTime.getTime() - now)
    },
    shiftUntilEndOfDayMs: (now) => {
        JHLP.nowTime = new Date();
        JHLP.nowTime.setTime(now);
        JHLP.nowTime.setHours(23);
        JHLP.nowTime.setMinutes(59);
        JHLP.nowTime.setSeconds(59);
        JHLP.nowTime.setMilliseconds(999);
        console.log("TIME HELPER - shift time to EOD:", JHLP.nowTime, (now - JHLP.nowTime.getTime()));
        return JHLP.nowTime.getTime()
    }

}