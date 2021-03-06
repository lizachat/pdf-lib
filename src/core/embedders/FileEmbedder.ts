import PDFString from 'src/core/objects/PDFString';
import PDFHexString from 'src/core/objects/PDFHexString';
import PDFContext from 'src/core/PDFContext';
import PDFRef from 'src/core/objects/PDFRef';


/** 
 * From the ZUGFeRD specification, Supplement-A, section **2.2.2. Data Relationship**.
 * See:
 * * https://www.ferd-net.de/standards/zugferd-versionsarchiv/zugferd-2.1.html
 * * http://www.awv-net.de/updates/zugferd21/zugferd21en.zip
 */
export enum AFRelationship {
  Data = 'Data',
  Source = 'Source',
  Alternative = 'Alternative',
  Supplement = 'Supplement',
  Unspecified = 'Unspecified'
}


export interface EmbeddedFileOptions {
  mimeType?: string;
  description?: string;
  creationDate?: Date;
  modificationDate?: Date;
  afRelationship?: AFRelationship;
}


class FileEmbedder {
  static for(
    bytes: Uint8Array,
    fileName: string,
    options: EmbeddedFileOptions = {},
  ) {
    return new FileEmbedder(bytes, fileName, options);
  }

  private readonly fileData: Uint8Array;
  readonly fileName: string;
  readonly options: EmbeddedFileOptions;

  private constructor(
    fileData: Uint8Array,
    fileName: string,
    options: EmbeddedFileOptions = {},
  ) {
    this.fileData = fileData;
    this.fileName = fileName;
    this.options = options;
  }

  async embedIntoContext(context: PDFContext, ref?: PDFRef): Promise<PDFRef> {
    const {
      mimeType,
      description,
      creationDate,
      modificationDate,
      afRelationship,
    } = this.options;

    console.log(' first');

    const embeddedFileStream = context.flateStream(this.fileData, {
      Type: 'EmbeddedFile',
      Subtype: mimeType ?? undefined,
      Params: {
        Size: this.fileData.length,
        CreationDate: creationDate
          ? PDFString.fromDate(creationDate)
          : undefined,
        ModDate: modificationDate
          ? PDFString.fromDate(modificationDate)
          : undefined,
      },
    });
    console.log(' second');
    const embeddedFileStreamRef = context.register(embeddedFileStream);
    console.log(' third');
    const fileSpecDict = context.obj({
      Type: 'Filespec',
      F: PDFString.of(this.fileName), // TODO: Assert that this is plain ASCII
      UF: PDFHexString.fromText(this.fileName),
      EF: { F: embeddedFileStreamRef },
      Desc: description ? PDFHexString.fromText(description) : undefined,
      AFRelationship: afRelationship ?? AFRelationship.Alternative,
    });
    console.log(' fourth', fileSpecDict);
    if (ref) {
      context.assign(ref, fileSpecDict);
      return ref;
    } else {
      return context.register(fileSpecDict);
    }
  }
}

export default FileEmbedder;
