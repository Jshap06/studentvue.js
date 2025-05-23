import { LoginCredentials, ParsedRequestError } from '../../utils/soap/Client/Client.interfaces';
import soap from '../../utils/soap/soap';
import { AdditionalInfo, AdditionalInfoItem, ClassScheduleInfo, SchoolInfo, StudentInfo } from './Client.interfaces';
import { StudentInfoXMLObject } from './Interfaces/xml/StudentInfo';
import Message from '../Message/Message';
import { MessageXMLObject } from '../Message/Message.xml';
import { AssignmentEventXMLObject, CalendarXMLObject, RegularEventXMLObject } from './Interfaces/xml/Calendar';
import { AssignmentEvent, Calendar, CalendarOptions, Event, HolidayEvent, RegularEvent } from './Interfaces/Calendar';
import { eachMonthOfInterval, parse } from 'date-fns';
import { FileResourceXMLObject, GradebookXMLObject, URLResourceXMLObject } from './Interfaces/xml/Gradebook';
import { AttendanceXMLObject } from './Interfaces/xml/Attendance';
import EventType from '../../Constants/EventType';
import _ from 'lodash';
import { Assignment, FileResource, Gradebook, Mark, URLResource, WeightedCategory } from './Interfaces/Gradebook';
import ResourceType from '../../Constants/ResourceType';
import { AbsentPeriod, Attendance, PeriodInfo } from './Interfaces/Attendance';
import { ScheduleXMLObject } from './Interfaces/xml/Schedule';
import { Schedule } from './Client.interfaces';
import { SchoolInfoXMLObject } from './Interfaces/xml/SchoolInfo';
import { ReportCardsXMLObject } from '../ReportCard/ReportCard.xml';
import { DocumentXMLObject } from '../Document/Document.xml';
import ReportCard from '../ReportCard/ReportCard';
import Document from '../Document/Document';
import RequestException from '../RequestException/RequestException';
import XMLFactory from '../../utils/XMLFactory/XMLFactory';
import cache from '../../utils/cache/cache';
import { optional, asyncPoolAll } from './Client.helpers';
import he from "he";

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
 * The StudentVUE Client to access the API
 * @constructor
 * @extends {soap.Client}
 */
export default class Client extends soap.Client {
  private hostUrl: string;
  constructor(credentials: LoginCredentials, proxyUrl:string,hostUrl: string) {
    super(credentials,proxyUrl);
    this.hostUrl = hostUrl;
  }

