import { LoginCredentials } from '../../utils/soap/Client/Client.interfaces';
import File from '../File/File';
import { DocumentFile } from './Document.interfaces';
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
    readonly file: {
        name: string;
        date: Date;
        type: string;
    };
    readonly comment: string;
    /**
     * Parses REST's `GetStudentDocumentContent` response
     * (`data.studentAttachedDocumentData.documentDatas[]`), confirmed against a real sample. The
     * SOAP shape this replaced (`DocumentFileXMLObject`) is no longer handled here - there's no
     * fallback, per the same "REST primary, no SOAP fallback" approach used for every other
     * migrated method, since a REST failure should surface as a real error instead of silently
     * falling back to a second, differently-shaped SOAP error.
     */
    protected parseXMLObject(json: any): DocumentFile[];
    constructor(doc: StudentDocumentDataJSON, credentials: LoginCredentials);
}
