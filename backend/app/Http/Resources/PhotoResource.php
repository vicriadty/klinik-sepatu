<?php

namespace App\Http\Resources;

use App\Services\PhotoService;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class PhotoResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'order_item_id' => $this->order_item_id,
            'type' => $this->type,
            'url' => PhotoService::publicUrl($this->path),
            'thumbnail_url' => PhotoService::publicUrl($this->thumbnail_path),
            'mime' => $this->mime,
            'size' => $this->size === null ? null : (int) $this->size,
            'created_at' => $this->created_at?->toISOString(),
        ];
    }
}
