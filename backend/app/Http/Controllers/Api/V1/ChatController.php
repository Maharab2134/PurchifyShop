<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\Chat;
use App\Models\ChatMessage;
use App\Models\Product;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

/**
 * Chat: REST polling instead of Socket.IO.
 * GET /api/v1/chat - list user's chats
 * GET /api/v1/chat/{id}/messages - get messages (poll)
 * POST /api/v1/chat/{id}/messages - send message
 */
class ChatController extends Controller
{
    public function index(): JsonResponse
    {
        // Only show OPEN chats; RESOLVED chats are hidden (removed from user list)
        $chats = Chat::where('user_id', Auth::id())
            ->where('status', 'OPEN')
            ->orderByDesc('updated_at')
            ->get()
            ->map(fn ($c) => [
            'id' => $c->id,
            'userId' => $c->user_id,
            'status' => $c->status,
            'createdAt' => $c->created_at?->toIso8601String(),
            'updatedAt' => $c->updated_at?->toIso8601String(),
        ]);
        return response()->json(['data' => $chats]);
    }

    public function create(): JsonResponse
    {
        $chat = Chat::create(['user_id' => Auth::id(), 'status' => 'OPEN']);
        return response()->json([
            'message' => 'Chat created',
            'data' => ['id' => $chat->id, 'status' => $chat->status, 'createdAt' => $chat->created_at?->toIso8601String()],
        ], 201);
    }

    public function messages(string $id): JsonResponse
    {
        $chat = Chat::where('user_id', Auth::id())->findOrFail($id);
        if ($chat->status !== 'OPEN') {
            abort(404, 'Chat is resolved and no longer available.');
        }
        $msgs = $chat->messages()->with(['sender', 'product'])->orderBy('created_at')->get()->map(fn ($m) => [
            'id' => $m->id,
            'chatId' => $m->chat_id,
            'senderId' => $m->sender_id,
            'sender' => $m->relationLoaded('sender') && $m->sender ? ['id' => $m->sender->id, 'name' => $m->sender->name] : null,
            'content' => $m->content,
            'type' => $m->type,
            'url' => $m->url,
            'productId' => $m->product_id,
            'product' => $m->relationLoaded('product') && $m->product ? [
                'id' => $m->product->id,
                'name' => $m->product->name,
                'slug' => $m->product->slug,
                'images' => $m->product->images ?? [],
                'price' => $m->product->variants?->first()?->price ?? 0,
            ] : null,
            'createdAt' => $m->created_at?->toIso8601String(),
        ]);
        return response()->json(['data' => $msgs]);
    }

    public function sendMessage(Request $request, string $id): JsonResponse
    {
        $chat = Chat::where('user_id', Auth::id())->findOrFail($id);
        if ($chat->status !== 'OPEN') {
            abort(422, 'Chat is resolved. You cannot send messages.');
        }
        $validated = $request->validate([
            'content' => ['nullable', 'string'],
            'type' => ['nullable', 'string', 'in:TEXT,IMAGE,PRODUCT'],
            'url' => ['nullable', 'string'],
            'productId' => ['nullable', 'uuid', 'exists:products,id'],
        ]);
        $m = ChatMessage::create([
            'chat_id' => $chat->id,
            'sender_id' => Auth::id(),
            'content' => $validated['content'] ?? null,
            'type' => $validated['type'] ?? 'TEXT',
            'url' => $validated['url'] ?? null,
            'product_id' => $validated['productId'] ?? null,
        ]);
        $chat->touch();
        return response()->json([
            'message' => 'Message sent',
            'data' => ['id' => $m->id, 'content' => $m->content, 'createdAt' => $m->created_at?->toIso8601String()],
        ], 201);
    }
}
