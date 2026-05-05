const cloudinary = require('cloudinary').v2;

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key:    process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

/**
 * Upload a base64 data URI or a file buffer to Cloudinary.
 * Returns the secure URL.
 * Falls back to storing the base64 locally if Cloudinary is not configured.
 *
 * @param {string} dataUri  - base64 data URI (e.g. data:application/pdf;base64,...)
 * @param {string} folder   - Cloudinary folder name
 * @returns {{ url: string, publicId: string }}
 */
const uploadProof = async (dataUri, folder = 'fee-proofs') => {
  if (!process.env.CLOUDINARY_CLOUD_NAME) {
    // No Cloudinary configured — return the base64 as-is (dev mode)
    console.warn('[Cloudinary] Not configured — storing proof as base64 (dev mode)');
    return { url: dataUri, publicId: null };
  }

  const result = await cloudinary.uploader.upload(dataUri, {
    folder,
    resource_type: 'auto',   // handles PDF, images, etc.
    allowed_formats: ['pdf', 'jpg', 'jpeg', 'png'],
  });

  return { url: result.secure_url, publicId: result.public_id };
};

/**
 * Delete a file from Cloudinary by its public ID.
 */
const deleteProof = async (publicId) => {
  if (!publicId || !process.env.CLOUDINARY_CLOUD_NAME) return;
  await cloudinary.uploader.destroy(publicId, { resource_type: 'auto' });
};

module.exports = { uploadProof, deleteProof };
