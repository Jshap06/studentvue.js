/**
 * hall pass settings
 */
export declare interface HallPassSetup {
  /** scheduling ahead*/
  maxDaysForFuturePass: number;
  /** show stopwatch instead of timer */
  countUp: boolean;
  /** if students are allowed to end their own passes */
  allowStudentsToEndHallPass: boolean;
}

/**
 * hall pass data

 * still gotta find out the shape of the entries in `roomTypes` and `records` - both arrays were empty in samples so it is still unknown
 * until we find out irl
 */
export declare interface HallPassData {
  studentGu: string;
  serverDateTime: string;
  setup: HallPassSetup;
  roomTypes: any[];
  records: any[];
}
