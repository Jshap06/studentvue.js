/**
 * REST migration TODO - what's unconfirmed or unmigrated, and why (see each method's own
 * comments for detail):
 * - ChildList (GetChildListData): concurrent-school mapping unconfirmed - no sample from a
 *   concurrently-enrolled student.
 * - StudentInfo (GetStudentInfoData): dentist, physician, emergencyContacts, lockerInfoRecords,
 *   additionalInfo unconfirmed - sample was truncated before reaching them.
 * - schedule (StudentClassList): conClasses (concurrent school) and today (current day) both
 *   unconfirmed - no concurrent-enrollment or weekday sample yet.
 * - attendance (GetStudentAttendanceList): per-period total arrays unconfirmed - sample was
 *   truncated. dailyAttendance (twice-daily schools) unsupported entirely - different shape,
 *   needs its own type, rejects with an explicit error for now.
 * - reportCards, messages, schoolInfo, calendar: not migrated yet - no REST method name/shape
 *   confirmed, still SOAP-only via `this.soapClient`.
 * - validateCredentials: intentionally left on SOAP - relies on a SOAP-specific bogus-method
 *   error-message trick, no REST equivalent attempted.
 */
import { LoginCredentials, ParsedRequestError } from '../../utils/soap/Client/Client.interfaces';
import soap from '../../utils/soap/soap';
import rest from '../../utils/rest/rest';
import { SchoolInfo, StudentInfo } from './Client.interfaces';
import Message from '../Message/Message';
import { MessageXMLObject } from '../Message/Message.xml';
import { AssignmentEventXMLObject, CalendarXMLObject, RegularEventXMLObject } from './Interfaces/xml/Calendar';
import { AssignmentEvent, Calendar, CalendarOptions, Event, HolidayEvent, RegularEvent } from './Interfaces/Calendar';
import { eachMonthOfInterval, parse } from 'date-fns';
import { GradebookXMLObject } from './Interfaces/xml/Gradebook';
import EventType from '../../Constants/EventType';
import _, { result } from 'lodash';
import { Assignment, Gradebook, Mark, WeightedCategory } from './Interfaces/Gradebook';
import { AbsentPeriod, Attendance, PeriodInfo } from './Interfaces/Attendance';
import { SchoolInfoXMLObject } from './Interfaces/xml/SchoolInfo';
import { ReportCardsXMLObject } from '../ReportCard/ReportCard.xml';
import ReportCard from '../ReportCard/ReportCard';
import Document, { StudentDocumentDataJSON } from '../Document/Document';
import RequestException from '../RequestException/RequestException';
import XMLFactory from '../../utils/XMLFactory/XMLFactory';
import cache from '../../utils/cache/cache';
import { asyncPoolAll } from './Client.helpers';
import he from "he";
import { el, id } from 'date-fns/locale';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { parse as dateParse } from "date-fns";

/**
 * TO DO; rewrite the studentInfo stuff to primary ChildList with studentInfo as the fallback, 
 * make the type REQUIRE the info about school concurrency, thusly, the login function will determine it in the immediate by concurrenrtly performing the fetches
 * to thusly have a minimal speed impact
 * 
 * 
 * 
 * 
 * 
 * 
 * 
 * 
 * 
 * 
 * 
 * 
 * 
 * 
 * 
 * 
 * 
 * 
 * 
 * 
 * The StudentVUE Client to access the API
 * @constructor
 * @extends {soap.Client}
 */



interface xmlCache{
  [identifier:string] /*district url + username + mp */ : {data:GradebookXMLObject,age:number}
}

/**
 * The JSON gradebook format wraps camelCase keys (`courses`, `reportingPeriods`) in a
 * `traditionalGradebook` object - `processRequest` already unwraps the outer `{ data: ... }`
 * envelope, so this is what actually reaches here: `{ traditionalGradebook: { courses, ... } }`.
 */
function isGradebookJSON(obj: any): boolean {
  const gb = obj?.traditionalGradebook;
  return gb != null && typeof gb === 'object' && Array.isArray(gb.courses);
}

/**
 * The JSON child-list format wraps a `childrenList` array (one entry per child the session has
 * access to) inside a `children` object - `processRequest` already unwraps the outer
 * `{ data: ... }` envelope, so this is what actually reaches here:
 * `{ children: { allModules, childrenList: [...] } }`.
 */
function isChildListJSON(obj: any): boolean {
  const children = obj?.children;
  return children != null && typeof children === 'object' && Array.isArray(children.childrenList);
}

/**
 * Parses the JSON child-list format into the same (deliberately partial) shape the XML branch's
 * `ChildList()` fallback produces - see the comment on that branch for which `StudentInfo` fields
 * this does and doesn't fill in.
 *
 * Unconfirmed: a concurrently-enrolled student's second school was never observed in a REST
 * sample. The XML branch nests it under a single child's `ConcurrentSchools`; this guesses the
 * REST equivalent is one extra `childrenList` entry per concurrent school for the same student
 * (entries after the first), since there's no other field that obviously carries it. Revisit if
 * a concurrent-enrollment sample ever turns up.
 */
function parseChildListJSON(json: any): StudentInfo {
  const children: any[] = json.children.childrenList ?? [];
  const child = children[0] ?? {};

  const m: any = {
    student: {
      name: child.childName,
      lastName: 'not available',
      nickname: 'not available',
    },
    photo: child.photo ?? undefined,
    counselor: undefined,
    currentSchool: child.organizationName,
    id: child.childPermID ?? undefined,
    orgYearGu: child.orgYearGU ?? undefined,
    gender: 'null',
    grade: child.grade ?? undefined,
  };

  if (children.length > 1) {
    m.schools = children.slice(1).map((c: any) => ({
      name: c.organizationName,
      GU: c.orgYearGU,
    }));
  }

  return m as StudentInfo;
}

