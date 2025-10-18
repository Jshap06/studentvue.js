(function (global, factory) {
  if (typeof define === "function" && define.amd) {
    define(["exports", "../../utils/soap/soap", "../Message/Message", "date-fns", "../../Constants/EventType", "lodash", "../ReportCard/ReportCard", "../Document/Document", "../RequestException/RequestException", "../../utils/XMLFactory/XMLFactory", "../../utils/cache/cache", "./Client.helpers", "he"], factory);
  } else if (typeof exports !== "undefined") {
    factory(exports, require("../../utils/soap/soap"), require("../Message/Message"), require("date-fns"), require("../../Constants/EventType"), require("lodash"), require("../ReportCard/ReportCard"), require("../Document/Document"), require("../RequestException/RequestException"), require("../../utils/XMLFactory/XMLFactory"), require("../../utils/cache/cache"), require("./Client.helpers"), require("he"));
  } else {
    var mod = {
      exports: {}
    };
    factory(mod.exports, global.soap, global.Message, global.dateFns, global.EventType, global.lodash, global.ReportCard, global.Document, global.RequestException, global.XMLFactory, global.cache, global.Client, global.he);
    global.Client = mod.exports;
  }
})(typeof globalThis !== "undefined" ? globalThis : typeof self !== "undefined" ? self : this, function (_exports, _soap, _Message, _dateFns, _EventType, _lodash, _ReportCard, _Document, _RequestException, _XMLFactory, _cache, _Client, _he) {
  "use strict";

  Object.defineProperty(_exports, "__esModule", {
    value: true
  });
  _exports.default = void 0;
  _soap = _interopRequireDefault(_soap);
  _Message = _interopRequireDefault(_Message);
  _EventType = _interopRequireDefault(_EventType);
  _lodash = _interopRequireDefault(_lodash);
  _ReportCard = _interopRequireDefault(_ReportCard);
  _Document = _interopRequireDefault(_Document);
  _RequestException = _interopRequireDefault(_RequestException);
  _XMLFactory = _interopRequireDefault(_XMLFactory);
  _cache = _interopRequireDefault(_cache);
  _he = _interopRequireDefault(_he);
  function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }
  class Client extends _soap.default.Client {
    constructor(credentials, proxyUrl, hostUrl) {
      super(credentials, proxyUrl);
      this.hostUrl = hostUrl;
    }

    /**
     * Validate's the user's credentials. It will throw an error if credentials are incorrect
     */
    validateCredentials() {
      return new Promise((res, rej) => {
        super.processRequest({
          validateErrors: false,
          methodName: 'fuck'
        }).then(response => {
          if (response.RT_ERROR[0]['@_ERROR_MESSAGE'][0].includes("A critical error has occurred")) {
            res();
          } else {
            rej(new _RequestException.default(response));
          }
          ;
        }).catch(rej);
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
    documents() {
      return new Promise((res, rej) => {
        super.processRequest({
          methodName: 'GetStudentDocumentInitialData',
          paramStr: {
            childIntId: 0
          }
        }).then(xmlObject => {
          if (typeof xmlObject['StudentDocuments'][0].StudentDocumentDatas[0] == "string") {
            console.log("where is my mind");
            return res([[],
            // @ts-ignore
            xmlObject.extraData]);
          } else {
            var _a = xmlObject['StudentDocuments'][0].StudentDocumentDatas[0].StudentDocumentData;
            var _f = xml => {
              return new _Document.default(xml, super.credentials);
            };
            var _r = [];
            for (var _i = 0; _i < _a.length; _i++) {
              _r.push(_f(_a[_i], _i, _a));
            }
            res([_r,
            //@ts-ignore
            xmlObject.extraData]);
          }
        }).catch(rej);
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
    reportCards() {
      return new Promise((res, rej) => {
        super.processRequest({
          methodName: 'GetReportCardInitialData',
          paramStr: {
            childIntId: 0
          }
        }).then(xmlObject => {
          var _a2 = xmlObject.RCReportingPeriodData[0].RCReportingPeriods[0].RCReportingPeriod;
          var _f2 = xml => {
            return new _ReportCard.default(xml, super.credentials);
          }
          //@ts-ignore
          ;
          var _r2 = [];
          for (var _i2 = 0; _i2 < _a2.length; _i2++) {
            _r2.push(_f2(_a2[_i2], _i2, _a2));
          }
          res([_r2, xmlObject.extraData]);
        }).catch(rej);
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
    schoolInfo() {
      return new Promise((res, rej) => {
        super.processRequest({
          methodName: 'StudentSchoolInfo',
          paramStr: {
            childIntID: 0
          }
        }).then(result => {
          const xmlObject = result.StudentSchoolInfoListing[0];
          //@ts-ignore
          xmlObject.extraData = result.extraData;
          var _a3 = xmlObject.StaffLists[0].StaffList;
          var _f3 = staff => {
            return {
              name: staff['@_Name'][0],
              email: staff['@_EMail'][0],
              staffGu: staff['@_StaffGU'][0],
              jobTitle: staff['@_Title'][0],
              extn: staff['@_Extn'][0],
              phone: staff['@_Phone'][0]
            };
          };
          var _r3 = [];
          for (var _i3 = 0; _i3 < _a3.length; _i3++) {
            _r3.push(_f3(_a3[_i3], _i3, _a3));
          }
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
                staffGu: xmlObject['@_PrincipalGu'][0]
              }
            },
            staff: _r3
            //@ts-ignore
          }, xmlObject.extraData]);
        }).catch(rej);
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
    schedule(termIndex) {
      return new Promise((res, rej) => {
        super.processRequest({
          methodName: 'StudentClassList',
          paramStr: {
            childIntId: 0,
            ...(termIndex != null ? {
              TermIndex: termIndex
            } : {})
          }
        }).then(xmlObject => {
          var response = {};
          response.termName = xmlObject.StudentClassSchedule[0]['@_TermIndexName'][0]; //could sometimes be strings but fuck that
          response.termIndex = xmlObject.StudentClassSchedule[0]['@_TermIndex'][0];
          //for now we're not grabbing the terms for the conccurent school, they lowk don't matter
          var _a4 = xmlObject.StudentClassSchedule[0].TermLists[0].TermListing;
          var _f4 = term => {
            return {
              start: term['@_BeginDate'][0],
              end: term['@_EndDate'][0],
              termIndex: term['@_TermIndex'][0],
              termName: term['@_TermName'][0]
            };
          };
          var _r4 = [];
          for (var _i4 = 0; _i4 < _a4.length; _i4++) {
            _r4.push(_f4(_a4[_i4], _i4, _a4));
          }
          response.terms = _r4;
          var _a5 = xmlObject.StudentClassSchedule[0].ClassLists[0].ClassListing;
          var _f5 = course => {
            return {
              name: course['@_CourseTitle'][0],
              period: course['@_Period'][0],
              teacher: course['@_Teacher'][0],
              room: course['@_RoomName'][0]
            };
          };
          var _r5 = [];
          for (var _i5 = 0; _i5 < _a5.length; _i5++) {
            _r5.push(_f5(_a5[_i5], _i5, _a5));
          }
          response.mainClasses = _r5;
          var checker = false;
          try {
            checker = xmlObject.StudentClassSchedule[0].ConcurrentSchoolStudentClassSchedules[0].ConcurrentSchoolStudentClassSchedule[0].ConSchClassLists[0].ClassListing[0] != '';
          } catch {}
          if (checker) {
            var _a6 = xmlObject.StudentClassSchedule[0].ConcurrentSchoolStudentClassSchedules[0].ConcurrentSchoolStudentClassSchedule[0].ConSchClassLists[0].ClassListing;
            var _f6 = course => {
              return {
                name: course['@_CourseTitle'][0],
                period: course['@_Period'][0],
                teacher: course['@_Teacher'][0],
                room: course['@_RoomName'][0]
              };
            };
            var _r6 = [];
            for (var _i6 = 0; _i6 < _a6.length; _i6++) {
              _r6.push(_f6(_a6[_i6], _i6, _a6));
            }
            response.conClasses = _r6;
            response.conClasses.conName = xmlObject.StudentClassSchedule[0].ConcurrentSchoolStudentClassSchedules[0].ConcurrentSchoolStudentClassSchedule[0]['@_SchoolName'];
          }
          try {
            if (xmlObject.StudentClassSchedule[0].TodayScheduleInfoData[0].SchoolInfos[0] != '') {
              response.today = {};
              var _a7 = xmlObject.StudentClassSchedule[0].TodayScheduleInfoData[0].SchoolInfos[0].SchoolInfo[0].Classes[0].ClassInfo;
              var _f7 = course => {
                return {
                  name: course['@_ClassName'],
                  start: course['@_StartTime'],
                  end: course['@_EndTime'],
                  teacher: course['@_TeacherName'],
                  period: course['@_Period'],
                  room: course['@_RoomName']
                };
              };
              var _r7 = [];
              for (var _i7 = 0; _i7 < _a7.length; _i7++) {
                _r7.push(_f7(_a7[_i7], _i7, _a7));
              }
              response.today.main = _r7;
              try {
                var _a8 = xmlObject.StudentClassSchedule[0].TodayScheduleInfoData[0].SchoolInfos[0].SchoolInfo[1].Classes[0].ClassInfo;
                var _f8 = course => {
                  return {
                    name: course['@_ClassName'],
                    start: course['@_StartTime'],
                    end: course['@_EndTime'],
                    teacher: course['@_TeacherName'],
                    period: course['@_Period'],
                    room: course['@_RoomName']
                  };
                };
                var _r8 = [];
                for (var _i8 = 0; _i8 < _a8.length; _i8++) {
                  _r8.push(_f8(_a8[_i8], _i8, _a8));
                }
                response.today.con = _r8;
                response.today.conName = xmlObject.StudentClassSchedule[0].TodayScheduleInfoData[0].SchoolInfos[0].Schoolinfo[1]['@_SchoolName'];
              } catch {
                console.log("no concurrent");
              }
            } else {
              response.today = false;
            }
          } catch (error) {
            console.log(error);
            response.today = false;
          }
          res([response, xmlObject.extraData]);
        }

        //@ts-ignore
        ).catch(rej);
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
    attendance() {
      return new Promise((res, rej) => {
        super.processRequest({
          methodName: 'Attendance',
          paramStr: {
            childIntId: 0
          }
        }).then(attendanceXMLObject => {
          const xmlObject = attendanceXMLObject.Attendance[0];
          //@ts-ignore
          xmlObject.extraData = attendanceXMLObject.extraData;
          var _a9 = xmlObject.TotalActivities[0].PeriodTotal;
          var _f9 = (pd, i) => {
            return {
              period: Number(pd['@_Number'][0]),
              total: {
                excused: Number(xmlObject.TotalExcused[0].PeriodTotal[i]['@_Total'][0]),
                tardies: Number(xmlObject.TotalTardies[0].PeriodTotal[i]['@_Total'][0]),
                unexcused: Number(xmlObject.TotalUnexcused[0].PeriodTotal[i]['@_Total'][0]),
                activities: Number(xmlObject.TotalActivities[0].PeriodTotal[i]['@_Total'][0]),
                unexcusedTardies: Number(xmlObject.TotalUnexcusedTardies[0].PeriodTotal[i]['@_Total'][0])
              }
            };
          };
          var _r9 = [];
          for (var _i9 = 0; _i9 < _a9.length; _i9++) {
            _r9.push(_f9(_a9[_i9], _i9, _a9));
          }
          res([{
            type: xmlObject['@_Type'][0],
            period: {
              total: Number(xmlObject['@_PeriodCount'][0]),
              start: Number(xmlObject['@_StartPeriod'][0]),
              end: Number(xmlObject['@_EndPeriod'][0])
            },
            schoolName: xmlObject['@_SchoolName'][0],
            absences: xmlObject.Absences[0].Absence ? xmlObject.Absences[0].Absence.map(absence => {
              return {
                date: new Date(absence['@_AbsenceDate'][0]),
                reason: absence['@_Reason'][0],
                note: absence['@_Note'][0],
                description: absence['@_CodeAllDayDescription'][0],
                periods: absence.Periods[0].Period.map(period => {
                  return {
                    period: Number(period['@_Number'][0]),
                    name: period['@_Name'][0],
                    reason: period['@_Reason'][0],
                    course: period['@_Course'][0],
                    staff: {
                      name: period['@_Staff'][0],
                      staffGu: period['@_StaffGU'][0],
                      email: period['@_StaffEMail'][0]
                    },
                    orgYearGu: period['@_OrgYearGU'][0]
                  };
                })
              };
            }) : [],
            periodInfos: _r9
          },
          //@ts-ignore
          xmlObject.extraData]);
        }).catch(rej);
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
    gradebook(reportingPeriodIndex, orgYearGu, fresh = true) {
      return new Promise((res, rej) => {
        let x = false;
        const mainBranch = () => {
          super.processRequest({
            methodName: 'Gradebook',
            paramStr: {
              childIntId: 0,
              ...(reportingPeriodIndex != null ? {
                ReportPeriod: reportingPeriodIndex
              } : {}),
              ...(orgYearGu != null ? {
                ConcurrentSchOrgYearGU: orgYearGu
              } : {})
            }
          }, xml => {
            return new _XMLFactory.default(xml).encodeAttribute('MeasureDescription', 'HasDropBox').encodeAttribute('Measure', 'Type').toString();
          }).then(xmlObject => {
            if (x) {
              xmlObject = x;
            } else if (reportingPeriodIndex != null) {
              const xmlCache = JSON.parse(localStorage.getItem("xmlCache") ?? "{}");
              const identifier = this.district + this.username + reportingPeriodIndex;
              xmlCache[identifier] = {
                data: xmlObject,
                age: Date.now()
              };
              localStorage.setItem("xmlCache", JSON.stringify(xmlCache));
            }
            try {
              if (xmlObject.RT_ERROR[0]['@_ERROR_MESSAGE'][0].includes("The user name or password is incorrect") || xmlObject.RT_ERROR[0]['@_ERROR_MESSAGE'][0].includes("Invalid user id or password")) {
                rej(new Error("Invalid/Incorrect Username or Password"));
              } else {
                rej(new _RequestException.default(xmlObject));
              }
              ;
            } catch (e) {
              var _a10 = xmlObject.Gradebook[0].ReportingPeriods[0].ReportPeriod;
              var _f10 = period => {
                return {
                  date: {
                    start: new Date(period['@_StartDate'][0]),
                    end: new Date(period['@_EndDate'][0])
                  },
                  name: period['@_GradePeriod'][0],
                  index: Number(period['@_Index'][0])
                };
              };
              var _r10 = [];
              for (var _i10 = 0; _i10 < _a10.length; _i10++) {
                _r10.push(_f10(_a10[_i10], _i10, _a10));
              }
              var _a11 = xmlObject.Gradebook[0].Courses[0].Course;
              var _f11 = course => {
                return {
                  courseID: course['@_CourseID']?.[0] ?? "",
                  period: Number(course['@_Period'][0]),
                  title: _he.default.decode(course['@_Title'][0]),
                  room: course['@_Room'][0],
                  staff: {
                    name: course['@_Staff'][0],
                    email: course['@_StaffEMail'][0],
                    staffGu: course['@_StaffGU'][0]
                  },
                  marks: typeof course.Marks[0] !== 'string' ? course.Marks[0].Mark.map(mark => {
                    return {
                      name: mark['@_MarkName'][0],
                      calculatedScore: {
                        string: mark['@_CalculatedScoreString'][0],
                        raw: Number(mark['@_CalculatedScoreRaw'][0])
                      },
                      weightedCategories: typeof mark['GradeCalculationSummary'][0] !== 'string' ? mark['GradeCalculationSummary'][0].AssignmentGradeCalc.map(weighted => {
                        return {
                          type: _he.default.decode(weighted['@_Type'][0]),
                          calculatedMark: weighted['@_CalculatedMark'][0],
                          weight: {
                            evaluated: weighted['@_WeightedPct'][0],
                            standard: weighted['@_Weight'][0]
                          },
                          points: {
                            current: Number(weighted['@_Points'][0]),
                            possible: Number(weighted['@_PointsPossible'][0])
                          }
                        };
                      }) : [],
                      assignments: typeof mark.Assignments[0] !== 'string' ? mark.Assignments[0].Assignment.map(assignment => {
                        return {
                          gradebookId: assignment['@_GradebookID'][0],
                          name: decodeURI(assignment['@_Measure'][0]),
                          type: _he.default.decode(assignment['@_Type'][0]),
                          date: {
                            start: new Date(assignment['@_Date'][0]),
                            due: new Date(assignment['@_DueDate'][0])
                          },
                          score: {
                            type: _he.default.decode(assignment['@_ScoreType'][0]),
                            value: assignment['@_Score'] !== undefined ? assignment['@_Score'] : "Not Graded"
                          },
                          points: assignment['@_Points'][0],
                          notes: _he.default.decode(assignment['@_Notes'][0]),
                          teacherId: assignment['@_TeacherID'][0],
                          description: decodeURI(assignment['@_MeasureDescription'][0]),
                          hasDropbox: JSON.parse(assignment['@_HasDropBox'][0]),
                          studentId: assignment['@_StudentID'][0],
                          dropboxDate: {
                            start: new Date(assignment['@_DropStartDate'][0]),
                            end: new Date(assignment['@_DropEndDate'][0])
                          },
                          resources: typeof assignment.Resources[0] !== 'string' ?
                          /*(assignment.Resources[0].Resource.map((rsrc:any) => {
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
                          [] : []
                        };
                      }) : []
                    };
                  }) : [{
                    name: "none",
                    calculatedScore: {
                      string: "none",
                      raw: NaN
                    },
                    weightedCategories: [],
                    assignments: []
                  }]
                };
              };
              var _r11 = [];
              for (var _i11 = 0; _i11 < _a11.length; _i11++) {
                _r11.push(_f11(_a11[_i11], _i11, _a11));
              }
              res([{
                error: xmlObject.Gradebook[0]['@_ErrorMessage'][0],
                type: xmlObject.Gradebook[0]['@_Type'][0],
                reportingPeriod: {
                  current: {
                    index: reportingPeriodIndex ?? Number(xmlObject.Gradebook[0].ReportingPeriods[0].ReportPeriod.find(x => {
                      return x['@_GradePeriod'][0] === xmlObject.Gradebook[0].ReportingPeriod[0]['@_GradePeriod'][0];
                    })?.['@_Index'][0]),
                    date: {
                      start: new Date(xmlObject.Gradebook[0].ReportingPeriod[0]['@_StartDate'][0]),
                      end: new Date(xmlObject.Gradebook[0].ReportingPeriod[0]['@_EndDate'][0])
                    },
                    name: xmlObject.Gradebook[0].ReportingPeriod[0]['@_GradePeriod'][0]
                  },
                  available: _r10
                },
                courses: _r11
              }, xmlObject.extraData]);
            }
          }).catch(rej);
        };
        if (fresh || reportingPeriodIndex == null) {
          mainBranch();
        } else {
          const m = JSON.parse(localStorage.getItem("xmlCache") ?? "{}");
          const identifier = this.district + this.username + reportingPeriodIndex;
          if (m[identifier]) {
            if (Math.abs(m[identifier].age - Date.now()) > 1000 * 60 * 60 * 24 * 3) {
              // if older than 3 days, refresh 
              mainBranch();
            } else {
              x = m[identifier].data;
              mainBranch();
            }
          }
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
    messages() {
      return new Promise((res, rej) => {
        super.processRequest({
          methodName: 'GetPXPMessages',
          paramStr: {
            childIntId: 0
          }
        }, xml => {
          return new _XMLFactory.default(xml).encodeAttribute('Content', 'Read').toString();
        }).then(xmlObject => {
          var _a12 = xmlObject.PXPMessagesData[0].MessageListings[0].MessageListing;
          var _f12 = message => {
            return new _Message.default(message, super.credentials, this.hostUrl);
          }
          // @ts-ignore //fucking sue me
          ;
          var _r12 = [];
          for (var _i12 = 0; _i12 < _a12.length; _i12++) {
            _r12.push(_f12(_a12[_i12], _i12, _a12));
          }
          res([_r12, xmlObject?.extraData]);
        }).catch(rej);
      });
    }

    //altnerate method for studentInfo when studentInfo fails:
    //those things commented out are not applicable here
    ChildList() {
      return new Promise((res, rej) => {
        super.processRequest({
          methodName: "ChildList"
        }).then(xmlObject => {
          const raw = xmlObject;
          xmlObject = xmlObject.ChildList[0];
          res([{
            student: {
              name: xmlObject.Child[0].ChildName,
              //full Name on this fallback method
              lastName: "not available",
              nickname: "not available"
            },
            //  birthDate:new Date(),
            // track:"not available",
            // address:"not available",
            photo: (0, _Client.optional)(xmlObject.Child[0].photo),
            counselor: undefined,
            currentSchool: xmlObject.Child[0].OrganizationName[0],
            // dentist:undefined,
            // physician:undefined,
            id: (0, _Client.optional)(xmlObject.Child[0]['@_ChildPermID']),
            orgYearGu: (0, _Client.optional)(xmlObject.Child[0]['@_OrgYearGU']),
            //phone:"not available",
            //email:"not available",
            //emergencyContacts:undefined,
            gender: "null",
            grade: (0, _Client.optional)(xmlObject.Child[0].Grade)
          }, raw.extraData]);
        }).catch(rej);
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
    studentInfo() {
      return new Promise((res, rej) => {
        super.processRequest({
          methodName: 'StudentInfo',
          paramStr: {
            childIntId: 0
          }
        }).then(xmlObjectData => {
          res([{
            student: {
              name: xmlObjectData.StudentInfo[0].FormattedName[0],
              lastName: xmlObjectData.StudentInfo[0].LastNameGoesBy[0],
              nickname: xmlObjectData.StudentInfo[0].NickName[0]
            },
            birthDate: new Date(xmlObjectData.StudentInfo[0].BirthDate[0]),
            track: (0, _Client.optional)(xmlObjectData.StudentInfo[0].Track),
            address: (0, _Client.optional)(xmlObjectData.StudentInfo[0].Address),
            photo: (0, _Client.optional)(xmlObjectData.StudentInfo[0].Photo),
            counselor: xmlObjectData.StudentInfo[0].CounselorName && xmlObjectData.StudentInfo[0].CounselorEmail && xmlObjectData.StudentInfo[0].CounselorStaffGU ? {
              name: xmlObjectData.StudentInfo[0].CounselorName[0],
              email: xmlObjectData.StudentInfo[0].CounselorEmail[0],
              staffGu: xmlObjectData.StudentInfo[0].CounselorStaffGU[0]
            } : undefined,
            currentSchool: xmlObjectData.StudentInfo[0].CurrentSchool[0],
            dentist: xmlObjectData.StudentInfo[0].Dentist ? {
              name: xmlObjectData.StudentInfo[0].Dentist[0]['@_Name'][0],
              phone: xmlObjectData.StudentInfo[0].Dentist[0]['@_Phone'][0],
              extn: xmlObjectData.StudentInfo[0].Dentist[0]['@_Extn'][0],
              office: xmlObjectData.StudentInfo[0].Dentist[0]['@_Office'][0]
            } : undefined,
            physician: xmlObjectData.StudentInfo[0].Physician ? {
              name: xmlObjectData.StudentInfo[0].Physician[0]['@_Name'][0],
              phone: xmlObjectData.StudentInfo[0].Physician[0]['@_Phone'][0],
              extn: xmlObjectData.StudentInfo[0].Physician[0]['@_Extn'][0],
              hospital: xmlObjectData.StudentInfo[0].Physician[0]['@_Hospital'][0]
            } : undefined,
            id: (0, _Client.optional)(xmlObjectData.StudentInfo[0].PermID),
            orgYearGu: (0, _Client.optional)(xmlObjectData.StudentInfo[0].OrgYearGU),
            phone: (0, _Client.optional)(xmlObjectData.StudentInfo[0].Phone),
            email: (0, _Client.optional)(xmlObjectData.StudentInfo[0].EMail),
            emergencyContacts: xmlObjectData.StudentInfo[0].EmergencyContacts ? xmlObjectData.StudentInfo[0].EmergencyContacts[0].EmergencyContact?.map(contact => {
              return {
                name: (0, _Client.optional)(contact['@_Name']),
                phone: {
                  home: (0, _Client.optional)(contact['@_HomePhone']),
                  mobile: (0, _Client.optional)(contact['@_MobilePhone']),
                  other: (0, _Client.optional)(contact['@_OtherPhone']),
                  work: (0, _Client.optional)(contact['@_WorkPhone'])
                },
                relationship: (0, _Client.optional)(contact['@_Relationship'])
              };
            }) : [],
            gender: (0, _Client.optional)(xmlObjectData.StudentInfo[0].Gender),
            grade: (0, _Client.optional)(xmlObjectData.StudentInfo[0].Grade),
            lockerInfoRecords: (0, _Client.optional)(xmlObjectData.StudentInfo[0].LockerInfoRecords),
            homeLanguage: (0, _Client.optional)(xmlObjectData.StudentInfo[0].HomeLanguage),
            homeRoom: (0, _Client.optional)(xmlObjectData.StudentInfo[0].HomeRoom),
            homeRoomTeacher: {
              email: (0, _Client.optional)(xmlObjectData.StudentInfo[0].HomeRoomTchEMail),
              name: (0, _Client.optional)(xmlObjectData.StudentInfo[0].HomeRoomTch),
              staffGu: (0, _Client.optional)(xmlObjectData.StudentInfo[0].HomeRoomTchStaffGU)
            },
            additionalInfo: xmlObjectData.StudentInfo[0].UserDefinedGroupBoxes[0].UserDefinedGroupBox ? xmlObjectData.StudentInfo[0].UserDefinedGroupBoxes[0].UserDefinedGroupBox.map(definedBox => {
              return {
                id: (0, _Client.optional)(definedBox['@_GroupBoxID']),
                // string | undefined
                type: definedBox['@_GroupBoxLabel'][0],
                // string
                vcId: (0, _Client.optional)(definedBox['@_VCID']),
                // string | undefined
                items: definedBox.UserDefinedItems[0].UserDefinedItem.map(item => {
                  return {
                    source: {
                      element: item['@_SourceElement'][0],
                      object: item['@_SourceObject'][0]
                    },
                    vcId: item['@_VCID'][0],
                    value: item['@_Value'][0],
                    type: item['@_ItemType'][0]
                  };
                })
              };
            }) : []
            //@ts-ignore You will never make me use typeScript.
          }, xmlObjectData.extraData]);
        }).catch(rej);
      });
    }
    fetchEventsWithinInterval(date) {
      return super.processRequest({
        methodName: 'StudentCalendar',
        paramStr: {
          childIntId: 0,
          RequestDate: date.toISOString()
        }
      }, xml => {
        return new _XMLFactory.default(xml).encodeAttribute('Title', 'Icon').toString();
      });
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
    async calendar(options = {}) {
      const defaultOptions = {
        concurrency: 7,
        ...options
      };
      const cal = await _cache.default.memo(() => {
        return this.fetchEventsWithinInterval(new Date());
      });
      const schoolEndDate = options.interval?.end ?? new Date(cal.CalendarListing[0]['@_SchoolEndDate'][0]);
      const schoolStartDate = options.interval?.start ?? new Date(cal.CalendarListing[0]['@_SchoolBegDate'][0]);
      return new Promise((res, rej) => {
        const monthsWithinSchoolYear = (0, _dateFns.eachMonthOfInterval)({
          start: schoolStartDate,
          end: schoolEndDate
        });
        const getAllEventsWithinSchoolYear = () => {
          return defaultOptions.concurrency == null ? Promise.all(monthsWithinSchoolYear.map(date => {
            return this.fetchEventsWithinInterval(date);
          })) : (0, _Client.asyncPoolAll)(defaultOptions.concurrency, monthsWithinSchoolYear, date => {
            return this.fetchEventsWithinInterval(date);
          });
        };
        let memo = null;
        getAllEventsWithinSchoolYear().then(events => {
          const allEvents = events.reduce((prev, events) => {
            if (memo == null) {
              memo = {
                schoolDate: {
                  start: new Date(events.CalendarListing[0]['@_SchoolBegDate'][0]),
                  end: new Date(events.CalendarListing[0]['@_SchoolEndDate'][0])
                },
                outputRange: {
                  start: schoolStartDate,
                  end: schoolEndDate
                },
                events: []
              };
            }
            const rest = {
              ...memo,
              // This is to prevent re-initializing Date objects in order to improve performance
              events: [...(prev.events ? prev.events : []), ...(typeof events.CalendarListing[0].EventLists[0] !== 'string' ? events.CalendarListing[0].EventLists[0].EventList.map(event => {
                switch (event['@_DayType'][0]) {
                  case _EventType.default.ASSIGNMENT:
                    {
                      const assignmentEvent = event;
                      return {
                        title: decodeURI(assignmentEvent['@_Title'][0]),
                        addLinkData: assignmentEvent['@_AddLinkData'][0],
                        agu: assignmentEvent['@_AGU'] ? assignmentEvent['@_AGU'][0] : undefined,
                        date: new Date(assignmentEvent['@_Date'][0]),
                        dgu: assignmentEvent['@_DGU'][0],
                        link: assignmentEvent['@_Link'][0],
                        startTime: assignmentEvent['@_StartTime'][0],
                        type: _EventType.default.ASSIGNMENT,
                        viewType: assignmentEvent['@_ViewType'][0]
                      };
                    }
                  case _EventType.default.HOLIDAY:
                    {
                      return {
                        title: decodeURI(event['@_Title'][0]),
                        type: _EventType.default.HOLIDAY,
                        startTime: event['@_StartTime'][0],
                        date: new Date(event['@_Date'][0])
                      };
                    }
                  case _EventType.default.REGULAR:
                    {
                      const regularEvent = event;
                      return {
                        title: decodeURI(regularEvent['@_Title'][0]),
                        agu: regularEvent['@_AGU'] ? regularEvent['@_AGU'][0] : undefined,
                        date: new Date(regularEvent['@_Date'][0]),
                        description: regularEvent['@_EvtDescription'] ? regularEvent['@_EvtDescription'][0] : undefined,
                        dgu: regularEvent['@_DGU'] ? regularEvent['@_DGU'][0] : undefined,
                        link: regularEvent['@_Link'] ? regularEvent['@_Link'][0] : undefined,
                        startTime: regularEvent['@_StartTime'][0],
                        type: _EventType.default.REGULAR,
                        viewType: regularEvent['@_ViewType'] ? regularEvent['@_ViewType'][0] : undefined,
                        addLinkData: regularEvent['@_AddLinkData'] ? regularEvent['@_AddLinkData'][0] : undefined
                      };
                    }
                }
              }) : [])]
            };
            return rest;
          }, {});
          res({
            ...allEvents,
            events: _lodash.default.uniqBy(allEvents.events, item => {
              return item.title;
            })
          });
        }).catch(rej);
      });
    }
  }
  _exports.default = Client;
});
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJDbGllbnQiLCJzb2FwIiwiY29uc3RydWN0b3IiLCJjcmVkZW50aWFscyIsInByb3h5VXJsIiwiaG9zdFVybCIsInZhbGlkYXRlQ3JlZGVudGlhbHMiLCJQcm9taXNlIiwicmVzIiwicmVqIiwicHJvY2Vzc1JlcXVlc3QiLCJ2YWxpZGF0ZUVycm9ycyIsIm1ldGhvZE5hbWUiLCJ0aGVuIiwicmVzcG9uc2UiLCJSVF9FUlJPUiIsImluY2x1ZGVzIiwiUmVxdWVzdEV4Y2VwdGlvbiIsImNhdGNoIiwiZG9jdW1lbnRzIiwicGFyYW1TdHIiLCJjaGlsZEludElkIiwieG1sT2JqZWN0IiwiU3R1ZGVudERvY3VtZW50RGF0YXMiLCJjb25zb2xlIiwibG9nIiwiZXh0cmFEYXRhIiwiU3R1ZGVudERvY3VtZW50RGF0YSIsInhtbCIsIkRvY3VtZW50IiwicmVwb3J0Q2FyZHMiLCJSQ1JlcG9ydGluZ1BlcmlvZERhdGEiLCJSQ1JlcG9ydGluZ1BlcmlvZHMiLCJSQ1JlcG9ydGluZ1BlcmlvZCIsIlJlcG9ydENhcmQiLCJzY2hvb2xJbmZvIiwiY2hpbGRJbnRJRCIsInJlc3VsdCIsIlN0dWRlbnRTY2hvb2xJbmZvTGlzdGluZyIsIlN0YWZmTGlzdHMiLCJTdGFmZkxpc3QiLCJzdGFmZiIsIm5hbWUiLCJlbWFpbCIsInN0YWZmR3UiLCJqb2JUaXRsZSIsImV4dG4iLCJwaG9uZSIsInNjaG9vbCIsImFkZHJlc3MiLCJhZGRyZXNzQWx0IiwiY2l0eSIsInppcENvZGUiLCJhbHRQaG9uZSIsInByaW5jaXBhbCIsInNjaGVkdWxlIiwidGVybUluZGV4IiwiVGVybUluZGV4IiwidGVybU5hbWUiLCJTdHVkZW50Q2xhc3NTY2hlZHVsZSIsIlRlcm1MaXN0cyIsIlRlcm1MaXN0aW5nIiwidGVybSIsInN0YXJ0IiwiZW5kIiwidGVybXMiLCJDbGFzc0xpc3RzIiwiQ2xhc3NMaXN0aW5nIiwiY291cnNlIiwicGVyaW9kIiwidGVhY2hlciIsInJvb20iLCJtYWluQ2xhc3NlcyIsImNoZWNrZXIiLCJDb25jdXJyZW50U2Nob29sU3R1ZGVudENsYXNzU2NoZWR1bGVzIiwiQ29uY3VycmVudFNjaG9vbFN0dWRlbnRDbGFzc1NjaGVkdWxlIiwiQ29uU2NoQ2xhc3NMaXN0cyIsImNvbkNsYXNzZXMiLCJjb25OYW1lIiwiVG9kYXlTY2hlZHVsZUluZm9EYXRhIiwiU2Nob29sSW5mb3MiLCJ0b2RheSIsIlNjaG9vbEluZm8iLCJDbGFzc2VzIiwiQ2xhc3NJbmZvIiwibWFpbiIsImNvbiIsIlNjaG9vbGluZm8iLCJlcnJvciIsImF0dGVuZGFuY2UiLCJhdHRlbmRhbmNlWE1MT2JqZWN0IiwiQXR0ZW5kYW5jZSIsIlRvdGFsQWN0aXZpdGllcyIsIlBlcmlvZFRvdGFsIiwicGQiLCJpIiwiTnVtYmVyIiwidG90YWwiLCJleGN1c2VkIiwiVG90YWxFeGN1c2VkIiwidGFyZGllcyIsIlRvdGFsVGFyZGllcyIsInVuZXhjdXNlZCIsIlRvdGFsVW5leGN1c2VkIiwiYWN0aXZpdGllcyIsInVuZXhjdXNlZFRhcmRpZXMiLCJUb3RhbFVuZXhjdXNlZFRhcmRpZXMiLCJ0eXBlIiwic2Nob29sTmFtZSIsImFic2VuY2VzIiwiQWJzZW5jZXMiLCJBYnNlbmNlIiwibWFwIiwiYWJzZW5jZSIsImRhdGUiLCJEYXRlIiwicmVhc29uIiwibm90ZSIsImRlc2NyaXB0aW9uIiwicGVyaW9kcyIsIlBlcmlvZHMiLCJQZXJpb2QiLCJvcmdZZWFyR3UiLCJwZXJpb2RJbmZvcyIsImdyYWRlYm9vayIsInJlcG9ydGluZ1BlcmlvZEluZGV4IiwiZnJlc2giLCJ4IiwibWFpbkJyYW5jaCIsIlJlcG9ydFBlcmlvZCIsIkNvbmN1cnJlbnRTY2hPcmdZZWFyR1UiLCJYTUxGYWN0b3J5IiwiZW5jb2RlQXR0cmlidXRlIiwidG9TdHJpbmciLCJ4bWxDYWNoZSIsIkpTT04iLCJwYXJzZSIsImxvY2FsU3RvcmFnZSIsImdldEl0ZW0iLCJpZGVudGlmaWVyIiwiZGlzdHJpY3QiLCJ1c2VybmFtZSIsImRhdGEiLCJhZ2UiLCJub3ciLCJzZXRJdGVtIiwic3RyaW5naWZ5IiwiRXJyb3IiLCJlIiwiR3JhZGVib29rIiwiUmVwb3J0aW5nUGVyaW9kcyIsImluZGV4IiwiQ291cnNlcyIsIkNvdXJzZSIsImNvdXJzZUlEIiwidGl0bGUiLCJoZSIsImRlY29kZSIsIm1hcmtzIiwiTWFya3MiLCJNYXJrIiwibWFyayIsImNhbGN1bGF0ZWRTY29yZSIsInN0cmluZyIsInJhdyIsIndlaWdodGVkQ2F0ZWdvcmllcyIsIkFzc2lnbm1lbnRHcmFkZUNhbGMiLCJ3ZWlnaHRlZCIsImNhbGN1bGF0ZWRNYXJrIiwid2VpZ2h0IiwiZXZhbHVhdGVkIiwic3RhbmRhcmQiLCJwb2ludHMiLCJjdXJyZW50IiwicG9zc2libGUiLCJhc3NpZ25tZW50cyIsIkFzc2lnbm1lbnRzIiwiQXNzaWdubWVudCIsImFzc2lnbm1lbnQiLCJncmFkZWJvb2tJZCIsImRlY29kZVVSSSIsImR1ZSIsInNjb3JlIiwidmFsdWUiLCJ1bmRlZmluZWQiLCJub3RlcyIsInRlYWNoZXJJZCIsImhhc0Ryb3Bib3giLCJzdHVkZW50SWQiLCJkcm9wYm94RGF0ZSIsInJlc291cmNlcyIsIlJlc291cmNlcyIsIk5hTiIsInJlcG9ydGluZ1BlcmlvZCIsImZpbmQiLCJSZXBvcnRpbmdQZXJpb2QiLCJhdmFpbGFibGUiLCJjb3Vyc2VzIiwibSIsIk1hdGgiLCJhYnMiLCJtZXNzYWdlcyIsIlBYUE1lc3NhZ2VzRGF0YSIsIk1lc3NhZ2VMaXN0aW5ncyIsIk1lc3NhZ2VMaXN0aW5nIiwibWVzc2FnZSIsIk1lc3NhZ2UiLCJDaGlsZExpc3QiLCJzdHVkZW50IiwiQ2hpbGQiLCJDaGlsZE5hbWUiLCJsYXN0TmFtZSIsIm5pY2tuYW1lIiwicGhvdG8iLCJvcHRpb25hbCIsImNvdW5zZWxvciIsImN1cnJlbnRTY2hvb2wiLCJPcmdhbml6YXRpb25OYW1lIiwiaWQiLCJnZW5kZXIiLCJncmFkZSIsIkdyYWRlIiwic3R1ZGVudEluZm8iLCJ4bWxPYmplY3REYXRhIiwiU3R1ZGVudEluZm8iLCJGb3JtYXR0ZWROYW1lIiwiTGFzdE5hbWVHb2VzQnkiLCJOaWNrTmFtZSIsImJpcnRoRGF0ZSIsIkJpcnRoRGF0ZSIsInRyYWNrIiwiVHJhY2siLCJBZGRyZXNzIiwiUGhvdG8iLCJDb3Vuc2Vsb3JOYW1lIiwiQ291bnNlbG9yRW1haWwiLCJDb3Vuc2Vsb3JTdGFmZkdVIiwiQ3VycmVudFNjaG9vbCIsImRlbnRpc3QiLCJEZW50aXN0Iiwib2ZmaWNlIiwicGh5c2ljaWFuIiwiUGh5c2ljaWFuIiwiaG9zcGl0YWwiLCJQZXJtSUQiLCJPcmdZZWFyR1UiLCJQaG9uZSIsIkVNYWlsIiwiZW1lcmdlbmN5Q29udGFjdHMiLCJFbWVyZ2VuY3lDb250YWN0cyIsIkVtZXJnZW5jeUNvbnRhY3QiLCJjb250YWN0IiwiaG9tZSIsIm1vYmlsZSIsIm90aGVyIiwid29yayIsInJlbGF0aW9uc2hpcCIsIkdlbmRlciIsImxvY2tlckluZm9SZWNvcmRzIiwiTG9ja2VySW5mb1JlY29yZHMiLCJob21lTGFuZ3VhZ2UiLCJIb21lTGFuZ3VhZ2UiLCJob21lUm9vbSIsIkhvbWVSb29tIiwiaG9tZVJvb21UZWFjaGVyIiwiSG9tZVJvb21UY2hFTWFpbCIsIkhvbWVSb29tVGNoIiwiSG9tZVJvb21UY2hTdGFmZkdVIiwiYWRkaXRpb25hbEluZm8iLCJVc2VyRGVmaW5lZEdyb3VwQm94ZXMiLCJVc2VyRGVmaW5lZEdyb3VwQm94IiwiZGVmaW5lZEJveCIsInZjSWQiLCJpdGVtcyIsIlVzZXJEZWZpbmVkSXRlbXMiLCJVc2VyRGVmaW5lZEl0ZW0iLCJpdGVtIiwic291cmNlIiwiZWxlbWVudCIsIm9iamVjdCIsImZldGNoRXZlbnRzV2l0aGluSW50ZXJ2YWwiLCJSZXF1ZXN0RGF0ZSIsInRvSVNPU3RyaW5nIiwiY2FsZW5kYXIiLCJvcHRpb25zIiwiZGVmYXVsdE9wdGlvbnMiLCJjb25jdXJyZW5jeSIsImNhbCIsImNhY2hlIiwibWVtbyIsInNjaG9vbEVuZERhdGUiLCJpbnRlcnZhbCIsIkNhbGVuZGFyTGlzdGluZyIsInNjaG9vbFN0YXJ0RGF0ZSIsIm1vbnRoc1dpdGhpblNjaG9vbFllYXIiLCJlYWNoTW9udGhPZkludGVydmFsIiwiZ2V0QWxsRXZlbnRzV2l0aGluU2Nob29sWWVhciIsImFsbCIsImFzeW5jUG9vbEFsbCIsImV2ZW50cyIsImFsbEV2ZW50cyIsInJlZHVjZSIsInByZXYiLCJzY2hvb2xEYXRlIiwib3V0cHV0UmFuZ2UiLCJyZXN0IiwiRXZlbnRMaXN0cyIsIkV2ZW50TGlzdCIsImV2ZW50IiwiRXZlbnRUeXBlIiwiQVNTSUdOTUVOVCIsImFzc2lnbm1lbnRFdmVudCIsImFkZExpbmtEYXRhIiwiYWd1IiwiZGd1IiwibGluayIsInN0YXJ0VGltZSIsInZpZXdUeXBlIiwiSE9MSURBWSIsIlJFR1VMQVIiLCJyZWd1bGFyRXZlbnQiLCJfIiwidW5pcUJ5Il0sInNvdXJjZXMiOlsiLi4vLi4vLi4vc3JjL1N0dWRlbnRWdWUvQ2xpZW50L0NsaWVudC50cyJdLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBMb2dpbkNyZWRlbnRpYWxzLCBQYXJzZWRSZXF1ZXN0RXJyb3IgfSBmcm9tICcuLi8uLi91dGlscy9zb2FwL0NsaWVudC9DbGllbnQuaW50ZXJmYWNlcyc7XHJcbmltcG9ydCBzb2FwIGZyb20gJy4uLy4uL3V0aWxzL3NvYXAvc29hcCc7XHJcbmltcG9ydCB7IEFkZGl0aW9uYWxJbmZvLCBBZGRpdGlvbmFsSW5mb0l0ZW0sIENsYXNzU2NoZWR1bGVJbmZvLCBTY2hvb2xJbmZvLCBTdHVkZW50SW5mbyB9IGZyb20gJy4vQ2xpZW50LmludGVyZmFjZXMnO1xyXG5pbXBvcnQgeyBTdHVkZW50SW5mb1hNTE9iamVjdCB9IGZyb20gJy4vSW50ZXJmYWNlcy94bWwvU3R1ZGVudEluZm8nO1xyXG5pbXBvcnQgTWVzc2FnZSBmcm9tICcuLi9NZXNzYWdlL01lc3NhZ2UnO1xyXG5pbXBvcnQgeyBNZXNzYWdlWE1MT2JqZWN0IH0gZnJvbSAnLi4vTWVzc2FnZS9NZXNzYWdlLnhtbCc7XHJcbmltcG9ydCB7IEFzc2lnbm1lbnRFdmVudFhNTE9iamVjdCwgQ2FsZW5kYXJYTUxPYmplY3QsIFJlZ3VsYXJFdmVudFhNTE9iamVjdCB9IGZyb20gJy4vSW50ZXJmYWNlcy94bWwvQ2FsZW5kYXInO1xyXG5pbXBvcnQgeyBBc3NpZ25tZW50RXZlbnQsIENhbGVuZGFyLCBDYWxlbmRhck9wdGlvbnMsIEV2ZW50LCBIb2xpZGF5RXZlbnQsIFJlZ3VsYXJFdmVudCB9IGZyb20gJy4vSW50ZXJmYWNlcy9DYWxlbmRhcic7XHJcbmltcG9ydCB7IGVhY2hNb250aE9mSW50ZXJ2YWwsIHBhcnNlIH0gZnJvbSAnZGF0ZS1mbnMnO1xyXG5pbXBvcnQgeyBGaWxlUmVzb3VyY2VYTUxPYmplY3QsIEdyYWRlYm9va1hNTE9iamVjdCwgVVJMUmVzb3VyY2VYTUxPYmplY3QgfSBmcm9tICcuL0ludGVyZmFjZXMveG1sL0dyYWRlYm9vayc7XHJcbmltcG9ydCB7IEF0dGVuZGFuY2VYTUxPYmplY3QgfSBmcm9tICcuL0ludGVyZmFjZXMveG1sL0F0dGVuZGFuY2UnO1xyXG5pbXBvcnQgRXZlbnRUeXBlIGZyb20gJy4uLy4uL0NvbnN0YW50cy9FdmVudFR5cGUnO1xyXG5pbXBvcnQgXyBmcm9tICdsb2Rhc2gnO1xyXG5pbXBvcnQgeyBBc3NpZ25tZW50LCBGaWxlUmVzb3VyY2UsIEdyYWRlYm9vaywgTWFyaywgVVJMUmVzb3VyY2UsIFdlaWdodGVkQ2F0ZWdvcnkgfSBmcm9tICcuL0ludGVyZmFjZXMvR3JhZGVib29rJztcclxuaW1wb3J0IFJlc291cmNlVHlwZSBmcm9tICcuLi8uLi9Db25zdGFudHMvUmVzb3VyY2VUeXBlJztcclxuaW1wb3J0IHsgQWJzZW50UGVyaW9kLCBBdHRlbmRhbmNlLCBQZXJpb2RJbmZvIH0gZnJvbSAnLi9JbnRlcmZhY2VzL0F0dGVuZGFuY2UnO1xyXG5pbXBvcnQgeyBTY2hlZHVsZVhNTE9iamVjdCB9IGZyb20gJy4vSW50ZXJmYWNlcy94bWwvU2NoZWR1bGUnO1xyXG5pbXBvcnQgeyBTY2hlZHVsZSB9IGZyb20gJy4vQ2xpZW50LmludGVyZmFjZXMnO1xyXG5pbXBvcnQgeyBTY2hvb2xJbmZvWE1MT2JqZWN0IH0gZnJvbSAnLi9JbnRlcmZhY2VzL3htbC9TY2hvb2xJbmZvJztcclxuaW1wb3J0IHsgUmVwb3J0Q2FyZHNYTUxPYmplY3QgfSBmcm9tICcuLi9SZXBvcnRDYXJkL1JlcG9ydENhcmQueG1sJztcclxuaW1wb3J0IHsgRG9jdW1lbnRYTUxPYmplY3QgfSBmcm9tICcuLi9Eb2N1bWVudC9Eb2N1bWVudC54bWwnO1xyXG5pbXBvcnQgUmVwb3J0Q2FyZCBmcm9tICcuLi9SZXBvcnRDYXJkL1JlcG9ydENhcmQnO1xyXG5pbXBvcnQgRG9jdW1lbnQgZnJvbSAnLi4vRG9jdW1lbnQvRG9jdW1lbnQnO1xyXG5pbXBvcnQgUmVxdWVzdEV4Y2VwdGlvbiBmcm9tICcuLi9SZXF1ZXN0RXhjZXB0aW9uL1JlcXVlc3RFeGNlcHRpb24nO1xyXG5pbXBvcnQgWE1MRmFjdG9yeSBmcm9tICcuLi8uLi91dGlscy9YTUxGYWN0b3J5L1hNTEZhY3RvcnknO1xyXG5pbXBvcnQgY2FjaGUgZnJvbSAnLi4vLi4vdXRpbHMvY2FjaGUvY2FjaGUnO1xyXG5pbXBvcnQgeyBvcHRpb25hbCwgYXN5bmNQb29sQWxsIH0gZnJvbSAnLi9DbGllbnQuaGVscGVycyc7XHJcbmltcG9ydCBoZSBmcm9tIFwiaGVcIjtcclxuaW1wb3J0IHsgZWwsIGlkIH0gZnJvbSAnZGF0ZS1mbnMvbG9jYWxlJztcclxuXHJcbi8qKlxyXG4gKiBUTyBETzsgcmV3cml0ZSB0aGUgc3R1ZGVudEluZm8gc3R1ZmYgdG8gcHJpbWFyeSBDaGlsZExpc3Qgd2l0aCBzdHVkZW50SW5mbyBhcyB0aGUgZmFsbGJhY2ssIFxyXG4gKiBtYWtlIHRoZSB0eXBlIFJFUVVJUkUgdGhlIGluZm8gYWJvdXQgc2Nob29sIGNvbmN1cnJlbmN5LCB0aHVzbHksIHRoZSBsb2dpbiBmdW5jdGlvbiB3aWxsIGRldGVybWluZSBpdCBpbiB0aGUgaW1tZWRpYXRlIGJ5IGNvbmN1cnJlbnJ0bHkgcGVyZm9ybWluZyB0aGUgZmV0Y2hlc1xyXG4gKiB0byB0aHVzbHkgaGF2ZSBhIG1pbmltYWwgc3BlZWQgaW1wYWN0XHJcbiAqIFxyXG4gKiBcclxuICogXHJcbiAqIFxyXG4gKiBcclxuICogXHJcbiAqIFxyXG4gKiBcclxuICogXHJcbiAqIFxyXG4gKiBcclxuICogXHJcbiAqIFxyXG4gKiBcclxuICogXHJcbiAqIFxyXG4gKiBcclxuICogXHJcbiAqIFxyXG4gKiBcclxuICogVGhlIFN0dWRlbnRWVUUgQ2xpZW50IHRvIGFjY2VzcyB0aGUgQVBJXHJcbiAqIEBjb25zdHJ1Y3RvclxyXG4gKiBAZXh0ZW5kcyB7c29hcC5DbGllbnR9XHJcbiAqL1xyXG5cclxuXHJcblxyXG5pbnRlcmZhY2UgeG1sQ2FjaGV7XHJcbiAgW2lkZW50aWZpZXI6c3RyaW5nXSAvKmRpc3RyaWN0IHVybCArIHVzZXJuYW1lICsgbXAgKi8gOiB7ZGF0YTpHcmFkZWJvb2tYTUxPYmplY3QsYWdlOm51bWJlcn1cclxufVxyXG5cclxuXHJcbmV4cG9ydCBkZWZhdWx0IGNsYXNzIENsaWVudCBleHRlbmRzIHNvYXAuQ2xpZW50IHtcclxuICBwcml2YXRlIGhvc3RVcmw6IHN0cmluZztcclxuICBjb25zdHJ1Y3RvcihjcmVkZW50aWFsczogTG9naW5DcmVkZW50aWFscywgcHJveHlVcmw6c3RyaW5nLGhvc3RVcmw6IHN0cmluZykge1xyXG4gICAgc3VwZXIoY3JlZGVudGlhbHMscHJveHlVcmwpO1xyXG4gICAgdGhpcy5ob3N0VXJsID0gaG9zdFVybDtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIFZhbGlkYXRlJ3MgdGhlIHVzZXIncyBjcmVkZW50aWFscy4gSXQgd2lsbCB0aHJvdyBhbiBlcnJvciBpZiBjcmVkZW50aWFscyBhcmUgaW5jb3JyZWN0XHJcbiAgICovXHJcbiAgcHVibGljIHZhbGlkYXRlQ3JlZGVudGlhbHMoKTogUHJvbWlzZTx2b2lkPiB7XHJcbiAgICByZXR1cm4gbmV3IFByb21pc2UoKHJlcywgcmVqKSA9PiB7XHJcbiAgICAgIHN1cGVyXHJcbiAgICAgICAgLnByb2Nlc3NSZXF1ZXN0PFBhcnNlZFJlcXVlc3RFcnJvcj4oeyB2YWxpZGF0ZUVycm9yczogZmFsc2UsIG1ldGhvZE5hbWU6ICdmdWNrJ30pXHJcbiAgICAgICAgLnRoZW4oKHJlc3BvbnNlKSA9PiB7XHJcbiAgICAgICAgICBpZiAocmVzcG9uc2UuUlRfRVJST1JbMF1bJ0BfRVJST1JfTUVTU0FHRSddWzBdLmluY2x1ZGVzKFwiQSBjcml0aWNhbCBlcnJvciBoYXMgb2NjdXJyZWRcIikpIHtyZXMoKTt9XHJcbiAgICAgICAgICBlbHNle3JlaihuZXcgUmVxdWVzdEV4Y2VwdGlvbihyZXNwb25zZSkpfTtcclxuICAgICAgICB9KVxyXG4gICAgICAgIC5jYXRjaChyZWopO1xyXG4gICAgfSk7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBHZXRzIHRoZSBzdHVkZW50J3MgZG9jdW1lbnRzIGZyb20gc3luZXJneSBzZXJ2ZXJzXHJcbiAgICogQHJldHVybnMge1Byb21pc2U8RG9jdW1lbnRbXT59PiBSZXR1cm5zIGEgbGlzdCBvZiBzdHVkZW50IGRvY3VtZW50c1xyXG4gICAqIEBkZXNjcmlwdGlvblxyXG4gICAqIGBgYGpzXHJcbiAgICogY29uc3QgZG9jdW1lbnRzID0gYXdhaXQgY2xpZW50LmRvY3VtZW50cygpO1xyXG4gICAqIGNvbnN0IGRvY3VtZW50ID0gZG9jdW1lbnRzWzBdO1xyXG4gICAqIGNvbnN0IGZpbGVzID0gYXdhaXQgZG9jdW1lbnQuZ2V0KCk7XHJcbiAgICogY29uc3QgYmFzZTY0Y29sbGVjdGlvbiA9IGZpbGVzLm1hcCgoZmlsZSkgPT4gZmlsZS5iYXNlNjQpO1xyXG4gICAqIGBgYFxyXG4gICAqL1xyXG4gIHB1YmxpYyBkb2N1bWVudHMoKTogUHJvbWlzZTxbRG9jdW1lbnRbXSxhbnldPiB7XHJcbiAgICByZXR1cm4gbmV3IFByb21pc2UoKHJlcywgcmVqKSA9PiB7XHJcbiAgICAgIHN1cGVyXHJcbiAgICAgICAgLnByb2Nlc3NSZXF1ZXN0PERvY3VtZW50WE1MT2JqZWN0Pih7XHJcbiAgICAgICAgICBtZXRob2ROYW1lOiAnR2V0U3R1ZGVudERvY3VtZW50SW5pdGlhbERhdGEnLFxyXG4gICAgICAgICAgcGFyYW1TdHI6IHsgY2hpbGRJbnRJZDogMCB9LFxyXG4gICAgICAgIH0pXHJcbiAgICAgICAgLnRoZW4oKHhtbE9iamVjdCkgPT4ge1xyXG4gICAgICAgICAgaWYodHlwZW9mKHhtbE9iamVjdFsnU3R1ZGVudERvY3VtZW50cyddWzBdLlN0dWRlbnREb2N1bWVudERhdGFzWzBdKT09XCJzdHJpbmdcIil7Y29uc29sZS5sb2coXCJ3aGVyZSBpcyBteSBtaW5kXCIpO3JldHVybiByZXMoW1tdLFxyXG4gICAgICAgICAgICAvLyBAdHMtaWdub3JlXHJcbiAgICAgICAgICAgIHhtbE9iamVjdC5leHRyYURhdGFdKX1cclxuICAgICAgICAgIGVsc2V7XHJcbiAgICAgICAgICByZXMoW1xyXG4gICAgICAgICAgICB4bWxPYmplY3RbJ1N0dWRlbnREb2N1bWVudHMnXVswXS5TdHVkZW50RG9jdW1lbnREYXRhc1swXS5TdHVkZW50RG9jdW1lbnREYXRhLm1hcChcclxuICAgICAgICAgICAgICAoeG1sOiBhbnkpID0+IG5ldyBEb2N1bWVudCh4bWwsIHN1cGVyLmNyZWRlbnRpYWxzKVxyXG4gICAgICAgICAgICApLFxyXG4gICAgICAgICAgICAvL0B0cy1pZ25vcmVcclxuICAgICAgICAgICAgeG1sT2JqZWN0LmV4dHJhRGF0YV1cclxuICAgICAgICAgICk7fVxyXG4gICAgICAgIH0pXHJcbiAgICAgICAgLmNhdGNoKHJlaik7XHJcbiAgICB9KTtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIEdldHMgYSBsaXN0IG9mIHJlcG9ydCBjYXJkc1xyXG4gICAqIEByZXR1cm5zIHtQcm9taXNlPFJlcG9ydENhcmRbXT59IFJldHVybnMgYSBsaXN0IG9mIHJlcG9ydCBjYXJkcyB0aGF0IGNhbiBmZXRjaCBhIGZpbGVcclxuICAgKiBAZGVzY3JpcHRpb25cclxuICAgKiBgYGBqc1xyXG4gICAqIGNvbnN0IHJlcG9ydENhcmRzID0gYXdhaXQgY2xpZW50LnJlcG9ydENhcmRzKCk7XHJcbiAgICogY29uc3QgZmlsZXMgPSBhd2FpdCBQcm9taXNlLmFsbChyZXBvcnRDYXJkcy5tYXAoKGNhcmQpID0+IGNhcmQuZ2V0KCkpKTtcclxuICAgKiBjb25zdCBiYXNlNjRhcnIgPSBmaWxlcy5tYXAoKGZpbGUpID0+IGZpbGUuYmFzZTY0KTsgLy8gW1wiSlZCRVJpMC4uLlwiLCBcImRVSW9hMS4uLlwiLCAuLi5dO1xyXG4gICAqIGBgYFxyXG4gICAqL1xyXG4gIHB1YmxpYyByZXBvcnRDYXJkcygpOiBQcm9taXNlPFtSZXBvcnRDYXJkW10sYW55XT4ge1xyXG4gICAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXMsIHJlaikgPT4ge1xyXG4gICAgICBzdXBlclxyXG4gICAgICAgIC5wcm9jZXNzUmVxdWVzdDxSZXBvcnRDYXJkc1hNTE9iamVjdD4oe1xyXG4gICAgICAgICAgbWV0aG9kTmFtZTogJ0dldFJlcG9ydENhcmRJbml0aWFsRGF0YScsXHJcbiAgICAgICAgICBwYXJhbVN0cjogeyBjaGlsZEludElkOiAwIH0sXHJcbiAgICAgICAgfSlcclxuICAgICAgICAudGhlbigoeG1sT2JqZWN0KSA9PiB7XHJcbiAgICAgICAgICByZXMoW1xyXG4gICAgICAgICAgICB4bWxPYmplY3QuUkNSZXBvcnRpbmdQZXJpb2REYXRhWzBdLlJDUmVwb3J0aW5nUGVyaW9kc1swXS5SQ1JlcG9ydGluZ1BlcmlvZC5tYXAoXHJcbiAgICAgICAgICAgICAgKHhtbCkgPT4gbmV3IFJlcG9ydENhcmQoeG1sLCBzdXBlci5jcmVkZW50aWFscylcclxuICAgICAgICAgICAgICAvL0B0cy1pZ25vcmVcclxuICAgICAgICAgICAgKSx4bWxPYmplY3QuZXh0cmFEYXRhXVxyXG4gICAgICAgICAgKTtcclxuICAgICAgICB9KVxyXG4gICAgICAgIC5jYXRjaChyZWopO1xyXG4gICAgfSk7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBHZXRzIHRoZSBzdHVkZW50J3Mgc2Nob29sJ3MgaW5mb3JtYXRpb25cclxuICAgKiBAcmV0dXJucyB7UHJvbWlzZTxTY2hvb2xJbmZvPn0gUmV0dXJucyB0aGUgaW5mb3JtYXRpb24gb2YgdGhlIHN0dWRlbnQncyBzY2hvb2xcclxuICAgKiBAZGVzY3JpcHRpb25cclxuICAgKiBgYGBqc1xyXG4gICAqIGF3YWl0IGNsaWVudC5zY2hvb2xJbmZvKCk7XHJcbiAgICpcclxuICAgKiBjbGllbnQuc2Nob29sSW5mbygpLnRoZW4oKHNjaG9vbEluZm8pID0+IHtcclxuICAgKiAgY29uc29sZS5sb2coXy51bmlxKHNjaG9vbEluZm8uc3RhZmYubWFwKChzdGFmZikgPT4gc3RhZmYubmFtZSkpKTsgLy8gTGlzdCBhbGwgc3RhZmYgcG9zaXRpb25zIHVzaW5nIGxvZGFzaFxyXG4gICAqIH0pXHJcbiAgICogYGBgXHJcbiAgICovXHJcbiAgcHVibGljIHNjaG9vbEluZm8oKTogUHJvbWlzZTxbU2Nob29sSW5mbyxhbnldPiB7XHJcbiAgICByZXR1cm4gbmV3IFByb21pc2UoKHJlcywgcmVqKSA9PiB7XHJcbiAgICAgIHN1cGVyXHJcbiAgICAgICAgLnByb2Nlc3NSZXF1ZXN0PFNjaG9vbEluZm9YTUxPYmplY3Qme2V4dHJhRGF0YT86YW55fT4oe1xyXG4gICAgICAgICAgbWV0aG9kTmFtZTogJ1N0dWRlbnRTY2hvb2xJbmZvJyxcclxuICAgICAgICAgIHBhcmFtU3RyOiB7IGNoaWxkSW50SUQ6IDAgfSxcclxuICAgICAgICB9KVxyXG4gICAgICAgIC50aGVuKChyZXN1bHQpID0+IHtcclxuICAgICAgICAgIGNvbnN0IHhtbE9iamVjdD1yZXN1bHQuU3R1ZGVudFNjaG9vbEluZm9MaXN0aW5nWzBdO1xyXG4gICAgICAgICAgLy9AdHMtaWdub3JlXHJcbiAgICAgICAgICB4bWxPYmplY3QuZXh0cmFEYXRhPXJlc3VsdC5leHRyYURhdGE7XHJcbiAgICAgICAgICByZXMoW3tcclxuICAgICAgICAgICAgc2Nob29sOiB7XHJcbiAgICAgICAgICAgICAgYWRkcmVzczogeG1sT2JqZWN0WydAX1NjaG9vbEFkZHJlc3MnXVswXSxcclxuICAgICAgICAgICAgICBhZGRyZXNzQWx0OiB4bWxPYmplY3RbJ0BfU2Nob29sQWRkcmVzczInXVswXSxcclxuICAgICAgICAgICAgICBjaXR5OiB4bWxPYmplY3RbJ0BfU2Nob29sQ2l0eSddWzBdLFxyXG4gICAgICAgICAgICAgIHppcENvZGU6IHhtbE9iamVjdFsnQF9TY2hvb2xaaXAnXVswXSxcclxuICAgICAgICAgICAgICBwaG9uZTogeG1sT2JqZWN0WydAX1Bob25lJ11bMF0sXHJcbiAgICAgICAgICAgICAgYWx0UGhvbmU6IHhtbE9iamVjdFsnQF9QaG9uZTInXVswXSxcclxuICAgICAgICAgICAgICBwcmluY2lwYWw6IHtcclxuICAgICAgICAgICAgICAgIG5hbWU6IHhtbE9iamVjdFsnQF9QcmluY2lwYWwnXVswXSxcclxuICAgICAgICAgICAgICAgIGVtYWlsOiB4bWxPYmplY3RbJ0BfUHJpbmNpcGFsRW1haWwnXVswXSxcclxuICAgICAgICAgICAgICAgIHN0YWZmR3U6IHhtbE9iamVjdFsnQF9QcmluY2lwYWxHdSddWzBdLFxyXG4gICAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgIHN0YWZmOiB4bWxPYmplY3QuU3RhZmZMaXN0c1swXS5TdGFmZkxpc3QubWFwKChzdGFmZikgPT4gKHtcclxuICAgICAgICAgICAgICBuYW1lOiBzdGFmZlsnQF9OYW1lJ11bMF0sXHJcbiAgICAgICAgICAgICAgZW1haWw6IHN0YWZmWydAX0VNYWlsJ11bMF0sXHJcbiAgICAgICAgICAgICAgc3RhZmZHdTogc3RhZmZbJ0BfU3RhZmZHVSddWzBdLFxyXG4gICAgICAgICAgICAgIGpvYlRpdGxlOiBzdGFmZlsnQF9UaXRsZSddWzBdLFxyXG4gICAgICAgICAgICAgIGV4dG46IHN0YWZmWydAX0V4dG4nXVswXSxcclxuICAgICAgICAgICAgICBwaG9uZTogc3RhZmZbJ0BfUGhvbmUnXVswXSxcclxuICAgICAgICAgICAgfSkpLFxyXG4gICAgICAgICAgICAvL0B0cy1pZ25vcmVcclxuICAgICAgICAgIH0seG1sT2JqZWN0LmV4dHJhRGF0YV0pO1xyXG4gICAgICAgIH0pXHJcbiAgICAgICAgLmNhdGNoKHJlaik7XHJcbiAgICB9KTtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIEdldHMgdGhlIHNjaGVkdWxlIG9mIHRoZSBzdHVkZW50XHJcbiAgICogQHBhcmFtIHtudW1iZXJ9IHRlcm1JbmRleCBUaGUgaW5kZXggb2YgdGhlIHRlcm0uXHJcbiAgICogQHJldHVybnMge1Byb21pc2U8U2NoZWR1bGU+fSBSZXR1cm5zIHRoZSBzY2hlZHVsZSBvZiB0aGUgc3R1ZGVudFxyXG4gICAqIEBkZXNjcmlwdGlvblxyXG4gICAqIGBgYGpzXHJcbiAgICogYXdhaXQgc2NoZWR1bGUoMCkgLy8gLT4geyB0ZXJtOiB7IGluZGV4OiAwLCBuYW1lOiAnMXN0IFF0ciBQcm9ncmVzcycgfSwgLi4uIH1cclxuICAgKiBgYGBcclxuICAgKi9cclxuICBwdWJsaWMgc2NoZWR1bGUodGVybUluZGV4PzogbnVtYmVyKTogUHJvbWlzZTxbYW55LGFueV0+IHtcclxuICAgIHJldHVybiBuZXcgUHJvbWlzZSgocmVzLCByZWopID0+IHtcclxuICAgICAgc3VwZXJcclxuICAgICAgICAucHJvY2Vzc1JlcXVlc3Q8YW55Pih7XHJcbiAgICAgICAgICBtZXRob2ROYW1lOiAnU3R1ZGVudENsYXNzTGlzdCcsXHJcbiAgICAgICAgICBwYXJhbVN0cjogeyBjaGlsZEludElkOiAwLCAuLi4odGVybUluZGV4ICE9IG51bGwgPyB7IFRlcm1JbmRleDogdGVybUluZGV4IH0gOiB7fSkgfSxcclxuICAgICAgICB9KVxyXG4gICAgICAgIC50aGVuKCh4bWxPYmplY3Q6YW55KSA9PiB7XHJcbiAgICAgICAgICB2YXIgcmVzcG9uc2U6YW55PXt9XHJcbiAgICAgICAgICByZXNwb25zZS50ZXJtTmFtZT14bWxPYmplY3QuU3R1ZGVudENsYXNzU2NoZWR1bGVbMF1bJ0BfVGVybUluZGV4TmFtZSddWzBdOyAvL2NvdWxkIHNvbWV0aW1lcyBiZSBzdHJpbmdzIGJ1dCBmdWNrIHRoYXRcclxuICAgICAgICAgIHJlc3BvbnNlLnRlcm1JbmRleD14bWxPYmplY3QuU3R1ZGVudENsYXNzU2NoZWR1bGVbMF1bJ0BfVGVybUluZGV4J11bMF07XHJcbiAgICAgICAgICAvL2ZvciBub3cgd2UncmUgbm90IGdyYWJiaW5nIHRoZSB0ZXJtcyBmb3IgdGhlIGNvbmNjdXJlbnQgc2Nob29sLCB0aGV5IGxvd2sgZG9uJ3QgbWF0dGVyXHJcbiAgICAgICAgICByZXNwb25zZS50ZXJtcz14bWxPYmplY3QuU3R1ZGVudENsYXNzU2NoZWR1bGVbMF0uVGVybUxpc3RzWzBdLlRlcm1MaXN0aW5nLm1hcCgodGVybTphbnkpPT4oe3N0YXJ0OnRlcm1bJ0BfQmVnaW5EYXRlJ11bMF0sZW5kOnRlcm1bJ0BfRW5kRGF0ZSddWzBdLHRlcm1JbmRleDp0ZXJtWydAX1Rlcm1JbmRleCddWzBdLHRlcm1OYW1lOnRlcm1bJ0BfVGVybU5hbWUnXVswXX0pKVxyXG4gICAgICAgICAgXHJcbiAgICAgICAgICByZXNwb25zZS5tYWluQ2xhc3Nlcz14bWxPYmplY3QuU3R1ZGVudENsYXNzU2NoZWR1bGVbMF0uQ2xhc3NMaXN0c1swXS5DbGFzc0xpc3RpbmcubWFwKChjb3Vyc2U6YW55KT0+KHtuYW1lOmNvdXJzZVsnQF9Db3Vyc2VUaXRsZSddWzBdLHBlcmlvZDpjb3Vyc2VbJ0BfUGVyaW9kJ11bMF0sdGVhY2hlcjpjb3Vyc2VbJ0BfVGVhY2hlciddWzBdLHJvb206Y291cnNlWydAX1Jvb21OYW1lJ11bMF19KSlcclxuICAgICAgICAgIHZhciBjaGVja2VyPWZhbHNlO1xyXG4gICAgICAgICAgdHJ5e1xyXG4gICAgICAgICAgICBjaGVja2VyPXhtbE9iamVjdC5TdHVkZW50Q2xhc3NTY2hlZHVsZVswXS5Db25jdXJyZW50U2Nob29sU3R1ZGVudENsYXNzU2NoZWR1bGVzWzBdLkNvbmN1cnJlbnRTY2hvb2xTdHVkZW50Q2xhc3NTY2hlZHVsZVswXS5cclxuICAgICAgICAgICAgQ29uU2NoQ2xhc3NMaXN0c1swXS5DbGFzc0xpc3RpbmdbMF0hPScnXHJcbiAgICAgICAgICAgIFxyXG4gICAgICAgICAgfWNhdGNoe31cclxuXHJcbiAgICAgICAgICBcclxuICAgICAgICAgIGlmKGNoZWNrZXIpe1xyXG4gICAgICAgICAgICByZXNwb25zZS5jb25DbGFzc2VzPXhtbE9iamVjdC5TdHVkZW50Q2xhc3NTY2hlZHVsZVswXS5Db25jdXJyZW50U2Nob29sU3R1ZGVudENsYXNzU2NoZWR1bGVzWzBdLkNvbmN1cnJlbnRTY2hvb2xTdHVkZW50Q2xhc3NTY2hlZHVsZVswXS5Db25TY2hDbGFzc0xpc3RzWzBdLkNsYXNzTGlzdGluZy5tYXAoKGNvdXJzZTphbnkpPT4oe25hbWU6Y291cnNlWydAX0NvdXJzZVRpdGxlJ11bMF0scGVyaW9kOmNvdXJzZVsnQF9QZXJpb2QnXVswXSx0ZWFjaGVyOmNvdXJzZVsnQF9UZWFjaGVyJ11bMF0scm9vbTpjb3Vyc2VbJ0BfUm9vbU5hbWUnXVswXX0pKVxyXG4gICAgICAgICAgICByZXNwb25zZS5jb25DbGFzc2VzLmNvbk5hbWU9eG1sT2JqZWN0LlN0dWRlbnRDbGFzc1NjaGVkdWxlWzBdLkNvbmN1cnJlbnRTY2hvb2xTdHVkZW50Q2xhc3NTY2hlZHVsZXNbMF0uQ29uY3VycmVudFNjaG9vbFN0dWRlbnRDbGFzc1NjaGVkdWxlWzBdWydAX1NjaG9vbE5hbWUnXVxyXG4gICAgICAgICAgfVxyXG4gICAgICAgICAgdHJ5e1xyXG4gICAgICAgICAgaWYoeG1sT2JqZWN0LlN0dWRlbnRDbGFzc1NjaGVkdWxlWzBdLlRvZGF5U2NoZWR1bGVJbmZvRGF0YVswXS5TY2hvb2xJbmZvc1swXSE9Jycpe1xyXG4gICAgICAgICAgICByZXNwb25zZS50b2RheT17fVxyXG4gICAgICAgICAgICByZXNwb25zZS50b2RheS5tYWluPXhtbE9iamVjdC5TdHVkZW50Q2xhc3NTY2hlZHVsZVswXS5Ub2RheVNjaGVkdWxlSW5mb0RhdGFbMF0uU2Nob29sSW5mb3NbMF0uU2Nob29sSW5mb1swXS5DbGFzc2VzWzBdLkNsYXNzSW5mby5tYXAoKGNvdXJzZTphbnkpPT4oe25hbWU6Y291cnNlWydAX0NsYXNzTmFtZSddLHN0YXJ0OmNvdXJzZVsnQF9TdGFydFRpbWUnXSxlbmQ6Y291cnNlWydAX0VuZFRpbWUnXSx0ZWFjaGVyOmNvdXJzZVsnQF9UZWFjaGVyTmFtZSddLHBlcmlvZDpjb3Vyc2VbJ0BfUGVyaW9kJ10scm9vbTpjb3Vyc2VbJ0BfUm9vbU5hbWUnXX0pKVxyXG4gICAgICAgICAgICB0cnl7XHJcbiAgICAgICAgICAgICAgcmVzcG9uc2UudG9kYXkuY29uPXhtbE9iamVjdC5TdHVkZW50Q2xhc3NTY2hlZHVsZVswXS5Ub2RheVNjaGVkdWxlSW5mb0RhdGFbMF0uU2Nob29sSW5mb3NbMF0uU2Nob29sSW5mb1sxXS5DbGFzc2VzWzBdLkNsYXNzSW5mby5tYXAoKGNvdXJzZTphbnkpPT4oe25hbWU6Y291cnNlWydAX0NsYXNzTmFtZSddLHN0YXJ0OmNvdXJzZVsnQF9TdGFydFRpbWUnXSxlbmQ6Y291cnNlWydAX0VuZFRpbWUnXSx0ZWFjaGVyOmNvdXJzZVsnQF9UZWFjaGVyTmFtZSddLHBlcmlvZDpjb3Vyc2VbJ0BfUGVyaW9kJ10scm9vbTpjb3Vyc2VbJ0BfUm9vbU5hbWUnXX0pKVxyXG4gICAgICAgICAgICAgIHJlc3BvbnNlLnRvZGF5LmNvbk5hbWU9eG1sT2JqZWN0LlN0dWRlbnRDbGFzc1NjaGVkdWxlWzBdLlRvZGF5U2NoZWR1bGVJbmZvRGF0YVswXS5TY2hvb2xJbmZvc1swXS5TY2hvb2xpbmZvWzFdWydAX1NjaG9vbE5hbWUnXTtcclxuICAgICAgICAgICAgfWNhdGNoe2NvbnNvbGUubG9nKFwibm8gY29uY3VycmVudFwiKX1cclxuICAgICAgICAgIH1cclxuICAgICAgICAgIGVsc2V7XHJcbiAgICAgICAgICAgIHJlc3BvbnNlLnRvZGF5PWZhbHNlXHJcbiAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgXHJcbiAgICAgICAgICB9Y2F0Y2goZXJyb3Ipe2NvbnNvbGUubG9nKGVycm9yKTtyZXNwb25zZS50b2RheT1mYWxzZX1cclxuICAgICAgICAgIHJlcyhbcmVzcG9uc2UseG1sT2JqZWN0LmV4dHJhRGF0YV0pXHJcbiAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgLy9AdHMtaWdub3JlXHJcblxyXG4gICAgICAgIClcclxuICAgICAgICAuY2F0Y2gocmVqKTtcclxuICAgIH0pO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogUmV0dXJucyB0aGUgYXR0ZW5kYW5jZSBvZiB0aGUgc3R1ZGVudFxyXG4gICAqIEByZXR1cm5zIHtQcm9taXNlPEF0dGVuZGFuY2U+fSBSZXR1cm5zIGFuIEF0dGVuZGFuY2Ugb2JqZWN0XHJcbiAgICogQGRlc2NyaXB0aW9uXHJcbiAgICogYGBganNcclxuICAgKiBjbGllbnQuYXR0ZW5kYW5jZSgpXHJcbiAgICogIC50aGVuKGNvbnNvbGUubG9nKTsgLy8gLT4geyB0eXBlOiAnUGVyaW9kJywgcGVyaW9kOiB7Li4ufSwgc2Nob29sTmFtZTogJ1VuaXZlcnNpdHkgSGlnaCBTY2hvb2wnLCBhYnNlbmNlczogWy4uLl0sIHBlcmlvZEluZm9zOiBbLi4uXSB9XHJcbiAgICogYGBgXHJcbiAgICovXHJcbiAgcHVibGljIGF0dGVuZGFuY2UoKTogUHJvbWlzZTxbQXR0ZW5kYW5jZSxhbnldPiB7XHJcbiAgICByZXR1cm4gbmV3IFByb21pc2UoKHJlcywgcmVqKSA9PiB7XHJcbiAgICAgIHN1cGVyXHJcbiAgICAgICAgLnByb2Nlc3NSZXF1ZXN0PEF0dGVuZGFuY2VYTUxPYmplY3Q+KHtcclxuICAgICAgICAgIG1ldGhvZE5hbWU6ICdBdHRlbmRhbmNlJyxcclxuICAgICAgICAgIHBhcmFtU3RyOiB7XHJcbiAgICAgICAgICAgIGNoaWxkSW50SWQ6IDAsXHJcbiAgICAgICAgICB9LFxyXG4gICAgICAgIH0pXHJcbiAgICAgICAgLnRoZW4oKGF0dGVuZGFuY2VYTUxPYmplY3QpID0+IHtcclxuICAgICAgICAgIGNvbnN0IHhtbE9iamVjdCA9IGF0dGVuZGFuY2VYTUxPYmplY3QuQXR0ZW5kYW5jZVswXTtcclxuICAgICAgICAgIC8vQHRzLWlnbm9yZVxyXG4gICAgICAgICAgeG1sT2JqZWN0LmV4dHJhRGF0YT1hdHRlbmRhbmNlWE1MT2JqZWN0LmV4dHJhRGF0YVxyXG5cclxuICAgICAgICAgIHJlcyhbe1xyXG4gICAgICAgICAgICB0eXBlOiB4bWxPYmplY3RbJ0BfVHlwZSddWzBdLFxyXG4gICAgICAgICAgICBwZXJpb2Q6IHtcclxuICAgICAgICAgICAgICB0b3RhbDogTnVtYmVyKHhtbE9iamVjdFsnQF9QZXJpb2RDb3VudCddWzBdKSxcclxuICAgICAgICAgICAgICBzdGFydDogTnVtYmVyKHhtbE9iamVjdFsnQF9TdGFydFBlcmlvZCddWzBdKSxcclxuICAgICAgICAgICAgICBlbmQ6IE51bWJlcih4bWxPYmplY3RbJ0BfRW5kUGVyaW9kJ11bMF0pLFxyXG4gICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICBzY2hvb2xOYW1lOiB4bWxPYmplY3RbJ0BfU2Nob29sTmFtZSddWzBdLFxyXG4gICAgICAgICAgICBhYnNlbmNlczogeG1sT2JqZWN0LkFic2VuY2VzWzBdLkFic2VuY2VcclxuICAgICAgICAgICAgICA/IHhtbE9iamVjdC5BYnNlbmNlc1swXS5BYnNlbmNlLm1hcCgoYWJzZW5jZSkgPT4gKHtcclxuICAgICAgICAgICAgICAgICAgZGF0ZTogbmV3IERhdGUoYWJzZW5jZVsnQF9BYnNlbmNlRGF0ZSddWzBdKSxcclxuICAgICAgICAgICAgICAgICAgcmVhc29uOiBhYnNlbmNlWydAX1JlYXNvbiddWzBdLFxyXG4gICAgICAgICAgICAgICAgICBub3RlOiBhYnNlbmNlWydAX05vdGUnXVswXSxcclxuICAgICAgICAgICAgICAgICAgZGVzY3JpcHRpb246IGFic2VuY2VbJ0BfQ29kZUFsbERheURlc2NyaXB0aW9uJ11bMF0sXHJcbiAgICAgICAgICAgICAgICAgIHBlcmlvZHM6IGFic2VuY2UuUGVyaW9kc1swXS5QZXJpb2QubWFwKFxyXG4gICAgICAgICAgICAgICAgICAgIChwZXJpb2QpID0+XHJcbiAgICAgICAgICAgICAgICAgICAgICAoe1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBwZXJpb2Q6IE51bWJlcihwZXJpb2RbJ0BfTnVtYmVyJ11bMF0pLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICBuYW1lOiBwZXJpb2RbJ0BfTmFtZSddWzBdLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICByZWFzb246IHBlcmlvZFsnQF9SZWFzb24nXVswXSxcclxuICAgICAgICAgICAgICAgICAgICAgICAgY291cnNlOiBwZXJpb2RbJ0BfQ291cnNlJ11bMF0sXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHN0YWZmOiB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgbmFtZTogcGVyaW9kWydAX1N0YWZmJ11bMF0sXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgc3RhZmZHdTogcGVyaW9kWydAX1N0YWZmR1UnXVswXSxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICBlbWFpbDogcGVyaW9kWydAX1N0YWZmRU1haWwnXVswXSxcclxuICAgICAgICAgICAgICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgICAgICAgICAgICAgb3JnWWVhckd1OiBwZXJpb2RbJ0BfT3JnWWVhckdVJ11bMF0sXHJcbiAgICAgICAgICAgICAgICAgICAgICB9IGFzIEFic2VudFBlcmlvZClcclxuICAgICAgICAgICAgICAgICAgKSxcclxuICAgICAgICAgICAgICAgIH0pKVxyXG4gICAgICAgICAgICAgIDogW10sXHJcbiAgICAgICAgICAgIHBlcmlvZEluZm9zOiB4bWxPYmplY3QuVG90YWxBY3Rpdml0aWVzWzBdLlBlcmlvZFRvdGFsLm1hcCgocGQsIGkpID0+ICh7XHJcbiAgICAgICAgICAgICAgcGVyaW9kOiBOdW1iZXIocGRbJ0BfTnVtYmVyJ11bMF0pLFxyXG4gICAgICAgICAgICAgIHRvdGFsOiB7XHJcbiAgICAgICAgICAgICAgICBleGN1c2VkOiBOdW1iZXIoeG1sT2JqZWN0LlRvdGFsRXhjdXNlZFswXS5QZXJpb2RUb3RhbFtpXVsnQF9Ub3RhbCddWzBdKSxcclxuICAgICAgICAgICAgICAgIHRhcmRpZXM6IE51bWJlcih4bWxPYmplY3QuVG90YWxUYXJkaWVzWzBdLlBlcmlvZFRvdGFsW2ldWydAX1RvdGFsJ11bMF0pLFxyXG4gICAgICAgICAgICAgICAgdW5leGN1c2VkOiBOdW1iZXIoeG1sT2JqZWN0LlRvdGFsVW5leGN1c2VkWzBdLlBlcmlvZFRvdGFsW2ldWydAX1RvdGFsJ11bMF0pLFxyXG4gICAgICAgICAgICAgICAgYWN0aXZpdGllczogTnVtYmVyKHhtbE9iamVjdC5Ub3RhbEFjdGl2aXRpZXNbMF0uUGVyaW9kVG90YWxbaV1bJ0BfVG90YWwnXVswXSksXHJcbiAgICAgICAgICAgICAgICB1bmV4Y3VzZWRUYXJkaWVzOiBOdW1iZXIoeG1sT2JqZWN0LlRvdGFsVW5leGN1c2VkVGFyZGllc1swXS5QZXJpb2RUb3RhbFtpXVsnQF9Ub3RhbCddWzBdKSxcclxuICAgICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICB9KSkgYXMgUGVyaW9kSW5mb1tdLFxyXG4gICAgICAgICAgfSBhcyBBdHRlbmRhbmNlLFxyXG4gICAgICAgICAgLy9AdHMtaWdub3JlXHJcbiAgICAgICAgeG1sT2JqZWN0LmV4dHJhRGF0YV1cclxuICAgICAgICApO1xyXG4gICAgICAgIH0pXHJcbiAgICAgICAgLmNhdGNoKHJlaik7XHJcbiAgICB9KTtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIFJldHVybnMgdGhlIGdyYWRlYm9vayBvZiB0aGUgc3R1ZGVudFxyXG4gICAqIEBwYXJhbSB7bnVtYmVyfSByZXBvcnRpbmdQZXJpb2RJbmRleCBUaGUgdGltZWZyYW1lIHRoYXQgdGhlIGdyYWRlYm9vayBzaG91bGQgcmV0dXJuXHJcbiAgICogQHJldHVybnMge1Byb21pc2U8R3JhZGVib29rPn0gUmV0dXJucyBhIEdyYWRlYm9vayBvYmplY3RcclxuICAgKiBAZGVzY3JpcHRpb25cclxuICAgKiBgYGBqc1xyXG4gICAqIGNvbnN0IGdyYWRlYm9vayA9IGF3YWl0IGNsaWVudC5ncmFkZWJvb2soKTtcclxuICAgKiBjb25zb2xlLmxvZyhncmFkZWJvb2spOyAvLyB7IGVycm9yOiAnJywgdHlwZTogJ1RyYWRpdGlvbmFsJywgcmVwb3J0aW5nUGVyaW9kOiB7Li4ufSwgY291cnNlczogWy4uLl0gfTtcclxuICAgKlxyXG4gICAqIGF3YWl0IGNsaWVudC5ncmFkZWJvb2soMCkgLy8gU29tZSBzY2hvb2xzIHdpbGwgaGF2ZSBSZXBvcnRpbmdQZXJpb2RJbmRleCAwIGFzIFwiMXN0IFF1YXJ0ZXIgUHJvZ3Jlc3NcIlxyXG4gICAqIGF3YWl0IGNsaWVudC5ncmFkZWJvb2soNykgLy8gU29tZSBzY2hvb2xzIHdpbGwgaGF2ZSBSZXBvcnRpbmdQZXJpb2RJbmRleCA3IGFzIFwiNHRoIFF1YXJ0ZXJcIlxyXG4gICAqIGBgYFxyXG4gICAqL1xyXG4gIHB1YmxpYyBncmFkZWJvb2socmVwb3J0aW5nUGVyaW9kSW5kZXg/OiBudW1iZXIsb3JnWWVhckd1PzpzdHJpbmcsIGZyZXNoPXRydWUpOiBQcm9taXNlPFtHcmFkZWJvb2ssYW55XT4ge1xyXG4gICAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXMsIHJlaikgPT4ge1xyXG4gICAgICBsZXQgeDphbnk9ZmFsc2U7XHJcbiAgICAgICBjb25zdCBtYWluQnJhbmNoID0gKCkgPT4ge1xyXG4gICAgICBzdXBlclxyXG4gICAgICAgIC5wcm9jZXNzUmVxdWVzdDxHcmFkZWJvb2tYTUxPYmplY3Qme2V4dHJhRGF0YT86YW55fT4oXHJcbiAgICAgICAgICB7XHJcbiAgICAgICAgICAgIG1ldGhvZE5hbWU6ICdHcmFkZWJvb2snLFxyXG4gICAgICAgICAgICBwYXJhbVN0cjoge1xyXG4gICAgICAgICAgICAgIGNoaWxkSW50SWQ6IDAsXHJcbiAgICAgICAgICAgICAgLi4uKHJlcG9ydGluZ1BlcmlvZEluZGV4ICE9IG51bGwgPyB7IFJlcG9ydFBlcmlvZDogcmVwb3J0aW5nUGVyaW9kSW5kZXggfSA6IHt9KSxcclxuICAgICAgICAgICAgICAuLi4ob3JnWWVhckd1ICE9IG51bGwgPyB7IENvbmN1cnJlbnRTY2hPcmdZZWFyR1U6IG9yZ1llYXJHdSB9IDoge30pXHJcbiAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICB9LFxyXG4gICAgICAgICAgKHhtbCkgPT5cclxuICAgICAgICAgICAgbmV3IFhNTEZhY3RvcnkoeG1sKVxyXG4gICAgICAgICAgICAgIC5lbmNvZGVBdHRyaWJ1dGUoJ01lYXN1cmVEZXNjcmlwdGlvbicsICdIYXNEcm9wQm94JylcclxuICAgICAgICAgICAgICAuZW5jb2RlQXR0cmlidXRlKCdNZWFzdXJlJywgJ1R5cGUnKVxyXG4gICAgICAgICAgICAgIC50b1N0cmluZygpXHJcbiAgICAgICAgKVxyXG4gICAgICAgIC50aGVuKCh4bWxPYmplY3Q6IEdyYWRlYm9va1hNTE9iamVjdCB8IGFueSkgPT4ge1xyXG4gICAgICAgICAgaWYoeCl7eG1sT2JqZWN0PXh9XHJcbiAgICAgICAgICBlbHNlIGlmKHJlcG9ydGluZ1BlcmlvZEluZGV4IT1udWxsKXtcclxuICAgICAgICAgICAgY29uc3QgeG1sQ2FjaGU6eG1sQ2FjaGU9SlNPTi5wYXJzZShsb2NhbFN0b3JhZ2UuZ2V0SXRlbShcInhtbENhY2hlXCIpID8/IFwie31cIik7XHJcbiAgICAgICAgICAgIGNvbnN0IGlkZW50aWZpZXI9dGhpcy5kaXN0cmljdCt0aGlzLnVzZXJuYW1lK3JlcG9ydGluZ1BlcmlvZEluZGV4XHJcbiAgICAgICAgICAgIHhtbENhY2hlW2lkZW50aWZpZXJdPXtkYXRhOnhtbE9iamVjdCxhZ2U6RGF0ZS5ub3coKX1cclxuICAgICAgICAgICAgbG9jYWxTdG9yYWdlLnNldEl0ZW0oXCJ4bWxDYWNoZVwiLEpTT04uc3RyaW5naWZ5KHhtbENhY2hlKSlcclxuICAgICAgICAgIH1cclxuICAgICAgICAgIHRyeXtcclxuICAgICAgICAgICAgaWYgKHhtbE9iamVjdC5SVF9FUlJPUlswXVsnQF9FUlJPUl9NRVNTQUdFJ11bMF0uaW5jbHVkZXMoXCJUaGUgdXNlciBuYW1lIG9yIHBhc3N3b3JkIGlzIGluY29ycmVjdFwiKXx8eG1sT2JqZWN0LlJUX0VSUk9SWzBdWydAX0VSUk9SX01FU1NBR0UnXVswXS5pbmNsdWRlcyhcIkludmFsaWQgdXNlciBpZCBvciBwYXNzd29yZFwiKSkge3JlaihuZXcgRXJyb3IoXCJJbnZhbGlkL0luY29ycmVjdCBVc2VybmFtZSBvciBQYXNzd29yZFwiKSk7fVxyXG4gICAgICAgICAgICBlbHNle3JlaihuZXcgUmVxdWVzdEV4Y2VwdGlvbih4bWxPYmplY3QpKX07fVxyXG4gICAgICAgICAgY2F0Y2goZSl7XHJcbiAgICAgICAgXHJcbiAgICAgICAgICByZXMoW3tcclxuICAgICAgICAgICAgZXJyb3I6IHhtbE9iamVjdC5HcmFkZWJvb2tbMF1bJ0BfRXJyb3JNZXNzYWdlJ11bMF0sXHJcbiAgICAgICAgICAgIHR5cGU6IHhtbE9iamVjdC5HcmFkZWJvb2tbMF1bJ0BfVHlwZSddWzBdLFxyXG4gICAgICAgICAgICByZXBvcnRpbmdQZXJpb2Q6IHtcclxuICAgICAgICAgICAgICBjdXJyZW50OiB7XHJcbiAgICAgICAgICAgICAgICBpbmRleDpcclxuICAgICAgICAgICAgICAgICAgcmVwb3J0aW5nUGVyaW9kSW5kZXggPz9cclxuICAgICAgICAgICAgICAgICAgTnVtYmVyKFxyXG4gICAgICAgICAgICAgICAgICAgIHhtbE9iamVjdC5HcmFkZWJvb2tbMF0uUmVwb3J0aW5nUGVyaW9kc1swXS5SZXBvcnRQZXJpb2QuZmluZChcclxuICAgICAgICAgICAgICAgICAgICAgICh4OmFueSkgPT4geFsnQF9HcmFkZVBlcmlvZCddWzBdID09PSB4bWxPYmplY3QuR3JhZGVib29rWzBdLlJlcG9ydGluZ1BlcmlvZFswXVsnQF9HcmFkZVBlcmlvZCddWzBdXHJcbiAgICAgICAgICAgICAgICAgICAgKT8uWydAX0luZGV4J11bMF1cclxuICAgICAgICAgICAgICAgICAgKSxcclxuICAgICAgICAgICAgICAgIGRhdGU6IHtcclxuICAgICAgICAgICAgICAgICAgc3RhcnQ6IG5ldyBEYXRlKHhtbE9iamVjdC5HcmFkZWJvb2tbMF0uUmVwb3J0aW5nUGVyaW9kWzBdWydAX1N0YXJ0RGF0ZSddWzBdKSxcclxuICAgICAgICAgICAgICAgICAgZW5kOiBuZXcgRGF0ZSh4bWxPYmplY3QuR3JhZGVib29rWzBdLlJlcG9ydGluZ1BlcmlvZFswXVsnQF9FbmREYXRlJ11bMF0pLFxyXG4gICAgICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgICAgIG5hbWU6IHhtbE9iamVjdC5HcmFkZWJvb2tbMF0uUmVwb3J0aW5nUGVyaW9kWzBdWydAX0dyYWRlUGVyaW9kJ11bMF0sXHJcbiAgICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgICBhdmFpbGFibGU6IHhtbE9iamVjdC5HcmFkZWJvb2tbMF0uUmVwb3J0aW5nUGVyaW9kc1swXS5SZXBvcnRQZXJpb2QubWFwKChwZXJpb2Q6YW55KSA9PiAoe1xyXG4gICAgICAgICAgICAgICAgZGF0ZTogeyBzdGFydDogbmV3IERhdGUocGVyaW9kWydAX1N0YXJ0RGF0ZSddWzBdKSwgZW5kOiBuZXcgRGF0ZShwZXJpb2RbJ0BfRW5kRGF0ZSddWzBdKSB9LFxyXG4gICAgICAgICAgICAgICAgbmFtZTogcGVyaW9kWydAX0dyYWRlUGVyaW9kJ11bMF0sXHJcbiAgICAgICAgICAgICAgICBpbmRleDogTnVtYmVyKHBlcmlvZFsnQF9JbmRleCddWzBdKSxcclxuICAgICAgICAgICAgICB9KSksXHJcbiAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgIGNvdXJzZXM6IHhtbE9iamVjdC5HcmFkZWJvb2tbMF0uQ291cnNlc1swXS5Db3Vyc2UubWFwKChjb3Vyc2U6YW55KSA9PiAoe1xyXG4gICAgICAgICAgICAgIGNvdXJzZUlEOiBjb3Vyc2VbJ0BfQ291cnNlSUQnXT8uWzBdID8/IFwiXCIsXHJcbiAgICAgICAgICAgICAgcGVyaW9kOiBOdW1iZXIoY291cnNlWydAX1BlcmlvZCddWzBdKSxcclxuICAgICAgICAgICAgICB0aXRsZTogaGUuZGVjb2RlKGNvdXJzZVsnQF9UaXRsZSddWzBdKSxcclxuICAgICAgICAgICAgICByb29tOiBjb3Vyc2VbJ0BfUm9vbSddWzBdLFxyXG4gICAgICAgICAgICAgIHN0YWZmOiB7XHJcbiAgICAgICAgICAgICAgICBuYW1lOiBjb3Vyc2VbJ0BfU3RhZmYnXVswXSxcclxuICAgICAgICAgICAgICAgIGVtYWlsOiBjb3Vyc2VbJ0BfU3RhZmZFTWFpbCddWzBdLFxyXG4gICAgICAgICAgICAgICAgc3RhZmZHdTogY291cnNlWydAX1N0YWZmR1UnXVswXSxcclxuICAgICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICAgIG1hcmtzOiB0eXBlb2YoY291cnNlLk1hcmtzWzBdKSE9PSdzdHJpbmcnID8gKGNvdXJzZS5NYXJrc1swXS5NYXJrLm1hcCgobWFyazphbnkpID0+ICh7XHJcbiAgICAgICAgICAgICAgICBuYW1lOiBtYXJrWydAX01hcmtOYW1lJ11bMF0sXHJcbiAgICAgICAgICAgICAgICBjYWxjdWxhdGVkU2NvcmU6IHtcclxuICAgICAgICAgICAgICAgICAgc3RyaW5nOiBtYXJrWydAX0NhbGN1bGF0ZWRTY29yZVN0cmluZyddWzBdLFxyXG4gICAgICAgICAgICAgICAgICByYXc6IE51bWJlcihtYXJrWydAX0NhbGN1bGF0ZWRTY29yZVJhdyddWzBdKSxcclxuICAgICAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgICAgICB3ZWlnaHRlZENhdGVnb3JpZXM6XHJcbiAgICAgICAgICAgICAgICAgIHR5cGVvZiBtYXJrWydHcmFkZUNhbGN1bGF0aW9uU3VtbWFyeSddWzBdICE9PSAnc3RyaW5nJ1xyXG4gICAgICAgICAgICAgICAgICAgID8gbWFya1snR3JhZGVDYWxjdWxhdGlvblN1bW1hcnknXVswXS5Bc3NpZ25tZW50R3JhZGVDYWxjLm1hcChcclxuICAgICAgICAgICAgICAgICAgICAgICAgKHdlaWdodGVkOiB7IFt4OiBzdHJpbmddOiBhbnlbXTsgfSkgPT5cclxuICAgICAgICAgICAgICAgICAgICAgICAgICAoe1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdHlwZTogaGUuZGVjb2RlKHdlaWdodGVkWydAX1R5cGUnXVswXSksXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjYWxjdWxhdGVkTWFyazogd2VpZ2h0ZWRbJ0BfQ2FsY3VsYXRlZE1hcmsnXVswXSxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHdlaWdodDoge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICBldmFsdWF0ZWQ6IHdlaWdodGVkWydAX1dlaWdodGVkUGN0J11bMF0sXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHN0YW5kYXJkOiB3ZWlnaHRlZFsnQF9XZWlnaHQnXVswXSxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBwb2ludHM6IHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgY3VycmVudDogTnVtYmVyKHdlaWdodGVkWydAX1BvaW50cyddWzBdKSxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcG9zc2libGU6IE51bWJlcih3ZWlnaHRlZFsnQF9Qb2ludHNQb3NzaWJsZSddWzBdKSxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgfSBhcyBXZWlnaHRlZENhdGVnb3J5KVxyXG4gICAgICAgICAgICAgICAgICAgICAgKVxyXG4gICAgICAgICAgICAgICAgICAgIDogW10sXHJcbiAgICAgICAgICAgICAgICBhc3NpZ25tZW50czpcclxuICAgICAgICAgICAgICAgICAgdHlwZW9mIG1hcmsuQXNzaWdubWVudHNbMF0gIT09ICdzdHJpbmcnXHJcbiAgICAgICAgICAgICAgICAgICAgPyAobWFyay5Bc3NpZ25tZW50c1swXS5Bc3NpZ25tZW50Lm1hcCgoYXNzaWdubWVudDphbnkpID0+ICh7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGdyYWRlYm9va0lkOiBhc3NpZ25tZW50WydAX0dyYWRlYm9va0lEJ11bMF0sXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIG5hbWU6IGRlY29kZVVSSShhc3NpZ25tZW50WydAX01lYXN1cmUnXVswXSksXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHR5cGU6IGhlLmRlY29kZShhc3NpZ25tZW50WydAX1R5cGUnXVswXSksXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGRhdGU6IHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICBzdGFydDogbmV3IERhdGUoYXNzaWdubWVudFsnQF9EYXRlJ11bMF0pLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgIGR1ZTogbmV3IERhdGUoYXNzaWdubWVudFsnQF9EdWVEYXRlJ11bMF0pLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICAgICAgICAgICAgICBzY29yZToge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgIHR5cGU6IGhlLmRlY29kZShhc3NpZ25tZW50WydAX1Njb3JlVHlwZSddWzBdKSxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICB2YWx1ZTogYXNzaWdubWVudFsnQF9TY29yZSddICE9PSB1bmRlZmluZWQgPyBhc3NpZ25tZW50WydAX1Njb3JlJ10gOiBcIk5vdCBHcmFkZWRcIixcclxuICAgICAgICAgICAgICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgICAgICAgICAgICAgcG9pbnRzOiBhc3NpZ25tZW50WydAX1BvaW50cyddWzBdLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICBub3RlczogaGUuZGVjb2RlKGFzc2lnbm1lbnRbJ0BfTm90ZXMnXVswXSksXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHRlYWNoZXJJZDogYXNzaWdubWVudFsnQF9UZWFjaGVySUQnXVswXSxcclxuICAgICAgICAgICAgICAgICAgICAgICAgZGVzY3JpcHRpb246IGRlY29kZVVSSShhc3NpZ25tZW50WydAX01lYXN1cmVEZXNjcmlwdGlvbiddWzBdKSxcclxuICAgICAgICAgICAgICAgICAgICAgICAgaGFzRHJvcGJveDogSlNPTi5wYXJzZShhc3NpZ25tZW50WydAX0hhc0Ryb3BCb3gnXVswXSksXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHN0dWRlbnRJZDogYXNzaWdubWVudFsnQF9TdHVkZW50SUQnXVswXSxcclxuICAgICAgICAgICAgICAgICAgICAgICAgZHJvcGJveERhdGU6IHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICBzdGFydDogbmV3IERhdGUoYXNzaWdubWVudFsnQF9Ecm9wU3RhcnREYXRlJ11bMF0pLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgIGVuZDogbmV3IERhdGUoYXNzaWdubWVudFsnQF9Ecm9wRW5kRGF0ZSddWzBdKSxcclxuICAgICAgICAgICAgICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgICAgICAgICAgICAgcmVzb3VyY2VzOlxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgIHR5cGVvZiBhc3NpZ25tZW50LlJlc291cmNlc1swXSAhPT0gJ3N0cmluZydcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgID8gLyooYXNzaWdubWVudC5SZXNvdXJjZXNbMF0uUmVzb3VyY2UubWFwKChyc3JjOmFueSkgPT4ge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHN3aXRjaCAocnNyY1snQF9UeXBlJ11bMF0pIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNhc2UgJ0ZpbGUnOiB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IGZpbGVSc3JjID0gcnNyYyBhcyBGaWxlUmVzb3VyY2VYTUxPYmplY3Q7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdHlwZTogUmVzb3VyY2VUeXBlLkZJTEUsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZmlsZToge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdHlwZTogZmlsZVJzcmNbJ0BfRmlsZVR5cGUnXVswXSxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG5hbWU6IGZpbGVSc3JjWydAX0ZpbGVOYW1lJ11bMF0sXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB1cmk6IHRoaXMuaG9zdFVybCArIGZpbGVSc3JjWydAX1NlcnZlckZpbGVOYW1lJ11bMF0sXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXNvdXJjZToge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZGF0ZTogbmV3IERhdGUoZmlsZVJzcmNbJ0BfUmVzb3VyY2VEYXRlJ11bMF0pLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaWQ6IGZpbGVSc3JjWydAX1Jlc291cmNlSUQnXVswXSxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG5hbWU6IGZpbGVSc3JjWydAX1Jlc291cmNlTmFtZSddWzBdLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0gYXMgRmlsZVJlc291cmNlO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgY2FzZSAnVVJMJzoge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb25zdCB1cmxSc3JjID0gcnNyYyBhcyBVUkxSZXNvdXJjZVhNTE9iamVjdDtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB1cmw6IHVybFJzcmNbJ0BfVVJMJ10gIT09IHVuZGVmaW5lZCA/IHVybFJzcmNbJ0BfVVJMJ10gOiBcIk5vdCBHaXZlblwiLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHR5cGU6IFJlc291cmNlVHlwZS5VUkwsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcmVzb3VyY2U6IHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGRhdGU6IG5ldyBEYXRlKHVybFJzcmNbJ0BfUmVzb3VyY2VEYXRlJ11bMF0pLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaWQ6IHVybFJzcmNbJ0BfUmVzb3VyY2VJRCddWzBdLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgbmFtZTogdXJsUnNyY1snQF9SZXNvdXJjZU5hbWUnXVswXSxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGRlc2NyaXB0aW9uOiB1cmxSc3JjWydAX1Jlc291cmNlRGVzY3JpcHRpb24nXVswXSxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHBhdGg6IHVybFJzcmNbJ0BfU2VydmVyRmlsZU5hbWUnXVswXSxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfSBhcyBVUkxSZXNvdXJjZTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGRlZmF1bHQ6XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJlaihcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBgVHlwZSAke3JzcmNbJ0BfVHlwZSddWzBdfSBkb2VzIG5vdCBleGlzdCBhcyBhIHR5cGUuIEFkZCBpdCB0byB0eXBlIGRlY2xhcmF0aW9ucy5gXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9KSBhcyAoRmlsZVJlc291cmNlIHwgVVJMUmVzb3VyY2UpW10pICovIFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy9PYnZpb3VzbHkgdGhpcyBpcyBhbiBpbnNhbmVseSBuZWdsaWdlbnQgZml4LiBKdXN0IHNheWluZyB0byBjb21wbGV0ZSBoZWxsIHdpdGggdGhlIHJlc291cmNlLiBCdXQsIGdyYWRlIG1lbG9uIGRvZXNuJ3QgdXNlIGl0LiBTbyBJIGRvbid0IGNhcmUuXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgIFtdIDogW10sXHJcbiAgICAgICAgICAgICAgICAgICAgICB9KSkgYXMgQXNzaWdubWVudFtdKVxyXG4gICAgICAgICAgICAgICAgICAgIDogW10sXHJcbiAgICAgICAgICAgICAgfSkpKSBhcyBNYXJrW106W3sgbmFtZTogXCJub25lXCIsIGNhbGN1bGF0ZWRTY29yZTogeyBzdHJpbmc6IFwibm9uZVwiLCByYXc6IE5hTiB9LCB3ZWlnaHRlZENhdGVnb3JpZXM6IFtdLCBhc3NpZ25tZW50czogW10gfV0gYXMgTWFya1tdLFxyXG4gICAgICAgICAgICB9KSksXHJcbiAgICAgICAgICB9IGFzIEdyYWRlYm9vayxcclxuICAgICAgICB4bWxPYmplY3QuZXh0cmFEYXRhXVxyXG4gICAgICAgICk7fVxyXG4gICAgICAgIH0pXHJcbiAgICAgICAgLmNhdGNoKHJlaik7fVxyXG4gICAgXHJcbiAgICAgIGlmKGZyZXNofHxyZXBvcnRpbmdQZXJpb2RJbmRleD09bnVsbCl7XHJcbiAgICAgICAgbWFpbkJyYW5jaCgpXHJcbiAgICAgIH0gICBcclxuICAgICAgICBlbHNle1xyXG4gICAgICAgICAgY29uc3QgbTp4bWxDYWNoZSA9IEpTT04ucGFyc2UobG9jYWxTdG9yYWdlLmdldEl0ZW0oXCJ4bWxDYWNoZVwiKSA/PyBcInt9XCIpXHJcbiAgICAgICAgICBjb25zdCBpZGVudGlmaWVyPXRoaXMuZGlzdHJpY3QrdGhpcy51c2VybmFtZStyZXBvcnRpbmdQZXJpb2RJbmRleFxyXG4gICAgICAgICAgaWYobVtpZGVudGlmaWVyXSl7XHJcbiAgICAgICAgICAgIGlmKE1hdGguYWJzKG1baWRlbnRpZmllcl0uYWdlLURhdGUubm93KCkpPjEwMDAqNjAqNjAqMjQqMyl7IC8vIGlmIG9sZGVyIHRoYW4gMyBkYXlzLCByZWZyZXNoIFxyXG4gICAgICAgICAgICAgIG1haW5CcmFuY2goKVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIGVsc2V7XHJcbiAgICAgICAgICAgICAgICB4PW1baWRlbnRpZmllcl0uZGF0YVxyXG4gICAgICAgICAgICAgICAgbWFpbkJyYW5jaCgpXHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgfVxyXG4gICAgfSk7XHJcbiAgfVxyXG5cclxuXHJcblxyXG4gIC8qKlxyXG4gICAqIEdldCBhIGxpc3Qgb2YgbWVzc2FnZXMgb2YgdGhlIHN0dWRlbnRcclxuICAgKiBAcmV0dXJucyB7UHJvbWlzZTxNZXNzYWdlW10+fSBSZXR1cm5zIGFuIGFycmF5IG9mIG1lc3NhZ2VzIG9mIHRoZSBzdHVkZW50XHJcbiAgICogQGRlc2NyaXB0aW9uXHJcbiAgICogYGBganNcclxuICAgKiBhd2FpdCBjbGllbnQubWVzc2FnZXMoKTsgLy8gLT4gW3sgaWQ6ICdFOTcyRjFCQy05OUEwLTRDRDAtOEQxNS1CMTg5NjhCNDNFMDgnLCB0eXBlOiAnU3R1ZGVudEFjdGl2aXR5JywgLi4uIH0sIHsgaWQ6ICc4NkZEQTExRC00MkM3LTQyNDktQjAwMy05NEIxNUVCMkM4RDQnLCB0eXBlOiAnU3R1ZGVudEFjdGl2aXR5JywgLi4uIH1dXHJcbiAgICogYGBgXHJcbiAgICovXHJcbiAgcHVibGljIG1lc3NhZ2VzKCk6IFByb21pc2U8W01lc3NhZ2VbXSxhbnldPiB7XHJcbiAgICByZXR1cm4gbmV3IFByb21pc2UoKHJlcywgcmVqKSA9PiB7XHJcbiAgICAgIHN1cGVyXHJcbiAgICAgICAgLnByb2Nlc3NSZXF1ZXN0PE1lc3NhZ2VYTUxPYmplY3Q+KFxyXG4gICAgICAgICAge1xyXG4gICAgICAgICAgICBtZXRob2ROYW1lOiAnR2V0UFhQTWVzc2FnZXMnLFxyXG4gICAgICAgICAgICBwYXJhbVN0cjogeyBjaGlsZEludElkOiAwIH0sXHJcbiAgICAgICAgICB9LFxyXG4gICAgICAgICAgKHhtbCkgPT4gbmV3IFhNTEZhY3RvcnkoeG1sKS5lbmNvZGVBdHRyaWJ1dGUoJ0NvbnRlbnQnLCAnUmVhZCcpLnRvU3RyaW5nKClcclxuICAgICAgICApXHJcbiAgICAgICAgLnRoZW4oKHhtbE9iamVjdCkgPT4ge1xyXG4gICAgICAgICAgcmVzKFtcclxuICAgICAgICAgICAgeG1sT2JqZWN0LlBYUE1lc3NhZ2VzRGF0YVswXS5NZXNzYWdlTGlzdGluZ3NbMF0uTWVzc2FnZUxpc3RpbmcubWFwKFxyXG4gICAgICAgICAgICAgIChtZXNzYWdlKSA9PiBuZXcgTWVzc2FnZShtZXNzYWdlLCBzdXBlci5jcmVkZW50aWFscywgdGhpcy5ob3N0VXJsKVxyXG4gICAgICAgICAgICAgIC8vIEB0cy1pZ25vcmUgLy9mdWNraW5nIHN1ZSBtZVxyXG4gICAgICAgICAgICApLHhtbE9iamVjdD8uZXh0cmFEYXRhXVxyXG4gICAgICAgICAgKTtcclxuICAgICAgICB9KVxyXG4gICAgICAgIC5jYXRjaChyZWopO1xyXG4gICAgfSk7XHJcbiAgfVxyXG5cclxuXHJcblxyXG4gIC8vYWx0bmVyYXRlIG1ldGhvZCBmb3Igc3R1ZGVudEluZm8gd2hlbiBzdHVkZW50SW5mbyBmYWlsczpcclxuICAvL3Rob3NlIHRoaW5ncyBjb21tZW50ZWQgb3V0IGFyZSBub3QgYXBwbGljYWJsZSBoZXJlXHJcbiAgcHVibGljIENoaWxkTGlzdCgpOlByb21pc2U8W1N0dWRlbnRJbmZvLGFueV0+e1xyXG4gICAgcmV0dXJuIG5ldyBQcm9taXNlPFtTdHVkZW50SW5mbyxhbnldPigocmVzLHJlaik9PntcclxuICAgICAgc3VwZXJcclxuICAgICAgICAucHJvY2Vzc1JlcXVlc3Qoe21ldGhvZE5hbWU6XCJDaGlsZExpc3RcIn0pXHJcbiAgICAgICAgICAudGhlbigoeG1sT2JqZWN0OmFueSk9PntcclxuICAgICAgICAgICAgY29uc3QgcmF3PXhtbE9iamVjdDtcclxuICAgICAgICAgICAgeG1sT2JqZWN0PXhtbE9iamVjdC5DaGlsZExpc3RbMF07XHJcblxyXG4gICAgICAgICAgICByZXMoW3tcclxuICAgICAgICAgICAgc3R1ZGVudDp7XHJcbiAgICAgICAgICAgICAgbmFtZTp4bWxPYmplY3QuQ2hpbGRbMF0uQ2hpbGROYW1lLCAvL2Z1bGwgTmFtZSBvbiB0aGlzIGZhbGxiYWNrIG1ldGhvZFxyXG4gICAgICAgICAgICAgIGxhc3ROYW1lOlwibm90IGF2YWlsYWJsZVwiLFxyXG4gICAgICAgICAgICAgIG5pY2tuYW1lOlwibm90IGF2YWlsYWJsZVwifSxcclxuICAgICAgICAgIC8vICBiaXJ0aERhdGU6bmV3IERhdGUoKSxcclxuICAgICAgICAgICAvLyB0cmFjazpcIm5vdCBhdmFpbGFibGVcIixcclxuICAgICAgICAgICAvLyBhZGRyZXNzOlwibm90IGF2YWlsYWJsZVwiLFxyXG4gICAgICAgICAgICBwaG90bzpvcHRpb25hbCh4bWxPYmplY3QuQ2hpbGRbMF0ucGhvdG8pLFxyXG4gICAgICAgICAgICBjb3Vuc2Vsb3I6dW5kZWZpbmVkLFxyXG4gICAgICAgICAgICBjdXJyZW50U2Nob29sOnhtbE9iamVjdC5DaGlsZFswXS5Pcmdhbml6YXRpb25OYW1lWzBdLFxyXG4gICAgICAgICAgIC8vIGRlbnRpc3Q6dW5kZWZpbmVkLFxyXG4gICAgICAgICAgICAvLyBwaHlzaWNpYW46dW5kZWZpbmVkLFxyXG4gICAgICAgICAgICAgIGlkOm9wdGlvbmFsKHhtbE9iamVjdC5DaGlsZFswXVsnQF9DaGlsZFBlcm1JRCddKSxcclxuICAgICAgICAgICAgICBvcmdZZWFyR3U6b3B0aW9uYWwoeG1sT2JqZWN0LkNoaWxkWzBdWydAX09yZ1llYXJHVSddKSxcclxuICAgICAgICAgICAgICAvL3Bob25lOlwibm90IGF2YWlsYWJsZVwiLFxyXG4gICAgICAgICAgICAgIC8vZW1haWw6XCJub3QgYXZhaWxhYmxlXCIsXHJcbiAgICAgICAgICAgICAgLy9lbWVyZ2VuY3lDb250YWN0czp1bmRlZmluZWQsXHJcbiAgICAgICAgICAgICAgZ2VuZGVyOlwibnVsbFwiLFxyXG4gICAgICAgICAgICAgIGdyYWRlOm9wdGlvbmFsKHhtbE9iamVjdC5DaGlsZFswXS5HcmFkZSksXHJcblxyXG5cclxuXHJcblxyXG4gICAgICAgICAgfSBhcyBTdHVkZW50SW5mbyxyYXcuZXh0cmFEYXRhXSl9KVxyXG4gICAgICAgICAgLmNhdGNoKHJlailcclxuICAgIH0pXHJcbiAgfVxyXG5cclxuXHJcbiAgLyoqXHJcbiAgICogR2V0cyB0aGUgaW5mbyBvZiBhIHN0dWRlbnRcclxuICAgKiBAcmV0dXJucyB7UHJvbWlzZTxTdHVkZW50SW5mbz59IFN0dWRlbnRJbmZvIG9iamVjdFxyXG4gICAqIEBkZXNjcmlwdGlvblxyXG4gICAqIGBgYGpzXHJcbiAgICogc3R1ZGVudEluZm8oKS50aGVuKGNvbnNvbGUubG9nKSAvLyAtPiB7IHN0dWRlbnQ6IHsgbmFtZTogJ0V2YW4gRGF2aXMnLCBuaWNrbmFtZTogJycsIGxhc3ROYW1lOiAnRGF2aXMnIH0sIC4uLn1cclxuICAgKiBgYGBcclxuICAgKi9cclxuICBwdWJsaWMgc3R1ZGVudEluZm8oKTogUHJvbWlzZTxbU3R1ZGVudEluZm8sYW55XT4ge1xyXG4gICAgcmV0dXJuIG5ldyBQcm9taXNlPFtTdHVkZW50SW5mbyxhbnldPigocmVzLCByZWopID0+IHtcclxuICAgICAgc3VwZXJcclxuICAgICAgICAucHJvY2Vzc1JlcXVlc3Q8U3R1ZGVudEluZm9YTUxPYmplY3Q+KHtcclxuICAgICAgICAgIG1ldGhvZE5hbWU6ICdTdHVkZW50SW5mbycsXHJcbiAgICAgICAgICBwYXJhbVN0cjogeyBjaGlsZEludElkOiAwIH0sXHJcbiAgICAgICAgfSlcclxuICAgICAgICAudGhlbigoeG1sT2JqZWN0RGF0YSkgPT4ge1xyXG4gICAgICAgICAgcmVzKFt7XHJcbiAgICAgICAgICAgIHN0dWRlbnQ6IHtcclxuICAgICAgICAgICAgICBuYW1lOiB4bWxPYmplY3REYXRhLlN0dWRlbnRJbmZvWzBdLkZvcm1hdHRlZE5hbWVbMF0sXHJcbiAgICAgICAgICAgICAgbGFzdE5hbWU6IHhtbE9iamVjdERhdGEuU3R1ZGVudEluZm9bMF0uTGFzdE5hbWVHb2VzQnlbMF0sXHJcbiAgICAgICAgICAgICAgbmlja25hbWU6IHhtbE9iamVjdERhdGEuU3R1ZGVudEluZm9bMF0uTmlja05hbWVbMF0sXHJcbiAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgIGJpcnRoRGF0ZTogbmV3IERhdGUoeG1sT2JqZWN0RGF0YS5TdHVkZW50SW5mb1swXS5CaXJ0aERhdGVbMF0pLFxyXG4gICAgICAgICAgICB0cmFjazogb3B0aW9uYWwoeG1sT2JqZWN0RGF0YS5TdHVkZW50SW5mb1swXS5UcmFjayksXHJcbiAgICAgICAgICAgIGFkZHJlc3M6IG9wdGlvbmFsKHhtbE9iamVjdERhdGEuU3R1ZGVudEluZm9bMF0uQWRkcmVzcyksXHJcbiAgICAgICAgICAgIHBob3RvOiBvcHRpb25hbCh4bWxPYmplY3REYXRhLlN0dWRlbnRJbmZvWzBdLlBob3RvKSxcclxuICAgICAgICAgICAgY291bnNlbG9yOlxyXG4gICAgICAgICAgICAgIHhtbE9iamVjdERhdGEuU3R1ZGVudEluZm9bMF0uQ291bnNlbG9yTmFtZSAmJlxyXG4gICAgICAgICAgICAgIHhtbE9iamVjdERhdGEuU3R1ZGVudEluZm9bMF0uQ291bnNlbG9yRW1haWwgJiZcclxuICAgICAgICAgICAgICB4bWxPYmplY3REYXRhLlN0dWRlbnRJbmZvWzBdLkNvdW5zZWxvclN0YWZmR1VcclxuICAgICAgICAgICAgICAgID8ge1xyXG4gICAgICAgICAgICAgICAgICAgIG5hbWU6IHhtbE9iamVjdERhdGEuU3R1ZGVudEluZm9bMF0uQ291bnNlbG9yTmFtZVswXSxcclxuICAgICAgICAgICAgICAgICAgICBlbWFpbDogeG1sT2JqZWN0RGF0YS5TdHVkZW50SW5mb1swXS5Db3Vuc2Vsb3JFbWFpbFswXSxcclxuICAgICAgICAgICAgICAgICAgICBzdGFmZkd1OiB4bWxPYmplY3REYXRhLlN0dWRlbnRJbmZvWzBdLkNvdW5zZWxvclN0YWZmR1VbMF0sXHJcbiAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIDogdW5kZWZpbmVkLFxyXG4gICAgICAgICAgICBjdXJyZW50U2Nob29sOiB4bWxPYmplY3REYXRhLlN0dWRlbnRJbmZvWzBdLkN1cnJlbnRTY2hvb2xbMF0sXHJcbiAgICAgICAgICAgIGRlbnRpc3Q6IHhtbE9iamVjdERhdGEuU3R1ZGVudEluZm9bMF0uRGVudGlzdFxyXG4gICAgICAgICAgICAgID8ge1xyXG4gICAgICAgICAgICAgICAgICBuYW1lOiB4bWxPYmplY3REYXRhLlN0dWRlbnRJbmZvWzBdLkRlbnRpc3RbMF1bJ0BfTmFtZSddWzBdLFxyXG4gICAgICAgICAgICAgICAgICBwaG9uZTogeG1sT2JqZWN0RGF0YS5TdHVkZW50SW5mb1swXS5EZW50aXN0WzBdWydAX1Bob25lJ11bMF0sXHJcbiAgICAgICAgICAgICAgICAgIGV4dG46IHhtbE9iamVjdERhdGEuU3R1ZGVudEluZm9bMF0uRGVudGlzdFswXVsnQF9FeHRuJ11bMF0sXHJcbiAgICAgICAgICAgICAgICAgIG9mZmljZTogeG1sT2JqZWN0RGF0YS5TdHVkZW50SW5mb1swXS5EZW50aXN0WzBdWydAX09mZmljZSddWzBdLFxyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgIDogdW5kZWZpbmVkLFxyXG4gICAgICAgICAgICBwaHlzaWNpYW46IHhtbE9iamVjdERhdGEuU3R1ZGVudEluZm9bMF0uUGh5c2ljaWFuXHJcbiAgICAgICAgICAgICAgPyB7XHJcbiAgICAgICAgICAgICAgICAgIG5hbWU6IHhtbE9iamVjdERhdGEuU3R1ZGVudEluZm9bMF0uUGh5c2ljaWFuWzBdWydAX05hbWUnXVswXSxcclxuICAgICAgICAgICAgICAgICAgcGhvbmU6IHhtbE9iamVjdERhdGEuU3R1ZGVudEluZm9bMF0uUGh5c2ljaWFuWzBdWydAX1Bob25lJ11bMF0sXHJcbiAgICAgICAgICAgICAgICAgIGV4dG46IHhtbE9iamVjdERhdGEuU3R1ZGVudEluZm9bMF0uUGh5c2ljaWFuWzBdWydAX0V4dG4nXVswXSxcclxuICAgICAgICAgICAgICAgICAgaG9zcGl0YWw6IHhtbE9iamVjdERhdGEuU3R1ZGVudEluZm9bMF0uUGh5c2ljaWFuWzBdWydAX0hvc3BpdGFsJ11bMF0sXHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgOiB1bmRlZmluZWQsXHJcbiAgICAgICAgICAgIGlkOiBvcHRpb25hbCh4bWxPYmplY3REYXRhLlN0dWRlbnRJbmZvWzBdLlBlcm1JRCksXHJcbiAgICAgICAgICAgIG9yZ1llYXJHdTogb3B0aW9uYWwoeG1sT2JqZWN0RGF0YS5TdHVkZW50SW5mb1swXS5PcmdZZWFyR1UpLFxyXG4gICAgICAgICAgICBwaG9uZTogb3B0aW9uYWwoeG1sT2JqZWN0RGF0YS5TdHVkZW50SW5mb1swXS5QaG9uZSksXHJcbiAgICAgICAgICAgIGVtYWlsOiBvcHRpb25hbCh4bWxPYmplY3REYXRhLlN0dWRlbnRJbmZvWzBdLkVNYWlsKSxcclxuICAgICAgICAgICAgZW1lcmdlbmN5Q29udGFjdHM6IHhtbE9iamVjdERhdGEuU3R1ZGVudEluZm9bMF0uRW1lcmdlbmN5Q29udGFjdHNcclxuICAgICAgICAgICAgICA/IHhtbE9iamVjdERhdGEuU3R1ZGVudEluZm9bMF0uRW1lcmdlbmN5Q29udGFjdHNbMF0uRW1lcmdlbmN5Q29udGFjdD8ubWFwKChjb250YWN0KSA9PiAoe1xyXG4gICAgICAgICAgICAgICAgICBuYW1lOiBvcHRpb25hbChjb250YWN0WydAX05hbWUnXSksXHJcbiAgICAgICAgICAgICAgICAgIHBob25lOiB7XHJcbiAgICAgICAgICAgICAgICAgICAgaG9tZTogb3B0aW9uYWwoY29udGFjdFsnQF9Ib21lUGhvbmUnXSksXHJcbiAgICAgICAgICAgICAgICAgICAgbW9iaWxlOiBvcHRpb25hbChjb250YWN0WydAX01vYmlsZVBob25lJ10pLFxyXG4gICAgICAgICAgICAgICAgICAgIG90aGVyOiBvcHRpb25hbChjb250YWN0WydAX090aGVyUGhvbmUnXSksXHJcbiAgICAgICAgICAgICAgICAgICAgd29yazogb3B0aW9uYWwoY29udGFjdFsnQF9Xb3JrUGhvbmUnXSksXHJcbiAgICAgICAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgICAgICAgIHJlbGF0aW9uc2hpcDogb3B0aW9uYWwoY29udGFjdFsnQF9SZWxhdGlvbnNoaXAnXSksXHJcbiAgICAgICAgICAgICAgICB9KSlcclxuICAgICAgICAgICAgICA6IFtdLFxyXG4gICAgICAgICAgICBnZW5kZXI6IG9wdGlvbmFsKHhtbE9iamVjdERhdGEuU3R1ZGVudEluZm9bMF0uR2VuZGVyKSxcclxuICAgICAgICAgICAgZ3JhZGU6IG9wdGlvbmFsKHhtbE9iamVjdERhdGEuU3R1ZGVudEluZm9bMF0uR3JhZGUpLFxyXG4gICAgICAgICAgICBsb2NrZXJJbmZvUmVjb3Jkczogb3B0aW9uYWwoeG1sT2JqZWN0RGF0YS5TdHVkZW50SW5mb1swXS5Mb2NrZXJJbmZvUmVjb3JkcyksXHJcbiAgICAgICAgICAgIGhvbWVMYW5ndWFnZTogb3B0aW9uYWwoeG1sT2JqZWN0RGF0YS5TdHVkZW50SW5mb1swXS5Ib21lTGFuZ3VhZ2UpLFxyXG4gICAgICAgICAgICBob21lUm9vbTogb3B0aW9uYWwoeG1sT2JqZWN0RGF0YS5TdHVkZW50SW5mb1swXS5Ib21lUm9vbSksXHJcbiAgICAgICAgICAgIGhvbWVSb29tVGVhY2hlcjoge1xyXG4gICAgICAgICAgICAgIGVtYWlsOiBvcHRpb25hbCh4bWxPYmplY3REYXRhLlN0dWRlbnRJbmZvWzBdLkhvbWVSb29tVGNoRU1haWwpLFxyXG4gICAgICAgICAgICAgIG5hbWU6IG9wdGlvbmFsKHhtbE9iamVjdERhdGEuU3R1ZGVudEluZm9bMF0uSG9tZVJvb21UY2gpLFxyXG4gICAgICAgICAgICAgIHN0YWZmR3U6IG9wdGlvbmFsKHhtbE9iamVjdERhdGEuU3R1ZGVudEluZm9bMF0uSG9tZVJvb21UY2hTdGFmZkdVKSxcclxuICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgYWRkaXRpb25hbEluZm86IHhtbE9iamVjdERhdGEuU3R1ZGVudEluZm9bMF0uVXNlckRlZmluZWRHcm91cEJveGVzWzBdLlVzZXJEZWZpbmVkR3JvdXBCb3hcclxuICAgICAgICAgICAgICA/ICh4bWxPYmplY3REYXRhLlN0dWRlbnRJbmZvWzBdLlVzZXJEZWZpbmVkR3JvdXBCb3hlc1swXS5Vc2VyRGVmaW5lZEdyb3VwQm94Lm1hcCgoZGVmaW5lZEJveCkgPT4gKHtcclxuICAgICAgICAgICAgICAgICAgaWQ6IG9wdGlvbmFsKGRlZmluZWRCb3hbJ0BfR3JvdXBCb3hJRCddKSwgLy8gc3RyaW5nIHwgdW5kZWZpbmVkXHJcbiAgICAgICAgICAgICAgICAgIHR5cGU6IGRlZmluZWRCb3hbJ0BfR3JvdXBCb3hMYWJlbCddWzBdLCAvLyBzdHJpbmdcclxuICAgICAgICAgICAgICAgICAgdmNJZDogb3B0aW9uYWwoZGVmaW5lZEJveFsnQF9WQ0lEJ10pLCAvLyBzdHJpbmcgfCB1bmRlZmluZWRcclxuICAgICAgICAgICAgICAgICAgaXRlbXM6IGRlZmluZWRCb3guVXNlckRlZmluZWRJdGVtc1swXS5Vc2VyRGVmaW5lZEl0ZW0ubWFwKChpdGVtKSA9PiAoe1xyXG4gICAgICAgICAgICAgICAgICAgIHNvdXJjZToge1xyXG4gICAgICAgICAgICAgICAgICAgICAgZWxlbWVudDogaXRlbVsnQF9Tb3VyY2VFbGVtZW50J11bMF0sXHJcbiAgICAgICAgICAgICAgICAgICAgICBvYmplY3Q6IGl0ZW1bJ0BfU291cmNlT2JqZWN0J11bMF0sXHJcbiAgICAgICAgICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgICAgICAgICB2Y0lkOiBpdGVtWydAX1ZDSUQnXVswXSxcclxuICAgICAgICAgICAgICAgICAgICB2YWx1ZTogaXRlbVsnQF9WYWx1ZSddWzBdLFxyXG4gICAgICAgICAgICAgICAgICAgIHR5cGU6IGl0ZW1bJ0BfSXRlbVR5cGUnXVswXSxcclxuICAgICAgICAgICAgICAgICAgfSkpIGFzIEFkZGl0aW9uYWxJbmZvSXRlbVtdLFxyXG4gICAgICAgICAgICAgICAgfSkpIGFzIEFkZGl0aW9uYWxJbmZvW10pXHJcbiAgICAgICAgICAgICAgOiBbXSxcclxuICAgICAgICAgICAgICAvL0B0cy1pZ25vcmUgWW91IHdpbGwgbmV2ZXIgbWFrZSBtZSB1c2UgdHlwZVNjcmlwdC5cclxuICAgICAgICAgIH0gYXMgU3R1ZGVudEluZm8seG1sT2JqZWN0RGF0YS5leHRyYURhdGFdKTtcclxuICAgICAgICB9KVxyXG4gICAgICAgIC5jYXRjaChyZWopO1xyXG4gICAgfSk7XHJcbiAgfVxyXG5cclxuICBwcml2YXRlIGZldGNoRXZlbnRzV2l0aGluSW50ZXJ2YWwoZGF0ZTogRGF0ZSkge1xyXG4gICAgcmV0dXJuIHN1cGVyLnByb2Nlc3NSZXF1ZXN0PENhbGVuZGFyWE1MT2JqZWN0PihcclxuICAgICAge1xyXG4gICAgICAgIG1ldGhvZE5hbWU6ICdTdHVkZW50Q2FsZW5kYXInLFxyXG4gICAgICAgIHBhcmFtU3RyOiB7IGNoaWxkSW50SWQ6IDAsIFJlcXVlc3REYXRlOiBkYXRlLnRvSVNPU3RyaW5nKCkgfSxcclxuICAgICAgfSxcclxuICAgICAgKHhtbCkgPT4gbmV3IFhNTEZhY3RvcnkoeG1sKS5lbmNvZGVBdHRyaWJ1dGUoJ1RpdGxlJywgJ0ljb24nKS50b1N0cmluZygpXHJcbiAgICApO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICpcclxuICAgKiBAcGFyYW0ge0NhbGVuZGFyT3B0aW9uc30gb3B0aW9ucyBPcHRpb25zIHRvIHByb3ZpZGUgZm9yIGNhbGVuZGFyIG1ldGhvZC4gQW4gaW50ZXJ2YWwgaXMgcmVxdWlyZWQuXHJcbiAgICogQHJldHVybnMge1Byb21pc2U8Q2FsZW5kYXI+fSBSZXR1cm5zIGEgQ2FsZW5kYXIgb2JqZWN0XHJcbiAgICogQGRlc2NyaXB0aW9uXHJcbiAgICogYGBganNcclxuICAgKiBjbGllbnQuY2FsZW5kYXIoeyBpbnRlcnZhbDogeyBzdGFydDogbmV3IERhdGUoJzUvMS8yMDIyJyksIGVuZDogbmV3IERhdGUoJzgvMS8yMDIxJykgfSwgY29uY3VycmVuY3k6IG51bGwgfSk7IC8vIC0+IExpbWl0bGVzcyBjb25jdXJyZW5jeSAobm90IHJlY29tbWVuZGVkKVxyXG4gICAqXHJcbiAgICogY29uc3QgY2FsZW5kYXIgPSBhd2FpdCBjbGllbnQuY2FsZW5kYXIoeyBpbnRlcnZhbDogeyAuLi4gfX0pO1xyXG4gICAqIGNvbnNvbGUubG9nKGNhbGVuZGFyKTsgLy8gLT4geyBzY2hvb2xEYXRlOiB7Li4ufSwgb3V0cHV0UmFuZ2U6IHsuLi59LCBldmVudHM6IFsuLi5dIH1cclxuICAgKiBgYGBcclxuICAgKi9cclxuICBwdWJsaWMgYXN5bmMgY2FsZW5kYXIob3B0aW9uczogQ2FsZW5kYXJPcHRpb25zID0ge30pOiBQcm9taXNlPENhbGVuZGFyPiB7XHJcbiAgICBjb25zdCBkZWZhdWx0T3B0aW9uczogQ2FsZW5kYXJPcHRpb25zID0ge1xyXG4gICAgICBjb25jdXJyZW5jeTogNyxcclxuICAgICAgLi4ub3B0aW9ucyxcclxuICAgIH07XHJcbiAgICBjb25zdCBjYWwgPSBhd2FpdCBjYWNoZS5tZW1vKCgpID0+IHRoaXMuZmV0Y2hFdmVudHNXaXRoaW5JbnRlcnZhbChuZXcgRGF0ZSgpKSk7XHJcbiAgICBjb25zdCBzY2hvb2xFbmREYXRlOiBEYXRlIHwgbnVtYmVyID1cclxuICAgICAgb3B0aW9ucy5pbnRlcnZhbD8uZW5kID8/IG5ldyBEYXRlKGNhbC5DYWxlbmRhckxpc3RpbmdbMF1bJ0BfU2Nob29sRW5kRGF0ZSddWzBdKTtcclxuICAgIGNvbnN0IHNjaG9vbFN0YXJ0RGF0ZTogRGF0ZSB8IG51bWJlciA9XHJcbiAgICAgIG9wdGlvbnMuaW50ZXJ2YWw/LnN0YXJ0ID8/IG5ldyBEYXRlKGNhbC5DYWxlbmRhckxpc3RpbmdbMF1bJ0BfU2Nob29sQmVnRGF0ZSddWzBdKTtcclxuXHJcbiAgICByZXR1cm4gbmV3IFByb21pc2UoKHJlcywgcmVqKSA9PiB7XHJcbiAgICAgIGNvbnN0IG1vbnRoc1dpdGhpblNjaG9vbFllYXIgPSBlYWNoTW9udGhPZkludGVydmFsKHsgc3RhcnQ6IHNjaG9vbFN0YXJ0RGF0ZSwgZW5kOiBzY2hvb2xFbmREYXRlIH0pO1xyXG4gICAgICBjb25zdCBnZXRBbGxFdmVudHNXaXRoaW5TY2hvb2xZZWFyID0gKCk6IFByb21pc2U8Q2FsZW5kYXJYTUxPYmplY3RbXT4gPT5cclxuICAgICAgICBkZWZhdWx0T3B0aW9ucy5jb25jdXJyZW5jeSA9PSBudWxsXHJcbiAgICAgICAgICA/IFByb21pc2UuYWxsKG1vbnRoc1dpdGhpblNjaG9vbFllYXIubWFwKChkYXRlOiBEYXRlKSA9PiB0aGlzLmZldGNoRXZlbnRzV2l0aGluSW50ZXJ2YWwoZGF0ZSkpKVxyXG4gICAgICAgICAgOiBhc3luY1Bvb2xBbGwoZGVmYXVsdE9wdGlvbnMuY29uY3VycmVuY3ksIG1vbnRoc1dpdGhpblNjaG9vbFllYXIsIChkYXRlOmFueSkgPT5cclxuICAgICAgICAgICAgICB0aGlzLmZldGNoRXZlbnRzV2l0aGluSW50ZXJ2YWwoZGF0ZSlcclxuICAgICAgICAgICAgKTtcclxuICAgICAgbGV0IG1lbW86IENhbGVuZGFyIHwgbnVsbCA9IG51bGw7XHJcbiAgICAgIGdldEFsbEV2ZW50c1dpdGhpblNjaG9vbFllYXIoKVxyXG4gICAgICAgIC50aGVuKChldmVudHMpID0+IHtcclxuICAgICAgICAgIGNvbnN0IGFsbEV2ZW50cyA9IGV2ZW50cy5yZWR1Y2UoKHByZXYsIGV2ZW50cykgPT4ge1xyXG4gICAgICAgICAgICBpZiAobWVtbyA9PSBudWxsKVxyXG4gICAgICAgICAgICAgIG1lbW8gPSB7XHJcbiAgICAgICAgICAgICAgICBzY2hvb2xEYXRlOiB7XHJcbiAgICAgICAgICAgICAgICAgIHN0YXJ0OiBuZXcgRGF0ZShldmVudHMuQ2FsZW5kYXJMaXN0aW5nWzBdWydAX1NjaG9vbEJlZ0RhdGUnXVswXSksXHJcbiAgICAgICAgICAgICAgICAgIGVuZDogbmV3IERhdGUoZXZlbnRzLkNhbGVuZGFyTGlzdGluZ1swXVsnQF9TY2hvb2xFbmREYXRlJ11bMF0pLFxyXG4gICAgICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgICAgIG91dHB1dFJhbmdlOiB7XHJcbiAgICAgICAgICAgICAgICAgIHN0YXJ0OiBzY2hvb2xTdGFydERhdGUsXHJcbiAgICAgICAgICAgICAgICAgIGVuZDogc2Nob29sRW5kRGF0ZSxcclxuICAgICAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgICAgICBldmVudHM6IFtdLFxyXG4gICAgICAgICAgICAgIH07XHJcbiAgICAgICAgICAgIGNvbnN0IHJlc3Q6IENhbGVuZGFyID0ge1xyXG4gICAgICAgICAgICAgIC4uLm1lbW8sIC8vIFRoaXMgaXMgdG8gcHJldmVudCByZS1pbml0aWFsaXppbmcgRGF0ZSBvYmplY3RzIGluIG9yZGVyIHRvIGltcHJvdmUgcGVyZm9ybWFuY2VcclxuICAgICAgICAgICAgICBldmVudHM6IFtcclxuICAgICAgICAgICAgICAgIC4uLihwcmV2LmV2ZW50cyA/IHByZXYuZXZlbnRzIDogW10pLFxyXG4gICAgICAgICAgICAgICAgLi4uKHR5cGVvZiBldmVudHMuQ2FsZW5kYXJMaXN0aW5nWzBdLkV2ZW50TGlzdHNbMF0gIT09ICdzdHJpbmcnXHJcbiAgICAgICAgICAgICAgICAgID8gKGV2ZW50cy5DYWxlbmRhckxpc3RpbmdbMF0uRXZlbnRMaXN0c1swXS5FdmVudExpc3QubWFwKChldmVudCkgPT4ge1xyXG4gICAgICAgICAgICAgICAgICAgICAgc3dpdGNoIChldmVudFsnQF9EYXlUeXBlJ11bMF0pIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgY2FzZSBFdmVudFR5cGUuQVNTSUdOTUVOVDoge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IGFzc2lnbm1lbnRFdmVudCA9IGV2ZW50IGFzIEFzc2lnbm1lbnRFdmVudFhNTE9iamVjdDtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4ge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdGl0bGU6IGRlY29kZVVSSShhc3NpZ25tZW50RXZlbnRbJ0BfVGl0bGUnXVswXSksXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBhZGRMaW5rRGF0YTogYXNzaWdubWVudEV2ZW50WydAX0FkZExpbmtEYXRhJ11bMF0sXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBhZ3U6IGFzc2lnbm1lbnRFdmVudFsnQF9BR1UnXSA/IGFzc2lnbm1lbnRFdmVudFsnQF9BR1UnXVswXSA6IHVuZGVmaW5lZCxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGRhdGU6IG5ldyBEYXRlKGFzc2lnbm1lbnRFdmVudFsnQF9EYXRlJ11bMF0pLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZGd1OiBhc3NpZ25tZW50RXZlbnRbJ0BfREdVJ11bMF0sXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBsaW5rOiBhc3NpZ25tZW50RXZlbnRbJ0BfTGluayddWzBdLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgc3RhcnRUaW1lOiBhc3NpZ25tZW50RXZlbnRbJ0BfU3RhcnRUaW1lJ11bMF0sXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0eXBlOiBFdmVudFR5cGUuQVNTSUdOTUVOVCxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHZpZXdUeXBlOiBhc3NpZ25tZW50RXZlbnRbJ0BfVmlld1R5cGUnXVswXSxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICB9IGFzIEFzc2lnbm1lbnRFdmVudDtcclxuICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgICAgICBjYXNlIEV2ZW50VHlwZS5IT0xJREFZOiB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRpdGxlOiBkZWNvZGVVUkkoZXZlbnRbJ0BfVGl0bGUnXVswXSksXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0eXBlOiBFdmVudFR5cGUuSE9MSURBWSxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHN0YXJ0VGltZTogZXZlbnRbJ0BfU3RhcnRUaW1lJ11bMF0sXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBkYXRlOiBuZXcgRGF0ZShldmVudFsnQF9EYXRlJ11bMF0pLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgIH0gYXMgSG9saWRheUV2ZW50O1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGNhc2UgRXZlbnRUeXBlLlJFR1VMQVI6IHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICBjb25zdCByZWd1bGFyRXZlbnQgPSBldmVudCBhcyBSZWd1bGFyRXZlbnRYTUxPYmplY3Q7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRpdGxlOiBkZWNvZGVVUkkocmVndWxhckV2ZW50WydAX1RpdGxlJ11bMF0pLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgYWd1OiByZWd1bGFyRXZlbnRbJ0BfQUdVJ10gPyByZWd1bGFyRXZlbnRbJ0BfQUdVJ11bMF0gOiB1bmRlZmluZWQsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBkYXRlOiBuZXcgRGF0ZShyZWd1bGFyRXZlbnRbJ0BfRGF0ZSddWzBdKSxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGRlc2NyaXB0aW9uOiByZWd1bGFyRXZlbnRbJ0BfRXZ0RGVzY3JpcHRpb24nXVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICA/IHJlZ3VsYXJFdmVudFsnQF9FdnREZXNjcmlwdGlvbiddWzBdXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDogdW5kZWZpbmVkLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZGd1OiByZWd1bGFyRXZlbnRbJ0BfREdVJ10gPyByZWd1bGFyRXZlbnRbJ0BfREdVJ11bMF0gOiB1bmRlZmluZWQsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBsaW5rOiByZWd1bGFyRXZlbnRbJ0BfTGluayddID8gcmVndWxhckV2ZW50WydAX0xpbmsnXVswXSA6IHVuZGVmaW5lZCxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHN0YXJ0VGltZTogcmVndWxhckV2ZW50WydAX1N0YXJ0VGltZSddWzBdLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdHlwZTogRXZlbnRUeXBlLlJFR1VMQVIsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB2aWV3VHlwZTogcmVndWxhckV2ZW50WydAX1ZpZXdUeXBlJ10gPyByZWd1bGFyRXZlbnRbJ0BfVmlld1R5cGUnXVswXSA6IHVuZGVmaW5lZCxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGFkZExpbmtEYXRhOiByZWd1bGFyRXZlbnRbJ0BfQWRkTGlua0RhdGEnXSA/IHJlZ3VsYXJFdmVudFsnQF9BZGRMaW5rRGF0YSddWzBdIDogdW5kZWZpbmVkLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgIH0gYXMgUmVndWxhckV2ZW50O1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgfSkgYXMgRXZlbnRbXSlcclxuICAgICAgICAgICAgICAgICAgOiBbXSksXHJcbiAgICAgICAgICAgICAgXSBhcyBFdmVudFtdLFxyXG4gICAgICAgICAgICB9O1xyXG5cclxuICAgICAgICAgICAgcmV0dXJuIHJlc3Q7XHJcbiAgICAgICAgICB9LCB7fSBhcyBDYWxlbmRhcik7XHJcbiAgICAgICAgICByZXMoeyAuLi5hbGxFdmVudHMsIGV2ZW50czogXy51bmlxQnkoYWxsRXZlbnRzLmV2ZW50cywgKGl0ZW06IHsgdGl0bGU6IGFueTsgfSkgPT4gaXRlbS50aXRsZSkgfSBhcyBDYWxlbmRhcik7XHJcbiAgICAgICAgfSlcclxuICAgICAgICAuY2F0Y2gocmVqKTtcclxuICAgIH0pO1xyXG4gIH1cclxufVxyXG4iXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztFQWtFZSxNQUFN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