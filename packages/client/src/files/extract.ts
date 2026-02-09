export enum FileReadKind {
  Text = 'text',
  ArrayBuffer = 'array-buffer',
  DataURL = 'data-url',
}

export type FileContentResult<F> = {
  file: F;
  readKind: FileReadKind;
  error?: DOMException | null;
  text?: string;
  arrayBuffer?: ArrayBuffer;
  dataUrl?: string;
};

export const extractFileContent = <F extends File | Blob>(
  f: F,
  kind: FileReadKind = FileReadKind.DataURL,
  encoding?: string,
): Promise<FileContentResult<F>> => {
  const reader = new FileReader();
  const result: FileContentResult<F> = {
    file: f,
    readKind: kind,
  };

  return new Promise((resolve) => {
    reader.addEventListener(
      'load',
      () => {
        switch (kind) {
          case FileReadKind.Text:
            result.text = reader.result as string;
            break;
          case FileReadKind.DataURL:
            result.dataUrl = reader.result as string;
            break;
          case FileReadKind.ArrayBuffer:
            result.arrayBuffer = reader.result as ArrayBuffer;
            break;
          default:
        }

        resolve(result);
      },
      { once: true },
    );

    reader.addEventListener(
      'error',
      () => {
        result.error = reader.error;
      },
      { once: true },
    );

    switch (kind) {
      case FileReadKind.Text:
        reader.readAsText(f, encoding);
        break;
      case FileReadKind.DataURL:
        reader.readAsDataURL(f);
        break;
      case FileReadKind.ArrayBuffer:
        reader.readAsArrayBuffer(f);
        break;
      default:
    }
  });
};