/**
 * The JSON student-info format carries the real payload in `studentInfoDetailXML` (seen with
 * `"type": "Detail"`), with a sibling `studentInfoXML` key that was `null` in the only sample
 * seen so far - `processRequest` already unwraps the outer `{ data: ... }` envelope, so this is
 * what actually reaches here: `{ studentInfoXML: null, studentInfoDetailXML: { formattedName, ... } }`.
 * Falls back to `studentInfoXML` if that's ever the populated one instead.
 */
function isStudentInfoJSON(obj: any): boolean {
  const info = obj?.studentInfoDetailXML ?? obj?.studentInfoXML;
  return info != null && typeof info === 'object';
}

/**
 * Parses the JSON student-info format into the same shape the XML branch's `studentInfo()`
 * produces.
 *
 * Unconfirmed: the only REST sample seen was truncated right after `photo`, before `dentist`,
 * `physician`, `emergencyContacts`, `lockerInfoRecords` and `userDefinedGroupBoxes` would have
 * appeared (if present at all - they may simply be absent for a student with none of those). The
 * field names/shapes below for those five are guessed by analogy with the confirmed fields'
 * camelCase convention (e.g. `permID`, `orgYearGU`, `counselorStaffGU`), not observed directly.
 * Revisit once a fuller sample turns up.
 */
function parseStudentInfoJSON(json: any): StudentInfo {
  const info: any = json.studentInfoDetailXML ?? json.studentInfoXML ?? {};

  return {
    student: {
      name: info.formattedName,
      lastName: info.lastNameGoesBy,
      nickname: info.nickName,
    },
    birthDate: dateParse(info.birthDate, 'M/dd/yyyy', new Date()),
    track: info.track ?? undefined,
    address: info.address ?? undefined,
    photo: info.photo ?? undefined,
    counselor:
      info.counselorName && info.counselorEmail && info.counselorStaffGU
        ? {
            name: info.counselorName,
            email: info.counselorEmail,
            staffGu: info.counselorStaffGU,
          }
        : undefined,
    currentSchool: info.currentSchool,
    // Unconfirmed - see function comment.
    dentist: info.dentist
      ? {
          name: info.dentist.name,
          phone: info.dentist.phone,
          extn: info.dentist.extn,
          office: info.dentist.office,
        }
      : undefined,
    // Unconfirmed - see function comment.
    physician: info.physician
      ? {
          name: info.physician.name,
          phone: info.physician.phone,
          extn: info.physician.extn,
          hospital: info.physician.hospital,
        }
      : undefined,
    id: info.permID ?? undefined,
    orgYearGu: info.orgYearGU ?? undefined,
    phone: info.phone ?? undefined,
    email: info.eMail ?? undefined,
    // Unconfirmed - see function comment.
    emergencyContacts: Array.isArray(info.emergencyContacts)
      ? info.emergencyContacts.map((contact: any) => ({
          name: contact.name,
          phone: {
            home: contact.homePhone,
            mobile: contact.mobilePhone,
            other: contact.otherPhone,
            work: contact.workPhone,
          },
          relationship: contact.relationship,
        }))
      : [],
    gender: info.gender ?? undefined,
    grade: info.grade ?? undefined,
    // Unconfirmed - see function comment.
    lockerInfoRecords: info.lockerInfoRecords ?? undefined,
    homeLanguage: info.homeLanguage ?? undefined,
    homeRoom: info.homeRoom ?? undefined,
    homeRoomTeacher: {
      email: info.homeRoomTchEMail ?? undefined,
      name: info.homeRoomTch ?? undefined,
      staffGu: info.homeRoomTchStaffGU ?? undefined,
    },
    // Unconfirmed - see function comment.
    additionalInfo: Array.isArray(info.userDefinedGroupBoxes)
      ? info.userDefinedGroupBoxes.map((box: any) => ({
          id: box.groupBoxID,
          type: box.groupBoxLabel,
          vcId: box.vcID,
          items: (box.userDefinedItems ?? []).map((item: any) => ({
            source: {
              element: item.sourceElement,
              object: item.sourceObject,
            },
            vcId: item.vcID,
            value: item.value,
            type: item.itemType,
          })),
        }))
      : [],
    //@ts-ignore You will never make me use typeScript.
  } as StudentInfo;
}

/**
 * The JSON class-list format (requested with `loadAllTerms: true`, same as the REST client
 * always sends) carries the payload in `studentClassScheduleForAllTerms`, with a sibling
 * `studentClassSchedule` key that was `null` in the only sample seen - that sibling is presumably
 * what's populated instead for a single-term (`loadAllTerms: false`) request, mirroring the old
 * SOAP shape's singular `StudentClassSchedule` wrapper, but that variant hasn't been observed
 * over REST. `processRequest` already unwraps the outer `{ data: ... }` envelope, so this is what
 * actually reaches here: `{ studentClassScheduleForAllTerms: { termLists, studentClassScheduleForTerms: [...] }, studentClassSchedule: null }`.
 */
function isStudentClassListJSON(obj: any): boolean {
  const sched = obj?.studentClassScheduleForAllTerms;
  return sched != null && typeof sched === 'object' && Array.isArray(sched.studentClassScheduleForTerms);
}

