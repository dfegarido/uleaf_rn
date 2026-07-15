import { Alert, Linking, PermissionsAndroid, Platform } from 'react-native';
import { CameraRoll } from '@react-native-camera-roll/camera-roll';
import RNFS from 'react-native-fs';
import Share from 'react-native-share';

const GALLERY_ALBUM = 'ileafU Labels';

function sanitizeFilenamePart(value, fallback) {
  const cleaned = String(value || fallback).replace(/[^\w.-]+/g, '_');
  return cleaned || String(fallback);
}

function toFileUri(absolutePath) {
  const path = String(absolutePath || '');
  if (!path) return path;
  if (path.startsWith('file://')) return path;
  return `file://${path}`;
}

/**
 * Android 10+ saves via MediaStore and does not need READ_MEDIA_* permission.
 * Only older Android versions need WRITE_EXTERNAL_STORAGE.
 */
async function requestGallerySavePermission() {
  if (Platform.OS !== 'android') {
    return true;
  }

  // Scoped storage: MediaStore insert works without storage permissions.
  if (typeof Platform.Version === 'number' && Platform.Version >= 29) {
    return true;
  }

  const granted = await PermissionsAndroid.request(
    PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE,
    {
      title: 'Storage access',
      message: 'Allow access so label images can be saved to your gallery.',
      buttonNeutral: 'Ask later',
      buttonNegative: 'Cancel',
      buttonPositive: 'Allow',
    },
  );
  return granted === PermissionsAndroid.RESULTS.GRANTED;
}

function isMissingNativeModuleError(error) {
  const message = String(error?.message || error || '').toLowerCase();
  return (
    message.includes('rnccameraroll') ||
    message.includes('cameraroll') ||
    message.includes('native module') ||
    message.includes('turbomodule') ||
    message.includes('invariant violation')
  );
}

/**
 * Share generated thermal label PNGs via the system share sheet.
 */
export async function shareThermalLabels(labels = []) {
  const items = (labels || []).filter((label) => label?.base64);
  if (!items.length) {
    Alert.alert('Share labels', 'No label images to share.');
    return { ok: false };
  }

  const timestamp = Date.now();
  const tempDir = `${RNFS.CachesDirectoryPath}/qr-labels-${timestamp}`;
  await RNFS.mkdir(tempDir);

  try {
    const filePaths = [];
    for (let index = 0; index < items.length; index += 1) {
      const label = items[index];
      const filename = `label-${sanitizeFilenamePart(label.plantCode, index + 1)}.png`;
      const filepath = `${tempDir}/${filename}`;
      await RNFS.writeFile(filepath, label.base64, 'base64');
      filePaths.push(toFileUri(filepath));
    }

    await Share.open({
      urls: filePaths,
      type: 'image/png',
      title: 'QR Labels',
      message: `${items.length} QR label(s) — save to Files, Photos, or Downloads`,
      failOnCancel: false,
    });

    return { ok: true, count: items.length };
  } catch (error) {
    if (error?.message !== 'User did not share') {
      Alert.alert('Share labels', error?.message || 'Failed to share labels.');
    }
    return { ok: false };
  } finally {
    try {
      await RNFS.unlink(tempDir);
    } catch (_) {
      // Cache cleanup is best-effort.
    }
  }
}

/**
 * Save generated thermal label PNGs to the device photo gallery.
 */
export async function saveThermalLabelsToGallery(labels = []) {
  const items = (labels || []).filter((label) => label?.base64);
  if (!items.length) {
    Alert.alert('Save to Gallery', 'No label images to save.');
    return { ok: false };
  }

  const hasPermission = await requestGallerySavePermission();
  if (!hasPermission) {
    Alert.alert(
      'Permission needed',
      'Storage access is required to save label images on this Android version.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Open Settings', onPress: () => Linking.openSettings() },
      ],
    );
    return { ok: false };
  }

  const timestamp = Date.now();
  const tempDir = `${RNFS.CachesDirectoryPath}/qr-labels-gallery-${timestamp}`;
  await RNFS.mkdir(tempDir);

  let saved = 0;
  let firstError = null;

  try {
    for (let index = 0; index < items.length; index += 1) {
      const label = items[index];
      const filename = `label-${sanitizeFilenamePart(label.plantCode, index + 1)}.png`;
      const filepath = `${tempDir}/${filename}`;
      await RNFS.writeFile(filepath, label.base64, 'base64');

      const fileUri = toFileUri(filepath);
      try {
        await CameraRoll.saveAsset(fileUri, {
          type: 'photo',
          album: GALLERY_ALBUM,
        });
        saved += 1;
      } catch (saveError) {
        // Retry once without album (some devices reject custom album create).
        try {
          await CameraRoll.saveAsset(fileUri, { type: 'photo' });
          saved += 1;
        } catch (retryError) {
          firstError = retryError || saveError;
          console.warn('saveThermalLabelsToGallery item failed:', retryError?.message || retryError);
        }
      }
    }

    if (saved > 0) {
      Alert.alert(
        'Saved to Gallery',
        saved === items.length
          ? `${saved} label image${saved === 1 ? '' : 's'} saved to Photos (album: ${GALLERY_ALBUM}).`
          : `Saved ${saved} of ${items.length} labels. Check Photos for the ileafU Labels album.`,
      );
      return { ok: true, saved };
    }

    if (isMissingNativeModuleError(firstError)) {
      Alert.alert(
        'Rebuild required',
        'Save to Gallery needs a native rebuild after adding the photo library package.\n\n' +
          'Run a full app rebuild (not just Metro reload), then try again.\n\n' +
          'Meanwhile you can use Share and choose Save Image / Photos.',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Share instead',
            onPress: () => {
              shareThermalLabels(items);
            },
          },
        ],
      );
      return { ok: false, saved: 0 };
    }

    Alert.alert(
      'Save to Gallery',
      firstError?.message ||
        'Could not save labels to Photos. Try Share and choose Save Image.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Share instead',
          onPress: () => {
            shareThermalLabels(items);
          },
        },
      ],
    );
    return { ok: false, saved: 0 };
  } catch (error) {
    if (isMissingNativeModuleError(error)) {
      Alert.alert(
        'Rebuild required',
        'Save to Gallery needs a native rebuild (camera-roll package). Reload is not enough.\n\nUse Share → Save Image as a workaround.',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Share instead',
            onPress: () => {
              shareThermalLabels(items);
            },
          },
        ],
      );
      return { ok: false, saved: 0 };
    }

    Alert.alert('Save to Gallery', error?.message || 'Failed to save labels to gallery.');
    return { ok: false, saved };
  } finally {
    try {
      await RNFS.unlink(tempDir);
    } catch (_) {
      // Cache cleanup is best-effort.
    }
  }
}
