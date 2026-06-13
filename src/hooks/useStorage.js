import { ref, uploadBytesResumable, getDownloadURL, deleteObject } from 'firebase/storage';
import { storage } from '../firebase/config';

/**
 * Upload a single file to Firebase Storage
 * @param {File} file - The file to upload
 * @param {string} path - Storage path prefix (e.g., 'properties', 'banners')
 * @param {function} onProgress - Optional progress callback (0-100)
 * @returns {Promise<string>} Download URL
 */
export const uploadFile = (file, path = 'uploads', onProgress = null) => {
  return new Promise((resolve, reject) => {
    const fileName = `${Date.now()}_${file.name.replace(/\s+/g, '_')}`;
    const storageRef = ref(storage, `${path}/${fileName}`);
    const uploadTask = uploadBytesResumable(storageRef, file);

    uploadTask.on(
      'state_changed',
      (snapshot) => {
        const progress = Math.round((snapshot.bytesTransferred / snapshot.totalBytes) * 100);
        if (onProgress) onProgress(progress);
      },
      (error) => reject(error),
      async () => {
        try {
          const url = await getDownloadURL(uploadTask.snapshot.ref);
          resolve(url);
        } catch (err) {
          reject(err);
        }
      }
    );
  });
};

/**
 * Upload multiple files to Firebase Storage
 * @param {File[]} files - Array of files
 * @param {string} path - Storage path prefix
 * @param {function} onProgress - Optional overall progress callback
 * @returns {Promise<string[]>} Array of download URLs
 */
export const uploadMultipleFiles = async (files, path = 'uploads', onProgress = null) => {
  const urls = [];
  for (let i = 0; i < files.length; i++) {
    const url = await uploadFile(files[i], path, (progress) => {
      if (onProgress) {
        const overallProgress = Math.round(((i + progress / 100) / files.length) * 100);
        onProgress(overallProgress);
      }
    });
    urls.push(url);
  }
  return urls;
};

/**
 * Delete a file from Firebase Storage by URL
 * @param {string} url - The full download URL of the file
 */
export const deleteFile = async (url) => {
  try {
    const storageRef = ref(storage, url);
    await deleteObject(storageRef);
  } catch (err) {
    console.warn('Could not delete file from storage:', err.message);
  }
};