/**
 * Parses the JSON class-list format into the same shape the XML branch's `schedule()` produces
 * (`termName`, `termIndex`, `terms`, `mainClasses`, `conClasses?`, `today`).
 *
 * Unlike the old SOAP call (which fetches one term at a time via an optional `TermIndex` param),
 * the REST request always asks for every term at once (`loadAllTerms: true`) and this picks the
 * relevant one afterward - by `termIndex` if given, else whichever one the response itself
 * flags as current (`termLists`'s/the wrapper's own `termIndex`).
 *
 * IMPORTANT - concurrent-school enrollment (`conClasses`) is a real, actively-used feature (a
 * student split across two schools, e.g. a home school + a magnet/CTE program) - this is NOT a
 * rare edge case to shrug off. It just hasn't been verifiable here because no REST sample from a
 * concurrently-enrolled student has been available (every sample's
 * `concurrentSchoolStudentClassScheduleForAllTermss` was `[]`). The mapping below is a best-effort
 * guess - one entry per concurrent school, each shaped like the main schedule's own
 * `studentClassScheduleForTerms` - modeled directly on the OLD SOAP implementation this replaced
 * (see git history for this file's `schedule()` before the REST migration, or the SOAP branch
 * still further back), which read:
 *   `StudentClassSchedule[0].ConcurrentSchoolStudentClassSchedules[0]
 *     .ConcurrentSchoolStudentClassSchedule[0].ConSchClassLists[0].ClassListing`
 *   for the classes, and `...ConcurrentSchoolStudentClassSchedule[0]['@_SchoolName']` for the
 *   school name (`conClasses.conName`).
 * Treat this as unverified and get a real concurrent-enrollment REST sample to confirm/fix the
 * field names (`concurrentSchoolStudentClassScheduleForAllTermss` entry shape in particular)
 * before trusting it in production - don't let it silently bitrot into "nobody checked this
 * actually works."
 *
 * IMPORTANT - `today` (the old XML branch's `TodayScheduleInfoData`) is in the same boat, not a
 * lesser one: the sample used to build this was captured on a weekend, when there's no school
 * day and thus genuinely no "today" schedule to return - the old XML branch's own logic treats
 * that as the expected empty case too (it falls back to `today = false` when
 * `TodayScheduleInfoData[0].SchoolInfos[0]` comes back empty). So the absence of a `today` field
 * in the sample is consistent with "no data to show," not "REST dropped this feature" - the
 * actual field name/shape for a populated weekday response is still completely unknown and
 * un-guessed here (unlike `conClasses`, which at least has a guessed mapping). Revisit this whole
 * method with a weekday REST sample to find the real field and stop hardcoding `false`
 * unconditionally.
 */
function parseStudentClassListJSON(json: any, termIndex?: number | null): any {
  const sched = json.studentClassScheduleForAllTerms;
  const terms: any[] = sched.termLists ?? [];
  const termSchedules: any[] = sched.studentClassScheduleForTerms ?? [];

  const targetTermIndex = termIndex != null ? String(termIndex) : sched.termIndex;
  const currentTermSchedule =
    termSchedules.find((t: any) => t.thisTermIndex === targetTermIndex) ?? termSchedules[0] ?? {};

  const toClass = (course: any) => ({
    name: course.courseTitle,
    period: course.period,
    teacher: course.teacher,
    room: course.roomName,
  });

  const response: any = {};
  response.termName = currentTermSchedule.thisTermIndexName ?? sched.termIndexName;
  response.termIndex = currentTermSchedule.thisTermIndex ?? sched.termIndex;
  response.terms = terms.map((term: any) => ({
    start: term.beginDate,
    end: term.endDate,
    termIndex: term.termIndex,
    termName: term.termName,
  }));
  response.mainClasses = (currentTermSchedule.classLists ?? []).map(toClass);

  // IMPORTANT - unverified, not a low-priority edge case. See the big comment on this function
  // for why (concurrent enrollment is a real, used feature; no REST sample for it exists yet)
  // and the old SOAP field path this was modeled on.
  const conSchedules: any[] = sched.concurrentSchoolStudentClassScheduleForAllTermss ?? [];
  if (conSchedules.length > 0) {
    const conTermSchedules: any[] = conSchedules[0]?.studentClassScheduleForTerms ?? [];
    const conCurrent = conTermSchedules.find((t: any) => t.thisTermIndex === targetTermIndex) ?? conTermSchedules[0];
    if (conCurrent) {
      response.conClasses = (conCurrent.classLists ?? []).map(toClass);
      response.conClasses.conName = conCurrent.schoolName;
    }
  }

  // IMPORTANT - unverified, not low stakes. The sample behind this was captured on a weekend
  // (so "no today data" was the correct/expected result then), but the real field for a populated
  // weekday response is still unknown - see the big comment on this function. Needs a weekday
  // REST sample to fix properly; don't mistake this hardcoded `false` for a settled answer.
  response.today = false;

  return response;
}

/**
 * The JSON document-list format carries the payload in `studentDocuments` - `processRequest`
 * already unwraps the outer `{ data: ... }` envelope, so this is what actually reaches here:
 * `{ studentDocuments: { studentDocumentDatas: [...], documentSetupDatas, changesPending, ... } }`.
 * Confirmed against a real sample.
 */
function isStudentDocumentsJSON(obj: any): boolean {
  const docs = obj?.studentDocuments;
  return docs != null && typeof docs === 'object' && Array.isArray(docs.studentDocumentDatas);
}

