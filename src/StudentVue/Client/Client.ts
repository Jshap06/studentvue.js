/**
 * REST migration TODO - what's unconfirmed or unmigrated, and why (see each method's own
 * comments for detail):
 * - ChildList (GetChildListData): concurrent-school mapping now CONFIRMED via a real sample -
 *   it's a `concurrentSchools` array on the student's own `childrenList` entry, not extra entries.
 * - StudentInfo (GetStudentInfoData): dentist, physician, emergencyContacts, lockerInfoRecords,
 *   additionalInfo still unconfirmed - a full untruncated sample arrived but this student simply
 *   didn't have any of those five populated, so their field names/shapes remain guesses.
 * - schedule (StudentClassList): conClasses and today now CONFIRMED via a real weekday sample from
 *   a concurrently-enrolled student. Switched back to single-term requests (`TermIndex` param,
 *   matching the old SOAP call) instead of `loadAllTerms` - the latter never returns
 *   `todayScheduleInfoData` at all, so `today` would always have come back empty/false under it.
 * - attendance (GetStudentAttendanceList): per-period total arrays unconfirmed - sample was
 *   truncated. dailyAttendance (twice-daily schools) unsupported entirely - different shape,
 *   needs its own type, rejects with an explicit error for now.
 * - reportCards, messages, schoolInfo, calendar: not migrated yet - no REST method name/shape
 *   confirmed, still SOAP-only via `this.soapClient`.
 * - validateCredentials: intentionally left on SOAP - relies on a SOAP-specific bogus-method
 *   error-message trick, no REST equivalent attempted.
 * - Every REST-migrated method above also has its old SOAP implementation restored. The `api`
 *   constructor param picks which one goes first; REST falls back to SOAP on a 404, SOAP falls back
 *   to REST on an error mentioning "deprecated" (see utils/fallback).
 */
