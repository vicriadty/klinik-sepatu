<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ReportExportResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'type' => $this->type,
            'filters' => $this->filters ?? [],
            'status' => $this->status,
            'error' => $this->error,
            'download_url' => $this->status === \App\Models\ReportExport::STATUS_COMPLETED
                ? url("/api/v1/reports/exports/{$this->id}/download")
                : null,
            'created_at' => $this->created_at?->toISOString(),
            'updated_at' => $this->updated_at?->toISOString(),
        ];
    }
}
