<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Controllers\Controller;
use App\Models\Chat;
use App\Models\ChatMessage;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ChatController extends Controller
{
    /**
     * GET /api/v1/admin/chats
     * List all chats with user info.
     */
    public function index(Request $request): JsonResponse
    {
        $status = $request->input('status'); // OPEN, RESOLVED
        $q = Chat::with(['user:id,name,email'])->orderByDesc('updated_at');
        
        if ($status && in_array($status, ['OPEN', 'RESOLVED'])) {
            $q->where('status', $status);
        }
        
        $chats = $q->get()->map(function ($c) {
            // Unread count: messages from user that admin hasn't replied to yet
            $lastUserMessage = $c->messages()->where('sender_id', $c->user_id)->latest('created_at')->first();
            $lastAdminMessage = $c->messages()->where('sender_id', '!=', $c->user_id)->latest('created_at')->first();
            $hasUnread = false;
            if ($lastUserMessage) {
                if (!$lastAdminMessage || $lastUserMessage->created_at > $lastAdminMessage->created_at) {
                    $hasUnread = true;
                }
            }
            $unreadCount = $hasUnread ? $c->messages()->where('sender_id', $c->user_id)->count() : 0;
            
            return [
                'id' => $c->id,
                'userId' => $c->user_id,
                'user' => $c->relationLoaded('user') && $c->user ? [
                    'id' => $c->user->id,
                    'name' => $c->user->name,
                    'email' => $c->user->email,
                ] : null,
                'status' => $c->status,
                'lastMessage' => $c->messages()->latest('created_at')->first()?->content,
                'lastMessageAt' => $c->messages()->latest('created_at')->first()?->created_at?->toIso8601String(),
                'messageCount' => $c->messages()->count(),
                'unreadCount' => $unreadCount,
                'createdAt' => $c->created_at?->toIso8601String(),
                'updatedAt' => $c->updated_at?->toIso8601String(),
            ];
        });
        
        return response()->json(['data' => $chats->values()->all()]);
    }

    /**
     * GET /api/v1/admin/chats/{id}
     * Get chat details with messages.
     */
    public function show(string $id): JsonResponse
    {
        $chat = Chat::with(['user:id,name,email', 'messages.sender:id,name,email'])->findOrFail($id);
        
        $messages = $chat->messages()->with(['sender:id,name,email', 'product'])->orderBy('created_at')->get()->map(fn ($m) => [
            'id' => $m->id,
            'chatId' => $m->chat_id,
            'senderId' => $m->sender_id,
            'sender' => $m->relationLoaded('sender') && $m->sender ? [
                'id' => $m->sender->id,
                'name' => $m->sender->name,
                'email' => $m->sender->email,
            ] : null,
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
        
        return response()->json([
            'data' => [
                'id' => $chat->id,
                'userId' => $chat->user_id,
                'user' => $chat->relationLoaded('user') && $chat->user ? [
                    'id' => $chat->user->id,
                    'name' => $chat->user->name,
                    'email' => $chat->user->email,
                ] : null,
                'status' => $chat->status,
                'messages' => $messages->values()->all(),
                'createdAt' => $chat->created_at?->toIso8601String(),
                'updatedAt' => $chat->updated_at?->toIso8601String(),
            ],
        ]);
    }

    /**
     * POST /api/v1/admin/chats/{id}/messages
     * Admin sends a message to a chat.
     */
    public function sendMessage(Request $request, string $id): JsonResponse
    {
        $chat = Chat::findOrFail($id);
        $validated = $request->validate([
            'content' => ['required', 'string'],
            'type' => ['nullable', 'string', 'in:TEXT,IMAGE'],
        ]);
        
        $admin = auth()->user();
        $message = ChatMessage::create([
            'chat_id' => $chat->id,
            'sender_id' => $admin->id,
            'content' => $validated['content'],
            'type' => $validated['type'] ?? 'TEXT',
            'url' => $request->input('url'),
        ]);
        
        $chat->touch();
        
        return response()->json([
            'message' => 'Message sent',
            'data' => [
                'id' => $message->id,
                'content' => $message->content,
                'senderId' => $message->sender_id,
                'createdAt' => $message->created_at?->toIso8601String(),
            ],
        ], 201);
    }

    /**
     * PUT /api/v1/admin/chats/{id}/status
     * Update chat status (OPEN, RESOLVED).
     */
    public function updateStatus(Request $request, string $id): JsonResponse
    {
        $chat = Chat::findOrFail($id);
        $validated = $request->validate([
            'status' => ['required', 'string', 'in:OPEN,RESOLVED'],
        ]);
        
        $chat->update(['status' => $validated['status']]);
        
        return response()->json([
            'message' => 'Chat status updated',
            'data' => [
                'id' => $chat->id,
                'status' => $chat->status,
            ],
        ]);
    }

    /**
     * DELETE /api/v1/admin/chats/{id}
     * Delete a chat and all its messages.
     */
    public function destroy(string $id): JsonResponse
    {
        $chat = Chat::findOrFail($id);
        
        // Delete all messages first (cascade should handle this, but being explicit)
        $chat->messages()->delete();
        
        // Delete the chat
        $chat->delete();
        
        return response()->json([
            'message' => 'Chat deleted successfully',
        ]);
    }
}
