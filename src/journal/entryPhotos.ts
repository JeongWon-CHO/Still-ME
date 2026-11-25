export type EntryPhoto = {
  id: string;
  base64: string;
  width: number;
  height: number;
};

export const MAX_ENTRY_PHOTOS = 3;
export const MAX_PHOTO_BASE64_LENGTH = 4 * Math.ceil((800 * 1024) / 3);
export const emptyPhotos: EntryPhoto[] = [];

export function photoSource(photo: EntryPhoto) {
  return { uri: 'data:image/jpeg;base64,' + photo.base64 };
}
