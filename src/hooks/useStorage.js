/**
 * Upload a single file to Cloudinary using secure signed uploads
 * @param {File} file - The file to upload
 * @param {string} path - Folder path prefix on Cloudinary (e.g., 'properties', 'banners')
 * @param {function} onProgress - Optional progress callback (0-100)
 * @returns {Promise<string>} Secure download URL
 */
export const uploadFile = async (file, path = 'uploads', onProgress = null) => {
  const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
  const apiKey = import.meta.env.VITE_CLOUDINARY_API_KEY;
  const apiSecret = import.meta.env.VITE_CLOUDINARY_API_SECRET;

  if (!cloudName || !apiKey || !apiSecret) {
    throw new Error('Cloudinary configuration is missing in environment variables.');
  }

  const timestamp = Math.round(new Date().getTime() / 1000);

  // Parameter signature requires sorting parameters alphabetically.
  // 'folder' comes before 'timestamp' alphabetically.
  const stringToSign = `folder=${path}&timestamp=${timestamp}${apiSecret}`;

  // Generate SHA-1 hash using the browser's Web Crypto API
  const utf8 = new TextEncoder().encode(stringToSign);
  const hashBuffer = await crypto.subtle.digest('SHA-1', utf8);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const signature = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

  const formData = new FormData();
  formData.append('file', file);
  formData.append('api_key', apiKey);
  formData.append('timestamp', timestamp);
  formData.append('folder', path);
  formData.append('signature', signature);

  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open('POST', `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, true);

    if (onProgress) {
      xhr.upload.onprogress = (event) => {
        if (event.lengthComputable) {
          const percentComplete = Math.round((event.loaded / event.total) * 100);
          onProgress(percentComplete);
        }
      };
    }

    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          const response = JSON.parse(xhr.responseText);
          resolve(response.secure_url);
        } catch (err) {
          reject(new Error('Failed to parse Cloudinary response'));
        }
      } else {
        try {
          const errResponse = JSON.parse(xhr.responseText);
          reject(new Error(errResponse.error?.message || 'Upload failed'));
        } catch {
          reject(new Error(`Upload failed with status ${xhr.status}`));
        }
      }
    };

    xhr.onerror = () => {
      reject(new Error('Network error during Cloudinary upload'));
    };

    xhr.send(formData);
  });
};

/**
 * Upload multiple files to Cloudinary
 * @param {File[]} files - Array of files
 * @param {string} path - Folder path prefix on Cloudinary
 * @param {function} onProgress - Optional overall progress callback
 * @returns {Promise<string[]>} Array of secure download URLs
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
 * Mock delete function for backward compatibility
 */
export const deleteFile = async (url) => {
  console.log('Delete file called (no-op on Cloudinary client side):', url);
};
