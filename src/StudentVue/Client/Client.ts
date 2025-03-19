import { LoginCredentials, ParsedRequestError } from '../../utils/soap/Client/Client.interfaces';
import soap from '../../utils/soap/soap';
import { AdditionalInfo, ClassScheduleInfo, SchoolInfo, StudentInfo, Schedule, Attendance, Gradebook } from './Client.interfaces';
import Message from '../Message/Message';
import ReportCard from '../ReportCard/ReportCard';
import Document from '../Document/Document';
import RequestException from '../RequestException/RequestException';
import XMLFactory from '../../utils/XMLFactory/XMLFactory';
import cache from '../../utils/cache/cache';
import { optional, asyncPoolAll } from './Client.helpers';
import he from "he";
import _ from 'lodash';
import { parse, eachMonthOfInterval } from 'date-fns';

// Utility function for safe attribute access
function safeGet(obj:any, path:any, defaultValue:any = undefined) {
  return path.reduce((acc:any, key:any) => (acc && acc[key] ? acc[key][0] : defaultValue), obj);
}

// Safe array conversion to handle cases where API returns single objects
function ensureArray(value:any) {
  return Array.isArray(value) ? value : value ? [value] : [];
}

export default class Client extends soap.Client {
  private hostUrl: string;
  constructor(credentials: LoginCredentials, hostUrl: string) {
    super(credentials);
    this.hostUrl = hostUrl;
  }

  /**
   * Validates the user's credentials. Always returns a response.
   */
  public validateCredentials(): Promise<boolean> {
    return super.processRequest<ParsedRequestError>({ methodName: 'ValidateLogin' })
      .then(response => {
        const errorMessage = safeGet(response, ['RT_ERROR', '@_ERROR_MESSAGE'], '');
        return !errorMessage.includes("A critical error has occurred");
      })
      .catch(() => false);
  }

  /**
   * Fetches student documents. Returns an empty array on failure.
   */
  public documents(): Promise<Document[]> {
    return super.processRequest({ methodName: 'GetStudentDocumentInitialData', paramStr: { childIntId: 0 } })
      .then(xmlObject => ensureArray(safeGet(xmlObject, ['StudentDocuments', 'StudentDocumentDatas', 'StudentDocumentData'], []))
        .map(xml => new Document(xml, super.credentials)))
      .catch(() => []);
  }

  /**
   * Fetches report cards. Returns an empty array on failure.
   */
  public reportCards(): Promise<ReportCard[]> {
    return super.processRequest({ methodName: 'GetReportCardInitialData', paramStr: { childIntId: 0 } })
      .then(xmlObject => ensureArray(safeGet(xmlObject, ['RCReportingPeriodData', 'RCReportingPeriods', 'RCReportingPeriod'], []))
        .map(xml => new ReportCard(xml, super.credentials)))
      .catch(() => []);
  }

  /**
   * Fetches school info. Returns default values if unavailable.
   */
  public schoolInfo(): Promise<SchoolInfo> {
    //@ts-ignore
    return super.processRequest({ methodName: 'StudentSchoolInfo', paramStr: { childIntID: 0 } })
      .then(result => {
        const xmlObject = safeGet(result, ['StudentSchoolInfoListing'], {});
        return {
          school: {
            address: safeGet(xmlObject, ['@_SchoolAddress'], 'Unknown'),
            city: safeGet(xmlObject, ['@_SchoolCity'], 'Unknown'),
            zipCode: safeGet(xmlObject, ['@_SchoolZip'], 'Unknown'),
            phone: safeGet(xmlObject, ['@_Phone'], 'Unknown'),
            principal: {
              name: safeGet(xmlObject, ['@_Principal'], 'Unknown'),
              email: safeGet(xmlObject, ['@_PrincipalEmail'], 'Unknown')
            }
          },
          staff: ensureArray(safeGet(xmlObject, ['StaffLists', 'StaffList'], []))
            .map(staff => ({
              name: safeGet(staff, ['@_Name'], 'Unknown'),
              email: safeGet(staff, ['@_EMail'], 'Unknown'),
              jobTitle: safeGet(staff, ['@_Title'], 'Unknown')
            }))
        };
      })
      .catch(() => ({
        school: { address: 'Unknown', city: 'Unknown', zipCode: 'Unknown', phone: 'Unknown', principal: { name: 'Unknown', email: 'Unknown' } },
        staff: []
      }));
  }

  /**
   * Fetches student schedule. Returns a default structure if unavailable.
   */
  public schedule(termIndex?: number): Promise<Schedule> {
        //@ts-ignore
    return super.processRequest({ methodName: 'StudentClassList', paramStr: { childIntId: 0, ...(termIndex != null ? { TermIndex: termIndex } : {}) } })
      .then(xmlObject => ({
        term: {
          index: Number(safeGet(xmlObject, ['StudentClassSchedule', '@_TermIndex'], 0)),
          name: safeGet(xmlObject, ['StudentClassSchedule', '@_TermIndexName'], 'Unknown')
        },
        classes: ensureArray(safeGet(xmlObject, ['StudentClassSchedule', 'ClassLists', 'ClassListing'], []))
          .map(studentClass => ({
            name: safeGet(studentClass, ['@_CourseTitle'], 'Unknown'),
            period: Number(safeGet(studentClass, ['@_Period'], 0)),
            room: safeGet(studentClass, ['@_RoomName'], 'Unknown'),
            teacher: {
              name: safeGet(studentClass, ['@_Teacher'], 'Unknown'),
              email: safeGet(studentClass, ['@_TeacherEmail'], 'Unknown')
            }
          }))
      }))
      .catch(() => ({
        term: { index: 0, name: 'Unknown' },
        classes: []
      }));
  }

  /**
   * Fetches student messages. Returns an empty array on failure.
   */
  public messages(): Promise<Message[]> {
    return super.processRequest({ methodName: 'GetPXPMessages', paramStr: { childIntId: 0 } })
      .then(xmlObject => ensureArray(safeGet(xmlObject, ['PXPMessagesData', 'MessageListings', 'MessageListing'], []))
        .map(message => new Message(message, super.credentials, this.hostUrl)))
      .catch(() => []);
  }
}