/**
 * The JSON attendance format carries the payload in `periodAttendance` - `processRequest`
 * already unwraps the outer `{ data: ... }` envelope, so this is what actually reaches here:
 * `{ dailyAttendance: null, periodAttendance: { type, absences: [...], ... } }`. Confirmed
 * against a real sample (`dailyAttendance` was `null` in it, `periodAttendance` was populated).
 *
 * Deliberately does NOT treat `dailyAttendance` as an alternate/equivalent shape to fall back to.
 * A default-value schema dump found elsewhere in the bundle shows `dailyAttendance`'s totals
 * (`totalExcused`, `totalTardies`, etc.) are plain numbers, not per-period arrays, and its
 * `absences` items have no nested `periods` breakdown at all - because daily (twice-daily, AM/PM)
 * attendance has no concept of "periods" to begin with. The old SOAP `Attendance` type (and this
 * migration) is period-based end to end (`AbsentPeriod`, `PeriodInfo`), so there's no honest way
 * to force daily-attendance data into that shape - `attendance()` rejects with a clear message
 * instead of silently fabricating fake periods. Properly supporting daily attendance would need
 * a separate output type and its own parser, not a branch here.
 */
function isAttendanceJSON(obj: any): boolean {
  return obj?.periodAttendance != null && typeof obj.periodAttendance === 'object';
}

/**
 * Parses REST's `periodAttendance` into the same shape the XML branch's `attendance()` produces.
 *
 * Confirmed against a real sample: `type`, `schoolName`, `startPeriod`, `endPeriod`,
 * `periodCount`, and `absences[]` with `absenceDate`, `reason`, `note`, `codeAllDayDescription`,
 * and a `periods[]` breakdown with `number`, `name`, `reason`, `course`, `staff`, `staffEMail`,
 * `staffGU`, `orgYearGU`.
 *
 * NOT confirmed against that sample (it was truncated before reaching them, if they're even
 * present for every response): the per-period total arrays (`totalExcused`, `totalTardies`,
 * `totalUnexcused`, `totalActivities`, `totalUnexcusedTardies`), each presumably an array of
 * `{ number, total }` - one entry per period - mirroring the per-period `periods[]` items' own
 * `number` field. This is inferred from two independent sources found elsewhere in the bundle: a
 * default-value schema dump listing these exact keys on `PeriodAttendance`, and real UI code
 * reading `periodAttendance.totalTardies[i].total`. Confident these keys exist and roughly this
 * shape, but the `number` field on each entry specifically (vs. relying on array index) is a
 * guess by analogy with `periods[]`. Revisit if a fuller sample ever turns up.
 */
function parseAttendanceJSON(json: any): Attendance {
  const att: any = json.periodAttendance;
  const absences: any[] = att.absences ?? [];
  const periodCount = Number(att.periodCount ?? 0);

  const totalFor = (key: string, i: number): number => Number(att[key]?.[i]?.total ?? 0);

  return {
    type: att.type,
    period: {
      total: periodCount,
      start: Number(att.startPeriod ?? 0),
      end: Number(att.endPeriod ?? 0),
    },
    schoolName: att.schoolName,
    absences: absences.map((absence: any) => ({
      date: dateParse(absence.absenceDate, 'M/dd/yyyy', new Date()),
      reason: absence.reason,
      note: absence.note,
      description: absence.codeAllDayDescription,
      periods: (absence.periods ?? []).map(
        (period: any) =>
          ({
            period: Number(period.number),
            name: period.name,
            reason: period.reason,
            course: period.course,
            staff: {
              name: period.staff,
              staffGu: period.staffGU,
              email: period.staffEMail,
            },
            orgYearGu: period.orgYearGU,
          } as AbsentPeriod)
      ),
    })),
    periodInfos: Array.from(
      { length: periodCount },
      (_, i) =>
        ({
          period: Number(att.totalActivities?.[i]?.number ?? i),
          total: {
            excused: totalFor('totalExcused', i),
            tardies: totalFor('totalTardies', i),
            unexcused: totalFor('totalUnexcused', i),
            activities: totalFor('totalActivities', i),
            unexcusedTardies: totalFor('totalUnexcusedTardies', i),
          },
        } as PeriodInfo)
    ),
  } as Attendance;
}

/**
 * Re-escapes a value the way Synergy serializes it into an XML attribute, then trims it like
 * fast-xml-parser does. The XML branch parses with `processEntities: false`, so it always saw these
 * escapes; applying them here and then running the same transforms as the XML branch (`he.decode` or
 * nothing) gives identical output.
 */
function xmlAttr(v: any): string {
  return xmlAttrUntrimmed(v).trim();
}

/**
 * `Measure` and `MeasureDescription` are URI-encoded by XMLFactory before parsing, so their surrounding
 * whitespace survives as `%20` and is not trimmed.
 */
function xmlAttrUntrimmed(v: any): string {
  return (v == null ? "" : String(v))
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/\r/g, "&#xD;")
    .replace(/\n/g, "&#xA;")
    .replace(/\t/g, "&#x9;");
}

/**
 * Parses the JSON gradebook format into the same Gradebook shape the XML branch produces.
 * Quirks of the XML branch are reproduced on purpose so the output is identical:
 * - every string is XML-attribute-escaped and trimmed first, then decoded only where the XML branch called `he.decode`
 * - IDs are strings (the XML parser never parses attribute values)
 * - `score.value` comes from `displayScore` (falls back to `"Not Graded"` when absent) - the XML
 *   branch's `@_Score` lookup never matches (Synergy's XML has no `Score` attribute, only
 *   `DisplayScore`), so it's likely always `"Not Graded"` there too, but that's a separate,
 *   pre-existing bug in the XML branch left untouched here
 * - courses without marks get the `"none"` placeholder mark
 * - resources are always `[]`
 */
