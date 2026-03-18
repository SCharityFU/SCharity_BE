import { BadRequestError } from './errors';

const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024;

const IMAGE_EXTENSIONS = new Set(['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp', 'svg']);
const IMAGE_MIME_PREFIX = 'image/';
const DOCUMENT_EXTENSIONS = new Set(['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp', 'svg', 'pdf', 'doc', 'docx']);
const DOCUMENT_MIME_TYPES = new Set([
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
]);

const getFileExtension = (fileName: string): string => {
  const idx = fileName.lastIndexOf('.');
  if (idx === -1) return '';
  return fileName.slice(idx + 1).toLowerCase();
};

const assertMaxFileSize = (file: Express.Multer.File, label: string) => {
  if (file.size > MAX_FILE_SIZE_BYTES) {
    throw new BadRequestError(`${label} exceeds 10MB limit`);
  }
};

const assertImageFile = (file: Express.Multer.File, label: string) => {
  const ext = getFileExtension(file.originalname);
  const isImageMime = file.mimetype.startsWith(IMAGE_MIME_PREFIX);
  const isImageExt = IMAGE_EXTENSIONS.has(ext);

  if (!isImageMime || !isImageExt) {
    throw new BadRequestError(`${label} must be a valid image file`);
  }
};

const assertProofDocumentFile = (file: Express.Multer.File, label: string) => {
  const ext = getFileExtension(file.originalname);
  const isImageMime = file.mimetype.startsWith(IMAGE_MIME_PREFIX);
  const isDocumentMime = DOCUMENT_MIME_TYPES.has(file.mimetype);
  const isAllowedExt = DOCUMENT_EXTENSIONS.has(ext);

  if (!isAllowedExt || (!isImageMime && !isDocumentMime)) {
    throw new BadRequestError(`${label} must be an image, PDF, or Word document`);
  }
};

export const validateSubmitRequestFiles = (
  thumbnailFile?: Express.Multer.File,
  mediaFiles: Express.Multer.File[] = [],
  proofFiles: Express.Multer.File[] = [],
) => {
  if (thumbnailFile) {
    assertMaxFileSize(thumbnailFile, 'Thumbnail file');
    assertImageFile(thumbnailFile, 'Thumbnail file');
  }

  for (let i = 0; i < mediaFiles.length; i++) {
    assertMaxFileSize(mediaFiles[i], `Media file #${i + 1}`);
    assertImageFile(mediaFiles[i], `Media file #${i + 1}`);
  }

  for (let i = 0; i < proofFiles.length; i++) {
    assertMaxFileSize(proofFiles[i], `Proof document #${i + 1}`);
    assertProofDocumentFile(proofFiles[i], `Proof document #${i + 1}`);
  }
};
