<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreReportExportRequest;
use App\Http\Resources\ReportExportResource;
use App\Jobs\GenerateReportExport;
use App\Models\ReportExport;
use App\Models\User;
use App\Support\ApiResponse;
use Illuminate\Foundation\Auth\Access\AuthorizesRequests;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Symfony\Component\HttpFoundation\BinaryFileResponse;
use Symfony\Component\HttpFoundation\Response;

class ReportExportController extends Controller
{
    use AuthorizesRequests;

    public function store(StoreReportExportRequest $request): JsonResponse
    {
        $this->authorize('viewFinancials', User::class);

        $validated = $request->validated();

        $export = ReportExport::query()->create([
            'user_id' => $request->user()->id,
            'type' => $validated['type'],
            'filters' => collect($validated)->except('type')->all(),
            'status' => ReportExport::STATUS_PENDING,
        ]);

        GenerateReportExport::dispatch($export->id);

        // With a sync queue driver the job already ran inline; refresh so
        // the response reflects the final status instead of PENDING.
        return response()->json(
            ['data' => new ReportExportResource($export->refresh())],
            Response::HTTP_ACCEPTED
        );
    }

    public function index(Request $request): JsonResponse
    {
        $this->authorize('viewFinancials', User::class);

        $exports = ReportExport::query()
            ->where('user_id', $request->user()->id)
            ->latest('id')
            ->paginate(ApiResponse::perPage($request));

        return ApiResponse::paginated($exports, ReportExportResource::class);
    }

    public function show(Request $request, ReportExport $export): JsonResponse
    {
        $this->authorize('viewFinancials', User::class);
        $this->authorizeExport($request, $export);

        return ApiResponse::ok(new ReportExportResource($export));
    }

    public function download(Request $request, ReportExport $export): BinaryFileResponse|JsonResponse
    {
        $this->authorize('viewFinancials', User::class);
        $this->authorizeExport($request, $export);

        if ($export->status !== ReportExport::STATUS_COMPLETED || ! $export->file_path) {
            return response()->json(
                ['message' => 'Export is not ready for download.'],
                Response::HTTP_CONFLICT
            );
        }

        if (! Storage::disk('local')->exists($export->file_path)) {
            return response()->json(['message' => 'Export file not found.'], Response::HTTP_NOT_FOUND);
        }

        return response()->download(
            Storage::disk('local')->path($export->file_path),
            basename($export->file_path),
            ['Content-Type' => 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet']
        );
    }

    private function authorizeExport(Request $request, ReportExport $export): void
    {
        abort_if($export->user_id !== $request->user()->id, Response::HTTP_NOT_FOUND);
    }
}
