<?php

namespace App\Support;

use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ApiResponse
{
    /**
     * Standard success envelope (PRD backend §12).
     */
    public static function ok(mixed $data, array $meta = []): JsonResponse
    {
        return response()->json(['data' => $data, 'meta' => $meta]);
    }

    /**
     * Standard offset-pagination envelope (ADR-0011):
     * { data: [...], meta: { page, per_page, total, last_page } }.
     *
     * @param class-string<\Illuminate\Http\Resources\Json\JsonResource> $resourceClass
     */
    public static function paginated(LengthAwarePaginator $paginator, string $resourceClass): JsonResponse
    {
        return response()->json([
            'data' => $resourceClass::collection($paginator->items()),
            'meta' => [
                'page' => $paginator->currentPage(),
                'per_page' => $paginator->perPage(),
                'total' => $paginator->total(),
                'last_page' => $paginator->lastPage(),
            ],
        ]);
    }

    /**
     * Offset-pagination envelope for pre-mapped row arrays
     * (reports build rows in the service layer, not resources).
     */
    public static function paginatedData(LengthAwarePaginator $paginator): JsonResponse
    {
        return response()->json([
            'data' => array_values($paginator->items()),
            'meta' => [
                'page' => $paginator->currentPage(),
                'per_page' => $paginator->perPage(),
                'total' => $paginator->total(),
                'last_page' => $paginator->lastPage(),
            ],
        ]);
    }

    public static function perPage(Request $request, int $default = 15, int $max = 100): int
    {
        return max(1, min($request->integer('per_page', $default), $max));
    }
}
