const cloudinary = require('cloudinary').v2;

// 1. Configure Cloudinary with inline credentials
cloudinary.config({
  cloud_name: 'dkyqilr3j',
  api_key: '181437571479618',
  api_secret: 'HkSEkgxRo583tlKTaNGeaVt--dQ',
  secure: true
});

async function run() {
  try {
    console.log('Uploading image...');
    // 2. Upload sample image from res.cloudinary.com/demo/
    const sampleImageUrl = 'https://res.cloudinary.com/demo/image/upload/couple.jpg';
    const uploadResult = await cloudinary.uploader.upload(sampleImageUrl, {
      public_id: 'sample_onboarding_couple'
    });

    console.log('Upload successful!');
    console.log('Secure URL:', uploadResult.secure_url);
    console.log('Public ID:', uploadResult.public_id);

    // 3. Get image details (metadata from the upload result directly)
    console.log('\nImage Details:');
    console.log(`Width: ${uploadResult.width}px`);
    console.log(`Height: ${uploadResult.height}px`);
    console.log(`Format: ${uploadResult.format}`);
    console.log(`File Size: ${uploadResult.bytes} bytes`);

    // 4. Transform the image
    const transformedUrl = cloudinary.url(uploadResult.public_id, {
      // f_auto: Automatically selects the best format (WebP, AVIF, etc.) depending on the browser
      fetch_format: 'auto',
      // q_auto: Automatically optimizes image quality for file size and visual quality
      quality: 'auto',
      secure: true
    });

    console.log('\nDone! Click link below to see optimized version of the image. Check the size and the format.');
    console.log(transformedUrl);

  } catch (error) {
    console.error('Error during Cloudinary operations:', error);
  }
}

run();
