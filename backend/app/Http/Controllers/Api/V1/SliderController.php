<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\Slider;
use Illuminate\Http\JsonResponse;

class SliderController extends Controller
{
    public function index(): JsonResponse
    {
        $sliders = Slider::where('is_active', true)
            ->orderBy('sort_order')
            ->orderBy('id')
            ->get()
            ->map(fn ($s) => [
                'id' => $s->id,
                'image' => $s->image,
                'link' => $s->link,
                'buttonTitle' => $s->title,
                'buttonLink' => $s->link,
                'description' => $s->description,
            ]);

        return response()->json([
            'message' => 'Sliders fetched successfully',
            'data' => $sliders,
        ]);
    }
}
