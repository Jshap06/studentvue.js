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
          }).then(result => {
            console.log("josh stewart");
            return result;
          });
        };
        if (fresh || reportingPeriodIndex == null) {
          console.log("what the fuck guys");
          fetchBranch().then(result => {
            console.log("boston");
            parseBranch(result);
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
                m[identifier] = {
                  data: result,
                  age: Date.now()
                };
                localStorage.setItem("xmlCache", JSON.stringify(m));
                parseBranch(result);
              }).catch(err => {
                return rej(err);
              });
            } else {
              parseBranch(m[identifier].data);
            }
          } else {
            fetchBranch().then(result => {
              const xmlCache = JSON.parse(localStorage.getItem("xmlCache") ?? "{}");
              xmlCache[identifier] = {
                data: result,
                age: Date.now()
              };
              console.log("dash poe", xmlCache);
              localStorage.setItem("xmlCache", xmlCache);
              parseBranch(result);
            });
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJDbGllbnQiLCJzb2FwIiwiY29uc3RydWN0b3IiLCJjcmVkZW50aWFscyIsInByb3h5VXJsIiwiaG9zdFVybCIsInZhbGlkYXRlQ3JlZGVudGlhbHMiLCJQcm9taXNlIiwicmVzIiwicmVqIiwicHJvY2Vzc1JlcXVlc3QiLCJ2YWxpZGF0ZUVycm9ycyIsIm1ldGhvZE5hbWUiLCJ0aGVuIiwicmVzcG9uc2UiLCJSVF9FUlJPUiIsImluY2x1ZGVzIiwiUmVxdWVzdEV4Y2VwdGlvbiIsImNhdGNoIiwiZG9jdW1lbnRzIiwicGFyYW1TdHIiLCJjaGlsZEludElkIiwieG1sT2JqZWN0IiwiU3R1ZGVudERvY3VtZW50RGF0YXMiLCJjb25zb2xlIiwibG9nIiwiZXh0cmFEYXRhIiwiU3R1ZGVudERvY3VtZW50RGF0YSIsInhtbCIsIkRvY3VtZW50IiwicmVwb3J0Q2FyZHMiLCJSQ1JlcG9ydGluZ1BlcmlvZERhdGEiLCJSQ1JlcG9ydGluZ1BlcmlvZHMiLCJSQ1JlcG9ydGluZ1BlcmlvZCIsIlJlcG9ydENhcmQiLCJzY2hvb2xJbmZvIiwiY2hpbGRJbnRJRCIsInJlc3VsdCIsIlN0dWRlbnRTY2hvb2xJbmZvTGlzdGluZyIsIlN0YWZmTGlzdHMiLCJTdGFmZkxpc3QiLCJzdGFmZiIsIm5hbWUiLCJlbWFpbCIsInN0YWZmR3UiLCJqb2JUaXRsZSIsImV4dG4iLCJwaG9uZSIsInNjaG9vbCIsImFkZHJlc3MiLCJhZGRyZXNzQWx0IiwiY2l0eSIsInppcENvZGUiLCJhbHRQaG9uZSIsInByaW5jaXBhbCIsInNjaGVkdWxlIiwidGVybUluZGV4IiwiVGVybUluZGV4IiwidGVybU5hbWUiLCJTdHVkZW50Q2xhc3NTY2hlZHVsZSIsIlRlcm1MaXN0cyIsIlRlcm1MaXN0aW5nIiwidGVybSIsInN0YXJ0IiwiZW5kIiwidGVybXMiLCJDbGFzc0xpc3RzIiwiQ2xhc3NMaXN0aW5nIiwiY291cnNlIiwicGVyaW9kIiwidGVhY2hlciIsInJvb20iLCJtYWluQ2xhc3NlcyIsImNoZWNrZXIiLCJDb25jdXJyZW50U2Nob29sU3R1ZGVudENsYXNzU2NoZWR1bGVzIiwiQ29uY3VycmVudFNjaG9vbFN0dWRlbnRDbGFzc1NjaGVkdWxlIiwiQ29uU2NoQ2xhc3NMaXN0cyIsImNvbkNsYXNzZXMiLCJjb25OYW1lIiwiVG9kYXlTY2hlZHVsZUluZm9EYXRhIiwiU2Nob29sSW5mb3MiLCJ0b2RheSIsIlNjaG9vbEluZm8iLCJDbGFzc2VzIiwiQ2xhc3NJbmZvIiwibWFpbiIsImNvbiIsIlNjaG9vbGluZm8iLCJlcnJvciIsImF0dGVuZGFuY2UiLCJhdHRlbmRhbmNlWE1MT2JqZWN0IiwiQXR0ZW5kYW5jZSIsIlRvdGFsQWN0aXZpdGllcyIsIlBlcmlvZFRvdGFsIiwicGQiLCJpIiwiTnVtYmVyIiwidG90YWwiLCJleGN1c2VkIiwiVG90YWxFeGN1c2VkIiwidGFyZGllcyIsIlRvdGFsVGFyZGllcyIsInVuZXhjdXNlZCIsIlRvdGFsVW5leGN1c2VkIiwiYWN0aXZpdGllcyIsInVuZXhjdXNlZFRhcmRpZXMiLCJUb3RhbFVuZXhjdXNlZFRhcmRpZXMiLCJ0eXBlIiwic2Nob29sTmFtZSIsImFic2VuY2VzIiwiQWJzZW5jZXMiLCJBYnNlbmNlIiwibWFwIiwiYWJzZW5jZSIsImRhdGUiLCJEYXRlIiwicmVhc29uIiwibm90ZSIsImRlc2NyaXB0aW9uIiwicGVyaW9kcyIsIlBlcmlvZHMiLCJQZXJpb2QiLCJvcmdZZWFyR3UiLCJwZXJpb2RJbmZvcyIsImdyYWRlYm9vayIsInJlcG9ydGluZ1BlcmlvZEluZGV4IiwiZnJlc2giLCJwYXJzZUJyYW5jaCIsIkVycm9yIiwiZSIsIkdyYWRlYm9vayIsIlJlcG9ydGluZ1BlcmlvZHMiLCJSZXBvcnRQZXJpb2QiLCJpbmRleCIsIkNvdXJzZXMiLCJDb3Vyc2UiLCJjb3Vyc2VJRCIsInRpdGxlIiwiaGUiLCJkZWNvZGUiLCJtYXJrcyIsIk1hcmtzIiwiTWFyayIsIm1hcmsiLCJjYWxjdWxhdGVkU2NvcmUiLCJzdHJpbmciLCJyYXciLCJ3ZWlnaHRlZENhdGVnb3JpZXMiLCJBc3NpZ25tZW50R3JhZGVDYWxjIiwid2VpZ2h0ZWQiLCJjYWxjdWxhdGVkTWFyayIsIndlaWdodCIsImV2YWx1YXRlZCIsInN0YW5kYXJkIiwicG9pbnRzIiwiY3VycmVudCIsInBvc3NpYmxlIiwiYXNzaWdubWVudHMiLCJBc3NpZ25tZW50cyIsIkFzc2lnbm1lbnQiLCJhc3NpZ25tZW50IiwiZ3JhZGVib29rSWQiLCJkZWNvZGVVUkkiLCJkdWUiLCJzY29yZSIsInZhbHVlIiwidW5kZWZpbmVkIiwibm90ZXMiLCJ0ZWFjaGVySWQiLCJoYXNEcm9wYm94IiwiSlNPTiIsInBhcnNlIiwic3R1ZGVudElkIiwiZHJvcGJveERhdGUiLCJyZXNvdXJjZXMiLCJSZXNvdXJjZXMiLCJOYU4iLCJyZXBvcnRpbmdQZXJpb2QiLCJmaW5kIiwieCIsIlJlcG9ydGluZ1BlcmlvZCIsImF2YWlsYWJsZSIsImNvdXJzZXMiLCJmZXRjaEJyYW5jaCIsIkNvbmN1cnJlbnRTY2hPcmdZZWFyR1UiLCJYTUxGYWN0b3J5IiwiZW5jb2RlQXR0cmlidXRlIiwidG9TdHJpbmciLCJlcnIiLCJtIiwibG9jYWxTdG9yYWdlIiwiZ2V0SXRlbSIsImlkZW50aWZpZXIiLCJkaXN0cmljdCIsInVzZXJuYW1lIiwiTWF0aCIsImFicyIsImFnZSIsIm5vdyIsImRhdGEiLCJzZXRJdGVtIiwic3RyaW5naWZ5IiwieG1sQ2FjaGUiLCJtZXNzYWdlcyIsIlBYUE1lc3NhZ2VzRGF0YSIsIk1lc3NhZ2VMaXN0aW5ncyIsIk1lc3NhZ2VMaXN0aW5nIiwibWVzc2FnZSIsIk1lc3NhZ2UiLCJDaGlsZExpc3QiLCJzdHVkZW50IiwiQ2hpbGQiLCJDaGlsZE5hbWUiLCJsYXN0TmFtZSIsIm5pY2tuYW1lIiwicGhvdG8iLCJvcHRpb25hbCIsImNvdW5zZWxvciIsImN1cnJlbnRTY2hvb2wiLCJPcmdhbml6YXRpb25OYW1lIiwiaWQiLCJnZW5kZXIiLCJncmFkZSIsIkdyYWRlIiwic3R1ZGVudEluZm8iLCJ4bWxPYmplY3REYXRhIiwiU3R1ZGVudEluZm8iLCJGb3JtYXR0ZWROYW1lIiwiTGFzdE5hbWVHb2VzQnkiLCJOaWNrTmFtZSIsImJpcnRoRGF0ZSIsIkJpcnRoRGF0ZSIsInRyYWNrIiwiVHJhY2siLCJBZGRyZXNzIiwiUGhvdG8iLCJDb3Vuc2Vsb3JOYW1lIiwiQ291bnNlbG9yRW1haWwiLCJDb3Vuc2Vsb3JTdGFmZkdVIiwiQ3VycmVudFNjaG9vbCIsImRlbnRpc3QiLCJEZW50aXN0Iiwib2ZmaWNlIiwicGh5c2ljaWFuIiwiUGh5c2ljaWFuIiwiaG9zcGl0YWwiLCJQZXJtSUQiLCJPcmdZZWFyR1UiLCJQaG9uZSIsIkVNYWlsIiwiZW1lcmdlbmN5Q29udGFjdHMiLCJFbWVyZ2VuY3lDb250YWN0cyIsIkVtZXJnZW5jeUNvbnRhY3QiLCJjb250YWN0IiwiaG9tZSIsIm1vYmlsZSIsIm90aGVyIiwid29yayIsInJlbGF0aW9uc2hpcCIsIkdlbmRlciIsImxvY2tlckluZm9SZWNvcmRzIiwiTG9ja2VySW5mb1JlY29yZHMiLCJob21lTGFuZ3VhZ2UiLCJIb21lTGFuZ3VhZ2UiLCJob21lUm9vbSIsIkhvbWVSb29tIiwiaG9tZVJvb21UZWFjaGVyIiwiSG9tZVJvb21UY2hFTWFpbCIsIkhvbWVSb29tVGNoIiwiSG9tZVJvb21UY2hTdGFmZkdVIiwiYWRkaXRpb25hbEluZm8iLCJVc2VyRGVmaW5lZEdyb3VwQm94ZXMiLCJVc2VyRGVmaW5lZEdyb3VwQm94IiwiZGVmaW5lZEJveCIsInZjSWQiLCJpdGVtcyIsIlVzZXJEZWZpbmVkSXRlbXMiLCJVc2VyRGVmaW5lZEl0ZW0iLCJpdGVtIiwic291cmNlIiwiZWxlbWVudCIsIm9iamVjdCIsImZldGNoRXZlbnRzV2l0aGluSW50ZXJ2YWwiLCJSZXF1ZXN0RGF0ZSIsInRvSVNPU3RyaW5nIiwiY2FsZW5kYXIiLCJvcHRpb25zIiwiZGVmYXVsdE9wdGlvbnMiLCJjb25jdXJyZW5jeSIsImNhbCIsImNhY2hlIiwibWVtbyIsInNjaG9vbEVuZERhdGUiLCJpbnRlcnZhbCIsIkNhbGVuZGFyTGlzdGluZyIsInNjaG9vbFN0YXJ0RGF0ZSIsIm1vbnRoc1dpdGhpblNjaG9vbFllYXIiLCJlYWNoTW9udGhPZkludGVydmFsIiwiZ2V0QWxsRXZlbnRzV2l0aGluU2Nob29sWWVhciIsImFsbCIsImFzeW5jUG9vbEFsbCIsImV2ZW50cyIsImFsbEV2ZW50cyIsInJlZHVjZSIsInByZXYiLCJzY2hvb2xEYXRlIiwib3V0cHV0UmFuZ2UiLCJyZXN0IiwiRXZlbnRMaXN0cyIsIkV2ZW50TGlzdCIsImV2ZW50IiwiRXZlbnRUeXBlIiwiQVNTSUdOTUVOVCIsImFzc2lnbm1lbnRFdmVudCIsImFkZExpbmtEYXRhIiwiYWd1IiwiZGd1IiwibGluayIsInN0YXJ0VGltZSIsInZpZXdUeXBlIiwiSE9MSURBWSIsIlJFR1VMQVIiLCJyZWd1bGFyRXZlbnQiLCJfIiwidW5pcUJ5Il0sInNvdXJjZXMiOlsiLi4vLi4vLi4vc3JjL1N0dWRlbnRWdWUvQ2xpZW50L0NsaWVudC50cyJdLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBMb2dpbkNyZWRlbnRpYWxzLCBQYXJzZWRSZXF1ZXN0RXJyb3IgfSBmcm9tICcuLi8uLi91dGlscy9zb2FwL0NsaWVudC9DbGllbnQuaW50ZXJmYWNlcyc7XHJcbmltcG9ydCBzb2FwIGZyb20gJy4uLy4uL3V0aWxzL3NvYXAvc29hcCc7XHJcbmltcG9ydCB7IEFkZGl0aW9uYWxJbmZvLCBBZGRpdGlvbmFsSW5mb0l0ZW0sIENsYXNzU2NoZWR1bGVJbmZvLCBTY2hvb2xJbmZvLCBTdHVkZW50SW5mbyB9IGZyb20gJy4vQ2xpZW50LmludGVyZmFjZXMnO1xyXG5pbXBvcnQgeyBTdHVkZW50SW5mb1hNTE9iamVjdCB9IGZyb20gJy4vSW50ZXJmYWNlcy94bWwvU3R1ZGVudEluZm8nO1xyXG5pbXBvcnQgTWVzc2FnZSBmcm9tICcuLi9NZXNzYWdlL01lc3NhZ2UnO1xyXG5pbXBvcnQgeyBNZXNzYWdlWE1MT2JqZWN0IH0gZnJvbSAnLi4vTWVzc2FnZS9NZXNzYWdlLnhtbCc7XHJcbmltcG9ydCB7IEFzc2lnbm1lbnRFdmVudFhNTE9iamVjdCwgQ2FsZW5kYXJYTUxPYmplY3QsIFJlZ3VsYXJFdmVudFhNTE9iamVjdCB9IGZyb20gJy4vSW50ZXJmYWNlcy94bWwvQ2FsZW5kYXInO1xyXG5pbXBvcnQgeyBBc3NpZ25tZW50RXZlbnQsIENhbGVuZGFyLCBDYWxlbmRhck9wdGlvbnMsIEV2ZW50LCBIb2xpZGF5RXZlbnQsIFJlZ3VsYXJFdmVudCB9IGZyb20gJy4vSW50ZXJmYWNlcy9DYWxlbmRhcic7XHJcbmltcG9ydCB7IGVhY2hNb250aE9mSW50ZXJ2YWwsIHBhcnNlIH0gZnJvbSAnZGF0ZS1mbnMnO1xyXG5pbXBvcnQgeyBGaWxlUmVzb3VyY2VYTUxPYmplY3QsIEdyYWRlYm9va1hNTE9iamVjdCwgVVJMUmVzb3VyY2VYTUxPYmplY3QgfSBmcm9tICcuL0ludGVyZmFjZXMveG1sL0dyYWRlYm9vayc7XHJcbmltcG9ydCB7IEF0dGVuZGFuY2VYTUxPYmplY3QgfSBmcm9tICcuL0ludGVyZmFjZXMveG1sL0F0dGVuZGFuY2UnO1xyXG5pbXBvcnQgRXZlbnRUeXBlIGZyb20gJy4uLy4uL0NvbnN0YW50cy9FdmVudFR5cGUnO1xyXG5pbXBvcnQgXywgeyByZXN1bHQgfSBmcm9tICdsb2Rhc2gnO1xyXG5pbXBvcnQgeyBBc3NpZ25tZW50LCBGaWxlUmVzb3VyY2UsIEdyYWRlYm9vaywgTWFyaywgVVJMUmVzb3VyY2UsIFdlaWdodGVkQ2F0ZWdvcnkgfSBmcm9tICcuL0ludGVyZmFjZXMvR3JhZGVib29rJztcclxuaW1wb3J0IFJlc291cmNlVHlwZSBmcm9tICcuLi8uLi9Db25zdGFudHMvUmVzb3VyY2VUeXBlJztcclxuaW1wb3J0IHsgQWJzZW50UGVyaW9kLCBBdHRlbmRhbmNlLCBQZXJpb2RJbmZvIH0gZnJvbSAnLi9JbnRlcmZhY2VzL0F0dGVuZGFuY2UnO1xyXG5pbXBvcnQgeyBTY2hlZHVsZVhNTE9iamVjdCB9IGZyb20gJy4vSW50ZXJmYWNlcy94bWwvU2NoZWR1bGUnO1xyXG5pbXBvcnQgeyBTY2hlZHVsZSB9IGZyb20gJy4vQ2xpZW50LmludGVyZmFjZXMnO1xyXG5pbXBvcnQgeyBTY2hvb2xJbmZvWE1MT2JqZWN0IH0gZnJvbSAnLi9JbnRlcmZhY2VzL3htbC9TY2hvb2xJbmZvJztcclxuaW1wb3J0IHsgUmVwb3J0Q2FyZHNYTUxPYmplY3QgfSBmcm9tICcuLi9SZXBvcnRDYXJkL1JlcG9ydENhcmQueG1sJztcclxuaW1wb3J0IHsgRG9jdW1lbnRYTUxPYmplY3QgfSBmcm9tICcuLi9Eb2N1bWVudC9Eb2N1bWVudC54bWwnO1xyXG5pbXBvcnQgUmVwb3J0Q2FyZCBmcm9tICcuLi9SZXBvcnRDYXJkL1JlcG9ydENhcmQnO1xyXG5pbXBvcnQgRG9jdW1lbnQgZnJvbSAnLi4vRG9jdW1lbnQvRG9jdW1lbnQnO1xyXG5pbXBvcnQgUmVxdWVzdEV4Y2VwdGlvbiBmcm9tICcuLi9SZXF1ZXN0RXhjZXB0aW9uL1JlcXVlc3RFeGNlcHRpb24nO1xyXG5pbXBvcnQgWE1MRmFjdG9yeSBmcm9tICcuLi8uLi91dGlscy9YTUxGYWN0b3J5L1hNTEZhY3RvcnknO1xyXG5pbXBvcnQgY2FjaGUgZnJvbSAnLi4vLi4vdXRpbHMvY2FjaGUvY2FjaGUnO1xyXG5pbXBvcnQgeyBvcHRpb25hbCwgYXN5bmNQb29sQWxsIH0gZnJvbSAnLi9DbGllbnQuaGVscGVycyc7XHJcbmltcG9ydCBoZSBmcm9tIFwiaGVcIjtcclxuaW1wb3J0IHsgZWwsIGlkIH0gZnJvbSAnZGF0ZS1mbnMvbG9jYWxlJztcclxuXHJcbi8qKlxyXG4gKiBUTyBETzsgcmV3cml0ZSB0aGUgc3R1ZGVudEluZm8gc3R1ZmYgdG8gcHJpbWFyeSBDaGlsZExpc3Qgd2l0aCBzdHVkZW50SW5mbyBhcyB0aGUgZmFsbGJhY2ssIFxyXG4gKiBtYWtlIHRoZSB0eXBlIFJFUVVJUkUgdGhlIGluZm8gYWJvdXQgc2Nob29sIGNvbmN1cnJlbmN5LCB0aHVzbHksIHRoZSBsb2dpbiBmdW5jdGlvbiB3aWxsIGRldGVybWluZSBpdCBpbiB0aGUgaW1tZWRpYXRlIGJ5IGNvbmN1cnJlbnJ0bHkgcGVyZm9ybWluZyB0aGUgZmV0Y2hlc1xyXG4gKiB0byB0aHVzbHkgaGF2ZSBhIG1pbmltYWwgc3BlZWQgaW1wYWN0XHJcbiAqIFxyXG4gKiBcclxuICogXHJcbiAqIFxyXG4gKiBcclxuICogXHJcbiAqIFxyXG4gKiBcclxuICogXHJcbiAqIFxyXG4gKiBcclxuICogXHJcbiAqIFxyXG4gKiBcclxuICogXHJcbiAqIFxyXG4gKiBcclxuICogXHJcbiAqIFxyXG4gKiBcclxuICogVGhlIFN0dWRlbnRWVUUgQ2xpZW50IHRvIGFjY2VzcyB0aGUgQVBJXHJcbiAqIEBjb25zdHJ1Y3RvclxyXG4gKiBAZXh0ZW5kcyB7c29hcC5DbGllbnR9XHJcbiAqL1xyXG5cclxuXHJcblxyXG5pbnRlcmZhY2UgeG1sQ2FjaGV7XHJcbiAgW2lkZW50aWZpZXI6c3RyaW5nXSAvKmRpc3RyaWN0IHVybCArIHVzZXJuYW1lICsgbXAgKi8gOiB7ZGF0YTpHcmFkZWJvb2tYTUxPYmplY3QsYWdlOm51bWJlcn1cclxufVxyXG5cclxuXHJcbmV4cG9ydCBkZWZhdWx0IGNsYXNzIENsaWVudCBleHRlbmRzIHNvYXAuQ2xpZW50IHtcclxuICBwcml2YXRlIGhvc3RVcmw6IHN0cmluZztcclxuICBjb25zdHJ1Y3RvcihjcmVkZW50aWFsczogTG9naW5DcmVkZW50aWFscywgcHJveHlVcmw6c3RyaW5nLGhvc3RVcmw6IHN0cmluZykge1xyXG4gICAgc3VwZXIoY3JlZGVudGlhbHMscHJveHlVcmwpO1xyXG4gICAgdGhpcy5ob3N0VXJsID0gaG9zdFVybDtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIFZhbGlkYXRlJ3MgdGhlIHVzZXIncyBjcmVkZW50aWFscy4gSXQgd2lsbCB0aHJvdyBhbiBlcnJvciBpZiBjcmVkZW50aWFscyBhcmUgaW5jb3JyZWN0XHJcbiAgICovXHJcbiAgcHVibGljIHZhbGlkYXRlQ3JlZGVudGlhbHMoKTogUHJvbWlzZTx2b2lkPiB7XHJcbiAgICByZXR1cm4gbmV3IFByb21pc2UoKHJlcywgcmVqKSA9PiB7XHJcbiAgICAgIHN1cGVyXHJcbiAgICAgICAgLnByb2Nlc3NSZXF1ZXN0PFBhcnNlZFJlcXVlc3RFcnJvcj4oeyB2YWxpZGF0ZUVycm9yczogZmFsc2UsIG1ldGhvZE5hbWU6ICdmdWNrJ30pXHJcbiAgICAgICAgLnRoZW4oKHJlc3BvbnNlKSA9PiB7XHJcbiAgICAgICAgICBpZiAocmVzcG9uc2UuUlRfRVJST1JbMF1bJ0BfRVJST1JfTUVTU0FHRSddWzBdLmluY2x1ZGVzKFwiQSBjcml0aWNhbCBlcnJvciBoYXMgb2NjdXJyZWRcIikpIHtyZXMoKTt9XHJcbiAgICAgICAgICBlbHNle3JlaihuZXcgUmVxdWVzdEV4Y2VwdGlvbihyZXNwb25zZSkpfTtcclxuICAgICAgICB9KVxyXG4gICAgICAgIC5jYXRjaChyZWopO1xyXG4gICAgfSk7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBHZXRzIHRoZSBzdHVkZW50J3MgZG9jdW1lbnRzIGZyb20gc3luZXJneSBzZXJ2ZXJzXHJcbiAgICogQHJldHVybnMge1Byb21pc2U8RG9jdW1lbnRbXT59PiBSZXR1cm5zIGEgbGlzdCBvZiBzdHVkZW50IGRvY3VtZW50c1xyXG4gICAqIEBkZXNjcmlwdGlvblxyXG4gICAqIGBgYGpzXHJcbiAgICogY29uc3QgZG9jdW1lbnRzID0gYXdhaXQgY2xpZW50LmRvY3VtZW50cygpO1xyXG4gICAqIGNvbnN0IGRvY3VtZW50ID0gZG9jdW1lbnRzWzBdO1xyXG4gICAqIGNvbnN0IGZpbGVzID0gYXdhaXQgZG9jdW1lbnQuZ2V0KCk7XHJcbiAgICogY29uc3QgYmFzZTY0Y29sbGVjdGlvbiA9IGZpbGVzLm1hcCgoZmlsZSkgPT4gZmlsZS5iYXNlNjQpO1xyXG4gICAqIGBgYFxyXG4gICAqL1xyXG4gIHB1YmxpYyBkb2N1bWVudHMoKTogUHJvbWlzZTxbRG9jdW1lbnRbXSxhbnldPiB7XHJcbiAgICByZXR1cm4gbmV3IFByb21pc2UoKHJlcywgcmVqKSA9PiB7XHJcbiAgICAgIHN1cGVyXHJcbiAgICAgICAgLnByb2Nlc3NSZXF1ZXN0PERvY3VtZW50WE1MT2JqZWN0Pih7XHJcbiAgICAgICAgICBtZXRob2ROYW1lOiAnR2V0U3R1ZGVudERvY3VtZW50SW5pdGlhbERhdGEnLFxyXG4gICAgICAgICAgcGFyYW1TdHI6IHsgY2hpbGRJbnRJZDogMCB9LFxyXG4gICAgICAgIH0pXHJcbiAgICAgICAgLnRoZW4oKHhtbE9iamVjdCkgPT4ge1xyXG4gICAgICAgICAgaWYodHlwZW9mKHhtbE9iamVjdFsnU3R1ZGVudERvY3VtZW50cyddWzBdLlN0dWRlbnREb2N1bWVudERhdGFzWzBdKT09XCJzdHJpbmdcIil7Y29uc29sZS5sb2coXCJ3aGVyZSBpcyBteSBtaW5kXCIpO3JldHVybiByZXMoW1tdLFxyXG4gICAgICAgICAgICAvLyBAdHMtaWdub3JlXHJcbiAgICAgICAgICAgIHhtbE9iamVjdC5leHRyYURhdGFdKX1cclxuICAgICAgICAgIGVsc2V7XHJcbiAgICAgICAgICByZXMoW1xyXG4gICAgICAgICAgICB4bWxPYmplY3RbJ1N0dWRlbnREb2N1bWVudHMnXVswXS5TdHVkZW50RG9jdW1lbnREYXRhc1swXS5TdHVkZW50RG9jdW1lbnREYXRhLm1hcChcclxuICAgICAgICAgICAgICAoeG1sOiBhbnkpID0+IG5ldyBEb2N1bWVudCh4bWwsIHN1cGVyLmNyZWRlbnRpYWxzKVxyXG4gICAgICAgICAgICApLFxyXG4gICAgICAgICAgICAvL0B0cy1pZ25vcmVcclxuICAgICAgICAgICAgeG1sT2JqZWN0LmV4dHJhRGF0YV1cclxuICAgICAgICAgICk7fVxyXG4gICAgICAgIH0pXHJcbiAgICAgICAgLmNhdGNoKHJlaik7XHJcbiAgICB9KTtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIEdldHMgYSBsaXN0IG9mIHJlcG9ydCBjYXJkc1xyXG4gICAqIEByZXR1cm5zIHtQcm9taXNlPFJlcG9ydENhcmRbXT59IFJldHVybnMgYSBsaXN0IG9mIHJlcG9ydCBjYXJkcyB0aGF0IGNhbiBmZXRjaCBhIGZpbGVcclxuICAgKiBAZGVzY3JpcHRpb25cclxuICAgKiBgYGBqc1xyXG4gICAqIGNvbnN0IHJlcG9ydENhcmRzID0gYXdhaXQgY2xpZW50LnJlcG9ydENhcmRzKCk7XHJcbiAgICogY29uc3QgZmlsZXMgPSBhd2FpdCBQcm9taXNlLmFsbChyZXBvcnRDYXJkcy5tYXAoKGNhcmQpID0+IGNhcmQuZ2V0KCkpKTtcclxuICAgKiBjb25zdCBiYXNlNjRhcnIgPSBmaWxlcy5tYXAoKGZpbGUpID0+IGZpbGUuYmFzZTY0KTsgLy8gW1wiSlZCRVJpMC4uLlwiLCBcImRVSW9hMS4uLlwiLCAuLi5dO1xyXG4gICAqIGBgYFxyXG4gICAqL1xyXG4gIHB1YmxpYyByZXBvcnRDYXJkcygpOiBQcm9taXNlPFtSZXBvcnRDYXJkW10sYW55XT4ge1xyXG4gICAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXMsIHJlaikgPT4ge1xyXG4gICAgICBzdXBlclxyXG4gICAgICAgIC5wcm9jZXNzUmVxdWVzdDxSZXBvcnRDYXJkc1hNTE9iamVjdD4oe1xyXG4gICAgICAgICAgbWV0aG9kTmFtZTogJ0dldFJlcG9ydENhcmRJbml0aWFsRGF0YScsXHJcbiAgICAgICAgICBwYXJhbVN0cjogeyBjaGlsZEludElkOiAwIH0sXHJcbiAgICAgICAgfSlcclxuICAgICAgICAudGhlbigoeG1sT2JqZWN0KSA9PiB7XHJcbiAgICAgICAgICByZXMoW1xyXG4gICAgICAgICAgICB4bWxPYmplY3QuUkNSZXBvcnRpbmdQZXJpb2REYXRhWzBdLlJDUmVwb3J0aW5nUGVyaW9kc1swXS5SQ1JlcG9ydGluZ1BlcmlvZC5tYXAoXHJcbiAgICAgICAgICAgICAgKHhtbCkgPT4gbmV3IFJlcG9ydENhcmQoeG1sLCBzdXBlci5jcmVkZW50aWFscylcclxuICAgICAgICAgICAgICAvL0B0cy1pZ25vcmVcclxuICAgICAgICAgICAgKSx4bWxPYmplY3QuZXh0cmFEYXRhXVxyXG4gICAgICAgICAgKTtcclxuICAgICAgICB9KVxyXG4gICAgICAgIC5jYXRjaChyZWopO1xyXG4gICAgfSk7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBHZXRzIHRoZSBzdHVkZW50J3Mgc2Nob29sJ3MgaW5mb3JtYXRpb25cclxuICAgKiBAcmV0dXJucyB7UHJvbWlzZTxTY2hvb2xJbmZvPn0gUmV0dXJucyB0aGUgaW5mb3JtYXRpb24gb2YgdGhlIHN0dWRlbnQncyBzY2hvb2xcclxuICAgKiBAZGVzY3JpcHRpb25cclxuICAgKiBgYGBqc1xyXG4gICAqIGF3YWl0IGNsaWVudC5zY2hvb2xJbmZvKCk7XHJcbiAgICpcclxuICAgKiBjbGllbnQuc2Nob29sSW5mbygpLnRoZW4oKHNjaG9vbEluZm8pID0+IHtcclxuICAgKiAgY29uc29sZS5sb2coXy51bmlxKHNjaG9vbEluZm8uc3RhZmYubWFwKChzdGFmZikgPT4gc3RhZmYubmFtZSkpKTsgLy8gTGlzdCBhbGwgc3RhZmYgcG9zaXRpb25zIHVzaW5nIGxvZGFzaFxyXG4gICAqIH0pXHJcbiAgICogYGBgXHJcbiAgICovXHJcbiAgcHVibGljIHNjaG9vbEluZm8oKTogUHJvbWlzZTxbU2Nob29sSW5mbyxhbnldPiB7XHJcbiAgICByZXR1cm4gbmV3IFByb21pc2UoKHJlcywgcmVqKSA9PiB7XHJcbiAgICAgIHN1cGVyXHJcbiAgICAgICAgLnByb2Nlc3NSZXF1ZXN0PFNjaG9vbEluZm9YTUxPYmplY3Qme2V4dHJhRGF0YT86YW55fT4oe1xyXG4gICAgICAgICAgbWV0aG9kTmFtZTogJ1N0dWRlbnRTY2hvb2xJbmZvJyxcclxuICAgICAgICAgIHBhcmFtU3RyOiB7IGNoaWxkSW50SUQ6IDAgfSxcclxuICAgICAgICB9KVxyXG4gICAgICAgIC50aGVuKChyZXN1bHQpID0+IHtcclxuICAgICAgICAgIGNvbnN0IHhtbE9iamVjdD1yZXN1bHQuU3R1ZGVudFNjaG9vbEluZm9MaXN0aW5nWzBdO1xyXG4gICAgICAgICAgLy9AdHMtaWdub3JlXHJcbiAgICAgICAgICB4bWxPYmplY3QuZXh0cmFEYXRhPXJlc3VsdC5leHRyYURhdGE7XHJcbiAgICAgICAgICByZXMoW3tcclxuICAgICAgICAgICAgc2Nob29sOiB7XHJcbiAgICAgICAgICAgICAgYWRkcmVzczogeG1sT2JqZWN0WydAX1NjaG9vbEFkZHJlc3MnXVswXSxcclxuICAgICAgICAgICAgICBhZGRyZXNzQWx0OiB4bWxPYmplY3RbJ0BfU2Nob29sQWRkcmVzczInXVswXSxcclxuICAgICAgICAgICAgICBjaXR5OiB4bWxPYmplY3RbJ0BfU2Nob29sQ2l0eSddWzBdLFxyXG4gICAgICAgICAgICAgIHppcENvZGU6IHhtbE9iamVjdFsnQF9TY2hvb2xaaXAnXVswXSxcclxuICAgICAgICAgICAgICBwaG9uZTogeG1sT2JqZWN0WydAX1Bob25lJ11bMF0sXHJcbiAgICAgICAgICAgICAgYWx0UGhvbmU6IHhtbE9iamVjdFsnQF9QaG9uZTInXVswXSxcclxuICAgICAgICAgICAgICBwcmluY2lwYWw6IHtcclxuICAgICAgICAgICAgICAgIG5hbWU6IHhtbE9iamVjdFsnQF9QcmluY2lwYWwnXVswXSxcclxuICAgICAgICAgICAgICAgIGVtYWlsOiB4bWxPYmplY3RbJ0BfUHJpbmNpcGFsRW1haWwnXVswXSxcclxuICAgICAgICAgICAgICAgIHN0YWZmR3U6IHhtbE9iamVjdFsnQF9QcmluY2lwYWxHdSddWzBdLFxyXG4gICAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgIHN0YWZmOiB4bWxPYmplY3QuU3RhZmZMaXN0c1swXS5TdGFmZkxpc3QubWFwKChzdGFmZikgPT4gKHtcclxuICAgICAgICAgICAgICBuYW1lOiBzdGFmZlsnQF9OYW1lJ11bMF0sXHJcbiAgICAgICAgICAgICAgZW1haWw6IHN0YWZmWydAX0VNYWlsJ11bMF0sXHJcbiAgICAgICAgICAgICAgc3RhZmZHdTogc3RhZmZbJ0BfU3RhZmZHVSddWzBdLFxyXG4gICAgICAgICAgICAgIGpvYlRpdGxlOiBzdGFmZlsnQF9UaXRsZSddWzBdLFxyXG4gICAgICAgICAgICAgIGV4dG46IHN0YWZmWydAX0V4dG4nXVswXSxcclxuICAgICAgICAgICAgICBwaG9uZTogc3RhZmZbJ0BfUGhvbmUnXVswXSxcclxuICAgICAgICAgICAgfSkpLFxyXG4gICAgICAgICAgICAvL0B0cy1pZ25vcmVcclxuICAgICAgICAgIH0seG1sT2JqZWN0LmV4dHJhRGF0YV0pO1xyXG4gICAgICAgIH0pXHJcbiAgICAgICAgLmNhdGNoKHJlaik7XHJcbiAgICB9KTtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIEdldHMgdGhlIHNjaGVkdWxlIG9mIHRoZSBzdHVkZW50XHJcbiAgICogQHBhcmFtIHtudW1iZXJ9IHRlcm1JbmRleCBUaGUgaW5kZXggb2YgdGhlIHRlcm0uXHJcbiAgICogQHJldHVybnMge1Byb21pc2U8U2NoZWR1bGU+fSBSZXR1cm5zIHRoZSBzY2hlZHVsZSBvZiB0aGUgc3R1ZGVudFxyXG4gICAqIEBkZXNjcmlwdGlvblxyXG4gICAqIGBgYGpzXHJcbiAgICogYXdhaXQgc2NoZWR1bGUoMCkgLy8gLT4geyB0ZXJtOiB7IGluZGV4OiAwLCBuYW1lOiAnMXN0IFF0ciBQcm9ncmVzcycgfSwgLi4uIH1cclxuICAgKiBgYGBcclxuICAgKi9cclxuICBwdWJsaWMgc2NoZWR1bGUodGVybUluZGV4PzogbnVtYmVyKTogUHJvbWlzZTxbYW55LGFueV0+IHtcclxuICAgIHJldHVybiBuZXcgUHJvbWlzZSgocmVzLCByZWopID0+IHtcclxuICAgICAgc3VwZXJcclxuICAgICAgICAucHJvY2Vzc1JlcXVlc3Q8YW55Pih7XHJcbiAgICAgICAgICBtZXRob2ROYW1lOiAnU3R1ZGVudENsYXNzTGlzdCcsXHJcbiAgICAgICAgICBwYXJhbVN0cjogeyBjaGlsZEludElkOiAwLCAuLi4odGVybUluZGV4ICE9IG51bGwgPyB7IFRlcm1JbmRleDogdGVybUluZGV4IH0gOiB7fSkgfSxcclxuICAgICAgICB9KVxyXG4gICAgICAgIC50aGVuKCh4bWxPYmplY3Q6YW55KSA9PiB7XHJcbiAgICAgICAgICB2YXIgcmVzcG9uc2U6YW55PXt9XHJcbiAgICAgICAgICByZXNwb25zZS50ZXJtTmFtZT14bWxPYmplY3QuU3R1ZGVudENsYXNzU2NoZWR1bGVbMF1bJ0BfVGVybUluZGV4TmFtZSddWzBdOyAvL2NvdWxkIHNvbWV0aW1lcyBiZSBzdHJpbmdzIGJ1dCBmdWNrIHRoYXRcclxuICAgICAgICAgIHJlc3BvbnNlLnRlcm1JbmRleD14bWxPYmplY3QuU3R1ZGVudENsYXNzU2NoZWR1bGVbMF1bJ0BfVGVybUluZGV4J11bMF07XHJcbiAgICAgICAgICAvL2ZvciBub3cgd2UncmUgbm90IGdyYWJiaW5nIHRoZSB0ZXJtcyBmb3IgdGhlIGNvbmNjdXJlbnQgc2Nob29sLCB0aGV5IGxvd2sgZG9uJ3QgbWF0dGVyXHJcbiAgICAgICAgICByZXNwb25zZS50ZXJtcz14bWxPYmplY3QuU3R1ZGVudENsYXNzU2NoZWR1bGVbMF0uVGVybUxpc3RzWzBdLlRlcm1MaXN0aW5nLm1hcCgodGVybTphbnkpPT4oe3N0YXJ0OnRlcm1bJ0BfQmVnaW5EYXRlJ11bMF0sZW5kOnRlcm1bJ0BfRW5kRGF0ZSddWzBdLHRlcm1JbmRleDp0ZXJtWydAX1Rlcm1JbmRleCddWzBdLHRlcm1OYW1lOnRlcm1bJ0BfVGVybU5hbWUnXVswXX0pKVxyXG4gICAgICAgICAgXHJcbiAgICAgICAgICByZXNwb25zZS5tYWluQ2xhc3Nlcz14bWxPYmplY3QuU3R1ZGVudENsYXNzU2NoZWR1bGVbMF0uQ2xhc3NMaXN0c1swXS5DbGFzc0xpc3RpbmcubWFwKChjb3Vyc2U6YW55KT0+KHtuYW1lOmNvdXJzZVsnQF9Db3Vyc2VUaXRsZSddWzBdLHBlcmlvZDpjb3Vyc2VbJ0BfUGVyaW9kJ11bMF0sdGVhY2hlcjpjb3Vyc2VbJ0BfVGVhY2hlciddWzBdLHJvb206Y291cnNlWydAX1Jvb21OYW1lJ11bMF19KSlcclxuICAgICAgICAgIHZhciBjaGVja2VyPWZhbHNlO1xyXG4gICAgICAgICAgdHJ5e1xyXG4gICAgICAgICAgICBjaGVja2VyPXhtbE9iamVjdC5TdHVkZW50Q2xhc3NTY2hlZHVsZVswXS5Db25jdXJyZW50U2Nob29sU3R1ZGVudENsYXNzU2NoZWR1bGVzWzBdLkNvbmN1cnJlbnRTY2hvb2xTdHVkZW50Q2xhc3NTY2hlZHVsZVswXS5cclxuICAgICAgICAgICAgQ29uU2NoQ2xhc3NMaXN0c1swXS5DbGFzc0xpc3RpbmdbMF0hPScnXHJcbiAgICAgICAgICAgIFxyXG4gICAgICAgICAgfWNhdGNoe31cclxuXHJcbiAgICAgICAgICBcclxuICAgICAgICAgIGlmKGNoZWNrZXIpe1xyXG4gICAgICAgICAgICByZXNwb25zZS5jb25DbGFzc2VzPXhtbE9iamVjdC5TdHVkZW50Q2xhc3NTY2hlZHVsZVswXS5Db25jdXJyZW50U2Nob29sU3R1ZGVudENsYXNzU2NoZWR1bGVzWzBdLkNvbmN1cnJlbnRTY2hvb2xTdHVkZW50Q2xhc3NTY2hlZHVsZVswXS5Db25TY2hDbGFzc0xpc3RzWzBdLkNsYXNzTGlzdGluZy5tYXAoKGNvdXJzZTphbnkpPT4oe25hbWU6Y291cnNlWydAX0NvdXJzZVRpdGxlJ11bMF0scGVyaW9kOmNvdXJzZVsnQF9QZXJpb2QnXVswXSx0ZWFjaGVyOmNvdXJzZVsnQF9UZWFjaGVyJ11bMF0scm9vbTpjb3Vyc2VbJ0BfUm9vbU5hbWUnXVswXX0pKVxyXG4gICAgICAgICAgICByZXNwb25zZS5jb25DbGFzc2VzLmNvbk5hbWU9eG1sT2JqZWN0LlN0dWRlbnRDbGFzc1NjaGVkdWxlWzBdLkNvbmN1cnJlbnRTY2hvb2xTdHVkZW50Q2xhc3NTY2hlZHVsZXNbMF0uQ29uY3VycmVudFNjaG9vbFN0dWRlbnRDbGFzc1NjaGVkdWxlWzBdWydAX1NjaG9vbE5hbWUnXVxyXG4gICAgICAgICAgfVxyXG4gICAgICAgICAgdHJ5e1xyXG4gICAgICAgICAgaWYoeG1sT2JqZWN0LlN0dWRlbnRDbGFzc1NjaGVkdWxlWzBdLlRvZGF5U2NoZWR1bGVJbmZvRGF0YVswXS5TY2hvb2xJbmZvc1swXSE9Jycpe1xyXG4gICAgICAgICAgICByZXNwb25zZS50b2RheT17fVxyXG4gICAgICAgICAgICByZXNwb25zZS50b2RheS5tYWluPXhtbE9iamVjdC5TdHVkZW50Q2xhc3NTY2hlZHVsZVswXS5Ub2RheVNjaGVkdWxlSW5mb0RhdGFbMF0uU2Nob29sSW5mb3NbMF0uU2Nob29sSW5mb1swXS5DbGFzc2VzWzBdLkNsYXNzSW5mby5tYXAoKGNvdXJzZTphbnkpPT4oe25hbWU6Y291cnNlWydAX0NsYXNzTmFtZSddLHN0YXJ0OmNvdXJzZVsnQF9TdGFydFRpbWUnXSxlbmQ6Y291cnNlWydAX0VuZFRpbWUnXSx0ZWFjaGVyOmNvdXJzZVsnQF9UZWFjaGVyTmFtZSddLHBlcmlvZDpjb3Vyc2VbJ0BfUGVyaW9kJ10scm9vbTpjb3Vyc2VbJ0BfUm9vbU5hbWUnXX0pKVxyXG4gICAgICAgICAgICB0cnl7XHJcbiAgICAgICAgICAgICAgcmVzcG9uc2UudG9kYXkuY29uPXhtbE9iamVjdC5TdHVkZW50Q2xhc3NTY2hlZHVsZVswXS5Ub2RheVNjaGVkdWxlSW5mb0RhdGFbMF0uU2Nob29sSW5mb3NbMF0uU2Nob29sSW5mb1sxXS5DbGFzc2VzWzBdLkNsYXNzSW5mby5tYXAoKGNvdXJzZTphbnkpPT4oe25hbWU6Y291cnNlWydAX0NsYXNzTmFtZSddLHN0YXJ0OmNvdXJzZVsnQF9TdGFydFRpbWUnXSxlbmQ6Y291cnNlWydAX0VuZFRpbWUnXSx0ZWFjaGVyOmNvdXJzZVsnQF9UZWFjaGVyTmFtZSddLHBlcmlvZDpjb3Vyc2VbJ0BfUGVyaW9kJ10scm9vbTpjb3Vyc2VbJ0BfUm9vbU5hbWUnXX0pKVxyXG4gICAgICAgICAgICAgIHJlc3BvbnNlLnRvZGF5LmNvbk5hbWU9eG1sT2JqZWN0LlN0dWRlbnRDbGFzc1NjaGVkdWxlWzBdLlRvZGF5U2NoZWR1bGVJbmZvRGF0YVswXS5TY2hvb2xJbmZvc1swXS5TY2hvb2xpbmZvWzFdWydAX1NjaG9vbE5hbWUnXTtcclxuICAgICAgICAgICAgfWNhdGNoe2NvbnNvbGUubG9nKFwibm8gY29uY3VycmVudFwiKX1cclxuICAgICAgICAgIH1cclxuICAgICAgICAgIGVsc2V7XHJcbiAgICAgICAgICAgIHJlc3BvbnNlLnRvZGF5PWZhbHNlXHJcbiAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgXHJcbiAgICAgICAgICB9Y2F0Y2goZXJyb3Ipe2NvbnNvbGUubG9nKGVycm9yKTtyZXNwb25zZS50b2RheT1mYWxzZX1cclxuICAgICAgICAgIHJlcyhbcmVzcG9uc2UseG1sT2JqZWN0LmV4dHJhRGF0YV0pXHJcbiAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgLy9AdHMtaWdub3JlXHJcblxyXG4gICAgICAgIClcclxuICAgICAgICAuY2F0Y2gocmVqKTtcclxuICAgIH0pO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogUmV0dXJucyB0aGUgYXR0ZW5kYW5jZSBvZiB0aGUgc3R1ZGVudFxyXG4gICAqIEByZXR1cm5zIHtQcm9taXNlPEF0dGVuZGFuY2U+fSBSZXR1cm5zIGFuIEF0dGVuZGFuY2Ugb2JqZWN0XHJcbiAgICogQGRlc2NyaXB0aW9uXHJcbiAgICogYGBganNcclxuICAgKiBjbGllbnQuYXR0ZW5kYW5jZSgpXHJcbiAgICogIC50aGVuKGNvbnNvbGUubG9nKTsgLy8gLT4geyB0eXBlOiAnUGVyaW9kJywgcGVyaW9kOiB7Li4ufSwgc2Nob29sTmFtZTogJ1VuaXZlcnNpdHkgSGlnaCBTY2hvb2wnLCBhYnNlbmNlczogWy4uLl0sIHBlcmlvZEluZm9zOiBbLi4uXSB9XHJcbiAgICogYGBgXHJcbiAgICovXHJcbiAgcHVibGljIGF0dGVuZGFuY2UoKTogUHJvbWlzZTxbQXR0ZW5kYW5jZSxhbnldPiB7XHJcbiAgICByZXR1cm4gbmV3IFByb21pc2UoKHJlcywgcmVqKSA9PiB7XHJcbiAgICAgIHN1cGVyXHJcbiAgICAgICAgLnByb2Nlc3NSZXF1ZXN0PEF0dGVuZGFuY2VYTUxPYmplY3Q+KHtcclxuICAgICAgICAgIG1ldGhvZE5hbWU6ICdBdHRlbmRhbmNlJyxcclxuICAgICAgICAgIHBhcmFtU3RyOiB7XHJcbiAgICAgICAgICAgIGNoaWxkSW50SWQ6IDAsXHJcbiAgICAgICAgICB9LFxyXG4gICAgICAgIH0pXHJcbiAgICAgICAgLnRoZW4oKGF0dGVuZGFuY2VYTUxPYmplY3QpID0+IHtcclxuICAgICAgICAgIGNvbnN0IHhtbE9iamVjdCA9IGF0dGVuZGFuY2VYTUxPYmplY3QuQXR0ZW5kYW5jZVswXTtcclxuICAgICAgICAgIC8vQHRzLWlnbm9yZVxyXG4gICAgICAgICAgeG1sT2JqZWN0LmV4dHJhRGF0YT1hdHRlbmRhbmNlWE1MT2JqZWN0LmV4dHJhRGF0YVxyXG5cclxuICAgICAgICAgIHJlcyhbe1xyXG4gICAgICAgICAgICB0eXBlOiB4bWxPYmplY3RbJ0BfVHlwZSddWzBdLFxyXG4gICAgICAgICAgICBwZXJpb2Q6IHtcclxuICAgICAgICAgICAgICB0b3RhbDogTnVtYmVyKHhtbE9iamVjdFsnQF9QZXJpb2RDb3VudCddWzBdKSxcclxuICAgICAgICAgICAgICBzdGFydDogTnVtYmVyKHhtbE9iamVjdFsnQF9TdGFydFBlcmlvZCddWzBdKSxcclxuICAgICAgICAgICAgICBlbmQ6IE51bWJlcih4bWxPYmplY3RbJ0BfRW5kUGVyaW9kJ11bMF0pLFxyXG4gICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICBzY2hvb2xOYW1lOiB4bWxPYmplY3RbJ0BfU2Nob29sTmFtZSddWzBdLFxyXG4gICAgICAgICAgICBhYnNlbmNlczogeG1sT2JqZWN0LkFic2VuY2VzWzBdLkFic2VuY2VcclxuICAgICAgICAgICAgICA/IHhtbE9iamVjdC5BYnNlbmNlc1swXS5BYnNlbmNlLm1hcCgoYWJzZW5jZSkgPT4gKHtcclxuICAgICAgICAgICAgICAgICAgZGF0ZTogbmV3IERhdGUoYWJzZW5jZVsnQF9BYnNlbmNlRGF0ZSddWzBdKSxcclxuICAgICAgICAgICAgICAgICAgcmVhc29uOiBhYnNlbmNlWydAX1JlYXNvbiddWzBdLFxyXG4gICAgICAgICAgICAgICAgICBub3RlOiBhYnNlbmNlWydAX05vdGUnXVswXSxcclxuICAgICAgICAgICAgICAgICAgZGVzY3JpcHRpb246IGFic2VuY2VbJ0BfQ29kZUFsbERheURlc2NyaXB0aW9uJ11bMF0sXHJcbiAgICAgICAgICAgICAgICAgIHBlcmlvZHM6IGFic2VuY2UuUGVyaW9kc1swXS5QZXJpb2QubWFwKFxyXG4gICAgICAgICAgICAgICAgICAgIChwZXJpb2QpID0+XHJcbiAgICAgICAgICAgICAgICAgICAgICAoe1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBwZXJpb2Q6IE51bWJlcihwZXJpb2RbJ0BfTnVtYmVyJ11bMF0pLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICBuYW1lOiBwZXJpb2RbJ0BfTmFtZSddWzBdLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICByZWFzb246IHBlcmlvZFsnQF9SZWFzb24nXVswXSxcclxuICAgICAgICAgICAgICAgICAgICAgICAgY291cnNlOiBwZXJpb2RbJ0BfQ291cnNlJ11bMF0sXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHN0YWZmOiB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgbmFtZTogcGVyaW9kWydAX1N0YWZmJ11bMF0sXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgc3RhZmZHdTogcGVyaW9kWydAX1N0YWZmR1UnXVswXSxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICBlbWFpbDogcGVyaW9kWydAX1N0YWZmRU1haWwnXVswXSxcclxuICAgICAgICAgICAgICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgICAgICAgICAgICAgb3JnWWVhckd1OiBwZXJpb2RbJ0BfT3JnWWVhckdVJ11bMF0sXHJcbiAgICAgICAgICAgICAgICAgICAgICB9IGFzIEFic2VudFBlcmlvZClcclxuICAgICAgICAgICAgICAgICAgKSxcclxuICAgICAgICAgICAgICAgIH0pKVxyXG4gICAgICAgICAgICAgIDogW10sXHJcbiAgICAgICAgICAgIHBlcmlvZEluZm9zOiB4bWxPYmplY3QuVG90YWxBY3Rpdml0aWVzWzBdLlBlcmlvZFRvdGFsLm1hcCgocGQsIGkpID0+ICh7XHJcbiAgICAgICAgICAgICAgcGVyaW9kOiBOdW1iZXIocGRbJ0BfTnVtYmVyJ11bMF0pLFxyXG4gICAgICAgICAgICAgIHRvdGFsOiB7XHJcbiAgICAgICAgICAgICAgICBleGN1c2VkOiBOdW1iZXIoeG1sT2JqZWN0LlRvdGFsRXhjdXNlZFswXS5QZXJpb2RUb3RhbFtpXVsnQF9Ub3RhbCddWzBdKSxcclxuICAgICAgICAgICAgICAgIHRhcmRpZXM6IE51bWJlcih4bWxPYmplY3QuVG90YWxUYXJkaWVzWzBdLlBlcmlvZFRvdGFsW2ldWydAX1RvdGFsJ11bMF0pLFxyXG4gICAgICAgICAgICAgICAgdW5leGN1c2VkOiBOdW1iZXIoeG1sT2JqZWN0LlRvdGFsVW5leGN1c2VkWzBdLlBlcmlvZFRvdGFsW2ldWydAX1RvdGFsJ11bMF0pLFxyXG4gICAgICAgICAgICAgICAgYWN0aXZpdGllczogTnVtYmVyKHhtbE9iamVjdC5Ub3RhbEFjdGl2aXRpZXNbMF0uUGVyaW9kVG90YWxbaV1bJ0BfVG90YWwnXVswXSksXHJcbiAgICAgICAgICAgICAgICB1bmV4Y3VzZWRUYXJkaWVzOiBOdW1iZXIoeG1sT2JqZWN0LlRvdGFsVW5leGN1c2VkVGFyZGllc1swXS5QZXJpb2RUb3RhbFtpXVsnQF9Ub3RhbCddWzBdKSxcclxuICAgICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICB9KSkgYXMgUGVyaW9kSW5mb1tdLFxyXG4gICAgICAgICAgfSBhcyBBdHRlbmRhbmNlLFxyXG4gICAgICAgICAgLy9AdHMtaWdub3JlXHJcbiAgICAgICAgeG1sT2JqZWN0LmV4dHJhRGF0YV1cclxuICAgICAgICApO1xyXG4gICAgICAgIH0pXHJcbiAgICAgICAgLmNhdGNoKHJlaik7XHJcbiAgICB9KTtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIFJldHVybnMgdGhlIGdyYWRlYm9vayBvZiB0aGUgc3R1ZGVudFxyXG4gICAqIEBwYXJhbSB7bnVtYmVyfSByZXBvcnRpbmdQZXJpb2RJbmRleCBUaGUgdGltZWZyYW1lIHRoYXQgdGhlIGdyYWRlYm9vayBzaG91bGQgcmV0dXJuXHJcbiAgICogQHJldHVybnMge1Byb21pc2U8R3JhZGVib29rPn0gUmV0dXJucyBhIEdyYWRlYm9vayBvYmplY3RcclxuICAgKiBAZGVzY3JpcHRpb25cclxuICAgKiBgYGBqc1xyXG4gICAqIGNvbnN0IGdyYWRlYm9vayA9IGF3YWl0IGNsaWVudC5ncmFkZWJvb2soKTtcclxuICAgKiBjb25zb2xlLmxvZyhncmFkZWJvb2spOyAvLyB7IGVycm9yOiAnJywgdHlwZTogJ1RyYWRpdGlvbmFsJywgcmVwb3J0aW5nUGVyaW9kOiB7Li4ufSwgY291cnNlczogWy4uLl0gfTtcclxuICAgKlxyXG4gICAqIGF3YWl0IGNsaWVudC5ncmFkZWJvb2soMCkgLy8gU29tZSBzY2hvb2xzIHdpbGwgaGF2ZSBSZXBvcnRpbmdQZXJpb2RJbmRleCAwIGFzIFwiMXN0IFF1YXJ0ZXIgUHJvZ3Jlc3NcIlxyXG4gICAqIGF3YWl0IGNsaWVudC5ncmFkZWJvb2soNykgLy8gU29tZSBzY2hvb2xzIHdpbGwgaGF2ZSBSZXBvcnRpbmdQZXJpb2RJbmRleCA3IGFzIFwiNHRoIFF1YXJ0ZXJcIlxyXG4gICAqIGBgYFxyXG4gICAqL1xyXG4gIHB1YmxpYyBncmFkZWJvb2socmVwb3J0aW5nUGVyaW9kSW5kZXg/OiBudW1iZXIsb3JnWWVhckd1PzpzdHJpbmcsIGZyZXNoPXRydWUpOiBQcm9taXNlPFtHcmFkZWJvb2ssYW55XT4ge1xyXG4gICAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXMsIHJlaikgPT4ge1xyXG5cclxuXHJcblxyXG4gICAgICBjb25zdCBwYXJzZUJyYW5jaCA9ICh4bWxPYmplY3Q6IEdyYWRlYm9va1hNTE9iamVjdCB8IGFueSkgPT4ge1xyXG5cclxuICAgICAgICAgIFxyXG4gICAgICAgICAgdHJ5e1xyXG4gICAgICAgICAgICBpZiAoeG1sT2JqZWN0LlJUX0VSUk9SWzBdWydAX0VSUk9SX01FU1NBR0UnXVswXS5pbmNsdWRlcyhcIlRoZSB1c2VyIG5hbWUgb3IgcGFzc3dvcmQgaXMgaW5jb3JyZWN0XCIpfHx4bWxPYmplY3QuUlRfRVJST1JbMF1bJ0BfRVJST1JfTUVTU0FHRSddWzBdLmluY2x1ZGVzKFwiSW52YWxpZCB1c2VyIGlkIG9yIHBhc3N3b3JkXCIpKSB7cmVqKG5ldyBFcnJvcihcIkludmFsaWQvSW5jb3JyZWN0IFVzZXJuYW1lIG9yIFBhc3N3b3JkXCIpKTt9XHJcbiAgICAgICAgICAgIGVsc2V7cmVqKG5ldyBSZXF1ZXN0RXhjZXB0aW9uKHhtbE9iamVjdCkpfTt9XHJcbiAgICAgICAgICBjYXRjaChlKXtcclxuICAgICAgICBcclxuICAgICAgICAgIHJlcyhbe1xyXG4gICAgICAgICAgICBlcnJvcjogeG1sT2JqZWN0LkdyYWRlYm9va1swXVsnQF9FcnJvck1lc3NhZ2UnXVswXSxcclxuICAgICAgICAgICAgdHlwZTogeG1sT2JqZWN0LkdyYWRlYm9va1swXVsnQF9UeXBlJ11bMF0sXHJcbiAgICAgICAgICAgIHJlcG9ydGluZ1BlcmlvZDoge1xyXG4gICAgICAgICAgICAgIGN1cnJlbnQ6IHtcclxuICAgICAgICAgICAgICAgIGluZGV4OlxyXG4gICAgICAgICAgICAgICAgICByZXBvcnRpbmdQZXJpb2RJbmRleCA/P1xyXG4gICAgICAgICAgICAgICAgICBOdW1iZXIoXHJcbiAgICAgICAgICAgICAgICAgICAgeG1sT2JqZWN0LkdyYWRlYm9va1swXS5SZXBvcnRpbmdQZXJpb2RzWzBdLlJlcG9ydFBlcmlvZC5maW5kKFxyXG4gICAgICAgICAgICAgICAgICAgICAgKHg6YW55KSA9PiB4WydAX0dyYWRlUGVyaW9kJ11bMF0gPT09IHhtbE9iamVjdC5HcmFkZWJvb2tbMF0uUmVwb3J0aW5nUGVyaW9kWzBdWydAX0dyYWRlUGVyaW9kJ11bMF1cclxuICAgICAgICAgICAgICAgICAgICApPy5bJ0BfSW5kZXgnXVswXVxyXG4gICAgICAgICAgICAgICAgICApLFxyXG4gICAgICAgICAgICAgICAgZGF0ZToge1xyXG4gICAgICAgICAgICAgICAgICBzdGFydDogbmV3IERhdGUoeG1sT2JqZWN0LkdyYWRlYm9va1swXS5SZXBvcnRpbmdQZXJpb2RbMF1bJ0BfU3RhcnREYXRlJ11bMF0pLFxyXG4gICAgICAgICAgICAgICAgICBlbmQ6IG5ldyBEYXRlKHhtbE9iamVjdC5HcmFkZWJvb2tbMF0uUmVwb3J0aW5nUGVyaW9kWzBdWydAX0VuZERhdGUnXVswXSksXHJcbiAgICAgICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICAgICAgbmFtZTogeG1sT2JqZWN0LkdyYWRlYm9va1swXS5SZXBvcnRpbmdQZXJpb2RbMF1bJ0BfR3JhZGVQZXJpb2QnXVswXSxcclxuICAgICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICAgIGF2YWlsYWJsZTogeG1sT2JqZWN0LkdyYWRlYm9va1swXS5SZXBvcnRpbmdQZXJpb2RzWzBdLlJlcG9ydFBlcmlvZC5tYXAoKHBlcmlvZDphbnkpID0+ICh7XHJcbiAgICAgICAgICAgICAgICBkYXRlOiB7IHN0YXJ0OiBuZXcgRGF0ZShwZXJpb2RbJ0BfU3RhcnREYXRlJ11bMF0pLCBlbmQ6IG5ldyBEYXRlKHBlcmlvZFsnQF9FbmREYXRlJ11bMF0pIH0sXHJcbiAgICAgICAgICAgICAgICBuYW1lOiBwZXJpb2RbJ0BfR3JhZGVQZXJpb2QnXVswXSxcclxuICAgICAgICAgICAgICAgIGluZGV4OiBOdW1iZXIocGVyaW9kWydAX0luZGV4J11bMF0pLFxyXG4gICAgICAgICAgICAgIH0pKSxcclxuICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgY291cnNlczogeG1sT2JqZWN0LkdyYWRlYm9va1swXS5Db3Vyc2VzWzBdLkNvdXJzZS5tYXAoKGNvdXJzZTphbnkpID0+ICh7XHJcbiAgICAgICAgICAgICAgY291cnNlSUQ6IGNvdXJzZVsnQF9Db3Vyc2VJRCddPy5bMF0gPz8gXCJcIixcclxuICAgICAgICAgICAgICBwZXJpb2Q6IE51bWJlcihjb3Vyc2VbJ0BfUGVyaW9kJ11bMF0pLFxyXG4gICAgICAgICAgICAgIHRpdGxlOiBoZS5kZWNvZGUoY291cnNlWydAX1RpdGxlJ11bMF0pLFxyXG4gICAgICAgICAgICAgIHJvb206IGNvdXJzZVsnQF9Sb29tJ11bMF0sXHJcbiAgICAgICAgICAgICAgc3RhZmY6IHtcclxuICAgICAgICAgICAgICAgIG5hbWU6IGNvdXJzZVsnQF9TdGFmZiddWzBdLFxyXG4gICAgICAgICAgICAgICAgZW1haWw6IGNvdXJzZVsnQF9TdGFmZkVNYWlsJ11bMF0sXHJcbiAgICAgICAgICAgICAgICBzdGFmZkd1OiBjb3Vyc2VbJ0BfU3RhZmZHVSddWzBdLFxyXG4gICAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgICAgbWFya3M6IHR5cGVvZihjb3Vyc2UuTWFya3NbMF0pIT09J3N0cmluZycgPyAoY291cnNlLk1hcmtzWzBdLk1hcmsubWFwKChtYXJrOmFueSkgPT4gKHtcclxuICAgICAgICAgICAgICAgIG5hbWU6IG1hcmtbJ0BfTWFya05hbWUnXVswXSxcclxuICAgICAgICAgICAgICAgIGNhbGN1bGF0ZWRTY29yZToge1xyXG4gICAgICAgICAgICAgICAgICBzdHJpbmc6IG1hcmtbJ0BfQ2FsY3VsYXRlZFNjb3JlU3RyaW5nJ11bMF0sXHJcbiAgICAgICAgICAgICAgICAgIHJhdzogTnVtYmVyKG1hcmtbJ0BfQ2FsY3VsYXRlZFNjb3JlUmF3J11bMF0pLFxyXG4gICAgICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgICAgIHdlaWdodGVkQ2F0ZWdvcmllczpcclxuICAgICAgICAgICAgICAgICAgdHlwZW9mIG1hcmtbJ0dyYWRlQ2FsY3VsYXRpb25TdW1tYXJ5J11bMF0gIT09ICdzdHJpbmcnXHJcbiAgICAgICAgICAgICAgICAgICAgPyBtYXJrWydHcmFkZUNhbGN1bGF0aW9uU3VtbWFyeSddWzBdLkFzc2lnbm1lbnRHcmFkZUNhbGMubWFwKFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAod2VpZ2h0ZWQ6IHsgW3g6IHN0cmluZ106IGFueVtdOyB9KSA9PlxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICh7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0eXBlOiBoZS5kZWNvZGUod2VpZ2h0ZWRbJ0BfVHlwZSddWzBdKSxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNhbGN1bGF0ZWRNYXJrOiB3ZWlnaHRlZFsnQF9DYWxjdWxhdGVkTWFyayddWzBdLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgd2VpZ2h0OiB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGV2YWx1YXRlZDogd2VpZ2h0ZWRbJ0BfV2VpZ2h0ZWRQY3QnXVswXSxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgc3RhbmRhcmQ6IHdlaWdodGVkWydAX1dlaWdodCddWzBdLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHBvaW50czoge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjdXJyZW50OiBOdW1iZXIod2VpZ2h0ZWRbJ0BfUG9pbnRzJ11bMF0pLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICBwb3NzaWJsZTogTnVtYmVyKHdlaWdodGVkWydAX1BvaW50c1Bvc3NpYmxlJ11bMF0pLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICB9IGFzIFdlaWdodGVkQ2F0ZWdvcnkpXHJcbiAgICAgICAgICAgICAgICAgICAgICApXHJcbiAgICAgICAgICAgICAgICAgICAgOiBbXSxcclxuICAgICAgICAgICAgICAgIGFzc2lnbm1lbnRzOlxyXG4gICAgICAgICAgICAgICAgICB0eXBlb2YgbWFyay5Bc3NpZ25tZW50c1swXSAhPT0gJ3N0cmluZydcclxuICAgICAgICAgICAgICAgICAgICA/IChtYXJrLkFzc2lnbm1lbnRzWzBdLkFzc2lnbm1lbnQubWFwKChhc3NpZ25tZW50OmFueSkgPT4gKHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgZ3JhZGVib29rSWQ6IGFzc2lnbm1lbnRbJ0BfR3JhZGVib29rSUQnXVswXSxcclxuICAgICAgICAgICAgICAgICAgICAgICAgbmFtZTogZGVjb2RlVVJJKGFzc2lnbm1lbnRbJ0BfTWVhc3VyZSddWzBdKSxcclxuICAgICAgICAgICAgICAgICAgICAgICAgdHlwZTogaGUuZGVjb2RlKGFzc2lnbm1lbnRbJ0BfVHlwZSddWzBdKSxcclxuICAgICAgICAgICAgICAgICAgICAgICAgZGF0ZToge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgIHN0YXJ0OiBuZXcgRGF0ZShhc3NpZ25tZW50WydAX0RhdGUnXVswXSksXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgZHVlOiBuZXcgRGF0ZShhc3NpZ25tZW50WydAX0R1ZURhdGUnXVswXSksXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHNjb3JlOiB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgdHlwZTogaGUuZGVjb2RlKGFzc2lnbm1lbnRbJ0BfU2NvcmVUeXBlJ11bMF0pLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgIHZhbHVlOiBhc3NpZ25tZW50WydAX1Njb3JlJ10gIT09IHVuZGVmaW5lZCA/IGFzc2lnbm1lbnRbJ0BfU2NvcmUnXSA6IFwiTm90IEdyYWRlZFwiLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICAgICAgICAgICAgICBwb2ludHM6IGFzc2lnbm1lbnRbJ0BfUG9pbnRzJ11bMF0sXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIG5vdGVzOiBoZS5kZWNvZGUoYXNzaWdubWVudFsnQF9Ob3RlcyddWzBdKSxcclxuICAgICAgICAgICAgICAgICAgICAgICAgdGVhY2hlcklkOiBhc3NpZ25tZW50WydAX1RlYWNoZXJJRCddWzBdLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICBkZXNjcmlwdGlvbjogZGVjb2RlVVJJKGFzc2lnbm1lbnRbJ0BfTWVhc3VyZURlc2NyaXB0aW9uJ11bMF0pLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICBoYXNEcm9wYm94OiBKU09OLnBhcnNlKGFzc2lnbm1lbnRbJ0BfSGFzRHJvcEJveCddWzBdKSxcclxuICAgICAgICAgICAgICAgICAgICAgICAgc3R1ZGVudElkOiBhc3NpZ25tZW50WydAX1N0dWRlbnRJRCddWzBdLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICBkcm9wYm94RGF0ZToge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgIHN0YXJ0OiBuZXcgRGF0ZShhc3NpZ25tZW50WydAX0Ryb3BTdGFydERhdGUnXVswXSksXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgZW5kOiBuZXcgRGF0ZShhc3NpZ25tZW50WydAX0Ryb3BFbmREYXRlJ11bMF0pLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICAgICAgICAgICAgICByZXNvdXJjZXM6XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgdHlwZW9mIGFzc2lnbm1lbnQuUmVzb3VyY2VzWzBdICE9PSAnc3RyaW5nJ1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgPyAvKihhc3NpZ25tZW50LlJlc291cmNlc1swXS5SZXNvdXJjZS5tYXAoKHJzcmM6YW55KSA9PiB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgc3dpdGNoIChyc3JjWydAX1R5cGUnXVswXSkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgY2FzZSAnRmlsZSc6IHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgY29uc3QgZmlsZVJzcmMgPSByc3JjIGFzIEZpbGVSZXNvdXJjZVhNTE9iamVjdDtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0eXBlOiBSZXNvdXJjZVR5cGUuRklMRSxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBmaWxlOiB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0eXBlOiBmaWxlUnNyY1snQF9GaWxlVHlwZSddWzBdLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgbmFtZTogZmlsZVJzcmNbJ0BfRmlsZU5hbWUnXVswXSxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHVyaTogdGhpcy5ob3N0VXJsICsgZmlsZVJzcmNbJ0BfU2VydmVyRmlsZU5hbWUnXVswXSxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJlc291cmNlOiB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBkYXRlOiBuZXcgRGF0ZShmaWxlUnNyY1snQF9SZXNvdXJjZURhdGUnXVswXSksXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZDogZmlsZVJzcmNbJ0BfUmVzb3VyY2VJRCddWzBdLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgbmFtZTogZmlsZVJzcmNbJ0BfUmVzb3VyY2VOYW1lJ11bMF0sXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfSBhcyBGaWxlUmVzb3VyY2U7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjYXNlICdVUkwnOiB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IHVybFJzcmMgPSByc3JjIGFzIFVSTFJlc291cmNlWE1MT2JqZWN0O1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4ge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHVybDogdXJsUnNyY1snQF9VUkwnXSAhPT0gdW5kZWZpbmVkID8gdXJsUnNyY1snQF9VUkwnXSA6IFwiTm90IEdpdmVuXCIsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdHlwZTogUmVzb3VyY2VUeXBlLlVSTCxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXNvdXJjZToge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZGF0ZTogbmV3IERhdGUodXJsUnNyY1snQF9SZXNvdXJjZURhdGUnXVswXSksXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZDogdXJsUnNyY1snQF9SZXNvdXJjZUlEJ11bMF0sXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBuYW1lOiB1cmxSc3JjWydAX1Jlc291cmNlTmFtZSddWzBdLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZGVzY3JpcHRpb246IHVybFJzcmNbJ0BfUmVzb3VyY2VEZXNjcmlwdGlvbiddWzBdLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcGF0aDogdXJsUnNyY1snQF9TZXJ2ZXJGaWxlTmFtZSddWzBdLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9IGFzIFVSTFJlc291cmNlO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZGVmYXVsdDpcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcmVqKFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGBUeXBlICR7cnNyY1snQF9UeXBlJ11bMF19IGRvZXMgbm90IGV4aXN0IGFzIGEgdHlwZS4gQWRkIGl0IHRvIHR5cGUgZGVjbGFyYXRpb25zLmBcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0pIGFzIChGaWxlUmVzb3VyY2UgfCBVUkxSZXNvdXJjZSlbXSkgKi8gXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvL09idmlvdXNseSB0aGlzIGlzIGFuIGluc2FuZWx5IG5lZ2xpZ2VudCBmaXguIEp1c3Qgc2F5aW5nIHRvIGNvbXBsZXRlIGhlbGwgd2l0aCB0aGUgcmVzb3VyY2UuIEJ1dCwgZ3JhZGUgbWVsb24gZG9lc24ndCB1c2UgaXQuIFNvIEkgZG9uJ3QgY2FyZS5cclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgW10gOiBbXSxcclxuICAgICAgICAgICAgICAgICAgICAgIH0pKSBhcyBBc3NpZ25tZW50W10pXHJcbiAgICAgICAgICAgICAgICAgICAgOiBbXSxcclxuICAgICAgICAgICAgICB9KSkpIGFzIE1hcmtbXTpbeyBuYW1lOiBcIm5vbmVcIiwgY2FsY3VsYXRlZFNjb3JlOiB7IHN0cmluZzogXCJub25lXCIsIHJhdzogTmFOIH0sIHdlaWdodGVkQ2F0ZWdvcmllczogW10sIGFzc2lnbm1lbnRzOiBbXSB9XSBhcyBNYXJrW10sXHJcbiAgICAgICAgICAgIH0pKSxcclxuICAgICAgICAgIH0gYXMgR3JhZGVib29rLFxyXG4gICAgICAgIHhtbE9iamVjdC5leHRyYURhdGFdXHJcbiAgICAgICAgKTt9XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgXHJcbiAgICBcclxuICBjb25zdCBmZXRjaEJyYW5jaCA9ICgpOiBQcm9taXNlPEdyYWRlYm9va1hNTE9iamVjdD4gPT4ge1xyXG4gIHJldHVybiBzdXBlclxyXG4gICAgLnByb2Nlc3NSZXF1ZXN0PEdyYWRlYm9va1hNTE9iamVjdCAmIHsgZXh0cmFEYXRhPzogYW55IH0+KFxyXG4gICAgICB7XHJcbiAgICAgICAgbWV0aG9kTmFtZTogJ0dyYWRlYm9vaycsXHJcbiAgICAgICAgcGFyYW1TdHI6IHtcclxuICAgICAgICAgIGNoaWxkSW50SWQ6IDAsXHJcbiAgICAgICAgICAuLi4ocmVwb3J0aW5nUGVyaW9kSW5kZXggIT0gbnVsbCA/IHsgUmVwb3J0UGVyaW9kOiByZXBvcnRpbmdQZXJpb2RJbmRleCB9IDoge30pLFxyXG4gICAgICAgICAgLi4uKG9yZ1llYXJHdSAhPSBudWxsID8geyBDb25jdXJyZW50U2NoT3JnWWVhckdVOiBvcmdZZWFyR3UgfSA6IHt9KSxcclxuICAgICAgICB9LFxyXG4gICAgICB9LFxyXG4gICAgICAoeG1sKSA9PlxyXG4gICAgICAgIG5ldyBYTUxGYWN0b3J5KHhtbClcclxuICAgICAgICAgIC5lbmNvZGVBdHRyaWJ1dGUoJ01lYXN1cmVEZXNjcmlwdGlvbicsICdIYXNEcm9wQm94JylcclxuICAgICAgICAgIC5lbmNvZGVBdHRyaWJ1dGUoJ01lYXN1cmUnLCAnVHlwZScpXHJcbiAgICAgICAgICAudG9TdHJpbmcoKVxyXG4gICAgKVxyXG4gICAgLnRoZW4oKHJlc3VsdCkgPT4ge1xyXG4gICAgICBjb25zb2xlLmxvZyhcImpvc2ggc3Rld2FydFwiKTtcclxuICAgICAgcmV0dXJuIHJlc3VsdDtcclxuICAgIH0pO1xyXG59O1xyXG5cclxuXHJcbiAgICAgIFxyXG5cclxuICAgICAgaWYoZnJlc2h8fHJlcG9ydGluZ1BlcmlvZEluZGV4PT1udWxsKXtcclxuICAgICAgICBjb25zb2xlLmxvZyhcIndoYXQgdGhlIGZ1Y2sgZ3V5c1wiKVxyXG4gICAgICAgIGZldGNoQnJhbmNoKCkudGhlbihyZXN1bHQ9Pntjb25zb2xlLmxvZyhcImJvc3RvblwiKTtwYXJzZUJyYW5jaChyZXN1bHQpfSkuY2F0Y2goZXJyPT5yZWooZXJyKSlcclxuICAgICAgfSAgIFxyXG4gICAgICAgIGVsc2V7XHJcbiAgICAgICAgICBjb25zdCBtOnhtbENhY2hlID0gSlNPTi5wYXJzZShsb2NhbFN0b3JhZ2UuZ2V0SXRlbShcInhtbENhY2hlXCIpID8/IFwie31cIilcclxuICAgICAgICAgIGNvbnN0IGlkZW50aWZpZXI9dGhpcy5kaXN0cmljdCt0aGlzLnVzZXJuYW1lK3JlcG9ydGluZ1BlcmlvZEluZGV4XHJcbiAgICAgICAgICBpZihtW2lkZW50aWZpZXJdKXtcclxuICAgICAgICAgICAgaWYoTWF0aC5hYnMobVtpZGVudGlmaWVyXS5hZ2UtRGF0ZS5ub3coKSk+MTAwMCo2MCo2MCoyNCozKXsgLy8gaWYgb2xkZXIgdGhhbiAzIGRheXMsIHJlZnJlc2ggXHJcbiAgICAgICAgICAgICAgICAgICAgICBmZXRjaEJyYW5jaCgpLnRoZW4oKHJlc3VsdCk9PntcclxuICAgICAgICAgICAgICAgICAgICAgIG1baWRlbnRpZmllcl09e2RhdGE6cmVzdWx0LGFnZTpEYXRlLm5vdygpfVxyXG4gICAgICAgICAgICAgICAgICAgICAgbG9jYWxTdG9yYWdlLnNldEl0ZW0oXCJ4bWxDYWNoZVwiLEpTT04uc3RyaW5naWZ5KG0pKVxyXG4gICAgICAgICAgICAgICAgICAgICAgcGFyc2VCcmFuY2gocmVzdWx0KX0pLmNhdGNoKGVycj0+cmVqKGVycikpXHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgZWxzZXtcclxuICAgICAgICAgICAgICAgIHBhcnNlQnJhbmNoKG1baWRlbnRpZmllcl0uZGF0YSlcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgfWVsc2V7XHJcbiAgICAgICAgICAgIGZldGNoQnJhbmNoKCkudGhlbihyZXN1bHQ9PntcclxuICAgICAgICAgICAgICBjb25zdCB4bWxDYWNoZT1KU09OLnBhcnNlKGxvY2FsU3RvcmFnZS5nZXRJdGVtKFwieG1sQ2FjaGVcIikgPz8gXCJ7fVwiKVxyXG4gICAgICAgICAgICAgIHhtbENhY2hlW2lkZW50aWZpZXJdPXtkYXRhOnJlc3VsdCxhZ2U6RGF0ZS5ub3coKX1cclxuICAgICAgICAgICAgICBjb25zb2xlLmxvZyhcImRhc2ggcG9lXCIseG1sQ2FjaGUpXHJcbiAgICAgICAgICAgICAgbG9jYWxTdG9yYWdlLnNldEl0ZW0oXCJ4bWxDYWNoZVwiLHhtbENhY2hlKVxyXG4gICAgICAgICAgICAgIHBhcnNlQnJhbmNoKHJlc3VsdClcclxuICAgICAgICAgICAgfSlcclxuICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgfVxyXG4gICAgfSk7XHJcbiAgfVxyXG5cclxuXHJcblxyXG4gIC8qKlxyXG4gICAqIEdldCBhIGxpc3Qgb2YgbWVzc2FnZXMgb2YgdGhlIHN0dWRlbnRcclxuICAgKiBAcmV0dXJucyB7UHJvbWlzZTxNZXNzYWdlW10+fSBSZXR1cm5zIGFuIGFycmF5IG9mIG1lc3NhZ2VzIG9mIHRoZSBzdHVkZW50XHJcbiAgICogQGRlc2NyaXB0aW9uXHJcbiAgICogYGBganNcclxuICAgKiBhd2FpdCBjbGllbnQubWVzc2FnZXMoKTsgLy8gLT4gW3sgaWQ6ICdFOTcyRjFCQy05OUEwLTRDRDAtOEQxNS1CMTg5NjhCNDNFMDgnLCB0eXBlOiAnU3R1ZGVudEFjdGl2aXR5JywgLi4uIH0sIHsgaWQ6ICc4NkZEQTExRC00MkM3LTQyNDktQjAwMy05NEIxNUVCMkM4RDQnLCB0eXBlOiAnU3R1ZGVudEFjdGl2aXR5JywgLi4uIH1dXHJcbiAgICogYGBgXHJcbiAgICovXHJcbiAgcHVibGljIG1lc3NhZ2VzKCk6IFByb21pc2U8W01lc3NhZ2VbXSxhbnldPiB7XHJcbiAgICByZXR1cm4gbmV3IFByb21pc2UoKHJlcywgcmVqKSA9PiB7XHJcbiAgICAgIHN1cGVyXHJcbiAgICAgICAgLnByb2Nlc3NSZXF1ZXN0PE1lc3NhZ2VYTUxPYmplY3Q+KFxyXG4gICAgICAgICAge1xyXG4gICAgICAgICAgICBtZXRob2ROYW1lOiAnR2V0UFhQTWVzc2FnZXMnLFxyXG4gICAgICAgICAgICBwYXJhbVN0cjogeyBjaGlsZEludElkOiAwIH0sXHJcbiAgICAgICAgICB9LFxyXG4gICAgICAgICAgKHhtbCkgPT4gbmV3IFhNTEZhY3RvcnkoeG1sKS5lbmNvZGVBdHRyaWJ1dGUoJ0NvbnRlbnQnLCAnUmVhZCcpLnRvU3RyaW5nKClcclxuICAgICAgICApXHJcbiAgICAgICAgLnRoZW4oKHhtbE9iamVjdCkgPT4ge1xyXG4gICAgICAgICAgcmVzKFtcclxuICAgICAgICAgICAgeG1sT2JqZWN0LlBYUE1lc3NhZ2VzRGF0YVswXS5NZXNzYWdlTGlzdGluZ3NbMF0uTWVzc2FnZUxpc3RpbmcubWFwKFxyXG4gICAgICAgICAgICAgIChtZXNzYWdlKSA9PiBuZXcgTWVzc2FnZShtZXNzYWdlLCBzdXBlci5jcmVkZW50aWFscywgdGhpcy5ob3N0VXJsKVxyXG4gICAgICAgICAgICAgIC8vIEB0cy1pZ25vcmUgLy9mdWNraW5nIHN1ZSBtZVxyXG4gICAgICAgICAgICApLHhtbE9iamVjdD8uZXh0cmFEYXRhXVxyXG4gICAgICAgICAgKTtcclxuICAgICAgICB9KVxyXG4gICAgICAgIC5jYXRjaChyZWopO1xyXG4gICAgfSk7XHJcbiAgfVxyXG5cclxuXHJcblxyXG4gIC8vYWx0bmVyYXRlIG1ldGhvZCBmb3Igc3R1ZGVudEluZm8gd2hlbiBzdHVkZW50SW5mbyBmYWlsczpcclxuICAvL3Rob3NlIHRoaW5ncyBjb21tZW50ZWQgb3V0IGFyZSBub3QgYXBwbGljYWJsZSBoZXJlXHJcbiAgcHVibGljIENoaWxkTGlzdCgpOlByb21pc2U8W1N0dWRlbnRJbmZvLGFueV0+e1xyXG4gICAgcmV0dXJuIG5ldyBQcm9taXNlPFtTdHVkZW50SW5mbyxhbnldPigocmVzLHJlaik9PntcclxuICAgICAgc3VwZXJcclxuICAgICAgICAucHJvY2Vzc1JlcXVlc3Qoe21ldGhvZE5hbWU6XCJDaGlsZExpc3RcIn0pXHJcbiAgICAgICAgICAudGhlbigoeG1sT2JqZWN0OmFueSk9PntcclxuICAgICAgICAgICAgY29uc3QgcmF3PXhtbE9iamVjdDtcclxuICAgICAgICAgICAgeG1sT2JqZWN0PXhtbE9iamVjdC5DaGlsZExpc3RbMF07XHJcblxyXG4gICAgICAgICAgICByZXMoW3tcclxuICAgICAgICAgICAgc3R1ZGVudDp7XHJcbiAgICAgICAgICAgICAgbmFtZTp4bWxPYmplY3QuQ2hpbGRbMF0uQ2hpbGROYW1lLCAvL2Z1bGwgTmFtZSBvbiB0aGlzIGZhbGxiYWNrIG1ldGhvZFxyXG4gICAgICAgICAgICAgIGxhc3ROYW1lOlwibm90IGF2YWlsYWJsZVwiLFxyXG4gICAgICAgICAgICAgIG5pY2tuYW1lOlwibm90IGF2YWlsYWJsZVwifSxcclxuICAgICAgICAgIC8vICBiaXJ0aERhdGU6bmV3IERhdGUoKSxcclxuICAgICAgICAgICAvLyB0cmFjazpcIm5vdCBhdmFpbGFibGVcIixcclxuICAgICAgICAgICAvLyBhZGRyZXNzOlwibm90IGF2YWlsYWJsZVwiLFxyXG4gICAgICAgICAgICBwaG90bzpvcHRpb25hbCh4bWxPYmplY3QuQ2hpbGRbMF0ucGhvdG8pLFxyXG4gICAgICAgICAgICBjb3Vuc2Vsb3I6dW5kZWZpbmVkLFxyXG4gICAgICAgICAgICBjdXJyZW50U2Nob29sOnhtbE9iamVjdC5DaGlsZFswXS5Pcmdhbml6YXRpb25OYW1lWzBdLFxyXG4gICAgICAgICAgIC8vIGRlbnRpc3Q6dW5kZWZpbmVkLFxyXG4gICAgICAgICAgICAvLyBwaHlzaWNpYW46dW5kZWZpbmVkLFxyXG4gICAgICAgICAgICAgIGlkOm9wdGlvbmFsKHhtbE9iamVjdC5DaGlsZFswXVsnQF9DaGlsZFBlcm1JRCddKSxcclxuICAgICAgICAgICAgICBvcmdZZWFyR3U6b3B0aW9uYWwoeG1sT2JqZWN0LkNoaWxkWzBdWydAX09yZ1llYXJHVSddKSxcclxuICAgICAgICAgICAgICAvL3Bob25lOlwibm90IGF2YWlsYWJsZVwiLFxyXG4gICAgICAgICAgICAgIC8vZW1haWw6XCJub3QgYXZhaWxhYmxlXCIsXHJcbiAgICAgICAgICAgICAgLy9lbWVyZ2VuY3lDb250YWN0czp1bmRlZmluZWQsXHJcbiAgICAgICAgICAgICAgZ2VuZGVyOlwibnVsbFwiLFxyXG4gICAgICAgICAgICAgIGdyYWRlOm9wdGlvbmFsKHhtbE9iamVjdC5DaGlsZFswXS5HcmFkZSksXHJcblxyXG5cclxuXHJcblxyXG4gICAgICAgICAgfSBhcyBTdHVkZW50SW5mbyxyYXcuZXh0cmFEYXRhXSl9KVxyXG4gICAgICAgICAgLmNhdGNoKHJlailcclxuICAgIH0pXHJcbiAgfVxyXG5cclxuXHJcbiAgLyoqXHJcbiAgICogR2V0cyB0aGUgaW5mbyBvZiBhIHN0dWRlbnRcclxuICAgKiBAcmV0dXJucyB7UHJvbWlzZTxTdHVkZW50SW5mbz59IFN0dWRlbnRJbmZvIG9iamVjdFxyXG4gICAqIEBkZXNjcmlwdGlvblxyXG4gICAqIGBgYGpzXHJcbiAgICogc3R1ZGVudEluZm8oKS50aGVuKGNvbnNvbGUubG9nKSAvLyAtPiB7IHN0dWRlbnQ6IHsgbmFtZTogJ0V2YW4gRGF2aXMnLCBuaWNrbmFtZTogJycsIGxhc3ROYW1lOiAnRGF2aXMnIH0sIC4uLn1cclxuICAgKiBgYGBcclxuICAgKi9cclxuICBwdWJsaWMgc3R1ZGVudEluZm8oKTogUHJvbWlzZTxbU3R1ZGVudEluZm8sYW55XT4ge1xyXG4gICAgcmV0dXJuIG5ldyBQcm9taXNlPFtTdHVkZW50SW5mbyxhbnldPigocmVzLCByZWopID0+IHtcclxuICAgICAgc3VwZXJcclxuICAgICAgICAucHJvY2Vzc1JlcXVlc3Q8U3R1ZGVudEluZm9YTUxPYmplY3Q+KHtcclxuICAgICAgICAgIG1ldGhvZE5hbWU6ICdTdHVkZW50SW5mbycsXHJcbiAgICAgICAgICBwYXJhbVN0cjogeyBjaGlsZEludElkOiAwIH0sXHJcbiAgICAgICAgfSlcclxuICAgICAgICAudGhlbigoeG1sT2JqZWN0RGF0YSkgPT4ge1xyXG4gICAgICAgICAgcmVzKFt7XHJcbiAgICAgICAgICAgIHN0dWRlbnQ6IHtcclxuICAgICAgICAgICAgICBuYW1lOiB4bWxPYmplY3REYXRhLlN0dWRlbnRJbmZvWzBdLkZvcm1hdHRlZE5hbWVbMF0sXHJcbiAgICAgICAgICAgICAgbGFzdE5hbWU6IHhtbE9iamVjdERhdGEuU3R1ZGVudEluZm9bMF0uTGFzdE5hbWVHb2VzQnlbMF0sXHJcbiAgICAgICAgICAgICAgbmlja25hbWU6IHhtbE9iamVjdERhdGEuU3R1ZGVudEluZm9bMF0uTmlja05hbWVbMF0sXHJcbiAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgIGJpcnRoRGF0ZTogbmV3IERhdGUoeG1sT2JqZWN0RGF0YS5TdHVkZW50SW5mb1swXS5CaXJ0aERhdGVbMF0pLFxyXG4gICAgICAgICAgICB0cmFjazogb3B0aW9uYWwoeG1sT2JqZWN0RGF0YS5TdHVkZW50SW5mb1swXS5UcmFjayksXHJcbiAgICAgICAgICAgIGFkZHJlc3M6IG9wdGlvbmFsKHhtbE9iamVjdERhdGEuU3R1ZGVudEluZm9bMF0uQWRkcmVzcyksXHJcbiAgICAgICAgICAgIHBob3RvOiBvcHRpb25hbCh4bWxPYmplY3REYXRhLlN0dWRlbnRJbmZvWzBdLlBob3RvKSxcclxuICAgICAgICAgICAgY291bnNlbG9yOlxyXG4gICAgICAgICAgICAgIHhtbE9iamVjdERhdGEuU3R1ZGVudEluZm9bMF0uQ291bnNlbG9yTmFtZSAmJlxyXG4gICAgICAgICAgICAgIHhtbE9iamVjdERhdGEuU3R1ZGVudEluZm9bMF0uQ291bnNlbG9yRW1haWwgJiZcclxuICAgICAgICAgICAgICB4bWxPYmplY3REYXRhLlN0dWRlbnRJbmZvWzBdLkNvdW5zZWxvclN0YWZmR1VcclxuICAgICAgICAgICAgICAgID8ge1xyXG4gICAgICAgICAgICAgICAgICAgIG5hbWU6IHhtbE9iamVjdERhdGEuU3R1ZGVudEluZm9bMF0uQ291bnNlbG9yTmFtZVswXSxcclxuICAgICAgICAgICAgICAgICAgICBlbWFpbDogeG1sT2JqZWN0RGF0YS5TdHVkZW50SW5mb1swXS5Db3Vuc2Vsb3JFbWFpbFswXSxcclxuICAgICAgICAgICAgICAgICAgICBzdGFmZkd1OiB4bWxPYmplY3REYXRhLlN0dWRlbnRJbmZvWzBdLkNvdW5zZWxvclN0YWZmR1VbMF0sXHJcbiAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIDogdW5kZWZpbmVkLFxyXG4gICAgICAgICAgICBjdXJyZW50U2Nob29sOiB4bWxPYmplY3REYXRhLlN0dWRlbnRJbmZvWzBdLkN1cnJlbnRTY2hvb2xbMF0sXHJcbiAgICAgICAgICAgIGRlbnRpc3Q6IHhtbE9iamVjdERhdGEuU3R1ZGVudEluZm9bMF0uRGVudGlzdFxyXG4gICAgICAgICAgICAgID8ge1xyXG4gICAgICAgICAgICAgICAgICBuYW1lOiB4bWxPYmplY3REYXRhLlN0dWRlbnRJbmZvWzBdLkRlbnRpc3RbMF1bJ0BfTmFtZSddWzBdLFxyXG4gICAgICAgICAgICAgICAgICBwaG9uZTogeG1sT2JqZWN0RGF0YS5TdHVkZW50SW5mb1swXS5EZW50aXN0WzBdWydAX1Bob25lJ11bMF0sXHJcbiAgICAgICAgICAgICAgICAgIGV4dG46IHhtbE9iamVjdERhdGEuU3R1ZGVudEluZm9bMF0uRGVudGlzdFswXVsnQF9FeHRuJ11bMF0sXHJcbiAgICAgICAgICAgICAgICAgIG9mZmljZTogeG1sT2JqZWN0RGF0YS5TdHVkZW50SW5mb1swXS5EZW50aXN0WzBdWydAX09mZmljZSddWzBdLFxyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgIDogdW5kZWZpbmVkLFxyXG4gICAgICAgICAgICBwaHlzaWNpYW46IHhtbE9iamVjdERhdGEuU3R1ZGVudEluZm9bMF0uUGh5c2ljaWFuXHJcbiAgICAgICAgICAgICAgPyB7XHJcbiAgICAgICAgICAgICAgICAgIG5hbWU6IHhtbE9iamVjdERhdGEuU3R1ZGVudEluZm9bMF0uUGh5c2ljaWFuWzBdWydAX05hbWUnXVswXSxcclxuICAgICAgICAgICAgICAgICAgcGhvbmU6IHhtbE9iamVjdERhdGEuU3R1ZGVudEluZm9bMF0uUGh5c2ljaWFuWzBdWydAX1Bob25lJ11bMF0sXHJcbiAgICAgICAgICAgICAgICAgIGV4dG46IHhtbE9iamVjdERhdGEuU3R1ZGVudEluZm9bMF0uUGh5c2ljaWFuWzBdWydAX0V4dG4nXVswXSxcclxuICAgICAgICAgICAgICAgICAgaG9zcGl0YWw6IHhtbE9iamVjdERhdGEuU3R1ZGVudEluZm9bMF0uUGh5c2ljaWFuWzBdWydAX0hvc3BpdGFsJ11bMF0sXHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgOiB1bmRlZmluZWQsXHJcbiAgICAgICAgICAgIGlkOiBvcHRpb25hbCh4bWxPYmplY3REYXRhLlN0dWRlbnRJbmZvWzBdLlBlcm1JRCksXHJcbiAgICAgICAgICAgIG9yZ1llYXJHdTogb3B0aW9uYWwoeG1sT2JqZWN0RGF0YS5TdHVkZW50SW5mb1swXS5PcmdZZWFyR1UpLFxyXG4gICAgICAgICAgICBwaG9uZTogb3B0aW9uYWwoeG1sT2JqZWN0RGF0YS5TdHVkZW50SW5mb1swXS5QaG9uZSksXHJcbiAgICAgICAgICAgIGVtYWlsOiBvcHRpb25hbCh4bWxPYmplY3REYXRhLlN0dWRlbnRJbmZvWzBdLkVNYWlsKSxcclxuICAgICAgICAgICAgZW1lcmdlbmN5Q29udGFjdHM6IHhtbE9iamVjdERhdGEuU3R1ZGVudEluZm9bMF0uRW1lcmdlbmN5Q29udGFjdHNcclxuICAgICAgICAgICAgICA/IHhtbE9iamVjdERhdGEuU3R1ZGVudEluZm9bMF0uRW1lcmdlbmN5Q29udGFjdHNbMF0uRW1lcmdlbmN5Q29udGFjdD8ubWFwKChjb250YWN0KSA9PiAoe1xyXG4gICAgICAgICAgICAgICAgICBuYW1lOiBvcHRpb25hbChjb250YWN0WydAX05hbWUnXSksXHJcbiAgICAgICAgICAgICAgICAgIHBob25lOiB7XHJcbiAgICAgICAgICAgICAgICAgICAgaG9tZTogb3B0aW9uYWwoY29udGFjdFsnQF9Ib21lUGhvbmUnXSksXHJcbiAgICAgICAgICAgICAgICAgICAgbW9iaWxlOiBvcHRpb25hbChjb250YWN0WydAX01vYmlsZVBob25lJ10pLFxyXG4gICAgICAgICAgICAgICAgICAgIG90aGVyOiBvcHRpb25hbChjb250YWN0WydAX090aGVyUGhvbmUnXSksXHJcbiAgICAgICAgICAgICAgICAgICAgd29yazogb3B0aW9uYWwoY29udGFjdFsnQF9Xb3JrUGhvbmUnXSksXHJcbiAgICAgICAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgICAgICAgIHJlbGF0aW9uc2hpcDogb3B0aW9uYWwoY29udGFjdFsnQF9SZWxhdGlvbnNoaXAnXSksXHJcbiAgICAgICAgICAgICAgICB9KSlcclxuICAgICAgICAgICAgICA6IFtdLFxyXG4gICAgICAgICAgICBnZW5kZXI6IG9wdGlvbmFsKHhtbE9iamVjdERhdGEuU3R1ZGVudEluZm9bMF0uR2VuZGVyKSxcclxuICAgICAgICAgICAgZ3JhZGU6IG9wdGlvbmFsKHhtbE9iamVjdERhdGEuU3R1ZGVudEluZm9bMF0uR3JhZGUpLFxyXG4gICAgICAgICAgICBsb2NrZXJJbmZvUmVjb3Jkczogb3B0aW9uYWwoeG1sT2JqZWN0RGF0YS5TdHVkZW50SW5mb1swXS5Mb2NrZXJJbmZvUmVjb3JkcyksXHJcbiAgICAgICAgICAgIGhvbWVMYW5ndWFnZTogb3B0aW9uYWwoeG1sT2JqZWN0RGF0YS5TdHVkZW50SW5mb1swXS5Ib21lTGFuZ3VhZ2UpLFxyXG4gICAgICAgICAgICBob21lUm9vbTogb3B0aW9uYWwoeG1sT2JqZWN0RGF0YS5TdHVkZW50SW5mb1swXS5Ib21lUm9vbSksXHJcbiAgICAgICAgICAgIGhvbWVSb29tVGVhY2hlcjoge1xyXG4gICAgICAgICAgICAgIGVtYWlsOiBvcHRpb25hbCh4bWxPYmplY3REYXRhLlN0dWRlbnRJbmZvWzBdLkhvbWVSb29tVGNoRU1haWwpLFxyXG4gICAgICAgICAgICAgIG5hbWU6IG9wdGlvbmFsKHhtbE9iamVjdERhdGEuU3R1ZGVudEluZm9bMF0uSG9tZVJvb21UY2gpLFxyXG4gICAgICAgICAgICAgIHN0YWZmR3U6IG9wdGlvbmFsKHhtbE9iamVjdERhdGEuU3R1ZGVudEluZm9bMF0uSG9tZVJvb21UY2hTdGFmZkdVKSxcclxuICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgYWRkaXRpb25hbEluZm86IHhtbE9iamVjdERhdGEuU3R1ZGVudEluZm9bMF0uVXNlckRlZmluZWRHcm91cEJveGVzWzBdLlVzZXJEZWZpbmVkR3JvdXBCb3hcclxuICAgICAgICAgICAgICA/ICh4bWxPYmplY3REYXRhLlN0dWRlbnRJbmZvWzBdLlVzZXJEZWZpbmVkR3JvdXBCb3hlc1swXS5Vc2VyRGVmaW5lZEdyb3VwQm94Lm1hcCgoZGVmaW5lZEJveCkgPT4gKHtcclxuICAgICAgICAgICAgICAgICAgaWQ6IG9wdGlvbmFsKGRlZmluZWRCb3hbJ0BfR3JvdXBCb3hJRCddKSwgLy8gc3RyaW5nIHwgdW5kZWZpbmVkXHJcbiAgICAgICAgICAgICAgICAgIHR5cGU6IGRlZmluZWRCb3hbJ0BfR3JvdXBCb3hMYWJlbCddWzBdLCAvLyBzdHJpbmdcclxuICAgICAgICAgICAgICAgICAgdmNJZDogb3B0aW9uYWwoZGVmaW5lZEJveFsnQF9WQ0lEJ10pLCAvLyBzdHJpbmcgfCB1bmRlZmluZWRcclxuICAgICAgICAgICAgICAgICAgaXRlbXM6IGRlZmluZWRCb3guVXNlckRlZmluZWRJdGVtc1swXS5Vc2VyRGVmaW5lZEl0ZW0ubWFwKChpdGVtKSA9PiAoe1xyXG4gICAgICAgICAgICAgICAgICAgIHNvdXJjZToge1xyXG4gICAgICAgICAgICAgICAgICAgICAgZWxlbWVudDogaXRlbVsnQF9Tb3VyY2VFbGVtZW50J11bMF0sXHJcbiAgICAgICAgICAgICAgICAgICAgICBvYmplY3Q6IGl0ZW1bJ0BfU291cmNlT2JqZWN0J11bMF0sXHJcbiAgICAgICAgICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgICAgICAgICB2Y0lkOiBpdGVtWydAX1ZDSUQnXVswXSxcclxuICAgICAgICAgICAgICAgICAgICB2YWx1ZTogaXRlbVsnQF9WYWx1ZSddWzBdLFxyXG4gICAgICAgICAgICAgICAgICAgIHR5cGU6IGl0ZW1bJ0BfSXRlbVR5cGUnXVswXSxcclxuICAgICAgICAgICAgICAgICAgfSkpIGFzIEFkZGl0aW9uYWxJbmZvSXRlbVtdLFxyXG4gICAgICAgICAgICAgICAgfSkpIGFzIEFkZGl0aW9uYWxJbmZvW10pXHJcbiAgICAgICAgICAgICAgOiBbXSxcclxuICAgICAgICAgICAgICAvL0B0cy1pZ25vcmUgWW91IHdpbGwgbmV2ZXIgbWFrZSBtZSB1c2UgdHlwZVNjcmlwdC5cclxuICAgICAgICAgIH0gYXMgU3R1ZGVudEluZm8seG1sT2JqZWN0RGF0YS5leHRyYURhdGFdKTtcclxuICAgICAgICB9KVxyXG4gICAgICAgIC5jYXRjaChyZWopO1xyXG4gICAgfSk7XHJcbiAgfVxyXG5cclxuICBwcml2YXRlIGZldGNoRXZlbnRzV2l0aGluSW50ZXJ2YWwoZGF0ZTogRGF0ZSkge1xyXG4gICAgcmV0dXJuIHN1cGVyLnByb2Nlc3NSZXF1ZXN0PENhbGVuZGFyWE1MT2JqZWN0PihcclxuICAgICAge1xyXG4gICAgICAgIG1ldGhvZE5hbWU6ICdTdHVkZW50Q2FsZW5kYXInLFxyXG4gICAgICAgIHBhcmFtU3RyOiB7IGNoaWxkSW50SWQ6IDAsIFJlcXVlc3REYXRlOiBkYXRlLnRvSVNPU3RyaW5nKCkgfSxcclxuICAgICAgfSxcclxuICAgICAgKHhtbCkgPT4gbmV3IFhNTEZhY3RvcnkoeG1sKS5lbmNvZGVBdHRyaWJ1dGUoJ1RpdGxlJywgJ0ljb24nKS50b1N0cmluZygpXHJcbiAgICApO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICpcclxuICAgKiBAcGFyYW0ge0NhbGVuZGFyT3B0aW9uc30gb3B0aW9ucyBPcHRpb25zIHRvIHByb3ZpZGUgZm9yIGNhbGVuZGFyIG1ldGhvZC4gQW4gaW50ZXJ2YWwgaXMgcmVxdWlyZWQuXHJcbiAgICogQHJldHVybnMge1Byb21pc2U8Q2FsZW5kYXI+fSBSZXR1cm5zIGEgQ2FsZW5kYXIgb2JqZWN0XHJcbiAgICogQGRlc2NyaXB0aW9uXHJcbiAgICogYGBganNcclxuICAgKiBjbGllbnQuY2FsZW5kYXIoeyBpbnRlcnZhbDogeyBzdGFydDogbmV3IERhdGUoJzUvMS8yMDIyJyksIGVuZDogbmV3IERhdGUoJzgvMS8yMDIxJykgfSwgY29uY3VycmVuY3k6IG51bGwgfSk7IC8vIC0+IExpbWl0bGVzcyBjb25jdXJyZW5jeSAobm90IHJlY29tbWVuZGVkKVxyXG4gICAqXHJcbiAgICogY29uc3QgY2FsZW5kYXIgPSBhd2FpdCBjbGllbnQuY2FsZW5kYXIoeyBpbnRlcnZhbDogeyAuLi4gfX0pO1xyXG4gICAqIGNvbnNvbGUubG9nKGNhbGVuZGFyKTsgLy8gLT4geyBzY2hvb2xEYXRlOiB7Li4ufSwgb3V0cHV0UmFuZ2U6IHsuLi59LCBldmVudHM6IFsuLi5dIH1cclxuICAgKiBgYGBcclxuICAgKi9cclxuICBwdWJsaWMgYXN5bmMgY2FsZW5kYXIob3B0aW9uczogQ2FsZW5kYXJPcHRpb25zID0ge30pOiBQcm9taXNlPENhbGVuZGFyPiB7XHJcbiAgICBjb25zdCBkZWZhdWx0T3B0aW9uczogQ2FsZW5kYXJPcHRpb25zID0ge1xyXG4gICAgICBjb25jdXJyZW5jeTogNyxcclxuICAgICAgLi4ub3B0aW9ucyxcclxuICAgIH07XHJcbiAgICBjb25zdCBjYWwgPSBhd2FpdCBjYWNoZS5tZW1vKCgpID0+IHRoaXMuZmV0Y2hFdmVudHNXaXRoaW5JbnRlcnZhbChuZXcgRGF0ZSgpKSk7XHJcbiAgICBjb25zdCBzY2hvb2xFbmREYXRlOiBEYXRlIHwgbnVtYmVyID1cclxuICAgICAgb3B0aW9ucy5pbnRlcnZhbD8uZW5kID8/IG5ldyBEYXRlKGNhbC5DYWxlbmRhckxpc3RpbmdbMF1bJ0BfU2Nob29sRW5kRGF0ZSddWzBdKTtcclxuICAgIGNvbnN0IHNjaG9vbFN0YXJ0RGF0ZTogRGF0ZSB8IG51bWJlciA9XHJcbiAgICAgIG9wdGlvbnMuaW50ZXJ2YWw/LnN0YXJ0ID8/IG5ldyBEYXRlKGNhbC5DYWxlbmRhckxpc3RpbmdbMF1bJ0BfU2Nob29sQmVnRGF0ZSddWzBdKTtcclxuXHJcbiAgICByZXR1cm4gbmV3IFByb21pc2UoKHJlcywgcmVqKSA9PiB7XHJcbiAgICAgIGNvbnN0IG1vbnRoc1dpdGhpblNjaG9vbFllYXIgPSBlYWNoTW9udGhPZkludGVydmFsKHsgc3RhcnQ6IHNjaG9vbFN0YXJ0RGF0ZSwgZW5kOiBzY2hvb2xFbmREYXRlIH0pO1xyXG4gICAgICBjb25zdCBnZXRBbGxFdmVudHNXaXRoaW5TY2hvb2xZZWFyID0gKCk6IFByb21pc2U8Q2FsZW5kYXJYTUxPYmplY3RbXT4gPT5cclxuICAgICAgICBkZWZhdWx0T3B0aW9ucy5jb25jdXJyZW5jeSA9PSBudWxsXHJcbiAgICAgICAgICA/IFByb21pc2UuYWxsKG1vbnRoc1dpdGhpblNjaG9vbFllYXIubWFwKChkYXRlOiBEYXRlKSA9PiB0aGlzLmZldGNoRXZlbnRzV2l0aGluSW50ZXJ2YWwoZGF0ZSkpKVxyXG4gICAgICAgICAgOiBhc3luY1Bvb2xBbGwoZGVmYXVsdE9wdGlvbnMuY29uY3VycmVuY3ksIG1vbnRoc1dpdGhpblNjaG9vbFllYXIsIChkYXRlOmFueSkgPT5cclxuICAgICAgICAgICAgICB0aGlzLmZldGNoRXZlbnRzV2l0aGluSW50ZXJ2YWwoZGF0ZSlcclxuICAgICAgICAgICAgKTtcclxuICAgICAgbGV0IG1lbW86IENhbGVuZGFyIHwgbnVsbCA9IG51bGw7XHJcbiAgICAgIGdldEFsbEV2ZW50c1dpdGhpblNjaG9vbFllYXIoKVxyXG4gICAgICAgIC50aGVuKChldmVudHMpID0+IHtcclxuICAgICAgICAgIGNvbnN0IGFsbEV2ZW50cyA9IGV2ZW50cy5yZWR1Y2UoKHByZXYsIGV2ZW50cykgPT4ge1xyXG4gICAgICAgICAgICBpZiAobWVtbyA9PSBudWxsKVxyXG4gICAgICAgICAgICAgIG1lbW8gPSB7XHJcbiAgICAgICAgICAgICAgICBzY2hvb2xEYXRlOiB7XHJcbiAgICAgICAgICAgICAgICAgIHN0YXJ0OiBuZXcgRGF0ZShldmVudHMuQ2FsZW5kYXJMaXN0aW5nWzBdWydAX1NjaG9vbEJlZ0RhdGUnXVswXSksXHJcbiAgICAgICAgICAgICAgICAgIGVuZDogbmV3IERhdGUoZXZlbnRzLkNhbGVuZGFyTGlzdGluZ1swXVsnQF9TY2hvb2xFbmREYXRlJ11bMF0pLFxyXG4gICAgICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgICAgIG91dHB1dFJhbmdlOiB7XHJcbiAgICAgICAgICAgICAgICAgIHN0YXJ0OiBzY2hvb2xTdGFydERhdGUsXHJcbiAgICAgICAgICAgICAgICAgIGVuZDogc2Nob29sRW5kRGF0ZSxcclxuICAgICAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgICAgICBldmVudHM6IFtdLFxyXG4gICAgICAgICAgICAgIH07XHJcbiAgICAgICAgICAgIGNvbnN0IHJlc3Q6IENhbGVuZGFyID0ge1xyXG4gICAgICAgICAgICAgIC4uLm1lbW8sIC8vIFRoaXMgaXMgdG8gcHJldmVudCByZS1pbml0aWFsaXppbmcgRGF0ZSBvYmplY3RzIGluIG9yZGVyIHRvIGltcHJvdmUgcGVyZm9ybWFuY2VcclxuICAgICAgICAgICAgICBldmVudHM6IFtcclxuICAgICAgICAgICAgICAgIC4uLihwcmV2LmV2ZW50cyA/IHByZXYuZXZlbnRzIDogW10pLFxyXG4gICAgICAgICAgICAgICAgLi4uKHR5cGVvZiBldmVudHMuQ2FsZW5kYXJMaXN0aW5nWzBdLkV2ZW50TGlzdHNbMF0gIT09ICdzdHJpbmcnXHJcbiAgICAgICAgICAgICAgICAgID8gKGV2ZW50cy5DYWxlbmRhckxpc3RpbmdbMF0uRXZlbnRMaXN0c1swXS5FdmVudExpc3QubWFwKChldmVudCkgPT4ge1xyXG4gICAgICAgICAgICAgICAgICAgICAgc3dpdGNoIChldmVudFsnQF9EYXlUeXBlJ11bMF0pIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgY2FzZSBFdmVudFR5cGUuQVNTSUdOTUVOVDoge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IGFzc2lnbm1lbnRFdmVudCA9IGV2ZW50IGFzIEFzc2lnbm1lbnRFdmVudFhNTE9iamVjdDtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4ge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdGl0bGU6IGRlY29kZVVSSShhc3NpZ25tZW50RXZlbnRbJ0BfVGl0bGUnXVswXSksXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBhZGRMaW5rRGF0YTogYXNzaWdubWVudEV2ZW50WydAX0FkZExpbmtEYXRhJ11bMF0sXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBhZ3U6IGFzc2lnbm1lbnRFdmVudFsnQF9BR1UnXSA/IGFzc2lnbm1lbnRFdmVudFsnQF9BR1UnXVswXSA6IHVuZGVmaW5lZCxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGRhdGU6IG5ldyBEYXRlKGFzc2lnbm1lbnRFdmVudFsnQF9EYXRlJ11bMF0pLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZGd1OiBhc3NpZ25tZW50RXZlbnRbJ0BfREdVJ11bMF0sXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBsaW5rOiBhc3NpZ25tZW50RXZlbnRbJ0BfTGluayddWzBdLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgc3RhcnRUaW1lOiBhc3NpZ25tZW50RXZlbnRbJ0BfU3RhcnRUaW1lJ11bMF0sXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0eXBlOiBFdmVudFR5cGUuQVNTSUdOTUVOVCxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHZpZXdUeXBlOiBhc3NpZ25tZW50RXZlbnRbJ0BfVmlld1R5cGUnXVswXSxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICB9IGFzIEFzc2lnbm1lbnRFdmVudDtcclxuICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgICAgICBjYXNlIEV2ZW50VHlwZS5IT0xJREFZOiB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRpdGxlOiBkZWNvZGVVUkkoZXZlbnRbJ0BfVGl0bGUnXVswXSksXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0eXBlOiBFdmVudFR5cGUuSE9MSURBWSxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHN0YXJ0VGltZTogZXZlbnRbJ0BfU3RhcnRUaW1lJ11bMF0sXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBkYXRlOiBuZXcgRGF0ZShldmVudFsnQF9EYXRlJ11bMF0pLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgIH0gYXMgSG9saWRheUV2ZW50O1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGNhc2UgRXZlbnRUeXBlLlJFR1VMQVI6IHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICBjb25zdCByZWd1bGFyRXZlbnQgPSBldmVudCBhcyBSZWd1bGFyRXZlbnRYTUxPYmplY3Q7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRpdGxlOiBkZWNvZGVVUkkocmVndWxhckV2ZW50WydAX1RpdGxlJ11bMF0pLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgYWd1OiByZWd1bGFyRXZlbnRbJ0BfQUdVJ10gPyByZWd1bGFyRXZlbnRbJ0BfQUdVJ11bMF0gOiB1bmRlZmluZWQsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBkYXRlOiBuZXcgRGF0ZShyZWd1bGFyRXZlbnRbJ0BfRGF0ZSddWzBdKSxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGRlc2NyaXB0aW9uOiByZWd1bGFyRXZlbnRbJ0BfRXZ0RGVzY3JpcHRpb24nXVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICA/IHJlZ3VsYXJFdmVudFsnQF9FdnREZXNjcmlwdGlvbiddWzBdXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDogdW5kZWZpbmVkLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZGd1OiByZWd1bGFyRXZlbnRbJ0BfREdVJ10gPyByZWd1bGFyRXZlbnRbJ0BfREdVJ11bMF0gOiB1bmRlZmluZWQsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBsaW5rOiByZWd1bGFyRXZlbnRbJ0BfTGluayddID8gcmVndWxhckV2ZW50WydAX0xpbmsnXVswXSA6IHVuZGVmaW5lZCxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHN0YXJ0VGltZTogcmVndWxhckV2ZW50WydAX1N0YXJ0VGltZSddWzBdLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdHlwZTogRXZlbnRUeXBlLlJFR1VMQVIsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB2aWV3VHlwZTogcmVndWxhckV2ZW50WydAX1ZpZXdUeXBlJ10gPyByZWd1bGFyRXZlbnRbJ0BfVmlld1R5cGUnXVswXSA6IHVuZGVmaW5lZCxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGFkZExpbmtEYXRhOiByZWd1bGFyRXZlbnRbJ0BfQWRkTGlua0RhdGEnXSA/IHJlZ3VsYXJFdmVudFsnQF9BZGRMaW5rRGF0YSddWzBdIDogdW5kZWZpbmVkLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgIH0gYXMgUmVndWxhckV2ZW50O1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgfSkgYXMgRXZlbnRbXSlcclxuICAgICAgICAgICAgICAgICAgOiBbXSksXHJcbiAgICAgICAgICAgICAgXSBhcyBFdmVudFtdLFxyXG4gICAgICAgICAgICB9O1xyXG5cclxuICAgICAgICAgICAgcmV0dXJuIHJlc3Q7XHJcbiAgICAgICAgICB9LCB7fSBhcyBDYWxlbmRhcik7XHJcbiAgICAgICAgICByZXMoeyAuLi5hbGxFdmVudHMsIGV2ZW50czogXy51bmlxQnkoYWxsRXZlbnRzLmV2ZW50cywgKGl0ZW06IHsgdGl0bGU6IGFueTsgfSkgPT4gaXRlbS50aXRsZSkgfSBhcyBDYWxlbmRhcik7XHJcbiAgICAgICAgfSlcclxuICAgICAgICAuY2F0Y2gocmVqKTtcclxuICAgIH0pO1xyXG4gIH1cclxufVxyXG4iXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztFQWtFZSxNQUFNQSxNQUFNLFNBQVNDLGFBQUksQ0FBQ0QsTUFBTSxDQUFDO0lBRTlDRSxXQUFXLENBQUNDLFdBQTZCLEVBQUVDLFFBQWUsRUFBQ0MsT0FBZSxFQUFFO01BQzFFLEtBQUssQ0FBQ0YsV0FBVyxFQUFDQyxRQUFRLENBQUM7TUFDM0IsSUFBSSxDQUFDQyxPQUFPLEdBQUdBLE9BQU87SUFDeEI7O0lBRUE7QUFDRjtBQUNBO0lBQ1NDLG1CQUFtQixHQUFrQjtNQUMxQyxPQUFPLElBQUlDLE9BQU8sQ0FBQyxDQUFDQyxHQUFHLEVBQUVDLEdBQUcsS0FBSztRQUMvQixLQUFLLENBQ0ZDLGNBQWMsQ0FBcUI7VUFBRUMsY0FBYyxFQUFFLEtBQUs7VUFBRUMsVUFBVSxFQUFFO1FBQU0sQ0FBQyxDQUFDLENBQ2hGQyxJQUFJLENBQUVDLFFBQVEsSUFBSztVQUNsQixJQUFJQSxRQUFRLENBQUNDLFFBQVEsQ0FBQyxDQUFDLENBQUMsQ0FBQyxpQkFBaUIsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDQyxR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