function parseGradebookJSON(json: any, reportingPeriodIndex?: number | null): Gradebook {
  const parseDate = (d: string) => dateParse(d, "M/dd/yyyy", new Date());

  json = json.traditionalGradebook;
  const periods: any[] = json.reportingPeriods ?? [];
  const current = json.reportingPeriod ?? {};

  return {
    error: xmlAttr(json.errorMessage),
    type: xmlAttr(json.type),
    reportingPeriod: {
      current: {
        index:
          reportingPeriodIndex ??
          Number(periods.find((x) => x.gradePeriod === current.gradePeriod)?.index),
        date: {
          start: parseDate(current.startDate),
          end: parseDate(current.endDate),
        },
        name: xmlAttr(current.gradePeriod),
      },
      available: periods.map((period) => ({
        date: { start: parseDate(period.startDate), end: parseDate(period.endDate) },
        name: xmlAttr(period.gradePeriod),
        index: Number(period.index),
      })),
    },
    courses: (json.courses ?? []).map((course: any) => ({
      courseID: course.courseID != null ? xmlAttr(course.courseID) : "",
      period: Number(course.period),
      title: he.decode(xmlAttr(course.title)),
      room: xmlAttr(course.room),
      staff: {
        name: xmlAttr(course.staff),
        email: xmlAttr(course.staffEMail),
        staffGu: xmlAttr(course.staffGU),
      },
      marks: course.marks?.length
        ? (course.marks.map((mark: any) => ({
            name: xmlAttr(mark.markName),
            calculatedScore: {
              string: xmlAttr(mark.calculatedScoreString),
              raw: Number(mark.calculatedScoreRaw),
            },
            weightedCategories: (mark.gradeCalculationSummary ?? []).map(
              (weighted: any) =>
                ({
                  type: he.decode(xmlAttr(weighted.type)),
                  calculatedMark: xmlAttr(weighted.calculatedMark),
                  weight: {
                    evaluated: xmlAttr(weighted.weightedPct),
                    standard: xmlAttr(weighted.weight),
                  },
                  points: {
                    current: Number(weighted.points),
                    possible: Number(weighted.pointsPossible),
                  },
                } as WeightedCategory)
            ),
            assignments: (mark.assignments ?? []).map(
              (assignment: any) =>
                ({
                  gradebookId: xmlAttr(assignment.gradebookID),
                  name: xmlAttrUntrimmed(assignment.measure),
                  type: he.decode(xmlAttr(assignment.type)),
                  date: {
                    start: parseDate(assignment.date),
                    due: parseDate(assignment.dueDate),
                  },
                  score: {
                    type: he.decode(xmlAttr(assignment.scoreType)),
                    value: assignment.displayScore != null ? he.decode(xmlAttr(assignment.displayScore)) : "Not Graded",
                  },
                  points: xmlAttr(assignment.points),
                  notes: he.decode(xmlAttr(assignment.notes)),
                  teacherId: xmlAttr(assignment.teacherID),
                  description: xmlAttrUntrimmed(assignment.measureDescription),
                  hasDropbox: Boolean(assignment.hasDropBox),
                  studentId: xmlAttr(assignment.studentID),
                  dropboxDate: {
                    start: parseDate(assignment.dropStartDate),
                    end: parseDate(assignment.dropEndDate),
                  },
                  resources: [],
                } as Assignment)
            ),
          })) as Mark[])
        : ([{ name: "none", calculatedScore: { string: "none", raw: NaN }, weightedCategories: [], assignments: [] }] as Mark[]),
    })),
  } as Gradebook;
}

export default class Client extends rest.Client {
  private hostUrl: string;
  // The legacy transport. REST (the base class, `super`) is primary now; SOAP is kept around by
  // composition only as a fallback/for the methods that haven't been moved to REST yet, since
  // their REST JSON shapes haven't been confirmed - see rest/Client/Client.ts for caveats.
  private soapClient: InstanceType<typeof soap.Client>;
  constructor(credentials: LoginCredentials, proxyUrl: string = 'native') {
    super(credentials, proxyUrl);
    this.hostUrl = new URL(credentials.districtUrl).origin + '/';
    this.soapClient = new soap.Client(credentials, proxyUrl);
  }

  /**
   * Validate's the user's credentials. It will throw an error if credentials are incorrect
   */
  public validateCredentials(): Promise<void> {
    return new Promise((res, rej) => {
      this.soapClient
        .request<ParsedRequestError>({ validateErrors: false, methodName: 'fuck'})
        .then((response) => {
          if (response.RT_ERROR[0]['@_ERROR_MESSAGE'][0].includes("A critical error has occurred")) {res();}
          else{rej(new RequestException(response))};
        })
        .catch(rej);
    });
  }

  /**
   * Gets the student's documents from synergy servers
   * @returns {Promise<Document[]>}> Returns a list of student documents
   * @description
   * ```js
   * const documents = await client.documents();
   * const document = documents[0];
   * const files = await document.get();
   * const base64collection = files.map((file) => file.base64);
   * ```
   */
  public documents(): Promise<[Document[],any]> {
    return new Promise((res, rej) => {
      super
        .processRequest<any>({
          methodName: 'GetStudentDocuments',
          paramStr: { childIntID: 0, languageCode: 'ENG' },
        })
        .then((result: any) => {
          if (!isStudentDocumentsJSON(result)) {
            return rej(new Error('Unexpected GetStudentDocuments REST response shape'));
          }
          const docs: StudentDocumentDataJSON[] = result.studentDocuments.studentDocumentDatas ?? [];
          res([
            docs.map((doc) => new Document(doc, super.credentials)),
            result.extraData,
          ]);
        })
        .catch(rej);
    });
  }

