export declare interface DocumentXMLObject {
  StudentDocuments: Array<{
    '@_showDateColumn': string[];
    '@_showDocNameColumn': string[];
    '@_StudentGU': string[];
    '@_StudentSSY': string[];
    StudentDocumentDatas: Array<
      | {
          StudentDocumentData: Array<{
            '@_DocumentGU': string[];
            '@_DocumentFileName': string[];
            '@_DocumentDate': string[];
            '@_DocumentType': string[];
            '@_StudentGU': string[];
            '@_DocumentComment': string[];
          }>;
        }
      | string
    >;
  }>;
}


export declare interface DocumentFileXMLObject {
  StudentAttachedDocumentData: [
    {
      DocumentCategoryLookups: [''];
      DocumentDatas: [
        {
          DocumentData: {
            '@_DocumentGU': [string];
            '@_StudentGU': [string];
            '@_DocDate': [string];
            '@_FileName': [string];
            '@_Category': [string];
            '@_Notes': [string];
            '@_DocType': [string];
            Base64Code: [string];
          }[];
        }
      ];
    }
  ];
}
