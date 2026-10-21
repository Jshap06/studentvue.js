import { LoginCredentials } from '../../utils/soap/Client/Client.interfaces';
import File from '../File/File';
import { DocumentFile } from './Document.interfaces';
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
    readonly file: {
        name: string;
        date: Date;
        type: string;
    };
    readonly comment: string;
    /**
     * Parses either REST's `GetStudentDocumentContent` response
     * (`data.studentAttachedDocumentData.documentDatas[]`, confirmed against a real sample) or the
     * SOAP `GetContentOfAttachedDoc` XML (`DocumentFileXMLObject`), depending on which transport
     * `get()` ended up using - see `utils/fallback`.
     */
    protected parseXMLObject(json: any): DocumentFile[];
    constructor(doc: StudentDocumentDataJSON, credentials: LoginCredentials, api?: ApiType);
}