  /**
   * Gets a list of report cards
   * @returns {Promise<ReportCard[]>} Returns a list of report cards that can fetch a file
   * @description
   * ```js
   * const reportCards = await client.reportCards();
   * const files = await Promise.all(reportCards.map((card) => card.get()));
   * const base64arr = files.map((file) => file.base64); // ["JVBERi0...", "dUIoa1...", ...];
   * ```
   */
  public reportCards(): Promise<[ReportCard[],any]> {
    return new Promise((res, rej) => {
      this.soapClient
        .request<ReportCardsXMLObject>({
          methodName: 'GetReportCardInitialData',
          paramStr: { childIntId: 0 },
        })
        .then((xmlObject) => {
          res([
            xmlObject.RCReportingPeriodData[0].RCReportingPeriods[0].RCReportingPeriod.map(
              (xml) => new ReportCard(xml, super.credentials)
              //@ts-ignore
            ),xmlObject.extraData]
          );
        })
        .catch(rej);
    });
  }

  /**
   * Gets the student's school's information
   * @returns {Promise<SchoolInfo>} Returns the information of the student's school
   * @description
   * ```js
   * await client.schoolInfo();
   *
   * client.schoolInfo().then((schoolInfo) => {
   *  console.log(_.uniq(schoolInfo.staff.map((staff) => staff.name))); // List all staff positions using lodash
   * })
   * ```
   */
  public schoolInfo(): Promise<[SchoolInfo,any]> {
    return new Promise((res, rej) => {
      this.soapClient
        .request<SchoolInfoXMLObject&{extraData?:any}>({
          methodName: 'StudentSchoolInfo',
          paramStr: { childIntID: 0 },
        })
        .then((result) => {
          const xmlObject=result.StudentSchoolInfoListing[0];
          //@ts-ignore
          xmlObject.extraData=result.extraData;
          res([{
            school: {
              address: xmlObject['@_SchoolAddress'][0],
              addressAlt: xmlObject['@_SchoolAddress2'][0],
              city: xmlObject['@_SchoolCity'][0],
              zipCode: xmlObject['@_SchoolZip'][0],
              phone: xmlObject['@_Phone'][0],
              altPhone: xmlObject['@_Phone2'][0],
              principal: {
                name: xmlObject['@_Principal'][0],
                email: xmlObject['@_PrincipalEmail'][0],
                staffGu: xmlObject['@_PrincipalGu'][0],
              },
            },
            staff: xmlObject.StaffLists[0].StaffList.map((staff) => ({
              name: staff['@_Name'][0],
              email: staff['@_EMail'][0],
              staffGu: staff['@_StaffGU'][0],
              jobTitle: staff['@_Title'][0],
              extn: staff['@_Extn'][0],
              phone: staff['@_Phone'][0],
            })),
            //@ts-ignore
          },xmlObject.extraData]);
        })
        .catch(rej);
    });
  }

  /**
   * Gets the schedule of the student
   * @param {number} termIndex The index of the term.
   * @returns {Promise<[any, any]>} Returns the schedule of the student
   * @description
   * ```js
   * await schedule(0) // -> { termName: 'Semester 1', termIndex: '0', terms: [...], mainClasses: [...], today: false }
   * ```
   */
  public schedule(termIndex?: number): Promise<[any,any]> {
    return new Promise((res, rej) => {
      super
        .processRequest<any>({
          methodName: 'StudentClassList',
          paramStr: { loadAllTerms: true, childIntID: 0 },
        })
        .then((result: any) => {
          if (isStudentClassListJSON(result)) {
            return res([parseStudentClassListJSON(result, termIndex), result.extraData]);
          }
          rej(new Error('Unexpected StudentClassList REST response shape'));
        })
        .catch(rej);
    });
  }

  /**
   * Returns the attendance of the student
   * @param {string} orgYearGu The concurrent school's orgYearGU to fetch attendance for, if any
   *   (same pattern as `gradebook()`'s own `orgYearGu` param). REST requires `orgYearGU` on every
   *   call, unlike the old SOAP method - pass the student's own `orgYearGu` (from `ChildList`/
   *   `studentInfo()`) if you don't have a concurrent school to target.
   * @returns {Promise<Attendance>} Returns an Attendance object
   * @description
   * ```js
   * client.attendance()
   *  .then(console.log); // -> { type: 'Period', period: {...}, schoolName: 'University High School', absences: [...], periodInfos: [...] }
   * ```
   */
  public attendance(orgYearGu?: string | null): Promise<[Attendance,any]> {
    return new Promise((res, rej) => {
      super
        .processRequest<any>({
          methodName: 'GetStudentAttendanceList',
          paramStr: { childIntID: 0, orgYearGU: orgYearGu ?? '' },
        })
        .then((result: any) => {
          if (isAttendanceJSON(result)) {
            return res([parseAttendanceJSON(result), result.extraData]);
          }
          if (result?.dailyAttendance != null) {
            return rej(
              new Error(
                'This school uses daily (twice-daily) attendance tracking, which has a different shape ' +
                  'than periodAttendance and is not supported by this method yet - see the comment on ' +
                  'isAttendanceJSON/parseAttendanceJSON for what would be needed.'
              )
            );
          }
          rej(new Error('Unexpected GetStudentAttendanceList REST response shape'));
        })
        .catch(rej);
    });
  }

