"""
MinIO storage service — handles upload, delete, and URL generation.
Bucket creation is lazy (first upload) so import never fails if MinIO is offline.
"""
import uuid
import io
import logging
from typing import Optional, Tuple
from minio import Minio
from minio.error import S3Error
from fastapi import UploadFile

from app.core.config import settings

logger = logging.getLogger(__name__)


class MinIOService:
    def __init__(self) -> None:
        self.client = Minio(
            endpoint=settings.MINIO_ENDPOINT,
            access_key=settings.MINIO_ACCESS_KEY,
            secret_key=settings.MINIO_SECRET_KEY,
            secure=settings.MINIO_USE_SSL,
        )
        self._buckets_ensured = False

    def _ensure_buckets(self) -> None:
        """Called lazily on first real operation."""
        if self._buckets_ensured:
            return
        for bucket in [settings.MINIO_BUCKET_IMAGES, settings.MINIO_BUCKET_VIDEOS]:
            try:
                if not self.client.bucket_exists(bucket):
                    self.client.make_bucket(bucket)
                    logger.info("Created MinIO bucket: %s", bucket)
            except Exception as exc:
                logger.warning("MinIO bucket init error for %s: %s", bucket, exc)
        self._buckets_ensured = True

    # ── Upload ──────────────────────────────────────────────────────────

    async def upload_image(self, file: UploadFile, prefix: str = "photos") -> Tuple[str, str, int]:
        """Returns (object_key, public_url, size_bytes)."""
        return await self._upload_file(file, settings.MINIO_BUCKET_IMAGES, prefix)

    async def upload_video(self, file: UploadFile, prefix: str = "videos") -> Tuple[str, str, int]:
        """Returns (object_key, public_url, size_bytes)."""
        return await self._upload_file(file, settings.MINIO_BUCKET_VIDEOS, prefix)

    async def _upload_file(self, file: UploadFile, bucket: str, prefix: str) -> Tuple[str, str, int]:
        try:
            self._ensure_buckets()
        except Exception as exc:
            raise ConnectionError(f"MinIO unavailable: {exc}") from exc

        ext = ""
        if file.filename and "." in file.filename:
            ext = f".{file.filename.rsplit('.', 1)[-1].lower()}"
        object_key = f"{prefix}/{uuid.uuid4().hex}{ext}"

        data = await file.read()
        size = len(data)

        try:
            self.client.put_object(
                bucket_name=bucket,
                object_name=object_key,
                data=io.BytesIO(data),
                length=size,
                content_type=file.content_type or "application/octet-stream",
            )
        except Exception as exc:
            raise ConnectionError(f"MinIO upload failed: {exc}") from exc

        public_url = self._build_url(bucket, object_key)
        logger.info("Uploaded %s → %s", file.filename, public_url)
        return object_key, public_url, size

    # ── Delete ──────────────────────────────────────────────────────────

    def delete_object(self, bucket: str, object_key: str) -> bool:
        try:
            self.client.remove_object(bucket, object_key)
            return True
        except S3Error as exc:
            logger.error("MinIO delete error: %s", exc)
            return False

    # ── Presigned URL ───────────────────────────────────────────────────

    def presigned_url(self, bucket: str, object_key: str, expires_seconds: int = 3600) -> Optional[str]:
        try:
            from datetime import timedelta
            return self.client.presigned_get_object(bucket, object_key, expires=timedelta(seconds=expires_seconds))
        except S3Error as exc:
            logger.error("Presigned URL error: %s", exc)
            return None

    def _build_url(self, bucket: str, object_key: str) -> str:
        base = settings.MINIO_PUBLIC_URL.rstrip("/")
        return f"{base}/{bucket}/{object_key}"


# singleton
minio_service = MinIOService()
