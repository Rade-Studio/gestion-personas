import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
  GetObjectCommand,
} from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'

const s3Client = new S3Client({
  region: process.env.S3_REGION || 'auto',
  endpoint: process.env.S3_ENDPOINT,
  credentials: {
    accessKeyId: process.env.S3_ACCESS_KEY_ID!,
    secretAccessKey: process.env.S3_SECRET_ACCESS_KEY!,
  },
})

const BUCKET_NAME = process.env.S3_BUCKET_NAME!
const PUBLIC_URL = process.env.S3_PUBLIC_URL!

/**
 * Sube un archivo al bucket S3/R2
 */
export async function uploadFile(
  file: File | Buffer,
  path: string,
  contentType: string
): Promise<{ url: string; path: string }> {
  const buffer = file instanceof File ? Buffer.from(await file.arrayBuffer()) : file

  await s3Client.send(
    new PutObjectCommand({
      Bucket: BUCKET_NAME,
      Key: path,
      Body: buffer,
      ContentType: contentType,
    })
  )

  const url = getPublicUrl(path)

  return { url, path }
}

/**
 * Elimina un archivo del bucket S3/R2
 */
export async function deleteFile(path: string): Promise<void> {
  await s3Client.send(
    new DeleteObjectCommand({
      Bucket: BUCKET_NAME,
      Key: path,
    })
  )
}

/**
 * Obtiene una URL firmada para subir un archivo directamente
 */
export async function getSignedUploadUrl(
  path: string,
  contentType: string,
  expiresIn = 3600
): Promise<string> {
  const command = new PutObjectCommand({
    Bucket: BUCKET_NAME,
    Key: path,
    ContentType: contentType,
  })

  return getSignedUrl(s3Client, command, { expiresIn })
}

/**
 * Obtiene una URL firmada para descargar un archivo privado
 */
export async function getSignedDownloadUrl(path: string, expiresIn = 3600): Promise<string> {
  const command = new GetObjectCommand({
    Bucket: BUCKET_NAME,
    Key: path,
  })

  return getSignedUrl(s3Client, command, { expiresIn })
}

/**
 * Genera la URL pública para un archivo
 */
export function getPublicUrl(path: string): string {
  // Remove leading slash if present
  const cleanPath = path.startsWith('/') ? path.slice(1) : path
  return `${PUBLIC_URL}/${cleanPath}`
}

/**
 * Valida que un archivo sea una imagen
 */
export function isValidImage(file: File): boolean {
  return file.type.startsWith('image/')
}

/**
 * Valida el tamaño del archivo (en bytes)
 */
export function isValidFileSize(file: File, maxSizeBytes: number): boolean {
  return file.size <= maxSizeBytes
}

/**
 * Genera un nombre de archivo único
 */
export function generateFileName(originalName: string, prefix?: string): string {
  const ext = originalName.split('.').pop()
  const timestamp = Date.now()
  const random = Math.random().toString(36).substring(2, 8)
  return prefix ? `${prefix}-${timestamp}-${random}.${ext}` : `${timestamp}-${random}.${ext}`
}
