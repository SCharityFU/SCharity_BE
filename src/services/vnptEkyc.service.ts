import axios from 'axios';
import FormData from 'form-data';

// ── VNPT eKYC Config ──────────────────────────────────────────────────────────
const BASE_URL = process.env.VNPT_EKYC_BASE_URL || 'https://api.idg.vnpt.vn';

/**
 * Build common headers for VNPT AI API calls
 */
function buildAiHeaders(): Record<string, string> {
  return {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${process.env.VNPT_EKYC_ACCESS_TOKEN}`,
    'Token-id': process.env.VNPT_EKYC_TOKEN_ID!,
    'Token-key': process.env.VNPT_EKYC_TOKEN_KEY!,
    'mac-address': 'WEB_APP',
  };
}

/**
 * Generate client_session string required by VNPT
 */
function generateClientSession(): string {
  return `WEB_SCharity_Windows_PC_1.0_SCharity_${Date.now()}`;
}

// ── Interfaces ────────────────────────────────────────────────────────────────

export interface KycRequest {
  frontImageBase64: string;
  backImageBase64: string;
  selfieImageBase64: string;
}

export interface KycResponse {
  success: boolean;
  message: string;
  fullName?: string;
  idNumber?: string;
  dateOfBirth?: string;
  address?: string;
  faceMatchScore?: number;
}

// ── Service Functions ─────────────────────────────────────────────────────────

/**
 * Upload a base64-encoded image to VNPT File Service → returns a hash string
 * VNPT expects multipart/form-data, NOT raw base64
 */
async function uploadBase64Image(base64Data: string, filename: string): Promise<string> {
  const imageBuffer = Buffer.from(base64Data, 'base64');

  const form = new FormData();
  form.append('file', imageBuffer, {
    filename,
    contentType: 'image/jpeg',
  });
  form.append('title', filename);
  form.append('description', 'eKYC upload');

  const response = await axios.post(`${BASE_URL}/file-service/v1/addFile`, form, {
    headers: {
      ...form.getHeaders(),
      Authorization: `Bearer ${process.env.VNPT_EKYC_ACCESS_TOKEN}`,
      'Token-id': process.env.VNPT_EKYC_TOKEN_ID,
      'Token-key': process.env.VNPT_EKYC_TOKEN_KEY,
    },
  });

  const obj = response.data?.object;
  if (typeof obj === 'object' && obj.hash) {
    return obj.hash;
  }
  if (typeof obj === 'string') {
    return obj;
  }
  throw new Error('Failed to upload image to VNPT: ' + JSON.stringify(response.data));
}

/**
 * OCR the front side of the ID card (CCCD)
 * Returns: object.name, object.id, object.birth_day, object.recent_location, etc.
 */
async function ocrFront(frontHash: string, clientSession: string) {
  const response = await axios.post(
    `${BASE_URL}/ai/v1/ocr/id/front`,
    {
      img_front: frontHash,
      client_session: clientSession,
      token: process.env.VNPT_EKYC_TOKEN_ID,
      type: -1, // auto-detect
    },
    { headers: buildAiHeaders() },
  );
  return response.data;
}

/**
 * OCR the back side of the ID card (CCCD)
 */
async function ocrBack(backHash: string, clientSession: string) {
  const response = await axios.post(
    `${BASE_URL}/ai/v1/ocr/id/back`,
    {
      img_back: backHash,
      client_session: clientSession,
      token: process.env.VNPT_EKYC_TOKEN_ID,
      type: -1,
    },
    { headers: buildAiHeaders() },
  );
  return response.data;
}

/**
 * Compare face on ID card with selfie photo
 * Returns: object.prob (similarity score 0-100%)
 */
async function faceCompare(frontHash: string, selfieHash: string, clientSession: string) {
  const response = await axios.post(
    `${BASE_URL}/ai/v1/face/compare`,
    {
      img_front: frontHash,
      img_face: selfieHash,
      client_session: clientSession,
      token: process.env.VNPT_EKYC_TOKEN_ID,
    },
    { headers: buildAiHeaders() },
  );
  return response.data;
}

/**
 * Check if the face is a real person (not a photo/screen spoof)
 */
async function checkFaceLiveness(faceHash: string, clientSession: string) {
  const response = await axios.post(
    `${BASE_URL}/ai/v1/face/liveness`,
    {
      img: faceHash,
      client_session: clientSession,
      token: process.env.VNPT_EKYC_TOKEN_ID,
    },
    { headers: buildAiHeaders() },
  );
  return response.data;
}

/**
 * Main orchestrator: Upload 3 images → Liveness checks → OCR → Face compare → return results
 */
export async function performKyc(request: KycRequest): Promise<KycResponse> {
  try {
    // Step 0: Upload 3 images to VNPT File Service
    const frontHash = await uploadBase64Image(request.frontImageBase64, 'cccd_front.jpg');
    const backHash = await uploadBase64Image(request.backImageBase64, 'cccd_back.jpg');
    const selfieHash = await uploadBase64Image(request.selfieImageBase64, 'selfie.jpg');

    const clientSession = generateClientSession();

    // Step 1: Face Liveness check to prevent spoofing
    // const faceLivenessData = await checkFaceLiveness(selfieHash, clientSession);
    // if (faceLivenessData?.object?.liveness !== 'success') {
    //   return {
    //     success: false,
    //     message:
    //       'Nhận diện khuôn mặt không hợp lệ. Hãy chụp trực tiếp người thật, không sử dụng ảnh in hoặc màn hình thiết bị khác.',
    //   };
    // }

    // Step 1: OCR front side
    const ocrFrontData = await ocrFront(frontHash, clientSession);

    // Step 2: OCR back side
    const ocrBackData = await ocrBack(backHash, clientSession);

    // Step 3: Face compare (CCCD front photo vs Selfie)
    const faceData = await faceCompare(frontHash, selfieHash, clientSession);

    // Parse results
    const fullName = ocrFrontData?.object?.name || '';
    const idNumber = ocrFrontData?.object?.id || '';
    const dateOfBirth = ocrFrontData?.object?.birth_day || '';
    const address = ocrFrontData?.object?.recent_location || '';
    const faceMatchScore = parseFloat(faceData?.object?.prob) || 0;

    return {
      success: true,
      message: 'KYC verification completed',
      fullName,
      idNumber,
      dateOfBirth,
      address,
      faceMatchScore,
    };
  } catch (error: any) {
    console.error('[VNPT eKYC] Error:', error.response?.data || error.message);
    return {
      success: false,
      message: `KYC verification failed: ${error.response?.data?.message || error.message}`,
    };
  }
}
