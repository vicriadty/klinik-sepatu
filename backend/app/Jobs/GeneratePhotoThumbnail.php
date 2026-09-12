<?php

namespace App\Jobs;

use App\Models\OrderItemPhoto;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;
use Illuminate\Support\Facades\Storage;
use Intervention\Image\Drivers\Gd\Driver as GdDriver;
use Intervention\Image\Encoders\JpegEncoder;
use Intervention\Image\ImageManager;

class GeneratePhotoThumbnail implements ShouldQueue
{
    use Queueable;

    public function __construct(public int $photoId)
    {
    }

    public function handle(): void
    {
        $photo = OrderItemPhoto::query()->find($this->photoId);

        if (! $photo) {
            return;
        }

        $disk = Storage::disk('s3');

        if (! $disk->exists($photo->path)) {
            return;
        }

        $basename = pathinfo($photo->path, PATHINFO_FILENAME);
        $thumbPath = "photos/thumbs/{$basename}.jpg";

        $image = (new ImageManager(new GdDriver))->decode($disk->get($photo->path));
        $image->scaleDown(width: 400);

        $disk->put($thumbPath, (string) $image->encode(new JpegEncoder(quality: 75)));

        $photo->forceFill(['thumbnail_path' => $thumbPath])->save();
    }
}
