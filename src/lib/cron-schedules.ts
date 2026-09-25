/**

 * Vercel cron schedules (UTC) mapped to IST targets.

 * @see https://vercel.com/docs/cron-jobs

 *

 * Automated emails: welcome (on login), birthday (eve 11:59 PM IST), weekly (Sat 5 PM IST).

 * No end-of-day class reminder emails.

 */

export const CRON_SCHEDULES = {

  /** 11:59 PM IST eve — birthday emails for tomorrow's birthdays */

  birthdayEveIst: "29 18 * * *",

  /** 12:00 AM IST — daily play reset */

  midnightIst: "30 18 * * *",

  /** 7:00 AM IST — morning ops + news refresh */

  newsMorningIst: "30 1 * * *",

  /** 5:00 PM IST Saturday — weekly leave report */

  weeklyLeaveIst: "30 11 * * 6",

} as const;



export const CRON_IST_LABELS = {

  birthdays: "Daily · 11:59 PM IST (eve before birthday)",

  dailyPlay: "Daily · 12:00 AM IST",

  dailyNews: "Daily · 7:00 AM IST (includes ops refresh)",

  weeklyLeave: "Saturday · 5:00 PM IST",

} as const;