  /**
   * Returns the gradebook of the student
   * @param {number} reportingPeriodIndex The timeframe that the gradebook should return
   * @returns {Promise<Gradebook>} Returns a Gradebook object
   * @description
   * ```js
   * const gradebook = await client.gradebook();
   * console.log(gradebook); // { error: '', type: 'Traditional', reportingPeriod: {...}, courses: [...] };
   *
   * await client.gradebook(0) // Some schools will have ReportingPeriodIndex 0 as "1st Quarter Progress"
   * await client.gradebook(7) // Some schools will have ReportingPeriodIndex 7 as "4th Quarter"
   * ```
   */
 public gradebook(reportingPeriodIndex?: number|null,orgYearGu?:string|null, fresh=true): Promise<[Gradebook,any]> {
    return new Promise((res, rej) => {



      const parseBranch = (xmlObject: GradebookXMLObject | any) => {
          if (isGradebookJSON(xmlObject)) {
            return res([parseGradebookJSON(xmlObject, reportingPeriodIndex), xmlObject.extraData]);
          }
          rej(new Error('Unexpected Gradebook REST response shape'));
        }

        async function mykeysbro(){
          const m = await AsyncStorage.getAllKeys()
   //       console.log(m.toString())
          const j = await AsyncStorage.getItem("xmlCache2");
       
    //      console.log("optimus",Object.keys(JSON.parse(j ?? "{}")))
          return m.toString() 
        }
      
    
  const fetchBranch = (): Promise<GradebookXMLObject> => {
  const gradebookParams = {
    childIntId: 0,
    ...(reportingPeriodIndex != null ? { ReportPeriod: reportingPeriodIndex } : {}),
    ...(orgYearGu != null ? { ConcurrentSchOrgYearGU: orgYearGu } : {}),
  };

  return super.processRequest<GradebookXMLObject & { extraData?: any }>({
    methodName: 'Gradebook',
    paramStr: gradebookParams,
  });
};




      if(fresh||reportingPeriodIndex==null){
        console.log("Reporting Period: ",reportingPeriodIndex);mykeysbro()
        fetchBranch().then(async result=>{console.log("Fetched fresh data");
          const cachedData = await AsyncStorage.getItem("xmlCache2")
          const m = JSON.parse(cachedData ?? "{}")
          const identifier=this.district+this.username+reportingPeriodIndex+(orgYearGu ?? "")
          m[identifier]={age:Date.now(),data:result}
          await AsyncStorage.setItem("xmlCache2",JSON.stringify(m))
          parseBranch(result)}).catch(err=>rej(err))
      }
        else{
          (async () => {
            const cachedData = await AsyncStorage.getItem("xmlCache2")
            const m:xmlCache = JSON.parse(cachedData ?? "{}")
            const identifier=this.district+this.username+reportingPeriodIndex+(orgYearGu ?? "")
            if(m[identifier]){
              if(Math.abs(m[identifier].age-Date.now())>1000*60*60*24*3){ // if older than 3 days, refresh
                     
                        fetchBranch().then(async (result)=>{
                        m[identifier]={data:result,age:Date.now()}
                        await AsyncStorage.setItem("xmlCache2",JSON.stringify(m))
                        parseBranch(result)}).catch(err=>rej(err))
              }
              else{
                  parseBranch(m[identifier].data)
              }
            }else{
              fetchBranch().then(async result=>{
                const cachedData = await AsyncStorage.getItem("xmlCache2")
                const xmlCache = JSON.parse(cachedData ?? "{}")
                xmlCache[identifier]={data:result,age:Date.now()}
                await AsyncStorage.setItem("xmlCache2",JSON.stringify(xmlCache))
                parseBranch(result)
              })
            }
          })().catch(err=>rej(err))
        }
    });
  }


  /**
   * Get a list of messages of the student
   * @returns {Promise<Message[]>} Returns an array of messages of the student
   * @description
   * ```js
   * await client.messages(); // -> [{ id: 'E972F1BC-99A0-4CD0-8D15-B18968B43E08', type: 'StudentActivity', ... }, { id: '86FDA11D-42C7-4249-B003-94B15EB2C8D4', type: 'StudentActivity', ... }]
   * ```
   */
  public messages(): Promise<[Message[],any]> {
    return new Promise((res, rej) => {
      this.soapClient
        .request<MessageXMLObject>(
          {
            methodName: 'GetPXPMessages',
            paramStr: { childIntId: 0 },
          },
          (xml) => new XMLFactory(xml).encodeAttribute('Content', 'Read').toString()
        )
        .then((xmlObject) => {
          res([
            xmlObject.PXPMessagesData[0].MessageListings[0].MessageListing.map(
              (message) => new Message(message, super.credentials, this.hostUrl)
              // @ts-ignore //fucking sue me
            ),xmlObject?.extraData]
          );
        })
        .catch(rej);
    });
  }



  //altnerate method for studentInfo when studentInfo fails:
  //those things commented out are not applicable here
  public ChildList():Promise<[StudentInfo,any]>{
    return new Promise<[StudentInfo,any]>((res,rej)=>{
      super
        .processRequest<any>({ methodName: 'GetChildListData' })
        .then((result: any) => {
          if (isChildListJSON(result)) {
            return res([parseChildListJSON(result), result.extraData]);
          }
          rej(new Error('Unexpected ChildList REST response shape'));
        })
        .catch(rej);
    });
  }


  /**
   * Gets the info of a student
   * @returns {Promise<StudentInfo>} StudentInfo object
   * @description
   * ```js
   * studentInfo().then(console.log) // -> { student: { name: 'Evan Davis', nickname: '', lastName: 'Davis' }, ...}
   * ```
   */
  public studentInfo(): Promise<[StudentInfo,any]> {
    return new Promise<[StudentInfo,any]>((res, rej) => {
      super
        .processRequest<any>({ methodName: 'GetStudentInfoData' })
        .then((xmlObjectData: any) => {
          if (isStudentInfoJSON(xmlObjectData)) {
            return res([parseStudentInfoJSON(xmlObjectData), xmlObjectData.extraData]);
          }
          rej(new Error('Unexpected StudentInfo REST response shape'));
        })
        .catch(rej);
    });
  }

