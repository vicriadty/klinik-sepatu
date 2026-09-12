<?php

namespace App\Jobs;

use App\Exports\GenericArrayExport;
use App\Models\ReportExport;
use App\Services\ReportService;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;
use Maatwebsite\Excel\Facades\Excel;

class GenerateReportExport implements ShouldQueue
{
    use Queueable;

    public function __construct(public int $exportId)
    {
    }

    public function handle(ReportService $reports): void
    {
        $export = ReportExport::query()->findOrFail($this->exportId);
        $export->forceFill(['status' => ReportExport::STATUS_PROCESSING])->save();

        try {
            [$headings, $rows] = $reports->exportData($export->type, $export->filters ?? []);

            $filename = sprintf(
                'exports/%s_%d_%s.xlsx',
                $export->type,
                $export->id,
                now()->format('Ymd_His')
            );

            Excel::store(new GenericArrayExport($headings, $rows), $filename, 'local');

            $export->forceFill([
                'status' => ReportExport::STATUS_COMPLETED,
                'file_path' => $filename,
                'error' => null,
            ])->save();
        } catch (\Throwable $e) {
            report($e);

            $export->forceFill([
                'status' => ReportExport::STATUS_FAILED,
                'error' => substr($e->getMessage(), 0, 500),
            ])->save();
        }
    }
}
