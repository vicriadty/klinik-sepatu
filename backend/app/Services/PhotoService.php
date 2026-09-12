<?php

namespace App\Services;

use App\Jobs\GeneratePhotoThumbnail;
use App\Models\OrderItem;
use App\Models\OrderItemPhoto;
use App\Models\User;
use App\Support\AuditLog;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

/**
 * Shoe photo handling (ADR-0007): UUID filenames on the S3-compatible
 * disk, public URLs, async thumbnails.
 */
class PhotoService
{
    public const DISK = 's3';

    public function store(OrderItem $item, UploadedFile $file, string $type, ?User $actor = null): OrderItemPhoto
    {
        $extension = $file->guessExtension() ?: $file->getClientOriginalExtension();
        $path = 'photos/'.Str::uuid().'.'.$extension;

        Storage::disk(self::DISK)->putFileAs('photos', $file, basename($path));

        $photo = $item->photos()->create([
            'type' => $type,
            'path' => $path,
            'mime' => $file->getMimeType(),
            'size' => $file->getSize(),
        ]);

        AuditLog::record('PHOTO_UPLOADED', 'order_item_photo', $photo->id, null, [
            'order_item_id' => $item->id,
            'type' => $type,
        ], $actor);

        GeneratePhotoThumbnail::dispatch($photo->id);

        return $photo;
    }

    public function delete(OrderItemPhoto $photo): void
    {
        $disk = Storage::disk(self::DISK);

        foreach (array_filter([$photo->path, $photo->thumbnail_path]) as $object) {
            if ($disk->exists($object)) {
                $disk->delete($object);
            }
        }

        $photo->delete();
    }

    public static function publicUrl(?string $path): ?string
    {
        if (! $path) {
            return null;
        }

        // Host-viewable base URL (dev: localhost MinIO; prod: CDN/bucket).
        // Falls back to the storage disk URL when unconfigured (tests).
        $base = rtrim((string) config('filesystems.photo_url_base', ''), '/');

        if ($base !== '') {
            return $base.'/'.ltrim($path, '/');
        }

        return Storage::disk(self::DISK)->url($path);
    }
}
