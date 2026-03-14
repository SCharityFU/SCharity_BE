import multer from 'multer';
import { BadRequestError } from '../utils/errors';

const ALLOWED_IMAGE_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif']);
const ALLOWED_DOC_TYPES = new Set(['application/pdf', ...ALLOWED_IMAGE_TYPES]);
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

const storage = multer.memoryStorage();

const imageFileFilter = (
  _req: Express.Request,
  file: Express.Multer.File,
  callback: multer.FileFilterCallback,
) => {
  if (ALLOWED_IMAGE_TYPES.has(file.mimetype)) {
    callback(null, true);
  } else {
    callback(new BadRequestError('Only image files are allowed (JPEG, PNG, WEBP, GIF)'));
  }
};

const docFileFilter = (
  _req: Express.Request,
  file: Express.Multer.File,
  callback: multer.FileFilterCallback,
) => {
  if (ALLOWED_DOC_TYPES.has(file.mimetype)) {
    callback(null, true);
  } else {
    callback(new BadRequestError('Only image and PDF files are allowed'));
  }
};

export const uploadImage = multer({
  storage,
  limits: { fileSize: MAX_FILE_SIZE },
  fileFilter: imageFileFilter,
}).single('avatar');

export const uploadThumbnail = multer({
  storage,
  limits: { fileSize: MAX_FILE_SIZE },
  fileFilter: imageFileFilter,
}).single('thumbnail');

export const uploadDocument = multer({
  storage,
  limits: { fileSize: MAX_FILE_SIZE },
  fileFilter: docFileFilter,
}).single('document');

export const uploadMultiple = multer({
  storage,
  limits: { fileSize: MAX_FILE_SIZE, files: 10 },
  fileFilter: imageFileFilter,
}).any();

export const uploadCampaignFiles = multer({
  storage,
  limits: { fileSize: MAX_FILE_SIZE, files: 12 },
  fileFilter: (_req, file, callback) => {
    if (file.fieldname === 'proofDocuments') {
      if (ALLOWED_DOC_TYPES.has(file.mimetype)) {
        callback(null, true);
      } else {
        callback(new BadRequestError('Only image and PDF files are allowed for proof documents'));
      }
    } else if (ALLOWED_IMAGE_TYPES.has(file.mimetype)) {
      callback(null, true);
    } else {
      callback(new BadRequestError('Only image files are allowed (JPEG, PNG, WEBP, GIF)'));
    }
  },
}).fields([
  { name: 'thumbnail', maxCount: 1 },
  { name: 'media', maxCount: 10 },
  { name: 'proofDocuments', maxCount: 10 },
]);

export const uploadEvidence = multer({
  storage,
  limits: { fileSize: MAX_FILE_SIZE, files: 5 },
  fileFilter: imageFileFilter,
}).array('evidence', 5);
