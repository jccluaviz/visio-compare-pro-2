
export enum ComparisonMode {
  SLIDER = 'SLIDER',
  SIDE_BY_SIDE = 'SIDE_BY_SIDE',
  OVERLAY = 'OVERLAY',
  DIFFERENCE = 'DIFFERENCE',
  BLINK = 'BLINK',       // Novedoso
  LOUPE = 'LOUPE',       // Útil
  ELA = 'ELA',           // Único (Forense)
}

export interface ExifData {
  make?: string;
  model?: string;
  dateTimeOriginal?: Date;
  exposureTime?: number;
  fNumber?: number;
  iso?: number;
  focalLength?: number;
  lensModel?: string;
  latitude?: number;
  longitude?: number;
  software?: string;
}

export interface ImageData {
  id: string;
  file: File;
  url: string;
  width: number;
  height: number;
  aspectRatio: number;
  type: string;
  size: number;
  lastModified: number;
  exif?: ExifData;
}
