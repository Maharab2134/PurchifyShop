<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\Footer;
use Illuminate\Http\JsonResponse;

class FooterController extends Controller
{
    /**
     * GET /api/v1/footer
     * Returns active footer columns.
     */
    public function index(): JsonResponse
    {
        $footerItems = Footer::where('is_active', true)
            ->orderBy('column_name')
            ->orderBy('sort_order')
            ->get();
        
        $copyright = $footerItems->firstWhere('copyright_text', '!=', null)?->copyright_text;
        $poweredBy = $footerItems->firstWhere('powered_by_text', '!=', null)?->powered_by_text;
        
        $columns = $footerItems->map(fn (Footer $f) => [
                'id' => $f->id,
                'columnName' => $f->column_name,
                'title' => $f->title,
                'logoUrl' => $f->logo_url,
                'links' => $f->links ?? [],
                'socialLinks' => $f->social_links ?? [],
                'contactInfo' => $f->contact_info ?? [],
                'content' => $f->content,
                'sortOrder' => $f->sort_order,
            ])
            ->groupBy('columnName')
            ->map(fn ($items) => $items->values()->all())
            ->all();

        return response()->json([
            'message' => 'Footer fetched successfully',
            'data' => [
                'columns' => $columns,
                'copyright' => $copyright,
                'poweredBy' => $poweredBy,
            ],
        ]);
    }
}
