import { PutObjectCommand, DeleteObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { s3Client, S3_BUCKET } from '../config/s3';

export const storageService = {
  async uploadFile(buffer: Buffer, key: string, mimeType: string): Promise<string> {
    const command = new PutObjectCommand({
      Bucket: S3_BUCKET,
      Key: key,
      Body: buffer,
      ContentType: mimeType,
    });

    await s3Client.send(command);

    const region = process.env.AWS_REGION || 'us-east-1';
    return `https://${S3_BUCKET}.s3.${region}.amazonaws.com/${key}`;
  },

  async deleteFile(key: string): Promise<void> {
    const command = new DeleteObjectCommand({
      Bucket: S3_BUCKET,
      Key: key,
    });
    await s3Client.send(command);
  },

  async getSignedUrl(key: string, expiresInSeconds = 3600): Promise<string> {
    const command = new GetObjectCommand({
      Bucket: S3_BUCKET,
      Key: key,
    });
    return getSignedUrl(s3Client, command, { expiresIn: expiresInSeconds });
  },

  async uploadCampaignThumbnail(buffer: Buffer, campaignId: string, mimeType: string) {
    const ext = mimeType.split('/')[1] || 'jpg';
    const key = `campaigns/${campaignId}/thumbnail-${Date.now()}.${ext}`;
    return this.uploadFile(buffer, key, mimeType);
  },

  async uploadCampaignMedia(buffer: Buffer, campaignId: string, index: number, mimeType: string) {
    const ext = mimeType.split('/')[1] || 'jpg';
    const key = `campaigns/${campaignId}/media-${index}-${Date.now()}.${ext}`;
    return this.uploadFile(buffer, key, mimeType);
  },

  async uploadCampaignDocument(buffer: Buffer, campaignId: string, name: string, mimeType: string) {
    const key = `campaigns/${campaignId}/docs/${name}-${Date.now()}`;
    return this.uploadFile(buffer, key, mimeType);
  },

  async uploadUpdateMedia(buffer: Buffer, campaignId: string, index: number, mimeType: string) {
    const ext = mimeType.split('/')[1] || 'jpg';
    const key = `campaigns/${campaignId}/updates/media-${index}-${Date.now()}.${ext}`;
    return this.uploadFile(buffer, key, mimeType);
  },
};
