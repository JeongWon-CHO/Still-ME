import { randomUUID } from 'expo-crypto';
import { File, Paths } from 'expo-file-system';
import { ImageManipulator, SaveFormat } from 'expo-image-manipulator';
import { launchImageLibraryAsync } from 'expo-image-picker';
import { MAX_PHOTO_BASE64_LENGTH, type EntryPhoto } from './entryPhotos';

const MAX_DIMENSION = 1600;

function removeCachedImage(uri: string) {
  const cachePrefix = Paths.cache.uri.replace(/\/?$/, '/');
  if (!uri.startsWith(cachePrefix)) return;
  try {
    new File(uri).delete();
  } catch {
    // The OS can also clear these temporary files from the app cache.
  }
}

async function preparePhoto(uri: string): Promise<EntryPhoto> {
  const context = ImageManipulator.manipulate(uri, {
    maxWidth: MAX_DIMENSION,
    maxHeight: MAX_DIMENSION,
  });
  try {
    const image = await context.renderAsync();
    try {
      for (const compress of [0.82, 0.6, 0.4]) {
        const result = await image.saveAsync({
          format: SaveFormat.JPEG,
          compress,
          base64: true,
        });
        removeCachedImage(result.uri);
        if (result.base64 && result.base64.length <= MAX_PHOTO_BASE64_LENGTH) {
          return {
            id: randomUUID(),
            base64: result.base64,
            width: result.width,
            height: result.height,
          };
        }
      }
      throw new Error('Image exceeds the storage limit');
    } finally {
      image.release();
    }
  } finally {
    context.release();
  }
}

export async function pickEntryPhotos(limit: number): Promise<EntryPhoto[]> {
  const result = await launchImageLibraryAsync({
    mediaTypes: ['images'],
    allowsMultipleSelection: true,
    orderedSelection: true,
    selectionLimit: limit,
  });
  if (result.canceled) return [];

  const photos: EntryPhoto[] = [];
  try {
    for (const asset of result.assets.slice(0, limit)) {
      photos.push(await preparePhoto(asset.uri));
    }
    return photos;
  } finally {
    for (const asset of result.assets) removeCachedImage(asset.uri);
  }
}
