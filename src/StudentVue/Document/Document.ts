import { LoginCredentials } from '../../utils/soap/Client/Client.interfaces';
import File from '../File/File';
import { DocumentFile } from './Document.interfaces';
import { parse as dateParse } from "date-fns";

/**
 * The shape of one entry in REST's `GetStudentDocuments` response
 * (`data.studentDocuments.studentDocumentDatas[]`), confirmed against a real sample.
 */
export interface StudentDocumentDataJSON {
  documentGU: string;
  documentFileName: string;
  documentDate: string;
  documentType: string;
  studentGU: string;
  documentComment: string;
}

export default class Document extends File<DocumentFile[]> {
  public readonly file: {
    name: string;
    date: Date;
    type: string;
  };

  public readonly comment: string;

  /**
   * Parses REST's `GetStudentDocumentContent` response
   * (`data.studentAttachedDocumentData.documentDatas[]`), confirmed against a real sample. The
   * SOAP shape this replaced (`DocumentFileXMLObject`) is no longer handled here - there's no
   * fallback, per the same "REST primary, no SOAP fallback" approach used for every other
   * migrated method, since a REST failure should surface as a real error instead of silently
   * falling back to a second, differently-shaped SOAP error.
   */
  protected parseXMLObject(json: any): DocumentFile[] {
    return json.studentAttachedDocumentData.documentDatas.map((document: any) => ({
      file: {
        name: document.fileName,
        type: document.docType,
        date: new Date(document.docDate),
      },
      category: document.category,
      notes: document.notes,
      base64: document.base64Code,
    }));
  }

  public constructor(doc: StudentDocumentDataJSON, credentials: LoginCredentials) {
    super(credentials, doc.documentGU, 'GetContentOfAttachedDoc', 'GetStudentDocumentContent');

    /**
     * The properties of the file
     * @public
     * @readonly
     * @property {string} name The name of the file
     * @property {string} type The file type
     * @property {Date} date The date the file was created
     */
    this.file = {
      name: doc.documentFileName,
      type: doc.documentType,
      date: dateParse(doc.documentDate, "M/dd/yyyy", new Date()),
    };

    /**
     * The comment included in the document
     * @public
     * @readonly
     * @type {string}
     */
    this.comment = doc.documentComment;
  }
}
