export type ImageDimensionsResult = {
  image: HTMLImageElement;
  file: File;
  width: number;
  height: number;
  err?: ErrorEvent;
};

// NOTE: Should return null when file is not an image
export const getImageDimensions = (img: File): Promise<ImageDimensionsResult> => {
  return new Promise((resolve) => {
    const image = new Image();
    image.src = URL.createObjectURL(img);

    image.addEventListener(
      'load',
      () => {
        resolve({
          image,
          file: img,
          width: image.naturalWidth,
          height: image.naturalHeight,
        });
      },
      { once: true },
    );

    image.addEventListener(
      'error',
      (err) => {
        resolve({
          image,
          file: img,
          width: 0,
          height: 0,
          err,
        });
      },
      { once: true },
    );
  });
};

export const canvasToBlob = (
  canvas: HTMLCanvasElement,
  mime?: string,
  quality?: number,
): Promise<Blob | null> => {
  return new Promise((resolve) => {
    canvas.toBlob(resolve, mime, quality);
  });
};

export type ImageConversionResult = {
  dimensions: ImageDimensionsResult;
  canvas: HTMLCanvasElement;
  isNotSupported: boolean;
  blob: Blob | null;
  numIterations: number;
};

export type ImageConversionsOptions = {
  // NOTE: Depends on how client browser is compiled, but most like jpeg, png and webp are supported
  mime?: string;
  quality?: number;

  // NOTE: Size in bytes of desired blob, quality will be "predicted"
  maxSize?: number;

  // NOTE: Step for quality decreasing when `maxSize` is set
  qualityStep?: number;
};

export const convert = async (
  img: File,
  opts?: ImageConversionsOptions,
): Promise<ImageConversionResult> => {
  const canvas = document.createElement('canvas');
  const dims = await getImageDimensions(img);

  if (dims.err != null) {
    return {
      isNotSupported: true,
      dimensions: dims,
      blob: null,
      numIterations: 0,
      canvas,
    };
  }

  canvas.width = dims.width;
  canvas.height = dims.height;

  const ctx = canvas.getContext('2d');
  if (ctx == null) {
    return {
      dimensions: dims,
      canvas,
      isNotSupported: true,
      blob: null,
      numIterations: 0,
    };
  }

  ctx.drawImage(dims.image, 0, 0, dims.width, dims.height);

  if (opts?.maxSize == null) {
    const blob = await canvasToBlob(canvas, opts?.mime || 'image/jpeg', opts?.quality ?? 0.95);

    return {
      dimensions: dims,
      canvas,
      isNotSupported: blob == null,
      blob,
      numIterations: 1,
    };
  }

  let [quality, numIterations] = [opts?.quality ?? 1, 0];
  const qualityStep = opts?.qualityStep ?? 0.05;
  const maxSize = opts?.maxSize || Number.POSITIVE_INFINITY;

  do {
    numIterations += 1;

    const blob = await canvasToBlob(canvas, opts?.mime || 'image/jpeg', quality);

    if (blob == null || blob.size <= maxSize) {
      return {
        dimensions: dims,
        canvas,
        isNotSupported: blob == null,
        blob,
        numIterations,
      };
    }

    quality -= qualityStep;
  } while (quality > 0);

  return {
    dimensions: dims,
    canvas,
    isNotSupported: true,
    blob: null,
    numIterations,
  };
};
