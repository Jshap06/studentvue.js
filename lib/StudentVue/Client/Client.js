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
        const parseBranch = xmlObject => {
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
        };
        const fetchBranch = () => {
          return super.processRequest({
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
          });
        };
        if (fresh || reportingPeriodIndex == null) {
          fetchBranch().then(result => {
            return parseBranch(result);
          }).catch(err => {
            return rej(err);
          });
        } else {
          const m = JSON.parse(localStorage.getItem("xmlCache") ?? "{}");
          const identifier = this.district + this.username + reportingPeriodIndex;
          if (m[identifier]) {
            if (Math.abs(m[identifier].age - Date.now()) > 1000 * 60 * 60 * 24 * 3) {
              // if older than 3 days, refresh 
              fetchBranch().then(result => {
                const xmlCache = JSON.parse(localStorage.getItem("xmlCache") ?? "{}");
                const identifier = this.district + this.username + reportingPeriodIndex;
                xmlCache[identifier] = {
                  data: result,
                  age: Date.now()
                };
                localStorage.setItem("xmlCache", JSON.stringify(xmlCache));
                parseBranch(result);
              }).catch(err => {
                return rej(err);
              });
            } else {
              parseBranch(m[identifier].data);
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJDbGllbnQiLCJzb2FwIiwiY29uc3RydWN0b3IiLCJjcmVkZW50aWFscyIsInByb3h5VXJsIiwiaG9zdFVybCIsInZhbGlkYXRlQ3JlZGVudGlhbHMiLCJQcm9taXNlIiwicmVzIiwicmVqIiwicHJvY2Vzc1JlcXVlc3QiLCJ2YWxpZGF0ZUVycm9ycyIsIm1ldGhvZE5hbWUiLCJ0aGVuIiwicmVzcG9uc2UiLCJSVF9FUlJPUiIsImluY2x1ZGVzIiwiUmVxdWVzdEV4Y2VwdGlvbiIsImNhdGNoIiwiZG9jdW1lbnRzIiwicGFyYW1TdHIiLCJjaGlsZEludElkIiwieG1sT2JqZWN0IiwiU3R1ZGVudERvY3VtZW50RGF0YXMiLCJjb25zb2xlIiwibG9nIiwiZXh0cmFEYXRhIiwiU3R1ZGVudERvY3VtZW50RGF0YSIsInhtbCIsIkRvY3VtZW50IiwicmVwb3J0Q2FyZHMiLCJSQ1JlcG9ydGluZ1BlcmlvZERhdGEiLCJSQ1JlcG9ydGluZ1BlcmlvZHMiLCJSQ1JlcG9ydGluZ1BlcmlvZCIsIlJlcG9ydENhcmQiLCJzY2hvb2xJbmZvIiwiY2hpbGRJbnRJRCIsInJlc3VsdCIsIlN0dWRlbnRTY2hvb2xJbmZvTGlzdGluZyIsIlN0YWZmTGlzdHMiLCJTdGFmZkxpc3QiLCJzdGFmZiIsIm5hbWUiLCJlbWFpbCIsInN0YWZmR3UiLCJqb2JUaXRsZSIsImV4dG4iLCJwaG9uZSIsInNjaG9vbCIsImFkZHJlc3MiLCJhZGRyZXNzQWx0IiwiY2l0eSIsInppcENvZGUiLCJhbHRQaG9uZSIsInByaW5jaXBhbCIsInNjaGVkdWxlIiwidGVybUluZGV4IiwiVGVybUluZGV4IiwidGVybU5hbWUiLCJTdHVkZW50Q2xhc3NTY2hlZHVsZSIsIlRlcm1MaXN0cyIsIlRlcm1MaXN0aW5nIiwidGVybSIsInN0YXJ0IiwiZW5kIiwidGVybXMiLCJDbGFzc0xpc3RzIiwiQ2xhc3NMaXN0aW5nIiwiY291cnNlIiwicGVyaW9kIiwidGVhY2hlciIsInJvb20iLCJtYWluQ2xhc3NlcyIsImNoZWNrZXIiLCJDb25jdXJyZW50U2Nob29sU3R1ZGVudENsYXNzU2NoZWR1bGVzIiwiQ29uY3VycmVudFNjaG9vbFN0dWRlbnRDbGFzc1NjaGVkdWxlIiwiQ29uU2NoQ2xhc3NMaXN0cyIsImNvbkNsYXNzZXMiLCJjb25OYW1lIiwiVG9kYXlTY2hlZHVsZUluZm9EYXRhIiwiU2Nob29sSW5mb3MiLCJ0b2RheSIsIlNjaG9vbEluZm8iLCJDbGFzc2VzIiwiQ2xhc3NJbmZvIiwibWFpbiIsImNvbiIsIlNjaG9vbGluZm8iLCJlcnJvciIsImF0dGVuZGFuY2UiLCJhdHRlbmRhbmNlWE1MT2JqZWN0IiwiQXR0ZW5kYW5jZSIsIlRvdGFsQWN0aXZpdGllcyIsIlBlcmlvZFRvdGFsIiwicGQiLCJpIiwiTnVtYmVyIiwidG90YWwiLCJleGN1c2VkIiwiVG90YWxFeGN1c2VkIiwidGFyZGllcyIsIlRvdGFsVGFyZGllcyIsInVuZXhjdXNlZCIsIlRvdGFsVW5leGN1c2VkIiwiYWN0aXZpdGllcyIsInVuZXhjdXNlZFRhcmRpZXMiLCJUb3RhbFVuZXhjdXNlZFRhcmRpZXMiLCJ0eXBlIiwic2Nob29sTmFtZSIsImFic2VuY2VzIiwiQWJzZW5jZXMiLCJBYnNlbmNlIiwibWFwIiwiYWJzZW5jZSIsImRhdGUiLCJEYXRlIiwicmVhc29uIiwibm90ZSIsImRlc2NyaXB0aW9uIiwicGVyaW9kcyIsIlBlcmlvZHMiLCJQZXJpb2QiLCJvcmdZZWFyR3UiLCJwZXJpb2RJbmZvcyIsImdyYWRlYm9vayIsInJlcG9ydGluZ1BlcmlvZEluZGV4IiwiZnJlc2giLCJwYXJzZUJyYW5jaCIsIkVycm9yIiwiZSIsIkdyYWRlYm9vayIsIlJlcG9ydGluZ1BlcmlvZHMiLCJSZXBvcnRQZXJpb2QiLCJpbmRleCIsIkNvdXJzZXMiLCJDb3Vyc2UiLCJjb3Vyc2VJRCIsInRpdGxlIiwiaGUiLCJkZWNvZGUiLCJtYXJrcyIsIk1hcmtzIiwiTWFyayIsIm1hcmsiLCJjYWxjdWxhdGVkU2NvcmUiLCJzdHJpbmciLCJyYXciLCJ3ZWlnaHRlZENhdGVnb3JpZXMiLCJBc3NpZ25tZW50R3JhZGVDYWxjIiwid2VpZ2h0ZWQiLCJjYWxjdWxhdGVkTWFyayIsIndlaWdodCIsImV2YWx1YXRlZCIsInN0YW5kYXJkIiwicG9pbnRzIiwiY3VycmVudCIsInBvc3NpYmxlIiwiYXNzaWdubWVudHMiLCJBc3NpZ25tZW50cyIsIkFzc2lnbm1lbnQiLCJhc3NpZ25tZW50IiwiZ3JhZGVib29rSWQiLCJkZWNvZGVVUkkiLCJkdWUiLCJzY29yZSIsInZhbHVlIiwidW5kZWZpbmVkIiwibm90ZXMiLCJ0ZWFjaGVySWQiLCJoYXNEcm9wYm94IiwiSlNPTiIsInBhcnNlIiwic3R1ZGVudElkIiwiZHJvcGJveERhdGUiLCJyZXNvdXJjZXMiLCJSZXNvdXJjZXMiLCJOYU4iLCJyZXBvcnRpbmdQZXJpb2QiLCJmaW5kIiwieCIsIlJlcG9ydGluZ1BlcmlvZCIsImF2YWlsYWJsZSIsImNvdXJzZXMiLCJmZXRjaEJyYW5jaCIsIkNvbmN1cnJlbnRTY2hPcmdZZWFyR1UiLCJYTUxGYWN0b3J5IiwiZW5jb2RlQXR0cmlidXRlIiwidG9TdHJpbmciLCJlcnIiLCJtIiwibG9jYWxTdG9yYWdlIiwiZ2V0SXRlbSIsImlkZW50aWZpZXIiLCJkaXN0cmljdCIsInVzZXJuYW1lIiwiTWF0aCIsImFicyIsImFnZSIsIm5vdyIsInhtbENhY2hlIiwiZGF0YSIsInNldEl0ZW0iLCJzdHJpbmdpZnkiLCJtZXNzYWdlcyIsIlBYUE1lc3NhZ2VzRGF0YSIsIk1lc3NhZ2VMaXN0aW5ncyIsIk1lc3NhZ2VMaXN0aW5nIiwibWVzc2FnZSIsIk1lc3NhZ2UiLCJDaGlsZExpc3QiLCJzdHVkZW50IiwiQ2hpbGQiLCJDaGlsZE5hbWUiLCJsYXN0TmFtZSIsIm5pY2tuYW1lIiwicGhvdG8iLCJvcHRpb25hbCIsImNvdW5zZWxvciIsImN1cnJlbnRTY2hvb2wiLCJPcmdhbml6YXRpb25OYW1lIiwiaWQiLCJnZW5kZXIiLCJncmFkZSIsIkdyYWRlIiwic3R1ZGVudEluZm8iLCJ4bWxPYmplY3REYXRhIiwiU3R1ZGVudEluZm8iLCJGb3JtYXR0ZWROYW1lIiwiTGFzdE5hbWVHb2VzQnkiLCJOaWNrTmFtZSIsImJpcnRoRGF0ZSIsIkJpcnRoRGF0ZSIsInRyYWNrIiwiVHJhY2siLCJBZGRyZXNzIiwiUGhvdG8iLCJDb3Vuc2Vsb3JOYW1lIiwiQ291bnNlbG9yRW1haWwiLCJDb3Vuc2Vsb3JTdGFmZkdVIiwiQ3VycmVudFNjaG9vbCIsImRlbnRpc3QiLCJEZW50aXN0Iiwib2ZmaWNlIiwicGh5c2ljaWFuIiwiUGh5c2ljaWFuIiwiaG9zcGl0YWwiLCJQZXJtSUQiLCJPcmdZZWFyR1UiLCJQaG9uZSIsIkVNYWlsIiwiZW1lcmdlbmN5Q29udGFjdHMiLCJFbWVyZ2VuY3lDb250YWN0cyIsIkVtZXJnZW5jeUNvbnRhY3QiLCJjb250YWN0IiwiaG9tZSIsIm1vYmlsZSIsIm90aGVyIiwid29yayIsInJlbGF0aW9uc2hpcCIsIkdlbmRlciIsImxvY2tlckluZm9SZWNvcmRzIiwiTG9ja2VySW5mb1JlY29yZHMiLCJob21lTGFuZ3VhZ2UiLCJIb21lTGFuZ3VhZ2UiLCJob21lUm9vbSIsIkhvbWVSb29tIiwiaG9tZVJvb21UZWFjaGVyIiwiSG9tZVJvb21UY2hFTWFpbCIsIkhvbWVSb29tVGNoIiwiSG9tZVJvb21UY2hTdGFmZkdVIiwiYWRkaXRpb25hbEluZm8iLCJVc2VyRGVmaW5lZEdyb3VwQm94ZXMiLCJVc2VyRGVmaW5lZEdyb3VwQm94IiwiZGVmaW5lZEJveCIsInZjSWQiLCJpdGVtcyIsIlVzZXJEZWZpbmVkSXRlbXMiLCJVc2VyRGVmaW5lZEl0ZW0iLCJpdGVtIiwic291cmNlIiwiZWxlbWVudCIsIm9iamVjdCIsImZldGNoRXZlbnRzV2l0aGluSW50ZXJ2YWwiLCJSZXF1ZXN0RGF0ZSIsInRvSVNPU3RyaW5nIiwiY2FsZW5kYXIiLCJvcHRpb25zIiwiZGVmYXVsdE9wdGlvbnMiLCJjb25jdXJyZW5jeSIsImNhbCIsImNhY2hlIiwibWVtbyIsInNjaG9vbEVuZERhdGUiLCJpbnRlcnZhbCIsIkNhbGVuZGFyTGlzdGluZyIsInNjaG9vbFN0YXJ0RGF0ZSIsIm1vbnRoc1dpdGhpblNjaG9vbFllYXIiLCJlYWNoTW9udGhPZkludGVydmFsIiwiZ2V0QWxsRXZlbnRzV2l0aGluU2Nob29sWWVhciIsImFsbCIsImFzeW5jUG9vbEFsbCIsImV2ZW50cyIsImFsbEV2ZW50cyIsInJlZHVjZSIsInByZXYiLCJzY2hvb2xEYXRlIiwib3V0cHV0UmFuZ2UiLCJyZXN0IiwiRXZlbnRMaXN0cyIsIkV2ZW50TGlzdCIsImV2ZW50IiwiRXZlbnRUeXBlIiwiQVNTSUdOTUVOVCIsImFzc2lnbm1lbnRFdmVudCIsImFkZExpbmtEYXRhIiwiYWd1IiwiZGd1IiwibGluayIsInN0YXJ0VGltZSIsInZpZXdUeXBlIiwiSE9MSURBWSIsIlJFR1VMQVIiLCJyZWd1bGFyRXZlbnQiLCJfIiwidW5pcUJ5Il0sInNvdXJjZXMiOlsiLi4vLi4vLi4vc3JjL1N0dWRlbnRWdWUvQ2xpZW50L0NsaWVudC50cyJdLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBMb2dpbkNyZWRlbnRpYWxzLCBQYXJzZWRSZXF1ZXN0RXJyb3IgfSBmcm9tICcuLi8uLi91dGlscy9zb2FwL0NsaWVudC9DbGllbnQuaW50ZXJmYWNlcyc7XHJcbmltcG9ydCBzb2FwIGZyb20gJy4uLy4uL3V0aWxzL3NvYXAvc29hcCc7XHJcbmltcG9ydCB7IEFkZGl0aW9uYWxJbmZvLCBBZGRpdGlvbmFsSW5mb0l0ZW0sIENsYXNzU2NoZWR1bGVJbmZvLCBTY2hvb2xJbmZvLCBTdHVkZW50SW5mbyB9IGZyb20gJy4vQ2xpZW50LmludGVyZmFjZXMnO1xyXG5pbXBvcnQgeyBTdHVkZW50SW5mb1hNTE9iamVjdCB9IGZyb20gJy4vSW50ZXJmYWNlcy94bWwvU3R1ZGVudEluZm8nO1xyXG5pbXBvcnQgTWVzc2FnZSBmcm9tICcuLi9NZXNzYWdlL01lc3NhZ2UnO1xyXG5pbXBvcnQgeyBNZXNzYWdlWE1MT2JqZWN0IH0gZnJvbSAnLi4vTWVzc2FnZS9NZXNzYWdlLnhtbCc7XHJcbmltcG9ydCB7IEFzc2lnbm1lbnRFdmVudFhNTE9iamVjdCwgQ2FsZW5kYXJYTUxPYmplY3QsIFJlZ3VsYXJFdmVudFhNTE9iamVjdCB9IGZyb20gJy4vSW50ZXJmYWNlcy94bWwvQ2FsZW5kYXInO1xyXG5pbXBvcnQgeyBBc3NpZ25tZW50RXZlbnQsIENhbGVuZGFyLCBDYWxlbmRhck9wdGlvbnMsIEV2ZW50LCBIb2xpZGF5RXZlbnQsIFJlZ3VsYXJFdmVudCB9IGZyb20gJy4vSW50ZXJmYWNlcy9DYWxlbmRhcic7XHJcbmltcG9ydCB7IGVhY2hNb250aE9mSW50ZXJ2YWwsIHBhcnNlIH0gZnJvbSAnZGF0ZS1mbnMnO1xyXG5pbXBvcnQgeyBGaWxlUmVzb3VyY2VYTUxPYmplY3QsIEdyYWRlYm9va1hNTE9iamVjdCwgVVJMUmVzb3VyY2VYTUxPYmplY3QgfSBmcm9tICcuL0ludGVyZmFjZXMveG1sL0dyYWRlYm9vayc7XHJcbmltcG9ydCB7IEF0dGVuZGFuY2VYTUxPYmplY3QgfSBmcm9tICcuL0ludGVyZmFjZXMveG1sL0F0dGVuZGFuY2UnO1xyXG5pbXBvcnQgRXZlbnRUeXBlIGZyb20gJy4uLy4uL0NvbnN0YW50cy9FdmVudFR5cGUnO1xyXG5pbXBvcnQgXyBmcm9tICdsb2Rhc2gnO1xyXG5pbXBvcnQgeyBBc3NpZ25tZW50LCBGaWxlUmVzb3VyY2UsIEdyYWRlYm9vaywgTWFyaywgVVJMUmVzb3VyY2UsIFdlaWdodGVkQ2F0ZWdvcnkgfSBmcm9tICcuL0ludGVyZmFjZXMvR3JhZGVib29rJztcclxuaW1wb3J0IFJlc291cmNlVHlwZSBmcm9tICcuLi8uLi9Db25zdGFudHMvUmVzb3VyY2VUeXBlJztcclxuaW1wb3J0IHsgQWJzZW50UGVyaW9kLCBBdHRlbmRhbmNlLCBQZXJpb2RJbmZvIH0gZnJvbSAnLi9JbnRlcmZhY2VzL0F0dGVuZGFuY2UnO1xyXG5pbXBvcnQgeyBTY2hlZHVsZVhNTE9iamVjdCB9IGZyb20gJy4vSW50ZXJmYWNlcy94bWwvU2NoZWR1bGUnO1xyXG5pbXBvcnQgeyBTY2hlZHVsZSB9IGZyb20gJy4vQ2xpZW50LmludGVyZmFjZXMnO1xyXG5pbXBvcnQgeyBTY2hvb2xJbmZvWE1MT2JqZWN0IH0gZnJvbSAnLi9JbnRlcmZhY2VzL3htbC9TY2hvb2xJbmZvJztcclxuaW1wb3J0IHsgUmVwb3J0Q2FyZHNYTUxPYmplY3QgfSBmcm9tICcuLi9SZXBvcnRDYXJkL1JlcG9ydENhcmQueG1sJztcclxuaW1wb3J0IHsgRG9jdW1lbnRYTUxPYmplY3QgfSBmcm9tICcuLi9Eb2N1bWVudC9Eb2N1bWVudC54bWwnO1xyXG5pbXBvcnQgUmVwb3J0Q2FyZCBmcm9tICcuLi9SZXBvcnRDYXJkL1JlcG9ydENhcmQnO1xyXG5pbXBvcnQgRG9jdW1lbnQgZnJvbSAnLi4vRG9jdW1lbnQvRG9jdW1lbnQnO1xyXG5pbXBvcnQgUmVxdWVzdEV4Y2VwdGlvbiBmcm9tICcuLi9SZXF1ZXN0RXhjZXB0aW9uL1JlcXVlc3RFeGNlcHRpb24nO1xyXG5pbXBvcnQgWE1MRmFjdG9yeSBmcm9tICcuLi8uLi91dGlscy9YTUxGYWN0b3J5L1hNTEZhY3RvcnknO1xyXG5pbXBvcnQgY2FjaGUgZnJvbSAnLi4vLi4vdXRpbHMvY2FjaGUvY2FjaGUnO1xyXG5pbXBvcnQgeyBvcHRpb25hbCwgYXN5bmNQb29sQWxsIH0gZnJvbSAnLi9DbGllbnQuaGVscGVycyc7XHJcbmltcG9ydCBoZSBmcm9tIFwiaGVcIjtcclxuaW1wb3J0IHsgZWwsIGlkIH0gZnJvbSAnZGF0ZS1mbnMvbG9jYWxlJztcclxuXHJcbi8qKlxyXG4gKiBUTyBETzsgcmV3cml0ZSB0aGUgc3R1ZGVudEluZm8gc3R1ZmYgdG8gcHJpbWFyeSBDaGlsZExpc3Qgd2l0aCBzdHVkZW50SW5mbyBhcyB0aGUgZmFsbGJhY2ssIFxyXG4gKiBtYWtlIHRoZSB0eXBlIFJFUVVJUkUgdGhlIGluZm8gYWJvdXQgc2Nob29sIGNvbmN1cnJlbmN5LCB0aHVzbHksIHRoZSBsb2dpbiBmdW5jdGlvbiB3aWxsIGRldGVybWluZSBpdCBpbiB0aGUgaW1tZWRpYXRlIGJ5IGNvbmN1cnJlbnJ0bHkgcGVyZm9ybWluZyB0aGUgZmV0Y2hlc1xyXG4gKiB0byB0aHVzbHkgaGF2ZSBhIG1pbmltYWwgc3BlZWQgaW1wYWN0XHJcbiAqIFxyXG4gKiBcclxuICogXHJcbiAqIFxyXG4gKiBcclxuICogXHJcbiAqIFxyXG4gKiBcclxuICogXHJcbiAqIFxyXG4gKiBcclxuICogXHJcbiAqIFxyXG4gKiBcclxuICogXHJcbiAqIFxyXG4gKiBcclxuICogXHJcbiAqIFxyXG4gKiBcclxuICogVGhlIFN0dWRlbnRWVUUgQ2xpZW50IHRvIGFjY2VzcyB0aGUgQVBJXHJcbiAqIEBjb25zdHJ1Y3RvclxyXG4gKiBAZXh0ZW5kcyB7c29hcC5DbGllbnR9XHJcbiAqL1xyXG5cclxuXHJcblxyXG5pbnRlcmZhY2UgeG1sQ2FjaGV7XHJcbiAgW2lkZW50aWZpZXI6c3RyaW5nXSAvKmRpc3RyaWN0IHVybCArIHVzZXJuYW1lICsgbXAgKi8gOiB7ZGF0YTpHcmFkZWJvb2tYTUxPYmplY3QsYWdlOm51bWJlcn1cclxufVxyXG5cclxuXHJcbmV4cG9ydCBkZWZhdWx0IGNsYXNzIENsaWVudCBleHRlbmRzIHNvYXAuQ2xpZW50IHtcclxuICBwcml2YXRlIGhvc3RVcmw6IHN0cmluZztcclxuICBjb25zdHJ1Y3RvcihjcmVkZW50aWFsczogTG9naW5DcmVkZW50aWFscywgcHJveHlVcmw6c3RyaW5nLGhvc3RVcmw6IHN0cmluZykge1xyXG4gICAgc3VwZXIoY3JlZGVudGlhbHMscHJveHlVcmwpO1xyXG4gICAgdGhpcy5ob3N0VXJsID0gaG9zdFVybDtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIFZhbGlkYXRlJ3MgdGhlIHVzZXIncyBjcmVkZW50aWFscy4gSXQgd2lsbCB0aHJvdyBhbiBlcnJvciBpZiBjcmVkZW50aWFscyBhcmUgaW5jb3JyZWN0XHJcbiAgICovXHJcbiAgcHVibGljIHZhbGlkYXRlQ3JlZGVudGlhbHMoKTogUHJvbWlzZTx2b2lkPiB7XHJcbiAgICByZXR1cm4gbmV3IFByb21pc2UoKHJlcywgcmVqKSA9PiB7XHJcbiAgICAgIHN1cGVyXHJcbiAgICAgICAgLnByb2Nlc3NSZXF1ZXN0PFBhcnNlZFJlcXVlc3RFcnJvcj4oeyB2YWxpZGF0ZUVycm9yczogZmFsc2UsIG1ldGhvZE5hbWU6ICdmdWNrJ30pXHJcbiAgICAgICAgLnRoZW4oKHJlc3BvbnNlKSA9PiB7XHJcbiAgICAgICAgICBpZiAocmVzcG9uc2UuUlRfRVJST1JbMF1bJ0BfRVJST1JfTUVTU0FHRSddWzBdLmluY2x1ZGVzKFwiQSBjcml0aWNhbCBlcnJvciBoYXMgb2NjdXJyZWRcIikpIHtyZXMoKTt9XHJcbiAgICAgICAgICBlbHNle3JlaihuZXcgUmVxdWVzdEV4Y2VwdGlvbihyZXNwb25zZSkpfTtcclxuICAgICAgICB9KVxyXG4gICAgICAgIC5jYXRjaChyZWopO1xyXG4gICAgfSk7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBHZXRzIHRoZSBzdHVkZW50J3MgZG9jdW1lbnRzIGZyb20gc3luZXJneSBzZXJ2ZXJzXHJcbiAgICogQHJldHVybnMge1Byb21pc2U8RG9jdW1lbnRbXT59PiBSZXR1cm5zIGEgbGlzdCBvZiBzdHVkZW50IGRvY3VtZW50c1xyXG4gICAqIEBkZXNjcmlwdGlvblxyXG4gICAqIGBgYGpzXHJcbiAgICogY29uc3QgZG9jdW1lbnRzID0gYXdhaXQgY2xpZW50LmRvY3VtZW50cygpO1xyXG4gICAqIGNvbnN0IGRvY3VtZW50ID0gZG9jdW1lbnRzWzBdO1xyXG4gICAqIGNvbnN0IGZpbGVzID0gYXdhaXQgZG9jdW1lbnQuZ2V0KCk7XHJcbiAgICogY29uc3QgYmFzZTY0Y29sbGVjdGlvbiA9IGZpbGVzLm1hcCgoZmlsZSkgPT4gZmlsZS5iYXNlNjQpO1xyXG4gICAqIGBgYFxyXG4gICAqL1xyXG4gIHB1YmxpYyBkb2N1bWVudHMoKTogUHJvbWlzZTxbRG9jdW1lbnRbXSxhbnldPiB7XHJcbiAgICByZXR1cm4gbmV3IFByb21pc2UoKHJlcywgcmVqKSA9PiB7XHJcbiAgICAgIHN1cGVyXHJcbiAgICAgICAgLnByb2Nlc3NSZXF1ZXN0PERvY3VtZW50WE1MT2JqZWN0Pih7XHJcbiAgICAgICAgICBtZXRob2ROYW1lOiAnR2V0U3R1ZGVudERvY3VtZW50SW5pdGlhbERhdGEnLFxyXG4gICAgICAgICAgcGFyYW1TdHI6IHsgY2hpbGRJbnRJZDogMCB9LFxyXG4gICAgICAgIH0pXHJcbiAgICAgICAgLnRoZW4oKHhtbE9iamVjdCkgPT4ge1xyXG4gICAgICAgICAgaWYodHlwZW9mKHhtbE9iamVjdFsnU3R1ZGVudERvY3VtZW50cyddWzBdLlN0dWRlbnREb2N1bWVudERhdGFzWzBdKT09XCJzdHJpbmdcIil7Y29uc29sZS5sb2coXCJ3aGVyZSBpcyBteSBtaW5kXCIpO3JldHVybiByZXMoW1tdLFxyXG4gICAgICAgICAgICAvLyBAdHMtaWdub3JlXHJcbiAgICAgICAgICAgIHhtbE9iamVjdC5leHRyYURhdGFdKX1cclxuICAgICAgICAgIGVsc2V7XHJcbiAgICAgICAgICByZXMoW1xyXG4gICAgICAgICAgICB4bWxPYmplY3RbJ1N0dWRlbnREb2N1bWVudHMnXVswXS5TdHVkZW50RG9jdW1lbnREYXRhc1swXS5TdHVkZW50RG9jdW1lbnREYXRhLm1hcChcclxuICAgICAgICAgICAgICAoeG1sOiBhbnkpID0+IG5ldyBEb2N1bWVudCh4bWwsIHN1cGVyLmNyZWRlbnRpYWxzKVxyXG4gICAgICAgICAgICApLFxyXG4gICAgICAgICAgICAvL0B0cy1pZ25vcmVcclxuICAgICAgICAgICAgeG1sT2JqZWN0LmV4dHJhRGF0YV1cclxuICAgICAgICAgICk7fVxyXG4gICAgICAgIH0pXHJcbiAgICAgICAgLmNhdGNoKHJlaik7XHJcbiAgICB9KTtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIEdldHMgYSBsaXN0IG9mIHJlcG9ydCBjYXJkc1xyXG4gICAqIEByZXR1cm5zIHtQcm9taXNlPFJlcG9ydENhcmRbXT59IFJldHVybnMgYSBsaXN0IG9mIHJlcG9ydCBjYXJkcyB0aGF0IGNhbiBmZXRjaCBhIGZpbGVcclxuICAgKiBAZGVzY3JpcHRpb25cclxuICAgKiBgYGBqc1xyXG4gICAqIGNvbnN0IHJlcG9ydENhcmRzID0gYXdhaXQgY2xpZW50LnJlcG9ydENhcmRzKCk7XHJcbiAgICogY29uc3QgZmlsZXMgPSBhd2FpdCBQcm9taXNlLmFsbChyZXBvcnRDYXJkcy5tYXAoKGNhcmQpID0+IGNhcmQuZ2V0KCkpKTtcclxuICAgKiBjb25zdCBiYXNlNjRhcnIgPSBmaWxlcy5tYXAoKGZpbGUpID0+IGZpbGUuYmFzZTY0KTsgLy8gW1wiSlZCRVJpMC4uLlwiLCBcImRVSW9hMS4uLlwiLCAuLi5dO1xyXG4gICAqIGBgYFxyXG4gICAqL1xyXG4gIHB1YmxpYyByZXBvcnRDYXJkcygpOiBQcm9taXNlPFtSZXBvcnRDYXJkW10sYW55XT4ge1xyXG4gICAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXMsIHJlaikgPT4ge1xyXG4gICAgICBzdXBlclxyXG4gICAgICAgIC5wcm9jZXNzUmVxdWVzdDxSZXBvcnRDYXJkc1hNTE9iamVjdD4oe1xyXG4gICAgICAgICAgbWV0aG9kTmFtZTogJ0dldFJlcG9ydENhcmRJbml0aWFsRGF0YScsXHJcbiAgICAgICAgICBwYXJhbVN0cjogeyBjaGlsZEludElkOiAwIH0sXHJcbiAgICAgICAgfSlcclxuICAgICAgICAudGhlbigoeG1sT2JqZWN0KSA9PiB7XHJcbiAgICAgICAgICByZXMoW1xyXG4gICAgICAgICAgICB4bWxPYmplY3QuUkNSZXBvcnRpbmdQZXJpb2REYXRhWzBdLlJDUmVwb3J0aW5nUGVyaW9kc1swXS5SQ1JlcG9ydGluZ1BlcmlvZC5tYXAoXHJcbiAgICAgICAgICAgICAgKHhtbCkgPT4gbmV3IFJlcG9ydENhcmQoeG1sLCBzdXBlci5jcmVkZW50aWFscylcclxuICAgICAgICAgICAgICAvL0B0cy1pZ25vcmVcclxuICAgICAgICAgICAgKSx4bWxPYmplY3QuZXh0cmFEYXRhXVxyXG4gICAgICAgICAgKTtcclxuICAgICAgICB9KVxyXG4gICAgICAgIC5jYXRjaChyZWopO1xyXG4gICAgfSk7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBHZXRzIHRoZSBzdHVkZW50J3Mgc2Nob29sJ3MgaW5mb3JtYXRpb25cclxuICAgKiBAcmV0dXJucyB7UHJvbWlzZTxTY2hvb2xJbmZvPn0gUmV0dXJucyB0aGUgaW5mb3JtYXRpb24gb2YgdGhlIHN0dWRlbnQncyBzY2hvb2xcclxuICAgKiBAZGVzY3JpcHRpb25cclxuICAgKiBgYGBqc1xyXG4gICAqIGF3YWl0IGNsaWVudC5zY2hvb2xJbmZvKCk7XHJcbiAgICpcclxuICAgKiBjbGllbnQuc2Nob29sSW5mbygpLnRoZW4oKHNjaG9vbEluZm8pID0+IHtcclxuICAgKiAgY29uc29sZS5sb2coXy51bmlxKHNjaG9vbEluZm8uc3RhZmYubWFwKChzdGFmZikgPT4gc3RhZmYubmFtZSkpKTsgLy8gTGlzdCBhbGwgc3RhZmYgcG9zaXRpb25zIHVzaW5nIGxvZGFzaFxyXG4gICAqIH0pXHJcbiAgICogYGBgXHJcbiAgICovXHJcbiAgcHVibGljIHNjaG9vbEluZm8oKTogUHJvbWlzZTxbU2Nob29sSW5mbyxhbnldPiB7XHJcbiAgICByZXR1cm4gbmV3IFByb21pc2UoKHJlcywgcmVqKSA9PiB7XHJcbiAgICAgIHN1cGVyXHJcbiAgICAgICAgLnByb2Nlc3NSZXF1ZXN0PFNjaG9vbEluZm9YTUxPYmplY3Qme2V4dHJhRGF0YT86YW55fT4oe1xyXG4gICAgICAgICAgbWV0aG9kTmFtZTogJ1N0dWRlbnRTY2hvb2xJbmZvJyxcclxuICAgICAgICAgIHBhcmFtU3RyOiB7IGNoaWxkSW50SUQ6IDAgfSxcclxuICAgICAgICB9KVxyXG4gICAgICAgIC50aGVuKChyZXN1bHQpID0+IHtcclxuICAgICAgICAgIGNvbnN0IHhtbE9iamVjdD1yZXN1bHQuU3R1ZGVudFNjaG9vbEluZm9MaXN0aW5nWzBdO1xyXG4gICAgICAgICAgLy9AdHMtaWdub3JlXHJcbiAgICAgICAgICB4bWxPYmplY3QuZXh0cmFEYXRhPXJlc3VsdC5leHRyYURhdGE7XHJcbiAgICAgICAgICByZXMoW3tcclxuICAgICAgICAgICAgc2Nob29sOiB7XHJcbiAgICAgICAgICAgICAgYWRkcmVzczogeG1sT2JqZWN0WydAX1NjaG9vbEFkZHJlc3MnXVswXSxcclxuICAgICAgICAgICAgICBhZGRyZXNzQWx0OiB4bWxPYmplY3RbJ0BfU2Nob29sQWRkcmVzczInXVswXSxcclxuICAgICAgICAgICAgICBjaXR5OiB4bWxPYmplY3RbJ0BfU2Nob29sQ2l0eSddWzBdLFxyXG4gICAgICAgICAgICAgIHppcENvZGU6IHhtbE9iamVjdFsnQF9TY2hvb2xaaXAnXVswXSxcclxuICAgICAgICAgICAgICBwaG9uZTogeG1sT2JqZWN0WydAX1Bob25lJ11bMF0sXHJcbiAgICAgICAgICAgICAgYWx0UGhvbmU6IHhtbE9iamVjdFsnQF9QaG9uZTInXVswXSxcclxuICAgICAgICAgICAgICBwcmluY2lwYWw6IHtcclxuICAgICAgICAgICAgICAgIG5hbWU6IHhtbE9iamVjdFsnQF9QcmluY2lwYWwnXVswXSxcclxuICAgICAgICAgICAgICAgIGVtYWlsOiB4bWxPYmplY3RbJ0BfUHJpbmNpcGFsRW1haWwnXVswXSxcclxuICAgICAgICAgICAgICAgIHN0YWZmR3U6IHhtbE9iamVjdFsnQF9QcmluY2lwYWxHdSddWzBdLFxyXG4gICAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgIHN0YWZmOiB4bWxPYmplY3QuU3RhZmZMaXN0c1swXS5TdGFmZkxpc3QubWFwKChzdGFmZikgPT4gKHtcclxuICAgICAgICAgICAgICBuYW1lOiBzdGFmZlsnQF9OYW1lJ11bMF0sXHJcbiAgICAgICAgICAgICAgZW1haWw6IHN0YWZmWydAX0VNYWlsJ11bMF0sXHJcbiAgICAgICAgICAgICAgc3RhZmZHdTogc3RhZmZbJ0BfU3RhZmZHVSddWzBdLFxyXG4gICAgICAgICAgICAgIGpvYlRpdGxlOiBzdGFmZlsnQF9UaXRsZSddWzBdLFxyXG4gICAgICAgICAgICAgIGV4dG46IHN0YWZmWydAX0V4dG4nXVswXSxcclxuICAgICAgICAgICAgICBwaG9uZTogc3RhZmZbJ0BfUGhvbmUnXVswXSxcclxuICAgICAgICAgICAgfSkpLFxyXG4gICAgICAgICAgICAvL0B0cy1pZ25vcmVcclxuICAgICAgICAgIH0seG1sT2JqZWN0LmV4dHJhRGF0YV0pO1xyXG4gICAgICAgIH0pXHJcbiAgICAgICAgLmNhdGNoKHJlaik7XHJcbiAgICB9KTtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIEdldHMgdGhlIHNjaGVkdWxlIG9mIHRoZSBzdHVkZW50XHJcbiAgICogQHBhcmFtIHtudW1iZXJ9IHRlcm1JbmRleCBUaGUgaW5kZXggb2YgdGhlIHRlcm0uXHJcbiAgICogQHJldHVybnMge1Byb21pc2U8U2NoZWR1bGU+fSBSZXR1cm5zIHRoZSBzY2hlZHVsZSBvZiB0aGUgc3R1ZGVudFxyXG4gICAqIEBkZXNjcmlwdGlvblxyXG4gICAqIGBgYGpzXHJcbiAgICogYXdhaXQgc2NoZWR1bGUoMCkgLy8gLT4geyB0ZXJtOiB7IGluZGV4OiAwLCBuYW1lOiAnMXN0IFF0ciBQcm9ncmVzcycgfSwgLi4uIH1cclxuICAgKiBgYGBcclxuICAgKi9cclxuICBwdWJsaWMgc2NoZWR1bGUodGVybUluZGV4PzogbnVtYmVyKTogUHJvbWlzZTxbYW55LGFueV0+IHtcclxuICAgIHJldHVybiBuZXcgUHJvbWlzZSgocmVzLCByZWopID0+IHtcclxuICAgICAgc3VwZXJcclxuICAgICAgICAucHJvY2Vzc1JlcXVlc3Q8YW55Pih7XHJcbiAgICAgICAgICBtZXRob2ROYW1lOiAnU3R1ZGVudENsYXNzTGlzdCcsXHJcbiAgICAgICAgICBwYXJhbVN0cjogeyBjaGlsZEludElkOiAwLCAuLi4odGVybUluZGV4ICE9IG51bGwgPyB7IFRlcm1JbmRleDogdGVybUluZGV4IH0gOiB7fSkgfSxcclxuICAgICAgICB9KVxyXG4gICAgICAgIC50aGVuKCh4bWxPYmplY3Q6YW55KSA9PiB7XHJcbiAgICAgICAgICB2YXIgcmVzcG9uc2U6YW55PXt9XHJcbiAgICAgICAgICByZXNwb25zZS50ZXJtTmFtZT14bWxPYmplY3QuU3R1ZGVudENsYXNzU2NoZWR1bGVbMF1bJ0BfVGVybUluZGV4TmFtZSddWzBdOyAvL2NvdWxkIHNvbWV0aW1lcyBiZSBzdHJpbmdzIGJ1dCBmdWNrIHRoYXRcclxuICAgICAgICAgIHJlc3BvbnNlLnRlcm1JbmRleD14bWxPYmplY3QuU3R1ZGVudENsYXNzU2NoZWR1bGVbMF1bJ0BfVGVybUluZGV4J11bMF07XHJcbiAgICAgICAgICAvL2ZvciBub3cgd2UncmUgbm90IGdyYWJiaW5nIHRoZSB0ZXJtcyBmb3IgdGhlIGNvbmNjdXJlbnQgc2Nob29sLCB0aGV5IGxvd2sgZG9uJ3QgbWF0dGVyXHJcbiAgICAgICAgICByZXNwb25zZS50ZXJtcz14bWxPYmplY3QuU3R1ZGVudENsYXNzU2NoZWR1bGVbMF0uVGVybUxpc3RzWzBdLlRlcm1MaXN0aW5nLm1hcCgodGVybTphbnkpPT4oe3N0YXJ0OnRlcm1bJ0BfQmVnaW5EYXRlJ11bMF0sZW5kOnRlcm1bJ0BfRW5kRGF0ZSddWzBdLHRlcm1JbmRleDp0ZXJtWydAX1Rlcm1JbmRleCddWzBdLHRlcm1OYW1lOnRlcm1bJ0BfVGVybU5hbWUnXVswXX0pKVxyXG4gICAgICAgICAgXHJcbiAgICAgICAgICByZXNwb25zZS5tYWluQ2xhc3Nlcz14bWxPYmplY3QuU3R1ZGVudENsYXNzU2NoZWR1bGVbMF0uQ2xhc3NMaXN0c1swXS5DbGFzc0xpc3RpbmcubWFwKChjb3Vyc2U6YW55KT0+KHtuYW1lOmNvdXJzZVsnQF9Db3Vyc2VUaXRsZSddWzBdLHBlcmlvZDpjb3Vyc2VbJ0BfUGVyaW9kJ11bMF0sdGVhY2hlcjpjb3Vyc2VbJ0BfVGVhY2hlciddWzBdLHJvb206Y291cnNlWydAX1Jvb21OYW1lJ11bMF19KSlcclxuICAgICAgICAgIHZhciBjaGVja2VyPWZhbHNlO1xyXG4gICAgICAgICAgdHJ5e1xyXG4gICAgICAgICAgICBjaGVja2VyPXhtbE9iamVjdC5TdHVkZW50Q2xhc3NTY2hlZHVsZVswXS5Db25jdXJyZW50U2Nob29sU3R1ZGVudENsYXNzU2NoZWR1bGVzWzBdLkNvbmN1cnJlbnRTY2hvb2xTdHVkZW50Q2xhc3NTY2hlZHVsZVswXS5cclxuICAgICAgICAgICAgQ29uU2NoQ2xhc3NMaXN0c1swXS5DbGFzc0xpc3RpbmdbMF0hPScnXHJcbiAgICAgICAgICAgIFxyXG4gICAgICAgICAgfWNhdGNoe31cclxuXHJcbiAgICAgICAgICBcclxuICAgICAgICAgIGlmKGNoZWNrZXIpe1xyXG4gICAgICAgICAgICByZXNwb25zZS5jb25DbGFzc2VzPXhtbE9iamVjdC5TdHVkZW50Q2xhc3NTY2hlZHVsZVswXS5Db25jdXJyZW50U2Nob29sU3R1ZGVudENsYXNzU2NoZWR1bGVzWzBdLkNvbmN1cnJlbnRTY2hvb2xTdHVkZW50Q2xhc3NTY2hlZHVsZVswXS5Db25TY2hDbGFzc0xpc3RzWzBdLkNsYXNzTGlzdGluZy5tYXAoKGNvdXJzZTphbnkpPT4oe25hbWU6Y291cnNlWydAX0NvdXJzZVRpdGxlJ11bMF0scGVyaW9kOmNvdXJzZVsnQF9QZXJpb2QnXVswXSx0ZWFjaGVyOmNvdXJzZVsnQF9UZWFjaGVyJ11bMF0scm9vbTpjb3Vyc2VbJ0BfUm9vbU5hbWUnXVswXX0pKVxyXG4gICAgICAgICAgICByZXNwb25zZS5jb25DbGFzc2VzLmNvbk5hbWU9eG1sT2JqZWN0LlN0dWRlbnRDbGFzc1NjaGVkdWxlWzBdLkNvbmN1cnJlbnRTY2hvb2xTdHVkZW50Q2xhc3NTY2hlZHVsZXNbMF0uQ29uY3VycmVudFNjaG9vbFN0dWRlbnRDbGFzc1NjaGVkdWxlWzBdWydAX1NjaG9vbE5hbWUnXVxyXG4gICAgICAgICAgfVxyXG4gICAgICAgICAgdHJ5e1xyXG4gICAgICAgICAgaWYoeG1sT2JqZWN0LlN0dWRlbnRDbGFzc1NjaGVkdWxlWzBdLlRvZGF5U2NoZWR1bGVJbmZvRGF0YVswXS5TY2hvb2xJbmZvc1swXSE9Jycpe1xyXG4gICAgICAgICAgICByZXNwb25zZS50b2RheT17fVxyXG4gICAgICAgICAgICByZXNwb25zZS50b2RheS5tYWluPXhtbE9iamVjdC5TdHVkZW50Q2xhc3NTY2hlZHVsZVswXS5Ub2RheVNjaGVkdWxlSW5mb0RhdGFbMF0uU2Nob29sSW5mb3NbMF0uU2Nob29sSW5mb1swXS5DbGFzc2VzWzBdLkNsYXNzSW5mby5tYXAoKGNvdXJzZTphbnkpPT4oe25hbWU6Y291cnNlWydAX0NsYXNzTmFtZSddLHN0YXJ0OmNvdXJzZVsnQF9TdGFydFRpbWUnXSxlbmQ6Y291cnNlWydAX0VuZFRpbWUnXSx0ZWFjaGVyOmNvdXJzZVsnQF9UZWFjaGVyTmFtZSddLHBlcmlvZDpjb3Vyc2VbJ0BfUGVyaW9kJ10scm9vbTpjb3Vyc2VbJ0BfUm9vbU5hbWUnXX0pKVxyXG4gICAgICAgICAgICB0cnl7XHJcbiAgICAgICAgICAgICAgcmVzcG9uc2UudG9kYXkuY29uPXhtbE9iamVjdC5TdHVkZW50Q2xhc3NTY2hlZHVsZVswXS5Ub2RheVNjaGVkdWxlSW5mb0RhdGFbMF0uU2Nob29sSW5mb3NbMF0uU2Nob29sSW5mb1sxXS5DbGFzc2VzWzBdLkNsYXNzSW5mby5tYXAoKGNvdXJzZTphbnkpPT4oe25hbWU6Y291cnNlWydAX0NsYXNzTmFtZSddLHN0YXJ0OmNvdXJzZVsnQF9TdGFydFRpbWUnXSxlbmQ6Y291cnNlWydAX0VuZFRpbWUnXSx0ZWFjaGVyOmNvdXJzZVsnQF9UZWFjaGVyTmFtZSddLHBlcmlvZDpjb3Vyc2VbJ0BfUGVyaW9kJ10scm9vbTpjb3Vyc2VbJ0BfUm9vbU5hbWUnXX0pKVxyXG4gICAgICAgICAgICAgIHJlc3BvbnNlLnRvZGF5LmNvbk5hbWU9eG1sT2JqZWN0LlN0dWRlbnRDbGFzc1NjaGVkdWxlWzBdLlRvZGF5U2NoZWR1bGVJbmZvRGF0YVswXS5TY2hvb2xJbmZvc1swXS5TY2hvb2xpbmZvWzFdWydAX1NjaG9vbE5hbWUnXTtcclxuICAgICAgICAgICAgfWNhdGNoe2NvbnNvbGUubG9nKFwibm8gY29uY3VycmVudFwiKX1cclxuICAgICAgICAgIH1cclxuICAgICAgICAgIGVsc2V7XHJcbiAgICAgICAgICAgIHJlc3BvbnNlLnRvZGF5PWZhbHNlXHJcbiAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgXHJcbiAgICAgICAgICB9Y2F0Y2goZXJyb3Ipe2NvbnNvbGUubG9nKGVycm9yKTtyZXNwb25zZS50b2RheT1mYWxzZX1cclxuICAgICAgICAgIHJlcyhbcmVzcG9uc2UseG1sT2JqZWN0LmV4dHJhRGF0YV0pXHJcbiAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgLy9AdHMtaWdub3JlXHJcblxyXG4gICAgICAgIClcclxuICAgICAgICAuY2F0Y2gocmVqKTtcclxuICAgIH0pO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogUmV0dXJucyB0aGUgYXR0ZW5kYW5jZSBvZiB0aGUgc3R1ZGVudFxyXG4gICAqIEByZXR1cm5zIHtQcm9taXNlPEF0dGVuZGFuY2U+fSBSZXR1cm5zIGFuIEF0dGVuZGFuY2Ugb2JqZWN0XHJcbiAgICogQGRlc2NyaXB0aW9uXHJcbiAgICogYGBganNcclxuICAgKiBjbGllbnQuYXR0ZW5kYW5jZSgpXHJcbiAgICogIC50aGVuKGNvbnNvbGUubG9nKTsgLy8gLT4geyB0eXBlOiAnUGVyaW9kJywgcGVyaW9kOiB7Li4ufSwgc2Nob29sTmFtZTogJ1VuaXZlcnNpdHkgSGlnaCBTY2hvb2wnLCBhYnNlbmNlczogWy4uLl0sIHBlcmlvZEluZm9zOiBbLi4uXSB9XHJcbiAgICogYGBgXHJcbiAgICovXHJcbiAgcHVibGljIGF0dGVuZGFuY2UoKTogUHJvbWlzZTxbQXR0ZW5kYW5jZSxhbnldPiB7XHJcbiAgICByZXR1cm4gbmV3IFByb21pc2UoKHJlcywgcmVqKSA9PiB7XHJcbiAgICAgIHN1cGVyXHJcbiAgICAgICAgLnByb2Nlc3NSZXF1ZXN0PEF0dGVuZGFuY2VYTUxPYmplY3Q+KHtcclxuICAgICAgICAgIG1ldGhvZE5hbWU6ICdBdHRlbmRhbmNlJyxcclxuICAgICAgICAgIHBhcmFtU3RyOiB7XHJcbiAgICAgICAgICAgIGNoaWxkSW50SWQ6IDAsXHJcbiAgICAgICAgICB9LFxyXG4gICAgICAgIH0pXHJcbiAgICAgICAgLnRoZW4oKGF0dGVuZGFuY2VYTUxPYmplY3QpID0+IHtcclxuICAgICAgICAgIGNvbnN0IHhtbE9iamVjdCA9IGF0dGVuZGFuY2VYTUxPYmplY3QuQXR0ZW5kYW5jZVswXTtcclxuICAgICAgICAgIC8vQHRzLWlnbm9yZVxyXG4gICAgICAgICAgeG1sT2JqZWN0LmV4dHJhRGF0YT1hdHRlbmRhbmNlWE1MT2JqZWN0LmV4dHJhRGF0YVxyXG5cclxuICAgICAgICAgIHJlcyhbe1xyXG4gICAgICAgICAgICB0eXBlOiB4bWxPYmplY3RbJ0BfVHlwZSddWzBdLFxyXG4gICAgICAgICAgICBwZXJpb2Q6IHtcclxuICAgICAgICAgICAgICB0b3RhbDogTnVtYmVyKHhtbE9iamVjdFsnQF9QZXJpb2RDb3VudCddWzBdKSxcclxuICAgICAgICAgICAgICBzdGFydDogTnVtYmVyKHhtbE9iamVjdFsnQF9TdGFydFBlcmlvZCddWzBdKSxcclxuICAgICAgICAgICAgICBlbmQ6IE51bWJlcih4bWxPYmplY3RbJ0BfRW5kUGVyaW9kJ11bMF0pLFxyXG4gICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICBzY2hvb2xOYW1lOiB4bWxPYmplY3RbJ0BfU2Nob29sTmFtZSddWzBdLFxyXG4gICAgICAgICAgICBhYnNlbmNlczogeG1sT2JqZWN0LkFic2VuY2VzWzBdLkFic2VuY2VcclxuICAgICAgICAgICAgICA/IHhtbE9iamVjdC5BYnNlbmNlc1swXS5BYnNlbmNlLm1hcCgoYWJzZW5jZSkgPT4gKHtcclxuICAgICAgICAgICAgICAgICAgZGF0ZTogbmV3IERhdGUoYWJzZW5jZVsnQF9BYnNlbmNlRGF0ZSddWzBdKSxcclxuICAgICAgICAgICAgICAgICAgcmVhc29uOiBhYnNlbmNlWydAX1JlYXNvbiddWzBdLFxyXG4gICAgICAgICAgICAgICAgICBub3RlOiBhYnNlbmNlWydAX05vdGUnXVswXSxcclxuICAgICAgICAgICAgICAgICAgZGVzY3JpcHRpb246IGFic2VuY2VbJ0BfQ29kZUFsbERheURlc2NyaXB0aW9uJ11bMF0sXHJcbiAgICAgICAgICAgICAgICAgIHBlcmlvZHM6IGFic2VuY2UuUGVyaW9kc1swXS5QZXJpb2QubWFwKFxyXG4gICAgICAgICAgICAgICAgICAgIChwZXJpb2QpID0+XHJcbiAgICAgICAgICAgICAgICAgICAgICAoe1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBwZXJpb2Q6IE51bWJlcihwZXJpb2RbJ0BfTnVtYmVyJ11bMF0pLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICBuYW1lOiBwZXJpb2RbJ0BfTmFtZSddWzBdLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICByZWFzb246IHBlcmlvZFsnQF9SZWFzb24nXVswXSxcclxuICAgICAgICAgICAgICAgICAgICAgICAgY291cnNlOiBwZXJpb2RbJ0BfQ291cnNlJ11bMF0sXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHN0YWZmOiB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgbmFtZTogcGVyaW9kWydAX1N0YWZmJ11bMF0sXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgc3RhZmZHdTogcGVyaW9kWydAX1N0YWZmR1UnXVswXSxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICBlbWFpbDogcGVyaW9kWydAX1N0YWZmRU1haWwnXVswXSxcclxuICAgICAgICAgICAgICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgICAgICAgICAgICAgb3JnWWVhckd1OiBwZXJpb2RbJ0BfT3JnWWVhckdVJ11bMF0sXHJcbiAgICAgICAgICAgICAgICAgICAgICB9IGFzIEFic2VudFBlcmlvZClcclxuICAgICAgICAgICAgICAgICAgKSxcclxuICAgICAgICAgICAgICAgIH0pKVxyXG4gICAgICAgICAgICAgIDogW10sXHJcbiAgICAgICAgICAgIHBlcmlvZEluZm9zOiB4bWxPYmplY3QuVG90YWxBY3Rpdml0aWVzWzBdLlBlcmlvZFRvdGFsLm1hcCgocGQsIGkpID0+ICh7XHJcbiAgICAgICAgICAgICAgcGVyaW9kOiBOdW1iZXIocGRbJ0BfTnVtYmVyJ11bMF0pLFxyXG4gICAgICAgICAgICAgIHRvdGFsOiB7XHJcbiAgICAgICAgICAgICAgICBleGN1c2VkOiBOdW1iZXIoeG1sT2JqZWN0LlRvdGFsRXhjdXNlZFswXS5QZXJpb2RUb3RhbFtpXVsnQF9Ub3RhbCddWzBdKSxcclxuICAgICAgICAgICAgICAgIHRhcmRpZXM6IE51bWJlcih4bWxPYmplY3QuVG90YWxUYXJkaWVzWzBdLlBlcmlvZFRvdGFsW2ldWydAX1RvdGFsJ11bMF0pLFxyXG4gICAgICAgICAgICAgICAgdW5leGN1c2VkOiBOdW1iZXIoeG1sT2JqZWN0LlRvdGFsVW5leGN1c2VkWzBdLlBlcmlvZFRvdGFsW2ldWydAX1RvdGFsJ11bMF0pLFxyXG4gICAgICAgICAgICAgICAgYWN0aXZpdGllczogTnVtYmVyKHhtbE9iamVjdC5Ub3RhbEFjdGl2aXRpZXNbMF0uUGVyaW9kVG90YWxbaV1bJ0BfVG90YWwnXVswXSksXHJcbiAgICAgICAgICAgICAgICB1bmV4Y3VzZWRUYXJkaWVzOiBOdW1iZXIoeG1sT2JqZWN0LlRvdGFsVW5leGN1c2VkVGFyZGllc1swXS5QZXJpb2RUb3RhbFtpXVsnQF9Ub3RhbCddWzBdKSxcclxuICAgICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICB9KSkgYXMgUGVyaW9kSW5mb1tdLFxyXG4gICAgICAgICAgfSBhcyBBdHRlbmRhbmNlLFxyXG4gICAgICAgICAgLy9AdHMtaWdub3JlXHJcbiAgICAgICAgeG1sT2JqZWN0LmV4dHJhRGF0YV1cclxuICAgICAgICApO1xyXG4gICAgICAgIH0pXHJcbiAgICAgICAgLmNhdGNoKHJlaik7XHJcbiAgICB9KTtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIFJldHVybnMgdGhlIGdyYWRlYm9vayBvZiB0aGUgc3R1ZGVudFxyXG4gICAqIEBwYXJhbSB7bnVtYmVyfSByZXBvcnRpbmdQZXJpb2RJbmRleCBUaGUgdGltZWZyYW1lIHRoYXQgdGhlIGdyYWRlYm9vayBzaG91bGQgcmV0dXJuXHJcbiAgICogQHJldHVybnMge1Byb21pc2U8R3JhZGVib29rPn0gUmV0dXJucyBhIEdyYWRlYm9vayBvYmplY3RcclxuICAgKiBAZGVzY3JpcHRpb25cclxuICAgKiBgYGBqc1xyXG4gICAqIGNvbnN0IGdyYWRlYm9vayA9IGF3YWl0IGNsaWVudC5ncmFkZWJvb2soKTtcclxuICAgKiBjb25zb2xlLmxvZyhncmFkZWJvb2spOyAvLyB7IGVycm9yOiAnJywgdHlwZTogJ1RyYWRpdGlvbmFsJywgcmVwb3J0aW5nUGVyaW9kOiB7Li4ufSwgY291cnNlczogWy4uLl0gfTtcclxuICAgKlxyXG4gICAqIGF3YWl0IGNsaWVudC5ncmFkZWJvb2soMCkgLy8gU29tZSBzY2hvb2xzIHdpbGwgaGF2ZSBSZXBvcnRpbmdQZXJpb2RJbmRleCAwIGFzIFwiMXN0IFF1YXJ0ZXIgUHJvZ3Jlc3NcIlxyXG4gICAqIGF3YWl0IGNsaWVudC5ncmFkZWJvb2soNykgLy8gU29tZSBzY2hvb2xzIHdpbGwgaGF2ZSBSZXBvcnRpbmdQZXJpb2RJbmRleCA3IGFzIFwiNHRoIFF1YXJ0ZXJcIlxyXG4gICAqIGBgYFxyXG4gICAqL1xyXG4gIHB1YmxpYyBncmFkZWJvb2socmVwb3J0aW5nUGVyaW9kSW5kZXg/OiBudW1iZXIsb3JnWWVhckd1PzpzdHJpbmcsIGZyZXNoPXRydWUpOiBQcm9taXNlPFtHcmFkZWJvb2ssYW55XT4ge1xyXG4gICAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXMsIHJlaikgPT4ge1xyXG5cclxuXHJcblxyXG4gICAgICBjb25zdCBwYXJzZUJyYW5jaCA9ICh4bWxPYmplY3Q6IEdyYWRlYm9va1hNTE9iamVjdCB8IGFueSkgPT4ge1xyXG5cclxuICAgICAgICAgIFxyXG4gICAgICAgICAgdHJ5e1xyXG4gICAgICAgICAgICBpZiAoeG1sT2JqZWN0LlJUX0VSUk9SWzBdWydAX0VSUk9SX01FU1NBR0UnXVswXS5pbmNsdWRlcyhcIlRoZSB1c2VyIG5hbWUgb3IgcGFzc3dvcmQgaXMgaW5jb3JyZWN0XCIpfHx4bWxPYmplY3QuUlRfRVJST1JbMF1bJ0BfRVJST1JfTUVTU0FHRSddWzBdLmluY2x1ZGVzKFwiSW52YWxpZCB1c2VyIGlkIG9yIHBhc3N3b3JkXCIpKSB7cmVqKG5ldyBFcnJvcihcIkludmFsaWQvSW5jb3JyZWN0IFVzZXJuYW1lIG9yIFBhc3N3b3JkXCIpKTt9XHJcbiAgICAgICAgICAgIGVsc2V7cmVqKG5ldyBSZXF1ZXN0RXhjZXB0aW9uKHhtbE9iamVjdCkpfTt9XHJcbiAgICAgICAgICBjYXRjaChlKXtcclxuICAgICAgICBcclxuICAgICAgICAgIHJlcyhbe1xyXG4gICAgICAgICAgICBlcnJvcjogeG1sT2JqZWN0LkdyYWRlYm9va1swXVsnQF9FcnJvck1lc3NhZ2UnXVswXSxcclxuICAgICAgICAgICAgdHlwZTogeG1sT2JqZWN0LkdyYWRlYm9va1swXVsnQF9UeXBlJ11bMF0sXHJcbiAgICAgICAgICAgIHJlcG9ydGluZ1BlcmlvZDoge1xyXG4gICAgICAgICAgICAgIGN1cnJlbnQ6IHtcclxuICAgICAgICAgICAgICAgIGluZGV4OlxyXG4gICAgICAgICAgICAgICAgICByZXBvcnRpbmdQZXJpb2RJbmRleCA/P1xyXG4gICAgICAgICAgICAgICAgICBOdW1iZXIoXHJcbiAgICAgICAgICAgICAgICAgICAgeG1sT2JqZWN0LkdyYWRlYm9va1swXS5SZXBvcnRpbmdQZXJpb2RzWzBdLlJlcG9ydFBlcmlvZC5maW5kKFxyXG4gICAgICAgICAgICAgICAgICAgICAgKHg6YW55KSA9PiB4WydAX0dyYWRlUGVyaW9kJ11bMF0gPT09IHhtbE9iamVjdC5HcmFkZWJvb2tbMF0uUmVwb3J0aW5nUGVyaW9kWzBdWydAX0dyYWRlUGVyaW9kJ11bMF1cclxuICAgICAgICAgICAgICAgICAgICApPy5bJ0BfSW5kZXgnXVswXVxyXG4gICAgICAgICAgICAgICAgICApLFxyXG4gICAgICAgICAgICAgICAgZGF0ZToge1xyXG4gICAgICAgICAgICAgICAgICBzdGFydDogbmV3IERhdGUoeG1sT2JqZWN0LkdyYWRlYm9va1swXS5SZXBvcnRpbmdQZXJpb2RbMF1bJ0BfU3RhcnREYXRlJ11bMF0pLFxyXG4gICAgICAgICAgICAgICAgICBlbmQ6IG5ldyBEYXRlKHhtbE9iamVjdC5HcmFkZWJvb2tbMF0uUmVwb3J0aW5nUGVyaW9kWzBdWydAX0VuZERhdGUnXVswXSksXHJcbiAgICAgICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICAgICAgbmFtZTogeG1sT2JqZWN0LkdyYWRlYm9va1swXS5SZXBvcnRpbmdQZXJpb2RbMF1bJ0BfR3JhZGVQZXJpb2QnXVswXSxcclxuICAgICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICAgIGF2YWlsYWJsZTogeG1sT2JqZWN0LkdyYWRlYm9va1swXS5SZXBvcnRpbmdQZXJpb2RzWzBdLlJlcG9ydFBlcmlvZC5tYXAoKHBlcmlvZDphbnkpID0+ICh7XHJcbiAgICAgICAgICAgICAgICBkYXRlOiB7IHN0YXJ0OiBuZXcgRGF0ZShwZXJpb2RbJ0BfU3RhcnREYXRlJ11bMF0pLCBlbmQ6IG5ldyBEYXRlKHBlcmlvZFsnQF9FbmREYXRlJ11bMF0pIH0sXHJcbiAgICAgICAgICAgICAgICBuYW1lOiBwZXJpb2RbJ0BfR3JhZGVQZXJpb2QnXVswXSxcclxuICAgICAgICAgICAgICAgIGluZGV4OiBOdW1iZXIocGVyaW9kWydAX0luZGV4J11bMF0pLFxyXG4gICAgICAgICAgICAgIH0pKSxcclxuICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgY291cnNlczogeG1sT2JqZWN0LkdyYWRlYm9va1swXS5Db3Vyc2VzWzBdLkNvdXJzZS5tYXAoKGNvdXJzZTphbnkpID0+ICh7XHJcbiAgICAgICAgICAgICAgY291cnNlSUQ6IGNvdXJzZVsnQF9Db3Vyc2VJRCddPy5bMF0gPz8gXCJcIixcclxuICAgICAgICAgICAgICBwZXJpb2Q6IE51bWJlcihjb3Vyc2VbJ0BfUGVyaW9kJ11bMF0pLFxyXG4gICAgICAgICAgICAgIHRpdGxlOiBoZS5kZWNvZGUoY291cnNlWydAX1RpdGxlJ11bMF0pLFxyXG4gICAgICAgICAgICAgIHJvb206IGNvdXJzZVsnQF9Sb29tJ11bMF0sXHJcbiAgICAgICAgICAgICAgc3RhZmY6IHtcclxuICAgICAgICAgICAgICAgIG5hbWU6IGNvdXJzZVsnQF9TdGFmZiddWzBdLFxyXG4gICAgICAgICAgICAgICAgZW1haWw6IGNvdXJzZVsnQF9TdGFmZkVNYWlsJ11bMF0sXHJcbiAgICAgICAgICAgICAgICBzdGFmZkd1OiBjb3Vyc2VbJ0BfU3RhZmZHVSddWzBdLFxyXG4gICAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgICAgbWFya3M6IHR5cGVvZihjb3Vyc2UuTWFya3NbMF0pIT09J3N0cmluZycgPyAoY291cnNlLk1hcmtzWzBdLk1hcmsubWFwKChtYXJrOmFueSkgPT4gKHtcclxuICAgICAgICAgICAgICAgIG5hbWU6IG1hcmtbJ0BfTWFya05hbWUnXVswXSxcclxuICAgICAgICAgICAgICAgIGNhbGN1bGF0ZWRTY29yZToge1xyXG4gICAgICAgICAgICAgICAgICBzdHJpbmc6IG1hcmtbJ0BfQ2FsY3VsYXRlZFNjb3JlU3RyaW5nJ11bMF0sXHJcbiAgICAgICAgICAgICAgICAgIHJhdzogTnVtYmVyKG1hcmtbJ0BfQ2FsY3VsYXRlZFNjb3JlUmF3J11bMF0pLFxyXG4gICAgICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgICAgIHdlaWdodGVkQ2F0ZWdvcmllczpcclxuICAgICAgICAgICAgICAgICAgdHlwZW9mIG1hcmtbJ0dyYWRlQ2FsY3VsYXRpb25TdW1tYXJ5J11bMF0gIT09ICdzdHJpbmcnXHJcbiAgICAgICAgICAgICAgICAgICAgPyBtYXJrWydHcmFkZUNhbGN1bGF0aW9uU3VtbWFyeSddWzBdLkFzc2lnbm1lbnRHcmFkZUNhbGMubWFwKFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAod2VpZ2h0ZWQ6IHsgW3g6IHN0cmluZ106IGFueVtdOyB9KSA9PlxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICh7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0eXBlOiBoZS5kZWNvZGUod2VpZ2h0ZWRbJ0BfVHlwZSddWzBdKSxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNhbGN1bGF0ZWRNYXJrOiB3ZWlnaHRlZFsnQF9DYWxjdWxhdGVkTWFyayddWzBdLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgd2VpZ2h0OiB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGV2YWx1YXRlZDogd2VpZ2h0ZWRbJ0BfV2VpZ2h0ZWRQY3QnXVswXSxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgc3RhbmRhcmQ6IHdlaWdodGVkWydAX1dlaWdodCddWzBdLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHBvaW50czoge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjdXJyZW50OiBOdW1iZXIod2VpZ2h0ZWRbJ0BfUG9pbnRzJ11bMF0pLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICBwb3NzaWJsZTogTnVtYmVyKHdlaWdodGVkWydAX1BvaW50c1Bvc3NpYmxlJ11bMF0pLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICB9IGFzIFdlaWdodGVkQ2F0ZWdvcnkpXHJcbiAgICAgICAgICAgICAgICAgICAgICApXHJcbiAgICAgICAgICAgICAgICAgICAgOiBbXSxcclxuICAgICAgICAgICAgICAgIGFzc2lnbm1lbnRzOlxyXG4gICAgICAgICAgICAgICAgICB0eXBlb2YgbWFyay5Bc3NpZ25tZW50c1swXSAhPT0gJ3N0cmluZydcclxuICAgICAgICAgICAgICAgICAgICA/IChtYXJrLkFzc2lnbm1lbnRzWzBdLkFzc2lnbm1lbnQubWFwKChhc3NpZ25tZW50OmFueSkgPT4gKHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgZ3JhZGVib29rSWQ6IGFzc2lnbm1lbnRbJ0BfR3JhZGVib29rSUQnXVswXSxcclxuICAgICAgICAgICAgICAgICAgICAgICAgbmFtZTogZGVjb2RlVVJJKGFzc2lnbm1lbnRbJ0BfTWVhc3VyZSddWzBdKSxcclxuICAgICAgICAgICAgICAgICAgICAgICAgdHlwZTogaGUuZGVjb2RlKGFzc2lnbm1lbnRbJ0BfVHlwZSddWzBdKSxcclxuICAgICAgICAgICAgICAgICAgICAgICAgZGF0ZToge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgIHN0YXJ0OiBuZXcgRGF0ZShhc3NpZ25tZW50WydAX0RhdGUnXVswXSksXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgZHVlOiBuZXcgRGF0ZShhc3NpZ25tZW50WydAX0R1ZURhdGUnXVswXSksXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHNjb3JlOiB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgdHlwZTogaGUuZGVjb2RlKGFzc2lnbm1lbnRbJ0BfU2NvcmVUeXBlJ11bMF0pLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgIHZhbHVlOiBhc3NpZ25tZW50WydAX1Njb3JlJ10gIT09IHVuZGVmaW5lZCA/IGFzc2lnbm1lbnRbJ0BfU2NvcmUnXSA6IFwiTm90IEdyYWRlZFwiLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICAgICAgICAgICAgICBwb2ludHM6IGFzc2lnbm1lbnRbJ0BfUG9pbnRzJ11bMF0sXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIG5vdGVzOiBoZS5kZWNvZGUoYXNzaWdubWVudFsnQF9Ob3RlcyddWzBdKSxcclxuICAgICAgICAgICAgICAgICAgICAgICAgdGVhY2hlcklkOiBhc3NpZ25tZW50WydAX1RlYWNoZXJJRCddWzBdLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICBkZXNjcmlwdGlvbjogZGVjb2RlVVJJKGFzc2lnbm1lbnRbJ0BfTWVhc3VyZURlc2NyaXB0aW9uJ11bMF0pLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICBoYXNEcm9wYm94OiBKU09OLnBhcnNlKGFzc2lnbm1lbnRbJ0BfSGFzRHJvcEJveCddWzBdKSxcclxuICAgICAgICAgICAgICAgICAgICAgICAgc3R1ZGVudElkOiBhc3NpZ25tZW50WydAX1N0dWRlbnRJRCddWzBdLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICBkcm9wYm94RGF0ZToge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgIHN0YXJ0OiBuZXcgRGF0ZShhc3NpZ25tZW50WydAX0Ryb3BTdGFydERhdGUnXVswXSksXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgZW5kOiBuZXcgRGF0ZShhc3NpZ25tZW50WydAX0Ryb3BFbmREYXRlJ11bMF0pLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICAgICAgICAgICAgICByZXNvdXJjZXM6XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgdHlwZW9mIGFzc2lnbm1lbnQuUmVzb3VyY2VzWzBdICE9PSAnc3RyaW5nJ1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgPyAvKihhc3NpZ25tZW50LlJlc291cmNlc1swXS5SZXNvdXJjZS5tYXAoKHJzcmM6YW55KSA9PiB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgc3dpdGNoIChyc3JjWydAX1R5cGUnXVswXSkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgY2FzZSAnRmlsZSc6IHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgY29uc3QgZmlsZVJzcmMgPSByc3JjIGFzIEZpbGVSZXNvdXJjZVhNTE9iamVjdDtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0eXBlOiBSZXNvdXJjZVR5cGUuRklMRSxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBmaWxlOiB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0eXBlOiBmaWxlUnNyY1snQF9GaWxlVHlwZSddWzBdLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgbmFtZTogZmlsZVJzcmNbJ0BfRmlsZU5hbWUnXVswXSxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHVyaTogdGhpcy5ob3N0VXJsICsgZmlsZVJzcmNbJ0BfU2VydmVyRmlsZU5hbWUnXVswXSxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJlc291cmNlOiB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBkYXRlOiBuZXcgRGF0ZShmaWxlUnNyY1snQF9SZXNvdXJjZURhdGUnXVswXSksXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZDogZmlsZVJzcmNbJ0BfUmVzb3VyY2VJRCddWzBdLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgbmFtZTogZmlsZVJzcmNbJ0BfUmVzb3VyY2VOYW1lJ11bMF0sXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfSBhcyBGaWxlUmVzb3VyY2U7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjYXNlICdVUkwnOiB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IHVybFJzcmMgPSByc3JjIGFzIFVSTFJlc291cmNlWE1MT2JqZWN0O1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4ge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHVybDogdXJsUnNyY1snQF9VUkwnXSAhPT0gdW5kZWZpbmVkID8gdXJsUnNyY1snQF9VUkwnXSA6IFwiTm90IEdpdmVuXCIsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdHlwZTogUmVzb3VyY2VUeXBlLlVSTCxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXNvdXJjZToge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZGF0ZTogbmV3IERhdGUodXJsUnNyY1snQF9SZXNvdXJjZURhdGUnXVswXSksXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZDogdXJsUnNyY1snQF9SZXNvdXJjZUlEJ11bMF0sXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBuYW1lOiB1cmxSc3JjWydAX1Jlc291cmNlTmFtZSddWzBdLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZGVzY3JpcHRpb246IHVybFJzcmNbJ0BfUmVzb3VyY2VEZXNjcmlwdGlvbiddWzBdLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcGF0aDogdXJsUnNyY1snQF9TZXJ2ZXJGaWxlTmFtZSddWzBdLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9IGFzIFVSTFJlc291cmNlO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZGVmYXVsdDpcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcmVqKFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGBUeXBlICR7cnNyY1snQF9UeXBlJ11bMF19IGRvZXMgbm90IGV4aXN0IGFzIGEgdHlwZS4gQWRkIGl0IHRvIHR5cGUgZGVjbGFyYXRpb25zLmBcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0pIGFzIChGaWxlUmVzb3VyY2UgfCBVUkxSZXNvdXJjZSlbXSkgKi8gXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvL09idmlvdXNseSB0aGlzIGlzIGFuIGluc2FuZWx5IG5lZ2xpZ2VudCBmaXguIEp1c3Qgc2F5aW5nIHRvIGNvbXBsZXRlIGhlbGwgd2l0aCB0aGUgcmVzb3VyY2UuIEJ1dCwgZ3JhZGUgbWVsb24gZG9lc24ndCB1c2UgaXQuIFNvIEkgZG9uJ3QgY2FyZS5cclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgW10gOiBbXSxcclxuICAgICAgICAgICAgICAgICAgICAgIH0pKSBhcyBBc3NpZ25tZW50W10pXHJcbiAgICAgICAgICAgICAgICAgICAgOiBbXSxcclxuICAgICAgICAgICAgICB9KSkpIGFzIE1hcmtbXTpbeyBuYW1lOiBcIm5vbmVcIiwgY2FsY3VsYXRlZFNjb3JlOiB7IHN0cmluZzogXCJub25lXCIsIHJhdzogTmFOIH0sIHdlaWdodGVkQ2F0ZWdvcmllczogW10sIGFzc2lnbm1lbnRzOiBbXSB9XSBhcyBNYXJrW10sXHJcbiAgICAgICAgICAgIH0pKSxcclxuICAgICAgICAgIH0gYXMgR3JhZGVib29rLFxyXG4gICAgICAgIHhtbE9iamVjdC5leHRyYURhdGFdXHJcbiAgICAgICAgKTt9XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgXHJcbiAgICBcclxuICAgICAgY29uc3QgZmV0Y2hCcmFuY2ggPSAoKT0+eyAgIFxyXG4gICAgICAgIHJldHVybiAgIHN1cGVyLnByb2Nlc3NSZXF1ZXN0PEdyYWRlYm9va1hNTE9iamVjdCZ7ZXh0cmFEYXRhPzphbnl9PihcclxuICAgICAgICAgIHtcclxuICAgICAgICAgICAgbWV0aG9kTmFtZTogJ0dyYWRlYm9vaycsXHJcbiAgICAgICAgICAgIHBhcmFtU3RyOiB7XHJcbiAgICAgICAgICAgICAgY2hpbGRJbnRJZDogMCxcclxuICAgICAgICAgICAgICAuLi4ocmVwb3J0aW5nUGVyaW9kSW5kZXggIT0gbnVsbCA/IHsgUmVwb3J0UGVyaW9kOiByZXBvcnRpbmdQZXJpb2RJbmRleCB9IDoge30pLFxyXG4gICAgICAgICAgICAgIC4uLihvcmdZZWFyR3UgIT0gbnVsbCA/IHsgQ29uY3VycmVudFNjaE9yZ1llYXJHVTogb3JnWWVhckd1IH0gOiB7fSlcclxuICAgICAgICAgICAgfSxcclxuICAgICAgICAgIH0sXHJcbiAgICAgICAgICAoeG1sKSA9PlxyXG4gICAgICAgICAgICBuZXcgWE1MRmFjdG9yeSh4bWwpXHJcbiAgICAgICAgICAgICAgLmVuY29kZUF0dHJpYnV0ZSgnTWVhc3VyZURlc2NyaXB0aW9uJywgJ0hhc0Ryb3BCb3gnKVxyXG4gICAgICAgICAgICAgIC5lbmNvZGVBdHRyaWJ1dGUoJ01lYXN1cmUnLCAnVHlwZScpXHJcbiAgICAgICAgICAgICAgLnRvU3RyaW5nKClcclxuICAgICAgICApfVxyXG5cclxuICAgICAgaWYoZnJlc2h8fHJlcG9ydGluZ1BlcmlvZEluZGV4PT1udWxsKXtcclxuICAgICAgICBmZXRjaEJyYW5jaCgpLnRoZW4ocmVzdWx0PT5wYXJzZUJyYW5jaChyZXN1bHQpKS5jYXRjaChlcnI9PnJlaihlcnIpKVxyXG4gICAgICB9ICAgXHJcbiAgICAgICAgZWxzZXtcclxuICAgICAgICAgIGNvbnN0IG06eG1sQ2FjaGUgPSBKU09OLnBhcnNlKGxvY2FsU3RvcmFnZS5nZXRJdGVtKFwieG1sQ2FjaGVcIikgPz8gXCJ7fVwiKVxyXG4gICAgICAgICAgY29uc3QgaWRlbnRpZmllcj10aGlzLmRpc3RyaWN0K3RoaXMudXNlcm5hbWUrcmVwb3J0aW5nUGVyaW9kSW5kZXhcclxuICAgICAgICAgIGlmKG1baWRlbnRpZmllcl0pe1xyXG4gICAgICAgICAgICBpZihNYXRoLmFicyhtW2lkZW50aWZpZXJdLmFnZS1EYXRlLm5vdygpKT4xMDAwKjYwKjYwKjI0KjMpeyAvLyBpZiBvbGRlciB0aGFuIDMgZGF5cywgcmVmcmVzaCBcclxuICAgICAgICAgICAgICAgICAgICAgIGZldGNoQnJhbmNoKCkudGhlbihyZXN1bHQ9PntcclxuICAgICAgICAgICAgICAgICAgICAgICAgXHJcbiAgICAgICAgICAgICAgICAgICAgICBjb25zdCB4bWxDYWNoZTp4bWxDYWNoZT1KU09OLnBhcnNlKGxvY2FsU3RvcmFnZS5nZXRJdGVtKFwieG1sQ2FjaGVcIikgPz8gXCJ7fVwiKTtcclxuICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IGlkZW50aWZpZXI9dGhpcy5kaXN0cmljdCt0aGlzLnVzZXJuYW1lK3JlcG9ydGluZ1BlcmlvZEluZGV4XHJcbiAgICAgICAgICAgICAgICAgICAgICB4bWxDYWNoZVtpZGVudGlmaWVyXT17ZGF0YTpyZXN1bHQsYWdlOkRhdGUubm93KCl9XHJcbiAgICAgICAgICAgICAgICAgICAgICBsb2NhbFN0b3JhZ2Uuc2V0SXRlbShcInhtbENhY2hlXCIsSlNPTi5zdHJpbmdpZnkoeG1sQ2FjaGUpKVxyXG4gICAgICAgICAgICAgICAgICAgICAgcGFyc2VCcmFuY2gocmVzdWx0KX0pLmNhdGNoKGVycj0+cmVqKGVycikpXHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgZWxzZXtcclxuICAgICAgICAgICAgICAgIHBhcnNlQnJhbmNoKG1baWRlbnRpZmllcl0uZGF0YSlcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgfVxyXG5cclxuICAgICAgICB9XHJcbiAgICB9KTtcclxuICB9XHJcblxyXG5cclxuXHJcbiAgLyoqXHJcbiAgICogR2V0IGEgbGlzdCBvZiBtZXNzYWdlcyBvZiB0aGUgc3R1ZGVudFxyXG4gICAqIEByZXR1cm5zIHtQcm9taXNlPE1lc3NhZ2VbXT59IFJldHVybnMgYW4gYXJyYXkgb2YgbWVzc2FnZXMgb2YgdGhlIHN0dWRlbnRcclxuICAgKiBAZGVzY3JpcHRpb25cclxuICAgKiBgYGBqc1xyXG4gICAqIGF3YWl0IGNsaWVudC5tZXNzYWdlcygpOyAvLyAtPiBbeyBpZDogJ0U5NzJGMUJDLTk5QTAtNENEMC04RDE1LUIxODk2OEI0M0UwOCcsIHR5cGU6ICdTdHVkZW50QWN0aXZpdHknLCAuLi4gfSwgeyBpZDogJzg2RkRBMTFELTQyQzctNDI0OS1CMDAzLTk0QjE1RUIyQzhENCcsIHR5cGU6ICdTdHVkZW50QWN0aXZpdHknLCAuLi4gfV1cclxuICAgKiBgYGBcclxuICAgKi9cclxuICBwdWJsaWMgbWVzc2FnZXMoKTogUHJvbWlzZTxbTWVzc2FnZVtdLGFueV0+IHtcclxuICAgIHJldHVybiBuZXcgUHJvbWlzZSgocmVzLCByZWopID0+IHtcclxuICAgICAgc3VwZXJcclxuICAgICAgICAucHJvY2Vzc1JlcXVlc3Q8TWVzc2FnZVhNTE9iamVjdD4oXHJcbiAgICAgICAgICB7XHJcbiAgICAgICAgICAgIG1ldGhvZE5hbWU6ICdHZXRQWFBNZXNzYWdlcycsXHJcbiAgICAgICAgICAgIHBhcmFtU3RyOiB7IGNoaWxkSW50SWQ6IDAgfSxcclxuICAgICAgICAgIH0sXHJcbiAgICAgICAgICAoeG1sKSA9PiBuZXcgWE1MRmFjdG9yeSh4bWwpLmVuY29kZUF0dHJpYnV0ZSgnQ29udGVudCcsICdSZWFkJykudG9TdHJpbmcoKVxyXG4gICAgICAgIClcclxuICAgICAgICAudGhlbigoeG1sT2JqZWN0KSA9PiB7XHJcbiAgICAgICAgICByZXMoW1xyXG4gICAgICAgICAgICB4bWxPYmplY3QuUFhQTWVzc2FnZXNEYXRhWzBdLk1lc3NhZ2VMaXN0aW5nc1swXS5NZXNzYWdlTGlzdGluZy5tYXAoXHJcbiAgICAgICAgICAgICAgKG1lc3NhZ2UpID0+IG5ldyBNZXNzYWdlKG1lc3NhZ2UsIHN1cGVyLmNyZWRlbnRpYWxzLCB0aGlzLmhvc3RVcmwpXHJcbiAgICAgICAgICAgICAgLy8gQHRzLWlnbm9yZSAvL2Z1Y2tpbmcgc3VlIG1lXHJcbiAgICAgICAgICAgICkseG1sT2JqZWN0Py5leHRyYURhdGFdXHJcbiAgICAgICAgICApO1xyXG4gICAgICAgIH0pXHJcbiAgICAgICAgLmNhdGNoKHJlaik7XHJcbiAgICB9KTtcclxuICB9XHJcblxyXG5cclxuXHJcbiAgLy9hbHRuZXJhdGUgbWV0aG9kIGZvciBzdHVkZW50SW5mbyB3aGVuIHN0dWRlbnRJbmZvIGZhaWxzOlxyXG4gIC8vdGhvc2UgdGhpbmdzIGNvbW1lbnRlZCBvdXQgYXJlIG5vdCBhcHBsaWNhYmxlIGhlcmVcclxuICBwdWJsaWMgQ2hpbGRMaXN0KCk6UHJvbWlzZTxbU3R1ZGVudEluZm8sYW55XT57XHJcbiAgICByZXR1cm4gbmV3IFByb21pc2U8W1N0dWRlbnRJbmZvLGFueV0+KChyZXMscmVqKT0+e1xyXG4gICAgICBzdXBlclxyXG4gICAgICAgIC5wcm9jZXNzUmVxdWVzdCh7bWV0aG9kTmFtZTpcIkNoaWxkTGlzdFwifSlcclxuICAgICAgICAgIC50aGVuKCh4bWxPYmplY3Q6YW55KT0+e1xyXG4gICAgICAgICAgICBjb25zdCByYXc9eG1sT2JqZWN0O1xyXG4gICAgICAgICAgICB4bWxPYmplY3Q9eG1sT2JqZWN0LkNoaWxkTGlzdFswXTtcclxuXHJcbiAgICAgICAgICAgIHJlcyhbe1xyXG4gICAgICAgICAgICBzdHVkZW50OntcclxuICAgICAgICAgICAgICBuYW1lOnhtbE9iamVjdC5DaGlsZFswXS5DaGlsZE5hbWUsIC8vZnVsbCBOYW1lIG9uIHRoaXMgZmFsbGJhY2sgbWV0aG9kXHJcbiAgICAgICAgICAgICAgbGFzdE5hbWU6XCJub3QgYXZhaWxhYmxlXCIsXHJcbiAgICAgICAgICAgICAgbmlja25hbWU6XCJub3QgYXZhaWxhYmxlXCJ9LFxyXG4gICAgICAgICAgLy8gIGJpcnRoRGF0ZTpuZXcgRGF0ZSgpLFxyXG4gICAgICAgICAgIC8vIHRyYWNrOlwibm90IGF2YWlsYWJsZVwiLFxyXG4gICAgICAgICAgIC8vIGFkZHJlc3M6XCJub3QgYXZhaWxhYmxlXCIsXHJcbiAgICAgICAgICAgIHBob3RvOm9wdGlvbmFsKHhtbE9iamVjdC5DaGlsZFswXS5waG90byksXHJcbiAgICAgICAgICAgIGNvdW5zZWxvcjp1bmRlZmluZWQsXHJcbiAgICAgICAgICAgIGN1cnJlbnRTY2hvb2w6eG1sT2JqZWN0LkNoaWxkWzBdLk9yZ2FuaXphdGlvbk5hbWVbMF0sXHJcbiAgICAgICAgICAgLy8gZGVudGlzdDp1bmRlZmluZWQsXHJcbiAgICAgICAgICAgIC8vIHBoeXNpY2lhbjp1bmRlZmluZWQsXHJcbiAgICAgICAgICAgICAgaWQ6b3B0aW9uYWwoeG1sT2JqZWN0LkNoaWxkWzBdWydAX0NoaWxkUGVybUlEJ10pLFxyXG4gICAgICAgICAgICAgIG9yZ1llYXJHdTpvcHRpb25hbCh4bWxPYmplY3QuQ2hpbGRbMF1bJ0BfT3JnWWVhckdVJ10pLFxyXG4gICAgICAgICAgICAgIC8vcGhvbmU6XCJub3QgYXZhaWxhYmxlXCIsXHJcbiAgICAgICAgICAgICAgLy9lbWFpbDpcIm5vdCBhdmFpbGFibGVcIixcclxuICAgICAgICAgICAgICAvL2VtZXJnZW5jeUNvbnRhY3RzOnVuZGVmaW5lZCxcclxuICAgICAgICAgICAgICBnZW5kZXI6XCJudWxsXCIsXHJcbiAgICAgICAgICAgICAgZ3JhZGU6b3B0aW9uYWwoeG1sT2JqZWN0LkNoaWxkWzBdLkdyYWRlKSxcclxuXHJcblxyXG5cclxuXHJcbiAgICAgICAgICB9IGFzIFN0dWRlbnRJbmZvLHJhdy5leHRyYURhdGFdKX0pXHJcbiAgICAgICAgICAuY2F0Y2gocmVqKVxyXG4gICAgfSlcclxuICB9XHJcblxyXG5cclxuICAvKipcclxuICAgKiBHZXRzIHRoZSBpbmZvIG9mIGEgc3R1ZGVudFxyXG4gICAqIEByZXR1cm5zIHtQcm9taXNlPFN0dWRlbnRJbmZvPn0gU3R1ZGVudEluZm8gb2JqZWN0XHJcbiAgICogQGRlc2NyaXB0aW9uXHJcbiAgICogYGBganNcclxuICAgKiBzdHVkZW50SW5mbygpLnRoZW4oY29uc29sZS5sb2cpIC8vIC0+IHsgc3R1ZGVudDogeyBuYW1lOiAnRXZhbiBEYXZpcycsIG5pY2tuYW1lOiAnJywgbGFzdE5hbWU6ICdEYXZpcycgfSwgLi4ufVxyXG4gICAqIGBgYFxyXG4gICAqL1xyXG4gIHB1YmxpYyBzdHVkZW50SW5mbygpOiBQcm9taXNlPFtTdHVkZW50SW5mbyxhbnldPiB7XHJcbiAgICByZXR1cm4gbmV3IFByb21pc2U8W1N0dWRlbnRJbmZvLGFueV0+KChyZXMsIHJlaikgPT4ge1xyXG4gICAgICBzdXBlclxyXG4gICAgICAgIC5wcm9jZXNzUmVxdWVzdDxTdHVkZW50SW5mb1hNTE9iamVjdD4oe1xyXG4gICAgICAgICAgbWV0aG9kTmFtZTogJ1N0dWRlbnRJbmZvJyxcclxuICAgICAgICAgIHBhcmFtU3RyOiB7IGNoaWxkSW50SWQ6IDAgfSxcclxuICAgICAgICB9KVxyXG4gICAgICAgIC50aGVuKCh4bWxPYmplY3REYXRhKSA9PiB7XHJcbiAgICAgICAgICByZXMoW3tcclxuICAgICAgICAgICAgc3R1ZGVudDoge1xyXG4gICAgICAgICAgICAgIG5hbWU6IHhtbE9iamVjdERhdGEuU3R1ZGVudEluZm9bMF0uRm9ybWF0dGVkTmFtZVswXSxcclxuICAgICAgICAgICAgICBsYXN0TmFtZTogeG1sT2JqZWN0RGF0YS5TdHVkZW50SW5mb1swXS5MYXN0TmFtZUdvZXNCeVswXSxcclxuICAgICAgICAgICAgICBuaWNrbmFtZTogeG1sT2JqZWN0RGF0YS5TdHVkZW50SW5mb1swXS5OaWNrTmFtZVswXSxcclxuICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgYmlydGhEYXRlOiBuZXcgRGF0ZSh4bWxPYmplY3REYXRhLlN0dWRlbnRJbmZvWzBdLkJpcnRoRGF0ZVswXSksXHJcbiAgICAgICAgICAgIHRyYWNrOiBvcHRpb25hbCh4bWxPYmplY3REYXRhLlN0dWRlbnRJbmZvWzBdLlRyYWNrKSxcclxuICAgICAgICAgICAgYWRkcmVzczogb3B0aW9uYWwoeG1sT2JqZWN0RGF0YS5TdHVkZW50SW5mb1swXS5BZGRyZXNzKSxcclxuICAgICAgICAgICAgcGhvdG86IG9wdGlvbmFsKHhtbE9iamVjdERhdGEuU3R1ZGVudEluZm9bMF0uUGhvdG8pLFxyXG4gICAgICAgICAgICBjb3Vuc2Vsb3I6XHJcbiAgICAgICAgICAgICAgeG1sT2JqZWN0RGF0YS5TdHVkZW50SW5mb1swXS5Db3Vuc2Vsb3JOYW1lICYmXHJcbiAgICAgICAgICAgICAgeG1sT2JqZWN0RGF0YS5TdHVkZW50SW5mb1swXS5Db3Vuc2Vsb3JFbWFpbCAmJlxyXG4gICAgICAgICAgICAgIHhtbE9iamVjdERhdGEuU3R1ZGVudEluZm9bMF0uQ291bnNlbG9yU3RhZmZHVVxyXG4gICAgICAgICAgICAgICAgPyB7XHJcbiAgICAgICAgICAgICAgICAgICAgbmFtZTogeG1sT2JqZWN0RGF0YS5TdHVkZW50SW5mb1swXS5Db3Vuc2Vsb3JOYW1lWzBdLFxyXG4gICAgICAgICAgICAgICAgICAgIGVtYWlsOiB4bWxPYmplY3REYXRhLlN0dWRlbnRJbmZvWzBdLkNvdW5zZWxvckVtYWlsWzBdLFxyXG4gICAgICAgICAgICAgICAgICAgIHN0YWZmR3U6IHhtbE9iamVjdERhdGEuU3R1ZGVudEluZm9bMF0uQ291bnNlbG9yU3RhZmZHVVswXSxcclxuICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgOiB1bmRlZmluZWQsXHJcbiAgICAgICAgICAgIGN1cnJlbnRTY2hvb2w6IHhtbE9iamVjdERhdGEuU3R1ZGVudEluZm9bMF0uQ3VycmVudFNjaG9vbFswXSxcclxuICAgICAgICAgICAgZGVudGlzdDogeG1sT2JqZWN0RGF0YS5TdHVkZW50SW5mb1swXS5EZW50aXN0XHJcbiAgICAgICAgICAgICAgPyB7XHJcbiAgICAgICAgICAgICAgICAgIG5hbWU6IHhtbE9iamVjdERhdGEuU3R1ZGVudEluZm9bMF0uRGVudGlzdFswXVsnQF9OYW1lJ11bMF0sXHJcbiAgICAgICAgICAgICAgICAgIHBob25lOiB4bWxPYmplY3REYXRhLlN0dWRlbnRJbmZvWzBdLkRlbnRpc3RbMF1bJ0BfUGhvbmUnXVswXSxcclxuICAgICAgICAgICAgICAgICAgZXh0bjogeG1sT2JqZWN0RGF0YS5TdHVkZW50SW5mb1swXS5EZW50aXN0WzBdWydAX0V4dG4nXVswXSxcclxuICAgICAgICAgICAgICAgICAgb2ZmaWNlOiB4bWxPYmplY3REYXRhLlN0dWRlbnRJbmZvWzBdLkRlbnRpc3RbMF1bJ0BfT2ZmaWNlJ11bMF0sXHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgOiB1bmRlZmluZWQsXHJcbiAgICAgICAgICAgIHBoeXNpY2lhbjogeG1sT2JqZWN0RGF0YS5TdHVkZW50SW5mb1swXS5QaHlzaWNpYW5cclxuICAgICAgICAgICAgICA/IHtcclxuICAgICAgICAgICAgICAgICAgbmFtZTogeG1sT2JqZWN0RGF0YS5TdHVkZW50SW5mb1swXS5QaHlzaWNpYW5bMF1bJ0BfTmFtZSddWzBdLFxyXG4gICAgICAgICAgICAgICAgICBwaG9uZTogeG1sT2JqZWN0RGF0YS5TdHVkZW50SW5mb1swXS5QaHlzaWNpYW5bMF1bJ0BfUGhvbmUnXVswXSxcclxuICAgICAgICAgICAgICAgICAgZXh0bjogeG1sT2JqZWN0RGF0YS5TdHVkZW50SW5mb1swXS5QaHlzaWNpYW5bMF1bJ0BfRXh0biddWzBdLFxyXG4gICAgICAgICAgICAgICAgICBob3NwaXRhbDogeG1sT2JqZWN0RGF0YS5TdHVkZW50SW5mb1swXS5QaHlzaWNpYW5bMF1bJ0BfSG9zcGl0YWwnXVswXSxcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICA6IHVuZGVmaW5lZCxcclxuICAgICAgICAgICAgaWQ6IG9wdGlvbmFsKHhtbE9iamVjdERhdGEuU3R1ZGVudEluZm9bMF0uUGVybUlEKSxcclxuICAgICAgICAgICAgb3JnWWVhckd1OiBvcHRpb25hbCh4bWxPYmplY3REYXRhLlN0dWRlbnRJbmZvWzBdLk9yZ1llYXJHVSksXHJcbiAgICAgICAgICAgIHBob25lOiBvcHRpb25hbCh4bWxPYmplY3REYXRhLlN0dWRlbnRJbmZvWzBdLlBob25lKSxcclxuICAgICAgICAgICAgZW1haWw6IG9wdGlvbmFsKHhtbE9iamVjdERhdGEuU3R1ZGVudEluZm9bMF0uRU1haWwpLFxyXG4gICAgICAgICAgICBlbWVyZ2VuY3lDb250YWN0czogeG1sT2JqZWN0RGF0YS5TdHVkZW50SW5mb1swXS5FbWVyZ2VuY3lDb250YWN0c1xyXG4gICAgICAgICAgICAgID8geG1sT2JqZWN0RGF0YS5TdHVkZW50SW5mb1swXS5FbWVyZ2VuY3lDb250YWN0c1swXS5FbWVyZ2VuY3lDb250YWN0Py5tYXAoKGNvbnRhY3QpID0+ICh7XHJcbiAgICAgICAgICAgICAgICAgIG5hbWU6IG9wdGlvbmFsKGNvbnRhY3RbJ0BfTmFtZSddKSxcclxuICAgICAgICAgICAgICAgICAgcGhvbmU6IHtcclxuICAgICAgICAgICAgICAgICAgICBob21lOiBvcHRpb25hbChjb250YWN0WydAX0hvbWVQaG9uZSddKSxcclxuICAgICAgICAgICAgICAgICAgICBtb2JpbGU6IG9wdGlvbmFsKGNvbnRhY3RbJ0BfTW9iaWxlUGhvbmUnXSksXHJcbiAgICAgICAgICAgICAgICAgICAgb3RoZXI6IG9wdGlvbmFsKGNvbnRhY3RbJ0BfT3RoZXJQaG9uZSddKSxcclxuICAgICAgICAgICAgICAgICAgICB3b3JrOiBvcHRpb25hbChjb250YWN0WydAX1dvcmtQaG9uZSddKSxcclxuICAgICAgICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgICAgICAgcmVsYXRpb25zaGlwOiBvcHRpb25hbChjb250YWN0WydAX1JlbGF0aW9uc2hpcCddKSxcclxuICAgICAgICAgICAgICAgIH0pKVxyXG4gICAgICAgICAgICAgIDogW10sXHJcbiAgICAgICAgICAgIGdlbmRlcjogb3B0aW9uYWwoeG1sT2JqZWN0RGF0YS5TdHVkZW50SW5mb1swXS5HZW5kZXIpLFxyXG4gICAgICAgICAgICBncmFkZTogb3B0aW9uYWwoeG1sT2JqZWN0RGF0YS5TdHVkZW50SW5mb1swXS5HcmFkZSksXHJcbiAgICAgICAgICAgIGxvY2tlckluZm9SZWNvcmRzOiBvcHRpb25hbCh4bWxPYmplY3REYXRhLlN0dWRlbnRJbmZvWzBdLkxvY2tlckluZm9SZWNvcmRzKSxcclxuICAgICAgICAgICAgaG9tZUxhbmd1YWdlOiBvcHRpb25hbCh4bWxPYmplY3REYXRhLlN0dWRlbnRJbmZvWzBdLkhvbWVMYW5ndWFnZSksXHJcbiAgICAgICAgICAgIGhvbWVSb29tOiBvcHRpb25hbCh4bWxPYmplY3REYXRhLlN0dWRlbnRJbmZvWzBdLkhvbWVSb29tKSxcclxuICAgICAgICAgICAgaG9tZVJvb21UZWFjaGVyOiB7XHJcbiAgICAgICAgICAgICAgZW1haWw6IG9wdGlvbmFsKHhtbE9iamVjdERhdGEuU3R1ZGVudEluZm9bMF0uSG9tZVJvb21UY2hFTWFpbCksXHJcbiAgICAgICAgICAgICAgbmFtZTogb3B0aW9uYWwoeG1sT2JqZWN0RGF0YS5TdHVkZW50SW5mb1swXS5Ib21lUm9vbVRjaCksXHJcbiAgICAgICAgICAgICAgc3RhZmZHdTogb3B0aW9uYWwoeG1sT2JqZWN0RGF0YS5TdHVkZW50SW5mb1swXS5Ib21lUm9vbVRjaFN0YWZmR1UpLFxyXG4gICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICBhZGRpdGlvbmFsSW5mbzogeG1sT2JqZWN0RGF0YS5TdHVkZW50SW5mb1swXS5Vc2VyRGVmaW5lZEdyb3VwQm94ZXNbMF0uVXNlckRlZmluZWRHcm91cEJveFxyXG4gICAgICAgICAgICAgID8gKHhtbE9iamVjdERhdGEuU3R1ZGVudEluZm9bMF0uVXNlckRlZmluZWRHcm91cEJveGVzWzBdLlVzZXJEZWZpbmVkR3JvdXBCb3gubWFwKChkZWZpbmVkQm94KSA9PiAoe1xyXG4gICAgICAgICAgICAgICAgICBpZDogb3B0aW9uYWwoZGVmaW5lZEJveFsnQF9Hcm91cEJveElEJ10pLCAvLyBzdHJpbmcgfCB1bmRlZmluZWRcclxuICAgICAgICAgICAgICAgICAgdHlwZTogZGVmaW5lZEJveFsnQF9Hcm91cEJveExhYmVsJ11bMF0sIC8vIHN0cmluZ1xyXG4gICAgICAgICAgICAgICAgICB2Y0lkOiBvcHRpb25hbChkZWZpbmVkQm94WydAX1ZDSUQnXSksIC8vIHN0cmluZyB8IHVuZGVmaW5lZFxyXG4gICAgICAgICAgICAgICAgICBpdGVtczogZGVmaW5lZEJveC5Vc2VyRGVmaW5lZEl0ZW1zWzBdLlVzZXJEZWZpbmVkSXRlbS5tYXAoKGl0ZW0pID0+ICh7XHJcbiAgICAgICAgICAgICAgICAgICAgc291cmNlOiB7XHJcbiAgICAgICAgICAgICAgICAgICAgICBlbGVtZW50OiBpdGVtWydAX1NvdXJjZUVsZW1lbnQnXVswXSxcclxuICAgICAgICAgICAgICAgICAgICAgIG9iamVjdDogaXRlbVsnQF9Tb3VyY2VPYmplY3QnXVswXSxcclxuICAgICAgICAgICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICAgICAgICAgIHZjSWQ6IGl0ZW1bJ0BfVkNJRCddWzBdLFxyXG4gICAgICAgICAgICAgICAgICAgIHZhbHVlOiBpdGVtWydAX1ZhbHVlJ11bMF0sXHJcbiAgICAgICAgICAgICAgICAgICAgdHlwZTogaXRlbVsnQF9JdGVtVHlwZSddWzBdLFxyXG4gICAgICAgICAgICAgICAgICB9KSkgYXMgQWRkaXRpb25hbEluZm9JdGVtW10sXHJcbiAgICAgICAgICAgICAgICB9KSkgYXMgQWRkaXRpb25hbEluZm9bXSlcclxuICAgICAgICAgICAgICA6IFtdLFxyXG4gICAgICAgICAgICAgIC8vQHRzLWlnbm9yZSBZb3Ugd2lsbCBuZXZlciBtYWtlIG1lIHVzZSB0eXBlU2NyaXB0LlxyXG4gICAgICAgICAgfSBhcyBTdHVkZW50SW5mbyx4bWxPYmplY3REYXRhLmV4dHJhRGF0YV0pO1xyXG4gICAgICAgIH0pXHJcbiAgICAgICAgLmNhdGNoKHJlaik7XHJcbiAgICB9KTtcclxuICB9XHJcblxyXG4gIHByaXZhdGUgZmV0Y2hFdmVudHNXaXRoaW5JbnRlcnZhbChkYXRlOiBEYXRlKSB7XHJcbiAgICByZXR1cm4gc3VwZXIucHJvY2Vzc1JlcXVlc3Q8Q2FsZW5kYXJYTUxPYmplY3Q+KFxyXG4gICAgICB7XHJcbiAgICAgICAgbWV0aG9kTmFtZTogJ1N0dWRlbnRDYWxlbmRhcicsXHJcbiAgICAgICAgcGFyYW1TdHI6IHsgY2hpbGRJbnRJZDogMCwgUmVxdWVzdERhdGU6IGRhdGUudG9JU09TdHJpbmcoKSB9LFxyXG4gICAgICB9LFxyXG4gICAgICAoeG1sKSA9PiBuZXcgWE1MRmFjdG9yeSh4bWwpLmVuY29kZUF0dHJpYnV0ZSgnVGl0bGUnLCAnSWNvbicpLnRvU3RyaW5nKClcclxuICAgICk7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKlxyXG4gICAqIEBwYXJhbSB7Q2FsZW5kYXJPcHRpb25zfSBvcHRpb25zIE9wdGlvbnMgdG8gcHJvdmlkZSBmb3IgY2FsZW5kYXIgbWV0aG9kLiBBbiBpbnRlcnZhbCBpcyByZXF1aXJlZC5cclxuICAgKiBAcmV0dXJucyB7UHJvbWlzZTxDYWxlbmRhcj59IFJldHVybnMgYSBDYWxlbmRhciBvYmplY3RcclxuICAgKiBAZGVzY3JpcHRpb25cclxuICAgKiBgYGBqc1xyXG4gICAqIGNsaWVudC5jYWxlbmRhcih7IGludGVydmFsOiB7IHN0YXJ0OiBuZXcgRGF0ZSgnNS8xLzIwMjInKSwgZW5kOiBuZXcgRGF0ZSgnOC8xLzIwMjEnKSB9LCBjb25jdXJyZW5jeTogbnVsbCB9KTsgLy8gLT4gTGltaXRsZXNzIGNvbmN1cnJlbmN5IChub3QgcmVjb21tZW5kZWQpXHJcbiAgICpcclxuICAgKiBjb25zdCBjYWxlbmRhciA9IGF3YWl0IGNsaWVudC5jYWxlbmRhcih7IGludGVydmFsOiB7IC4uLiB9fSk7XHJcbiAgICogY29uc29sZS5sb2coY2FsZW5kYXIpOyAvLyAtPiB7IHNjaG9vbERhdGU6IHsuLi59LCBvdXRwdXRSYW5nZTogey4uLn0sIGV2ZW50czogWy4uLl0gfVxyXG4gICAqIGBgYFxyXG4gICAqL1xyXG4gIHB1YmxpYyBhc3luYyBjYWxlbmRhcihvcHRpb25zOiBDYWxlbmRhck9wdGlvbnMgPSB7fSk6IFByb21pc2U8Q2FsZW5kYXI+IHtcclxuICAgIGNvbnN0IGRlZmF1bHRPcHRpb25zOiBDYWxlbmRhck9wdGlvbnMgPSB7XHJcbiAgICAgIGNvbmN1cnJlbmN5OiA3LFxyXG4gICAgICAuLi5vcHRpb25zLFxyXG4gICAgfTtcclxuICAgIGNvbnN0IGNhbCA9IGF3YWl0IGNhY2hlLm1lbW8oKCkgPT4gdGhpcy5mZXRjaEV2ZW50c1dpdGhpbkludGVydmFsKG5ldyBEYXRlKCkpKTtcclxuICAgIGNvbnN0IHNjaG9vbEVuZERhdGU6IERhdGUgfCBudW1iZXIgPVxyXG4gICAgICBvcHRpb25zLmludGVydmFsPy5lbmQgPz8gbmV3IERhdGUoY2FsLkNhbGVuZGFyTGlzdGluZ1swXVsnQF9TY2hvb2xFbmREYXRlJ11bMF0pO1xyXG4gICAgY29uc3Qgc2Nob29sU3RhcnREYXRlOiBEYXRlIHwgbnVtYmVyID1cclxuICAgICAgb3B0aW9ucy5pbnRlcnZhbD8uc3RhcnQgPz8gbmV3IERhdGUoY2FsLkNhbGVuZGFyTGlzdGluZ1swXVsnQF9TY2hvb2xCZWdEYXRlJ11bMF0pO1xyXG5cclxuICAgIHJldHVybiBuZXcgUHJvbWlzZSgocmVzLCByZWopID0+IHtcclxuICAgICAgY29uc3QgbW9udGhzV2l0aGluU2Nob29sWWVhciA9IGVhY2hNb250aE9mSW50ZXJ2YWwoeyBzdGFydDogc2Nob29sU3RhcnREYXRlLCBlbmQ6IHNjaG9vbEVuZERhdGUgfSk7XHJcbiAgICAgIGNvbnN0IGdldEFsbEV2ZW50c1dpdGhpblNjaG9vbFllYXIgPSAoKTogUHJvbWlzZTxDYWxlbmRhclhNTE9iamVjdFtdPiA9PlxyXG4gICAgICAgIGRlZmF1bHRPcHRpb25zLmNvbmN1cnJlbmN5ID09IG51bGxcclxuICAgICAgICAgID8gUHJvbWlzZS5hbGwobW9udGhzV2l0aGluU2Nob29sWWVhci5tYXAoKGRhdGU6IERhdGUpID0+IHRoaXMuZmV0Y2hFdmVudHNXaXRoaW5JbnRlcnZhbChkYXRlKSkpXHJcbiAgICAgICAgICA6IGFzeW5jUG9vbEFsbChkZWZhdWx0T3B0aW9ucy5jb25jdXJyZW5jeSwgbW9udGhzV2l0aGluU2Nob29sWWVhciwgKGRhdGU6YW55KSA9PlxyXG4gICAgICAgICAgICAgIHRoaXMuZmV0Y2hFdmVudHNXaXRoaW5JbnRlcnZhbChkYXRlKVxyXG4gICAgICAgICAgICApO1xyXG4gICAgICBsZXQgbWVtbzogQ2FsZW5kYXIgfCBudWxsID0gbnVsbDtcclxuICAgICAgZ2V0QWxsRXZlbnRzV2l0aGluU2Nob29sWWVhcigpXHJcbiAgICAgICAgLnRoZW4oKGV2ZW50cykgPT4ge1xyXG4gICAgICAgICAgY29uc3QgYWxsRXZlbnRzID0gZXZlbnRzLnJlZHVjZSgocHJldiwgZXZlbnRzKSA9PiB7XHJcbiAgICAgICAgICAgIGlmIChtZW1vID09IG51bGwpXHJcbiAgICAgICAgICAgICAgbWVtbyA9IHtcclxuICAgICAgICAgICAgICAgIHNjaG9vbERhdGU6IHtcclxuICAgICAgICAgICAgICAgICAgc3RhcnQ6IG5ldyBEYXRlKGV2ZW50cy5DYWxlbmRhckxpc3RpbmdbMF1bJ0BfU2Nob29sQmVnRGF0ZSddWzBdKSxcclxuICAgICAgICAgICAgICAgICAgZW5kOiBuZXcgRGF0ZShldmVudHMuQ2FsZW5kYXJMaXN0aW5nWzBdWydAX1NjaG9vbEVuZERhdGUnXVswXSksXHJcbiAgICAgICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICAgICAgb3V0cHV0UmFuZ2U6IHtcclxuICAgICAgICAgICAgICAgICAgc3RhcnQ6IHNjaG9vbFN0YXJ0RGF0ZSxcclxuICAgICAgICAgICAgICAgICAgZW5kOiBzY2hvb2xFbmREYXRlLFxyXG4gICAgICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgICAgIGV2ZW50czogW10sXHJcbiAgICAgICAgICAgICAgfTtcclxuICAgICAgICAgICAgY29uc3QgcmVzdDogQ2FsZW5kYXIgPSB7XHJcbiAgICAgICAgICAgICAgLi4ubWVtbywgLy8gVGhpcyBpcyB0byBwcmV2ZW50IHJlLWluaXRpYWxpemluZyBEYXRlIG9iamVjdHMgaW4gb3JkZXIgdG8gaW1wcm92ZSBwZXJmb3JtYW5jZVxyXG4gICAgICAgICAgICAgIGV2ZW50czogW1xyXG4gICAgICAgICAgICAgICAgLi4uKHByZXYuZXZlbnRzID8gcHJldi5ldmVudHMgOiBbXSksXHJcbiAgICAgICAgICAgICAgICAuLi4odHlwZW9mIGV2ZW50cy5DYWxlbmRhckxpc3RpbmdbMF0uRXZlbnRMaXN0c1swXSAhPT0gJ3N0cmluZydcclxuICAgICAgICAgICAgICAgICAgPyAoZXZlbnRzLkNhbGVuZGFyTGlzdGluZ1swXS5FdmVudExpc3RzWzBdLkV2ZW50TGlzdC5tYXAoKGV2ZW50KSA9PiB7XHJcbiAgICAgICAgICAgICAgICAgICAgICBzd2l0Y2ggKGV2ZW50WydAX0RheVR5cGUnXVswXSkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBjYXNlIEV2ZW50VHlwZS5BU1NJR05NRU5UOiB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgY29uc3QgYXNzaWdubWVudEV2ZW50ID0gZXZlbnQgYXMgQXNzaWdubWVudEV2ZW50WE1MT2JqZWN0O1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aXRsZTogZGVjb2RlVVJJKGFzc2lnbm1lbnRFdmVudFsnQF9UaXRsZSddWzBdKSxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGFkZExpbmtEYXRhOiBhc3NpZ25tZW50RXZlbnRbJ0BfQWRkTGlua0RhdGEnXVswXSxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGFndTogYXNzaWdubWVudEV2ZW50WydAX0FHVSddID8gYXNzaWdubWVudEV2ZW50WydAX0FHVSddWzBdIDogdW5kZWZpbmVkLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZGF0ZTogbmV3IERhdGUoYXNzaWdubWVudEV2ZW50WydAX0RhdGUnXVswXSksXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBkZ3U6IGFzc2lnbm1lbnRFdmVudFsnQF9ER1UnXVswXSxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGxpbms6IGFzc2lnbm1lbnRFdmVudFsnQF9MaW5rJ11bMF0sXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBzdGFydFRpbWU6IGFzc2lnbm1lbnRFdmVudFsnQF9TdGFydFRpbWUnXVswXSxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHR5cGU6IEV2ZW50VHlwZS5BU1NJR05NRU5ULFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdmlld1R5cGU6IGFzc2lnbm1lbnRFdmVudFsnQF9WaWV3VHlwZSddWzBdLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgIH0gYXMgQXNzaWdubWVudEV2ZW50O1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGNhc2UgRXZlbnRUeXBlLkhPTElEQVk6IHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4ge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdGl0bGU6IGRlY29kZVVSSShldmVudFsnQF9UaXRsZSddWzBdKSxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHR5cGU6IEV2ZW50VHlwZS5IT0xJREFZLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgc3RhcnRUaW1lOiBldmVudFsnQF9TdGFydFRpbWUnXVswXSxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGRhdGU6IG5ldyBEYXRlKGV2ZW50WydAX0RhdGUnXVswXSksXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgfSBhcyBIb2xpZGF5RXZlbnQ7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICAgICAgY2FzZSBFdmVudFR5cGUuUkVHVUxBUjoge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IHJlZ3VsYXJFdmVudCA9IGV2ZW50IGFzIFJlZ3VsYXJFdmVudFhNTE9iamVjdDtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4ge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdGl0bGU6IGRlY29kZVVSSShyZWd1bGFyRXZlbnRbJ0BfVGl0bGUnXVswXSksXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBhZ3U6IHJlZ3VsYXJFdmVudFsnQF9BR1UnXSA/IHJlZ3VsYXJFdmVudFsnQF9BR1UnXVswXSA6IHVuZGVmaW5lZCxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGRhdGU6IG5ldyBEYXRlKHJlZ3VsYXJFdmVudFsnQF9EYXRlJ11bMF0pLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZGVzY3JpcHRpb246IHJlZ3VsYXJFdmVudFsnQF9FdnREZXNjcmlwdGlvbiddXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgID8gcmVndWxhckV2ZW50WydAX0V2dERlc2NyaXB0aW9uJ11bMF1cclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgOiB1bmRlZmluZWQsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBkZ3U6IHJlZ3VsYXJFdmVudFsnQF9ER1UnXSA/IHJlZ3VsYXJFdmVudFsnQF9ER1UnXVswXSA6IHVuZGVmaW5lZCxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGxpbms6IHJlZ3VsYXJFdmVudFsnQF9MaW5rJ10gPyByZWd1bGFyRXZlbnRbJ0BfTGluayddWzBdIDogdW5kZWZpbmVkLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgc3RhcnRUaW1lOiByZWd1bGFyRXZlbnRbJ0BfU3RhcnRUaW1lJ11bMF0sXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0eXBlOiBFdmVudFR5cGUuUkVHVUxBUixcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHZpZXdUeXBlOiByZWd1bGFyRXZlbnRbJ0BfVmlld1R5cGUnXSA/IHJlZ3VsYXJFdmVudFsnQF9WaWV3VHlwZSddWzBdIDogdW5kZWZpbmVkLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgYWRkTGlua0RhdGE6IHJlZ3VsYXJFdmVudFsnQF9BZGRMaW5rRGF0YSddID8gcmVndWxhckV2ZW50WydAX0FkZExpbmtEYXRhJ11bMF0gOiB1bmRlZmluZWQsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgfSBhcyBSZWd1bGFyRXZlbnQ7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICB9KSBhcyBFdmVudFtdKVxyXG4gICAgICAgICAgICAgICAgICA6IFtdKSxcclxuICAgICAgICAgICAgICBdIGFzIEV2ZW50W10sXHJcbiAgICAgICAgICAgIH07XHJcblxyXG4gICAgICAgICAgICByZXR1cm4gcmVzdDtcclxuICAgICAgICAgIH0sIHt9IGFzIENhbGVuZGFyKTtcclxuICAgICAgICAgIHJlcyh7IC4uLmFsbEV2ZW50cywgZXZlbnRzOiBfLnVuaXFCeShhbGxFdmVudHMuZXZlbnRzLCAoaXRlbTogeyB0aXRsZTogYW55OyB9KSA9PiBpdGVtLnRpdGxlKSB9IGFzIENhbGVuZGFyKTtcclxuICAgICAgICB9KVxyXG4gICAgICAgIC5jYXRjaChyZWopO1xyXG4gICAgfSk7XHJcbiAgfVxyXG59XHJcbiJdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0VBa0VlLE1BQU1BLE1BQU0sU0FBU0MsYUFBSSxDQUFDRCxNQUFNLENBQUM7SUFFOUNFLFdBQVcsQ0FBQ0MsV0FBNkIsRUFBRUMsUUFBZSxFQUFDQyxPQUFlLEVBQUU7TUFDMUUsS0FBSyxDQUFDRixXQUFXLEVBQUNDLFFBQVEsQ0FBQztNQUMzQixJQUFJLENBQUNDLE9BQU8sR0FBR0EsT0FBTztJQUN4Qjs7SUFFQTtBQUNGO0FBQ0E7SUFDU0MsbUJBQW1CLEdBQWtCO01BQzFDLE9BQU8sSUFBSUMsT0FBTyxDQUFDLENBQUNDLEdBQUcsRUFBRUMsR0FBRyxLQUFLO1FBQy9CLEtBQUssQ0FDRkMsY0FBYyxDQUFxQjtVQUFFQyxjQUFjLEVBQUUsS0FBSztVQUFFQyxVQUFVLEVBQUU7UUFBTSxDQUFDLENBQUMsQ0FDaEZDLElBQUksQ0FBRUMsUUFBUSxJQUFLO1VBQ2xCLElBQUlBLFFBQVEsQ0FBQ0MsUUFBUSxDQUFDLENBQUMsQ0FBQyxDQUFDLGlCQUFpQixDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUNDLFFBQVEsQ0FBQywrQkFBK0IsQ0FBQyxFQUFFO1lBQUNSLEdBQUcsRUFBRTtVQUFDLENBQUMsTUFDOUY7WUFBQ0MsR0FBRyxDQUFDLElBQUlRLHlCQUFnQixDQUFDSCxRQUFRLENBQUMsQ0FBQztVQUFBO1VBQUM7UUFDM0MsQ0FBQyxDQUFDLENBQ0RJLEtBQUssQ0FBQ1QsR0FBRyxDQUFDO01BQ2YsQ0FBQyxDQUFDO0lBQ0o7O0lBRUE7QUFDRjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtJQUNTVSxTQUFTLEdBQThCO01BQzVDLE9BQU8sSUFBSVosT0FBTyxDQUFDLENBQUNDLEdBQUcsRUFBRUMsR0FBRyxLQUFLO1FBQy9CLEtBQUssQ0FDRkMsY0FBYyxDQUFv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