  private fetchEventsWithinInterval(date: Date) {
    return this.soapClient.request<CalendarXMLObject>(
      {
        methodName: 'StudentCalendar',
        paramStr: { childIntId: 0, RequestDate: date.toISOString() },
      },
      (xml) => new XMLFactory(xml).encodeAttribute('Title', 'Icon').toString()
    );
  }

  /**
   *
   * @param {CalendarOptions} options Options to provide for calendar method. An interval is required.
   * @returns {Promise<Calendar>} Returns a Calendar object
   * @description
   * ```js
   * client.calendar({ interval: { start: dateParse('5/1/2022',"M/dd/yyyy",new Date()), end: dateParse('8/1/2021',"M/dd/yyyy",new Date()) }, concurrency: null }); // -> Limitless concurrency (not recommended)
   *
   * const calendar = await client.calendar({ interval: { ... }});
   * console.log(calendar); // -> { schoolDate: {...}, outputRange: {...}, events: [...] }
   * ```
   */
  public async calendar(options: CalendarOptions = {}): Promise<Calendar> {
    const defaultOptions: CalendarOptions = {
      concurrency: 7,
      ...options,
    };
    const cal = await cache.memo(() => this.fetchEventsWithinInterval(new Date()));
    const schoolEndDate: Date | number =
      options.interval?.end ?? dateParse(cal.CalendarListing[0]['@_SchoolEndDate'][0],"M/dd/yyyy",new Date());
    const schoolStartDate: Date | number =
      options.interval?.start ?? dateParse(cal.CalendarListing[0]['@_SchoolBegDate'][0],"M/dd/yyyy",new Date());

    return new Promise((res, rej) => {
      const monthsWithinSchoolYear = eachMonthOfInterval({ start: schoolStartDate, end: schoolEndDate });
      const getAllEventsWithinSchoolYear = (): Promise<CalendarXMLObject[]> =>
        defaultOptions.concurrency == null
          ? Promise.all(monthsWithinSchoolYear.map((date: Date) => this.fetchEventsWithinInterval(date)))
          : asyncPoolAll(defaultOptions.concurrency, monthsWithinSchoolYear, (date:any) =>
              this.fetchEventsWithinInterval(date)
            );
      let memo: Calendar | null = null;
      getAllEventsWithinSchoolYear()
        .then((events) => {
          const allEvents = events.reduce((prev, events) => {
            if (memo == null)
              memo = {
                schoolDate: {
                  start: dateParse(events.CalendarListing[0]['@_SchoolBegDate'][0],"M/dd/yyyy",new Date()),
                  end: dateParse(events.CalendarListing[0]['@_SchoolEndDate'][0],"M/dd/yyyy",new Date()),
                },
                outputRange: {
                  start: schoolStartDate,
                  end: schoolEndDate,
                },
                events: [],
              };
            const rest: Calendar = {
              ...memo, // This is to prevent re-initializing Date objects in order to improve performance
              events: [
                ...(prev.events ? prev.events : []),
                ...(typeof events.CalendarListing[0].EventLists[0] !== 'string'
                  ? (events.CalendarListing[0].EventLists[0].EventList.map((event) => {
                      switch (event['@_DayType'][0]) {
                        case EventType.ASSIGNMENT: {
                          const assignmentEvent = event as AssignmentEventXMLObject;
                          return {
                            title: decodeURI(assignmentEvent['@_Title'][0]),
                            addLinkData: assignmentEvent['@_AddLinkData'][0],
                            agu: assignmentEvent['@_AGU'] ? assignmentEvent['@_AGU'][0] : undefined,
                            date: dateParse(assignmentEvent['@_Date'][0],"M/dd/yyyy",new Date()),
                            dgu: assignmentEvent['@_DGU'][0],
                            link: assignmentEvent['@_Link'][0],
                            startTime: assignmentEvent['@_StartTime'][0],
                            type: EventType.ASSIGNMENT,
                            viewType: assignmentEvent['@_ViewType'][0],
                          } as AssignmentEvent;
                        }
                        case EventType.HOLIDAY: {
                          return {
                            title: decodeURI(event['@_Title'][0]),
                            type: EventType.HOLIDAY,
                            startTime: event['@_StartTime'][0],
                            date: dateParse(event['@_Date'][0],"M/dd/yyyy",new Date()),
                          } as HolidayEvent;
                        }
                        case EventType.REGULAR: {
                          const regularEvent = event as RegularEventXMLObject;
                          return {
                            title: decodeURI(regularEvent['@_Title'][0]),
                            agu: regularEvent['@_AGU'] ? regularEvent['@_AGU'][0] : undefined,
                            date: dateParse(regularEvent['@_Date'][0],"M/dd/yyyy",new Date()),
                            description: regularEvent['@_EvtDescription']
                              ? regularEvent['@_EvtDescription'][0]
                              : undefined,
                            dgu: regularEvent['@_DGU'] ? regularEvent['@_DGU'][0] : undefined,
                            link: regularEvent['@_Link'] ? regularEvent['@_Link'][0] : undefined,
                            startTime: regularEvent['@_StartTime'][0],
                            type: EventType.REGULAR,
                            viewType: regularEvent['@_ViewType'] ? regularEvent['@_ViewType'][0] : undefined,
                            addLinkData: regularEvent['@_AddLinkData'] ? regularEvent['@_AddLinkData'][0] : undefined,
                          } as RegularEvent;
                        }
                      }
                    }) as Event[])
                  : []),
              ] as Event[],
            };

            return rest;
          }, {} as Calendar);
          res({ ...allEvents, events: _.uniqBy(allEvents.events, (item: { title: any; }) => item.title) } as Calendar);
        })
        .catch(rej);
    });
  }
}
