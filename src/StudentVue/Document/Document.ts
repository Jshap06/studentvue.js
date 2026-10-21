import { LoginCredentials } from '../../utils/soap/Client/Client.interfaces';
import File from '../File/File';
import { DocumentFile } from './Document.interfaces';
import { parse as dateParse } from "date-fns";
import { DocumentFileXMLObject } from './Document.xml';
import { ApiType } from '../../utils/fallback/fallback';

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
   * Parses either REST's `GetStudentDocumentContent` response
   * (`data.studentAttachedDocumentData.documentDatas[]`, confirmed against a real sample) or the
   * SOAP `GetContentOfAttachedDoc` XML (`DocumentFileXMLObject`), depending on which transport
   * `get()` ended up using - see `utils/fallback`.
   */
  protected parseXMLObject(json: any): DocumentFile[] {
    if (json?.StudentAttachedDocumentData != null) {
      return (json as DocumentFileXMLObject).StudentAttachedDocumentData[0].DocumentDatas[0].DocumentData.map(
        (document) => ({
          file: {
            name: document['@_FileName'][0],
            type: document['@_DocType'][0],
            date: new Date(document['@_DocDate'][0]),
          },
          category: document['@_Category'][0],
          notes: document['@_Notes'][0],
          base64: document.Base64Code[0],
        })
      );
    }
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

  public constructor(doc: StudentDocumentDataJSON, credentials: LoginCredentials, api: ApiType = 'rest') {
    super(credentials, doc.documentGU, 'GetContentOfAttachedDoc', 'GetStudentDocumentContent', api);

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
