module.exports = {
    getSlotTimeLocal: (weeksForward, timeOfStart, dayNumber) => {

        const slotTime = new Date();
        let currentDay = slotTime.getDay()
        currentDay = (currentDay == 0) ? 7 : currentDay;
        const daysToAdd = weeksForward * 7 + dayNumber - currentDay;

        slotTime.setHours(0);
        slotTime.setMinutes(0);
        slotTime.setSeconds(0);
        slotTime.setMilliseconds(0);
        slotTime.setTime(slotTime.getTime() + daysToAdd * 24 * 60 * 60 * 1000 + timeOfStart);

        return slotTime;
    },
    getDayStr: (day) => {
        var month = 1+day.getMonth()
        return day.getDate() + "." + month + "." + day.getFullYear()
    },
    getTimeStr: (day) => {
        return day.toTimeString()
    },
    getUntilEndOfDayMsFromNow: (now) => {
        const nowTime = new Date();
        nowTime.setTime(now);
        nowTime.setHours(23);
        nowTime.setMinutes(59);
        nowTime.setSeconds(59);
        nowTime.setMilliseconds(999);
        return (nowTime.getTime() - now)
    },
    shiftUntilEndOfDayMs: (now) => {
        const nowTime = new Date();
        nowTime.setTime(now);
        nowTime.setHours(23);
        nowTime.setMinutes(59);
        nowTime.setSeconds(59);
        nowTime.setMilliseconds(999);
        console.log("TIME HELPER - shift time to EOD:", nowTime, (now - nowTime.getTime()));
        return nowTime.getTime()
    }

}