  /**
   * Validate's the user's credentials. It will throw an error if credentials are incorrect
   */
  public validateCredentials(): Promise<void> {
    return new Promise((res, rej) => {
      super
        .processRequest<ParsedRequestError>({ validateErrors: false, methodName: 'fuck'})
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
        .processRequest<DocumentXMLObject>({
          methodName: 'GetStudentDocumentInitialData',
          paramStr: { childIntId: 0 },
        })
        .then((xmlObject) => {
          if(typeof(xmlObject['StudentDocuments'][0].StudentDocumentDatas[0])=="string"){console.log("where is my mind");return res([[],
            // @ts-ignore
            xmlObject.extraData])}
          else{
          res([
            xmlObject['StudentDocuments'][0].StudentDocumentDatas[0].StudentDocumentData.map(
              (xml: any) => new Document(xml, super.credentials)
            ),
            //@ts-ignore
            xmlObject.extraData]
          );}
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
      super
        .processRequest<ReportCardsXMLObject>({
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
      super
        .processRequest<SchoolInfoXMLObject&{extraData?:any}>({
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
   * @returns {Promise<Schedule>} Returns the schedule of the student
   * @description
   * ```js
   * await schedule(0) // -> { term: { index: 0, name: '1st Qtr Progress' }, ... }
   * ```
   */
  public schedule(termIndex?: number): Promise<[any,any]> {
    return new Promise((res, rej) => {
      super
        .processRequest<any>({
          methodName: 'StudentClassList',
          paramStr: { childIntId: 0, ...(termIndex != null ? { TermIndex: termIndex } : {}) },
        })
        .then((xmlObject:any) => {
          var response:any={}
          response.termName=xmlObject.StudentClassSchedule[0]['@_TermIndexName'][0]; //could sometimes be strings but fuck that
          response.termIndex=xmlObject.StudentClassSchedule[0]['@_TermIndex'][0];
          //for now we're not grabbing the terms for the conccurent school, they lowk don't matter
          response.terms=xmlObject.StudentClassSchedule[0].TermLists[0].TermListing.map((term:any)=>({start:term['@_BeginDate'][0],end:term['@_EndDate'][0],termIndex:term['@_TermIndex'][0],termName:term['@_TermName'][0]}))
          
          response.mainClasses=xmlObject.StudentClassSchedule[0].ClassLists[0].ClassListing.map((course:any)=>({name:course['@_CourseTitle'][0],period:course['@_Period'][0],teacher:course['@_Teacher'][0],room:course['@_RoomName'][0]}))
          var checker=false;
          try{
            checker=xmlObject.StudentClassSchedule[0].ConcurrentSchoolStudentClassSchedules[0].ConcurrentSchoolStudentClassSchedule[0].
            ConSchClassLists[0].ClassListing[0]!=''
            
          }catch{}

          
          if(checker){
            response.conClasses=xmlObject.StudentClassSchedule[0].ConcurrentSchoolStudentClassSchedules[0].ConcurrentSchoolStudentClassSchedule[0].ConSchClassLists[0].ClassListing.map((course:any)=>({name:course['@_CourseTitle'][0],period:course['@_Period'][0],teacher:course['@_Teacher'][0],room:course['@_RoomName'][0]}))
            response.conClasses.conName=xmlObject.StudentClassSchedule[0].ConcurrentSchoolStudentClassSchedules[0].ConcurrentSchoolStudentClassSchedule[0]['@_SchoolName']
          }
          try{
          if(xmlObject.StudentClassSchedule[0].TodayScheduleInfoData[0].SchoolInfos[0]!=''){
            response.today={}
            response.today.main=xmlObject.StudentClassSchedule[0].TodayScheduleInfoData[0].SchoolInfos[0].SchoolInfo[0].Classes[0].ClassInfo.map((course:any)=>({name:course['@_ClassName'],start:course['@_StartTime'],end:course['@_EndTime'],teacher:course['@_TeacherName'],period:course['@_Period'],room:course['@_RoomName']}))
            try{
              response.today.con=xmlObject.StudentClassSchedule[0].TodayScheduleInfoData[0].SchoolInfos[0].SchoolInfo[1].Classes[0].ClassInfo.map((course:any)=>({name:course['@_ClassName'],start:course['@_StartTime'],end:course['@_EndTime'],teacher:course['@_TeacherName'],period:course['@_Period'],room:course['@_RoomName']}))
              response.today.conName=xmlObject.StudentClassSchedule[0].TodayScheduleInfoData[0].SchoolInfos[0].Schoolinfo[1]['@_SchoolName'];
            }catch{console.log("no concurrent")}
          }
          else{
            response.today=false
          }

          
          }catch(error){console.log(error);response.today=false}
          res([response,xmlObject.extraData])
          }

          //@ts-ignore

        )
        .catch(rej);
    });
  }

  /**
   * Returns the attendance of the student
   * @returns {Promise<Attendance>} Returns an Attendance object
   * @description
   * ```js
   * client.attendance()
   *  .then(console.log); // -> { type: 'Period', period: {...}, schoolName: 'University High School', absences: [...], periodInfos: [...] }
   * ```
   */
  public attendance(): Promise<[Attendance,any]> {
    return new Promise((res, rej) => {
      super
        .processRequest<AttendanceXMLObject>({
          methodName: 'Attendance',
          paramStr: {
            childIntId: 0,
          },
        })
        .then((attendanceXMLObject) => {
          const xmlObject = attendanceXMLObject.Attendance[0];
          //@ts-ignore
          xmlObject.extraData=attendanceXMLObject.extraData

          res([{
            type: xmlObject['@_Type'][0],
            period: {
              total: Number(xmlObject['@_PeriodCount'][0]),
              start: Number(xmlObject['@_StartPeriod'][0]),
              end: Number(xmlObject['@_EndPeriod'][0]),
            },
            schoolName: xmlObject['@_SchoolName'][0],
            absences: xmlObject.Absences[0].Absence
              ? xmlObject.Absences[0].Absence.map((absence) => ({
                  date: new Date(absence['@_AbsenceDate'][0]),
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
          } as Attendance,
          //@ts-ignore
        xmlObject.extraData]
        );
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
  public gradebook(reportingPeriodIndex?: number,orgYearGu?:string): Promise<[Gradebook,any]> {
    return new Promise((res, rej) => {
      super
        .processRequest<GradebookXMLObject&{extraData?:any}>(
          {
            methodName: 'Gradebook',
            paramStr: {
              childIntId: 0,
              ...(reportingPeriodIndex != null ? { ReportPeriod: reportingPeriodIndex } : {}),
              ...(orgYearGu != null ? { ConcurrentSchOrgYearGU: orgYearGu } : {})
            },
          },
          (xml) =>
            new XMLFactory(xml)
              .encodeAttribute('MeasureDescription', 'HasDropBox')
              .encodeAttribute('Measure', 'Type')
              .toString()
        )
        .then((xmlObject: GradebookXMLObject | any) => {
          try{
            if (xmlObject.RT_ERROR[0]['@_ERROR_MESSAGE'][0].includes("The user name or password is incorrect")||xmlObject.RT_ERROR[0]['@_ERROR_MESSAGE'][0].includes("Invalid user id or password")) {rej(new Error("Invalid/Incorrect Username or Password"));}
            else{rej(new RequestException(xmlObject))};}
          catch(e){
        
          res([{
            error: xmlObject.Gradebook[0]['@_ErrorMessage'][0],
            type: xmlObject.Gradebook[0]['@_Type'][0],
            reportingPeriod: {
              current: {
                index:
                  reportingPeriodIndex ??
                  Number(
                    xmlObject.Gradebook[0].ReportingPeriods[0].ReportPeriod.find(
                      (x:any) => x['@_GradePeriod'][0] === xmlObject.Gradebook[0].ReportingPeriod[0]['@_GradePeriod'][0]
                    )?.['@_Index'][0]
                  ),
                date: {
                  start: new Date(xmlObject.Gradebook[0].ReportingPeriod[0]['@_StartDate'][0]),
                  end: new Date(xmlObject.Gradebook[0].ReportingPeriod[0]['@_EndDate'][0]),
                },
                name: xmlObject.Gradebook[0].ReportingPeriod[0]['@_GradePeriod'][0],
              },
              available: xmlObject.Gradebook[0].ReportingPeriods[0].ReportPeriod.map((period:any) => ({
                date: { start: new Date(period['@_StartDate'][0]), end: new Date(period['@_EndDate'][0]) },
                name: period['@_GradePeriod'][0],
                index: Number(period['@_Index'][0]),
              })),
            },
            courses: xmlObject.Gradebook[0].Courses[0].Course.map((course:any) => ({
              period: Number(course['@_Period'][0]),
              title: he.decode(course['@_Title'][0]),
              room: course['@_Room'][0],
              staff: {
                name: course['@_Staff'][0],
                email: course['@_StaffEMail'][0],
                staffGu: course['@_StaffGU'][0],
              },
              marks: typeof(course.Marks[0])!=='string' ? (course.Marks[0].Mark.map((mark:any) => ({
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
                    ? (mark.Assignments[0].Assignment.map((assignment:any) => ({
                        gradebookId: assignment['@_GradebookID'][0],
                        name: decodeURI(assignment['@_Measure'][0]),
                        type: he.decode(assignment['@_Type'][0]),
                        date: {
                          start: new Date(assignment['@_Date'][0]),
                          due: new Date(assignment['@_DueDate'][0]),
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
                          start: new Date(assignment['@_DropStartDate'][0]),
                          end: new Date(assignment['@_DropEndDate'][0]),
                        },
                        resources:
                          typeof assignment.Resources[0] !== 'string'
                            ? /*(assignment.Resources[0].Resource.map((rsrc:any) => {
                                switch (rsrc['@_Type'][0]) {
                                  case 'File': {
                                    const fileRsrc = rsrc as FileResourceXMLObject;
                                    return {
                                      type: ResourceType.FILE,
                                      file: {
                                        type: fileRsrc['@_FileType'][0],
                                        name: fileRsrc['@_FileName'][0],
                                        uri: this.hostUrl + fileRsrc['@_ServerFileName'][0],
                                      },
                                      resource: {
                                        date: new Date(fileRsrc['@_ResourceDate'][0]),
                                        id: fileRsrc['@_ResourceID'][0],
                                        name: fileRsrc['@_ResourceName'][0],
                                      },
                                    } as FileResource;
                                  }
                                  case 'URL': {
                                    const urlRsrc = rsrc as URLResourceXMLObject;
                                    return {
                                      url: urlRsrc['@_URL'] !== undefined ? urlRsrc['@_URL'] : "Not Given",
                                      type: ResourceType.URL,
                                      resource: {
                                        date: new Date(urlRsrc['@_ResourceDate'][0]),
                                        id: urlRsrc['@_ResourceID'][0],
                                        name: urlRsrc['@_ResourceName'][0],
                                        description: urlRsrc['@_ResourceDescription'][0],
                                      },
                                      path: urlRsrc['@_ServerFileName'][0],
                                    } as URLResource;
                                  }
                                  default:
                                    rej(
                                      `Type ${rsrc['@_Type'][0]} does not exist as a type. Add it to type declarations.`
                                    );
                                }
                              }) as (FileResource | URLResource)[]) */ 
                               //Obviously this is an insanely negligent fix. Just saying to complete hell with the resource. But, grade melon doesn't use it. So I don't care.
                           [] : [],
                      })) as Assignment[])
                    : [],
              }))) as Mark[]:[{ name: "none", calculatedScore: { string: "none", raw: NaN }, weightedCategories: [], assignments: [] }] as Mark[],
            })),
          } as Gradebook,
        xmlObject.extraData]
        );}
        })
        .catch(rej);
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
      super
        .processRequest<MessageXMLObject>(
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
        .processRequest({methodName:"ChildList"})
          .then((xmlObject:any)=>{
            const raw=xmlObject;
            xmlObject=xmlObject.ChildList[0];

            res([{
            student:{
              name:xmlObject.Child[0].ChildName, //full Name on this fallback method
              lastName:"not available",
              nickname:"not available"},
          //  birthDate:new Date(),
           // track:"not available",
           // address:"not available",
            photo:optional(xmlObject.Child[0].photo),
            counselor:undefined,
            currentSchool:xmlObject.Child[0].OrganizationName[0],
           // dentist:undefined,
            // physician:undefined,
              id:optional(xmlObject.Child[0]['@_ChildPermID']),
              orgYearGu:optional(xmlObject.Child[0]['@_OrgYearGU']),
              //phone:"not available",
              //email:"not available",
              //emergencyContacts:undefined,
              gender:"null",
              grade:optional(xmlObject.Child[0].Grade),




          } as StudentInfo,raw.extraData])})
          .catch(rej)
    })
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
        .processRequest<StudentInfoXMLObject>({
          methodName: 'StudentInfo',
          paramStr: { childIntId: 0 },
        })
        .then((xmlObjectData) => {
          res([{
            student: {
              name: xmlObjectData.StudentInfo[0].FormattedName[0],
              lastName: xmlObjectData.StudentInfo[0].LastNameGoesBy[0],
              nickname: xmlObjectData.StudentInfo[0].NickName[0],
            },
            birthDate: new Date(xmlObjectData.StudentInfo[0].BirthDate[0]),
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
              //@ts-ignore You will never make me use typeScript.
          } as StudentInfo,xmlObjectData.extraData]);
        })
        .catch(rej);
    });
  }

  private fetchEventsWithinInterval(date: Date) {
    return super.processRequest<CalendarXMLObject>(
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
   * client.calendar({ interval: { start: new Date('5/1/2022'), end: new Date('8/1/2021') }, concurrency: null }); // -> Limitless concurrency (not recommended)
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
      options.interval?.end ?? new Date(cal.CalendarListing[0]['@_SchoolEndDate'][0]);
    const schoolStartDate: Date | number =
      options.interval?.start ?? new Date(cal.CalendarListing[0]['@_SchoolBegDate'][0]);

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
                  start: new Date(events.CalendarListing[0]['@_SchoolBegDate'][0]),
                  end: new Date(events.CalendarListing[0]['@_SchoolEndDate'][0]),
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
                            date: new Date(assignmentEvent['@_Date'][0]),
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
                            date: new Date(event['@_Date'][0]),
                          } as HolidayEvent;
                        }
                        case EventType.REGULAR: {
                          const regularEvent = event as RegularEventXMLObject;
                          return {
                            title: decodeURI(regularEvent['@_Title'][0]),
                            agu: regularEvent['@_AGU'] ? regularEvent['@_AGU'][0] : undefined,
                            date: new Date(regularEvent['@_Date'][0]),
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