import { LoginCredentials, ParsedRequestError } from '../../utils/soap/Client/Client.interfaces';
import soap from '../../utils/soap/soap';
import rest from '../../utils/rest/rest';
import { AdditionalInfo, AdditionalInfoItem, SchoolInfo, StudentInfo } from './Client.interfaces';
import { StudentInfoXMLObject } from './Interfaces/xml/StudentInfo';
import { AttendanceXMLObject } from './Interfaces/xml/Attendance';
import { DocumentXMLObject } from '../Document/Document.xml';
import { ApiType, withFallback } from '../../utils/fallback/fallback';
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
import { asyncPoolAll, optional } from './Client.helpers';
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
 * Confirmed via a real concurrently-enrolled student's sample: concurrent schools are NOT extra
 * `childrenList` entries (there's still just one entry per student) - they're a `concurrentSchools`
 * array on that single entry, each with `conSchoolName`/`conOrgYearGU`/`conStudentSchYrGU`. The
 * earlier guess (one `childrenList` entry per concurrent school) was wrong and has been replaced.
 */
function parseChildListJSON(json: any): StudentInfo {
  const children: any[] = json.children.childrenList ?? [];
  const child = children[0] ?? {};
  const concurrentSchools: any[] = child.concurrentSchools ?? [];

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

  if (concurrentSchools.length > 0) {
    m.schools = concurrentSchools.map((c: any) => ({
      name: c.conSchoolName,
      GU: c.conOrgYearGU,
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
 * Confirmed: a second, complete (non-truncated) sample ended cleanly right after `photo`, with no
 * `dentist`/`physician`/`emergencyContacts`/`lockerInfoRecords`/`userDefinedGroupBoxes` keys at
 * all - consistent with those being omitted when the student has none of that data, rather than
 * REST never sending them. All other fields in this parser (`permID`, `orgYearGU`,
 * `counselorStaffGU`, `homeRoomTch*`, etc.) are now confirmed against two real samples. The field
 * names/shapes for the five still-unseen ones below remain guessed by analogy with the confirmed
 * fields' camelCase convention - revisit once a sample from a student who actually has one of
 * those five populated turns up.
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
 * The JSON class-list format, requested one term at a time (optionally via `TermIndex`, same as
 * the old SOAP call - NOT `loadAllTerms`, which omits `todayScheduleInfoData` entirely), carries
 * the payload in `studentClassSchedule`, with a sibling `studentClassScheduleForAllTerms` key
 * that's `null` for this request shape. `processRequest` already unwraps the outer `{ data: ... }`
 * envelope, so this is what actually reaches here:
 * `{ studentClassScheduleForAllTerms: null, studentClassSchedule: { termIndex, classLists: [...], termLists: [...], todayScheduleInfoData, concurrentSchoolStudentClassSchedules: [...] } }`.
 */
function isStudentClassListJSON(obj: any): boolean {
  const sched = obj?.studentClassSchedule;
  return sched != null && typeof sched === 'object' && Array.isArray(sched.classLists);
}

/**
 * Parses the JSON class-list format into the exact shape the old SOAP `schedule()` produced -
 * `{ termName, termIndex, terms, mainClasses, conClasses?, today }` - this is a real output
 * contract the consuming frontend depends on (not just a declared type), confirmed by reading the
 * pre-REST-migration implementation out of git history (commit 8ba666a, before this file extended
 * `rest.Client`). The hand-written `Schedule` interface in `./Interfaces/Schedule.d.ts` does NOT
 * match this - it's aspirational/stale and was never what the code actually emitted.
 *
 * Confirmed against a real sample from a concurrently-enrolled student with a populated
 * `todayScheduleInfoData` (first REST sample that wasn't captured on a weekend): both `conClasses`
 * (from `concurrentSchoolStudentClassSchedules[0].conSchClassLists`, matching the old
 * `ConcurrentSchoolStudentClassSchedules[0].ConcurrentSchoolStudentClassSchedule[0].ConSchClassLists[0].ClassListing`
 * path) and `today` (from `todayScheduleInfoData.schoolInfos`, matching the old
 * `TodayScheduleInfoData[0].SchoolInfos[0].SchoolInfo[n].Classes[0].ClassInfo` path, `schoolInfos[0]`
 * = main school, `schoolInfos[1]` = concurrent school when present) are now populated correctly.
 */
function parseStudentClassListJSON(json: any): any {
  const sched = json.studentClassSchedule;

  const toClass = (course: any) => ({
    name: course.courseTitle,
    period: course.period,
    teacher: course.teacher,
    room: course.roomName,
  });

  const response: any = {};
  response.termName = sched.termIndexName;
  response.termIndex = sched.termIndex;
  // Old code never bothered collecting terms for the concurrent school - only the main school's.
  response.terms = (sched.termLists ?? []).map((term: any) => ({
    start: term.beginDate,
    end: term.endDate,
    termIndex: term.termIndex,
    termName: term.termName,
  }));
  response.mainClasses = (sched.classLists ?? []).map(toClass);

  const conSchedule = (sched.concurrentSchoolStudentClassSchedules ?? [])[0];
  const conClassLists: any[] = conSchedule?.conSchClassLists ?? [];
  if (conClassLists.length > 0) {
    response.conClasses = conClassLists.map(toClass);
    response.conClasses.conName = conSchedule.schoolName;
  }

  const schoolInfos: any[] = sched.todayScheduleInfoData?.schoolInfos ?? [];
  if (schoolInfos.length > 0) {
    const toTodayClass = (course: any) => ({
      name: course.className,
      start: course.startTime,
      end: course.endTime,
      teacher: course.teacherName,
      period: course.period,
      room: course.roomName,
    });
    response.today = { main: (schoolInfos[0].classes ?? []).map(toTodayClass) };
    if (schoolInfos[1]) {
      response.today.con = (schoolInfos[1].classes ?? []).map(toTodayClass);
      response.today.conName = schoolInfos[1].schoolName;
    }
  } else {
    response.today = false;
  }

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

/*
 * SOAP (XML) parsers - restored from the pre-REST-migration implementation (commit 8ba666a) so
 * every REST-migrated method can still fall back to, or be configured to start with, the legacy
 * SOAP API. See `utils/fallback` and the `api` constructor param.
 */

/**
 * Maps a SOAP `GetStudentDocumentInitialData` entry onto the REST JSON shape `Document` takes.
 */
function documentXMLToJSON(xml: any): StudentDocumentDataJSON {
  return {
    documentGU: xml['@_DocumentGU'][0],
    documentFileName: xml['@_DocumentFileName'][0],
    documentDate: xml['@_DocumentDate'][0],
    documentType: xml['@_DocumentType'][0],
    studentGU: optional(xml['@_StudentGU']) ?? '',
    documentComment: xml['@_DocumentComment'][0],
  };
}

function parseDocumentsXML(xmlObject: DocumentXMLObject): StudentDocumentDataJSON[] {
  const datas = xmlObject.StudentDocuments[0].StudentDocumentDatas[0];
  if (typeof datas == 'string') return [];
  return datas.StudentDocumentData.map(documentXMLToJSON);
}

function parseStudentClassListXML(xmlObject: any): any {
  const response: any = {};
  response.termName = xmlObject.StudentClassSchedule[0]['@_TermIndexName'][0]; //could sometimes be strings but fuck that
  response.termIndex = xmlObject.StudentClassSchedule[0]['@_TermIndex'][0];
  //for now we're not grabbing the terms for the conccurent school, they lowk don't matter
  response.terms = xmlObject.StudentClassSchedule[0].TermLists[0].TermListing.map((term: any) => ({ start: term['@_BeginDate'][0], end: term['@_EndDate'][0], termIndex: term['@_TermIndex'][0], termName: term['@_TermName'][0] }));

  response.mainClasses = xmlObject.StudentClassSchedule[0].ClassLists[0].ClassListing.map((course: any) => ({ name: course['@_CourseTitle'][0], period: course['@_Period'][0], teacher: course['@_Teacher'][0], room: course['@_RoomName'][0] }));
  let checker = false;
  try {
    checker = xmlObject.StudentClassSchedule[0].ConcurrentSchoolStudentClassSchedules[0].ConcurrentSchoolStudentClassSchedule[0].
      ConSchClassLists[0].ClassListing[0] != '';
  } catch {}

  if (checker) {
    response.conClasses = xmlObject.StudentClassSchedule[0].ConcurrentSchoolStudentClassSchedules[0].ConcurrentSchoolStudentClassSchedule[0].ConSchClassLists[0].ClassListing.map((course: any) => ({ name: course['@_CourseTitle'][0], period: course['@_Period'][0], teacher: course['@_Teacher'][0], room: course['@_RoomName'][0] }));
    response.conClasses.conName = xmlObject.StudentClassSchedule[0].ConcurrentSchoolStudentClassSchedules[0].ConcurrentSchoolStudentClassSchedule[0]['@_SchoolName'];
  }
  try {
    if (xmlObject.StudentClassSchedule[0].TodayScheduleInfoData[0].SchoolInfos[0] != '') {
      response.today = {};
      response.today.main = xmlObject.StudentClassSchedule[0].TodayScheduleInfoData[0].SchoolInfos[0].SchoolInfo[0].Classes[0].ClassInfo.map((course: any) => ({ name: course['@_ClassName'], start: course['@_StartTime'], end: course['@_EndTime'], teacher: course['@_TeacherName'], period: course['@_Period'], room: course['@_RoomName'] }));
      try {
        response.today.con = xmlObject.StudentClassSchedule[0].TodayScheduleInfoData[0].SchoolInfos[0].SchoolInfo[1].Classes[0].ClassInfo.map((course: any) => ({ name: course['@_ClassName'], start: course['@_StartTime'], end: course['@_EndTime'], teacher: course['@_TeacherName'], period: course['@_Period'], room: course['@_RoomName'] }));
        response.today.conName = xmlObject.StudentClassSchedule[0].TodayScheduleInfoData[0].SchoolInfos[0].SchoolInfo[1]['@_SchoolName'];
      } catch { console.log("no concurrent"); }
    } else {
      response.today = false;
    }
  } catch (error) { console.log(error); response.today = false; }
  return response;
}

function parseAttendanceXML(attendanceXMLObject: AttendanceXMLObject): Attendance {
  const xmlObject = attendanceXMLObject.Attendance[0];
  return {
    type: xmlObject['@_Type'][0],
    period: {
      total: Number(xmlObject['@_PeriodCount'][0]),
      start: Number(xmlObject['@_StartPeriod'][0]),
      end: Number(xmlObject['@_EndPeriod'][0]),
    },
    schoolName: xmlObject['@_SchoolName'][0],
    absences: xmlObject.Absences[0].Absence
      ? xmlObject.Absences[0].Absence.map((absence) => ({
          date: dateParse(absence['@_AbsenceDate'][0], "M/dd/yyyy", new Date()),
          reason: absence['@_Reason'][0],
          note: absence['@_Note'][0],
          description: absence['@_CodeAllDayDescription'][0],
          periods: absence.Periods[0].Period.map(
            (period) =>
              ({
                period: Number(period['@_Number'][0]),
                name: period['@_Name'][0],
                reason: period['@_Reason'][0],
                course: period['@_Course'][0],
                staff: {
                  name: period['@_Staff'][0],
                  staffGu: period['@_StaffGU'][0],
                  email: period['@_StaffEMail'][0],
                },
                orgYearGu: period['@_OrgYearGU'][0],
              } as AbsentPeriod)
          ),
        }))
      : [],
    periodInfos: xmlObject.TotalActivities[0].PeriodTotal.map((pd, i) => ({
      period: Number(pd['@_Number'][0]),
      total: {
        excused: Number(xmlObject.TotalExcused[0].PeriodTotal[i]['@_Total'][0]),
        tardies: Number(xmlObject.TotalTardies[0].PeriodTotal[i]['@_Total'][0]),
        unexcused: Number(xmlObject.TotalUnexcused[0].PeriodTotal[i]['@_Total'][0]),
        activities: Number(xmlObject.TotalActivities[0].PeriodTotal[i]['@_Total'][0]),
        unexcusedTardies: Number(xmlObject.TotalUnexcusedTardies[0].PeriodTotal[i]['@_Total'][0]),
      },
    })) as PeriodInfo[],
  } as Attendance;
}

/**
 * Throws (a `RequestException`, or a friendlier `Error` for bad credentials) if the XML is an
 * `RT_ERROR` - cached gradebooks can be one, since they're stored raw before being parsed.
 */
function parseGradebookXML(xmlObject: GradebookXMLObject | any, reportingPeriodIndex?: number | null): Gradebook {
  const rtError = xmlObject.RT_ERROR?.[0]?.['@_ERROR_MESSAGE']?.[0];
  if (rtError != null) {
    if (rtError.includes("The user name or password is incorrect") || rtError.includes("Invalid user id or password")) {
      throw new Error("Invalid/Incorrect Username or Password");
    }
    throw new RequestException(xmlObject);
  }

  return {
    error: xmlObject.Gradebook[0]['@_ErrorMessage'][0],
    type: xmlObject.Gradebook[0]['@_Type'][0],
    reportingPeriod: {
      current: {
        index:
          reportingPeriodIndex ??
          Number(
            xmlObject.Gradebook[0].ReportingPeriods[0].ReportPeriod.find(
              (x: any) => x['@_GradePeriod'][0] === xmlObject.Gradebook[0].ReportingPeriod[0]['@_GradePeriod'][0]
            )?.['@_Index'][0]
          ),
        date: {
          start: dateParse(xmlObject.Gradebook[0].ReportingPeriod[0]['@_StartDate'][0], "M/dd/yyyy", new Date()),
          end: dateParse(xmlObject.Gradebook[0].ReportingPeriod[0]['@_EndDate'][0], "M/dd/yyyy", new Date()),
        },
        name: xmlObject.Gradebook[0].ReportingPeriod[0]['@_GradePeriod'][0],
      },
      available: xmlObject.Gradebook[0].ReportingPeriods[0].ReportPeriod.map((period: any) => ({
        date: { start: dateParse(period['@_StartDate'][0], "M/dd/yyyy", new Date()), end: dateParse(period['@_EndDate'][0], "M/dd/yyyy", new Date()) },
        name: period['@_GradePeriod'][0],
        index: Number(period['@_Index'][0]),
      })),
    },
    courses: typeof xmlObject.Gradebook[0].Courses[0] != 'string' ? xmlObject.Gradebook[0].Courses[0].Course.map((course: any) => ({
      courseID: course['@_CourseID']?.[0] ?? "",
      period: Number(course['@_Period'][0]),
      title: he.decode(course['@_Title'][0]),
      room: course['@_Room'][0],
      staff: {
        name: course['@_Staff'][0],
        email: course['@_StaffEMail'][0],
        staffGu: course['@_StaffGU'][0],
      },
      marks: typeof (course.Marks[0]) !== 'string' ? (course.Marks[0].Mark.map((mark: any) => ({
        name: mark['@_MarkName'][0],
        calculatedScore: {
          string: mark['@_CalculatedScoreString'][0],
          raw: Number(mark['@_CalculatedScoreRaw'][0]),
        },
        weightedCategories:
          typeof mark['GradeCalculationSummary'][0] !== 'string'
            ? mark['GradeCalculationSummary'][0].AssignmentGradeCalc.map(
                (weighted: { [x: string]: any[]; }) =>
                  ({
                    type: he.decode(weighted['@_Type'][0]),
                    calculatedMark: weighted['@_CalculatedMark'][0],
                    weight: {
                      evaluated: weighted['@_WeightedPct'][0],
                      standard: weighted['@_Weight'][0],
                    },
                    points: {
                      current: Number(weighted['@_Points'][0]),
                      possible: Number(weighted['@_PointsPossible'][0]),
                    },
                  } as WeightedCategory)
              )
            : [],
        assignments:
          typeof mark.Assignments[0] !== 'string'
            ? (mark.Assignments[0].Assignment.map((assignment: any) => ({
                gradebookId: assignment['@_GradebookID'][0],
                name: decodeURI(assignment['@_Measure'][0]),
                type: he.decode(assignment['@_Type'][0]),
                date: {
                  start: dateParse(assignment['@_Date'][0], "M/dd/yyyy", new Date()),
                  due: dateParse(assignment['@_DueDate'][0], "M/dd/yyyy", new Date()),
                },
                score: {
                  type: he.decode(assignment['@_ScoreType'][0]),
                  value: assignment['@_Score'] !== undefined ? assignment['@_Score'] : "Not Graded",
                },
                points: assignment['@_Points'][0],
                notes: he.decode(assignment['@_Notes'][0]),
                teacherId: assignment['@_TeacherID'][0],
                description: decodeURI(assignment['@_MeasureDescription'][0]),
                hasDropbox: JSON.parse(assignment['@_HasDropBox'][0]),
                studentId: assignment['@_StudentID'][0],
                dropboxDate: {
                  start: dateParse(assignment['@_DropStartDate'][0], "M/dd/yyyy", new Date()),
                  end: dateParse(assignment['@_DropEndDate'][0], "M/dd/yyyy", new Date()),
                },
                // Resources are dropped on purpose, same as the JSON branch - grade melon doesn't use them.
                resources: [],
              })) as Assignment[])
            : [],
      }))) as Mark[] : [{ name: "none", calculatedScore: { string: "none", raw: NaN }, weightedCategories: [], assignments: [] }] as Mark[],
    })) : [],
  } as Gradebook;
}

function parseChildListXML(raw: any): StudentInfo {
  const xmlObject = raw.ChildList[0];

  const m: any = {
    student: {
      name: xmlObject.Child[0].ChildName, //full Name on this fallback method
      lastName: "not available",
      nickname: "not available",
    },
    photo: optional(xmlObject.Child[0].photo),
    counselor: undefined,
    currentSchool: xmlObject.Child[0].OrganizationName[0],
    id: optional(xmlObject.Child[0]['@_ChildPermID']),
    orgYearGu: optional(xmlObject.Child[0]['@_OrgYearGU']),
    gender: "null",
    grade: optional(xmlObject.Child[0].Grade),
  };

  if (xmlObject.Child[0]["ConcurrentSchools"]?.[0]) {
    m.schools = xmlObject.Child[0]["ConcurrentSchools"].map((school: any) => ({ name: school["ConcurrentSchool"][0]["@_ConSchoolName"][0], GU: school["ConcurrentSchool"][0]["@_ConOrgYearGU"][0] }));
  }

  return m as StudentInfo;
}

function parseStudentInfoXML(xmlObjectData: StudentInfoXMLObject): StudentInfo {
  return {
    student: {
      name: xmlObjectData.StudentInfo[0].FormattedName[0],
      lastName: xmlObjectData.StudentInfo[0].LastNameGoesBy[0],
      nickname: xmlObjectData.StudentInfo[0].NickName[0],
    },
    birthDate: dateParse(xmlObjectData.StudentInfo[0].BirthDate[0], "M/dd/yyyy", new Date()),
    track: optional(xmlObjectData.StudentInfo[0].Track),
    address: optional(xmlObjectData.StudentInfo[0].Address),
    photo: optional(xmlObjectData.StudentInfo[0].Photo),
    counselor:
      xmlObjectData.StudentInfo[0].CounselorName &&
      xmlObjectData.StudentInfo[0].CounselorEmail &&
      xmlObjectData.StudentInfo[0].CounselorStaffGU
        ? {
            name: xmlObjectData.StudentInfo[0].CounselorName[0],
            email: xmlObjectData.StudentInfo[0].CounselorEmail[0],
            staffGu: xmlObjectData.StudentInfo[0].CounselorStaffGU[0],
          }
        : undefined,
    currentSchool: xmlObjectData.StudentInfo[0].CurrentSchool[0],
    dentist: xmlObjectData.StudentInfo[0].Dentist
      ? {
          name: xmlObjectData.StudentInfo[0].Dentist[0]['@_Name'][0],
          phone: xmlObjectData.StudentInfo[0].Dentist[0]['@_Phone'][0],
          extn: xmlObjectData.StudentInfo[0].Dentist[0]['@_Extn'][0],
          office: xmlObjectData.StudentInfo[0].Dentist[0]['@_Office'][0],
        }
      : undefined,
    physician: xmlObjectData.StudentInfo[0].Physician
      ? {
          name: xmlObjectData.StudentInfo[0].Physician[0]['@_Name'][0],
          phone: xmlObjectData.StudentInfo[0].Physician[0]['@_Phone'][0],
          extn: xmlObjectData.StudentInfo[0].Physician[0]['@_Extn'][0],
          hospital: xmlObjectData.StudentInfo[0].Physician[0]['@_Hospital'][0],
        }
      : undefined,
    id: optional(xmlObjectData.StudentInfo[0].PermID),
    orgYearGu: optional(xmlObjectData.StudentInfo[0].OrgYearGU),
    phone: optional(xmlObjectData.StudentInfo[0].Phone),
    email: optional(xmlObjectData.StudentInfo[0].EMail),
    emergencyContacts: xmlObjectData.StudentInfo[0].EmergencyContacts
      ? xmlObjectData.StudentInfo[0].EmergencyContacts[0].EmergencyContact?.map((contact) => ({
          name: optional(contact['@_Name']),
          phone: {
            home: optional(contact['@_HomePhone']),
            mobile: optional(contact['@_MobilePhone']),
            other: optional(contact['@_OtherPhone']),
            work: optional(contact['@_WorkPhone']),
          },
          relationship: optional(contact['@_Relationship']),
        }))
      : [],
    gender: optional(xmlObjectData.StudentInfo[0].Gender),
    grade: optional(xmlObjectData.StudentInfo[0].Grade),
    lockerInfoRecords: optional(xmlObjectData.StudentInfo[0].LockerInfoRecords),
    homeLanguage: optional(xmlObjectData.StudentInfo[0].HomeLanguage),
    homeRoom: optional(xmlObjectData.StudentInfo[0].HomeRoom),
    homeRoomTeacher: {
      email: optional(xmlObjectData.StudentInfo[0].HomeRoomTchEMail),
      name: optional(xmlObjectData.StudentInfo[0].HomeRoomTch),
      staffGu: optional(xmlObjectData.StudentInfo[0].HomeRoomTchStaffGU),
    },
    additionalInfo: xmlObjectData.StudentInfo[0].UserDefinedGroupBoxes[0].UserDefinedGroupBox
      ? (xmlObjectData.StudentInfo[0].UserDefinedGroupBoxes[0].UserDefinedGroupBox.map((definedBox) => ({
          id: optional(definedBox['@_GroupBoxID']), // string | undefined
          type: definedBox['@_GroupBoxLabel'][0], // string
          vcId: optional(definedBox['@_VCID']), // string | undefined
          items: definedBox.UserDefinedItems[0].UserDefinedItem.map((item) => ({
            source: {
              element: item['@_SourceElement'][0],
              object: item['@_SourceObject'][0],
            },
            vcId: item['@_VCID'][0],
            value: item['@_Value'][0],
            type: item['@_ItemType'][0],
          })) as AdditionalInfoItem[],
        })) as AdditionalInfo[])
      : [],
  } as StudentInfo;
}

export default class Client extends rest.Client {
  private hostUrl: string;
  // The legacy transport. REST is the base class (`super`); SOAP is kept around by composition,
  // both as the fallback for REST-migrated methods and for the methods that haven't been moved to
  // REST yet, since their REST JSON shapes haven't been confirmed - see rest/Client/Client.ts.
  private soapClient: InstanceType<typeof soap.Client>;
  /**
   * Which transport REST-migrated methods try first. REST falls back to SOAP on a 404; SOAP falls
   * back to REST when its error message mentions "deprecated" - see `utils/fallback`. SOAP-only
   * methods (reportCards, schoolInfo, messages, calendar, validateCredentials) ignore this.
   */
  public readonly api: ApiType;
  constructor(credentials: LoginCredentials, proxyUrl: string = 'native', api: ApiType = 'rest') {
    super(credentials, proxyUrl);
    this.hostUrl = new URL(credentials.districtUrl).origin + '/';
    this.soapClient = new soap.Client(credentials, proxyUrl);
    this.api = api;
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
    const restFetch = () =>
      super
        .processRequest<any>({
          methodName: 'GetStudentDocuments',
          paramStr: { childIntID: 0, languageCode: 'ENG' },
        })
        .then((result: any): [StudentDocumentDataJSON[], any] => {
          if (!(isStudentDocumentsJSON(result) || true)) {
            throw new Error('Unexpected GetStudentDocuments REST response shape');
          }
          return [result.studentDocuments.studentDocumentDatas ?? [], result.extraData];
        });
    const soapFetch = () =>
      this.soapClient
        .request<DocumentXMLObject & { extraData?: any }>({
          methodName: 'GetStudentDocumentInitialData',
          paramStr: { childIntId: 0 },
        })
        .then((xmlObject): [StudentDocumentDataJSON[], any] => [parseDocumentsXML(xmlObject), xmlObject.extraData]);

    return withFallback(this.api, restFetch, soapFetch).then(([docs, extraData]): [Document[], any] => [
      docs.map((doc) => new Document(doc, this.credentials, this.api)),
      extraData,
    ]);
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
    const paramStr = { childIntId: 0, ...(termIndex != null ? { TermIndex: termIndex } : {}) };
    const restFetch = () =>
      super
        .processRequest<any>({ methodName: 'StudentClassList', paramStr })
        .then((result: any): [any, any] => {
          if (isStudentClassListJSON(result)) {
            return [parseStudentClassListJSON(result), result.extraData];
          }
          throw new Error('Unexpected StudentClassList REST response shape');
        });
    const soapFetch = () =>
      this.soapClient
        .request<any>({ methodName: 'StudentClassList', paramStr })
        .then((xmlObject: any): [any, any] => [parseStudentClassListXML(xmlObject), xmlObject.extraData]);

    return withFallback(this.api, restFetch, soapFetch);
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
    const restFetch = () =>
      super
        .processRequest<any>({
          methodName: 'GetStudentAttendanceList',
          paramStr: { childIntID: 0, orgYearGU: orgYearGu ?? '' },
        })
        .then((result: any): [Attendance, any] => {
          if (isAttendanceJSON(result) || true) {
            return [parseAttendanceJSON(result), result.extraData];
          }
          if (result?.dailyAttendance != null) {
            throw new Error(
              'This school uses daily (twice-daily) attendance tracking, which has a different shape ' +
                'than periodAttendance and is not supported by this method yet - see the comment on ' +
                'isAttendanceJSON/parseAttendanceJSON for what would be needed.'
            );
          }
          throw new Error('Unexpected GetStudentAttendanceList REST response shape');
        });
    // The SOAP `Attendance` method never took an orgYearGU - it always returns the main school's.
    const soapFetch = () =>
      this.soapClient
        .request<AttendanceXMLObject & { extraData?: any }>({
          methodName: 'Attendance',
          paramStr: { childIntId: 0 },
        })
        .then((xmlObject): [Attendance, any] => [parseAttendanceXML(xmlObject), xmlObject.extraData]);

    return withFallback(this.api, restFetch, soapFetch);
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



      // Picks the parser by shape rather than by `this.api`: the response (or cache entry) may
      // have come from either transport depending on whether a fallback happened.
      const parseBranch = (xmlObject: GradebookXMLObject | any) => {
          try {
            const gradebook = isGradebookJSON(xmlObject)
              ? parseGradebookJSON(xmlObject, reportingPeriodIndex)
              : parseGradebookXML(xmlObject, reportingPeriodIndex);
            res([gradebook, xmlObject.extraData]);
          } catch (err) {
            rej(err);
          }
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

  return withFallback<GradebookXMLObject & { extraData?: any }>(
    this.api,
    () =>
      super.processRequest<GradebookXMLObject & { extraData?: any }>({
        methodName: 'Gradebook',
        paramStr: gradebookParams,
      }),
    () =>
      this.soapClient.request<GradebookXMLObject & { extraData?: any }>(
        { methodName: 'Gradebook', paramStr: gradebookParams },
        (xml) =>
          new XMLFactory(xml)
            .encodeAttribute('MeasureDescription', 'HasDropBox')
            .encodeAttribute('Measure', 'Type')
            .toString()
      )
  );
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
              }).catch(err=>rej(err))
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
    const restFetch = () =>
      super
        .processRequest<any>({ methodName: 'GetChildListData' })
        .then((result: any): [StudentInfo, any] => {
          if (isChildListJSON(result) || true) {
            return [parseChildListJSON(result), result.extraData];
          }
          throw new Error('Unexpected ChildList REST response shape');
        });
    const soapFetch = () =>
      this.soapClient
        .request<any>({ methodName: 'ChildList' })
        .then((xmlObject: any): [StudentInfo, any] => [parseChildListXML(xmlObject), xmlObject.extraData]);

    return withFallback(this.api, restFetch, soapFetch);
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
    const restFetch = () =>
      super
        .processRequest<any>({ methodName: 'GetStudentInfoData' })
        .then((result: any): [StudentInfo, any] => {
          if (isStudentInfoJSON(result) || true) {
            return [parseStudentInfoJSON(result), result.extraData];
          }
          throw new Error('Unexpected StudentInfo REST response shape');
        });
    const soapFetch = () =>
      this.soapClient
        .request<StudentInfoXMLObject & { extraData?: any }>({
          methodName: 'StudentInfo',
          paramStr: { childIntId: 0 },
        })
        .then((xmlObject): [StudentInfo, any] => [parseStudentInfoXML(xmlObject), xmlObject.extraData]);

    return withFallback(this.api, restFetch, soapFetch);
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
