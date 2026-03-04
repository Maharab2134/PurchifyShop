import { useEffect, useState, useRef } from 'react'
import { MessageSquare, Send, CheckCircle, XCircle, Search, Package, Trash2 } from 'lucide-react'
import { Link } from 'react-router-dom'
import Button from '@/components/atoms/Button'
import ConfirmModal from '@/components/admin/ConfirmModal'
import { adminApi } from '@/api/admin'
import useToast from '@/hooks/useToast'
import { toImageUrl } from '@/utils/imageUrl'

interface Chat {
  id: string
  userId: string
  user: { id: string; name: string; email: string } | null
  status: string
  lastMessage?: string | null
  lastMessageAt?: string | null
  messageCount: number
  unreadCount: number
  createdAt?: string
  updatedAt?: string
}

interface ChatMessage {
  id: string
  chatId: string
  senderId: string
  sender: { id: string; name: string; email: string } | null
  content: string | null
  type: string
  url: string | null
  productId?: string | null
  product?: {
    id: string
    name: string
    slug: string
    images: string[]
    price: number
  } | null
  createdAt?: string
}

interface ChatDetail {
  id: string
  userId: string
  user: { id: string; name: string; email: string } | null
  status: string
  messages: ChatMessage[]
  createdAt?: string
  updatedAt?: string
}

export default function AdminChats() {
  const { showToast } = useToast()
  const [chats, setChats] = useState<Chat[]>([])
  const [selectedChat, setSelectedChat] = useState<ChatDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [messageText, setMessageText] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | 'OPEN' | 'RESOLVED'>('OPEN')
  const [searchQuery, setSearchQuery] = useState('')
  const [deletingChat, setDeletingChat] = useState<Chat | null>(null)
  const [deleting, setDeleting] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const pollIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const loadChats = async () => {
    setLoading(true)
    try {
      const res = await adminApi.chats.list(statusFilter !== 'all' ? { status: statusFilter } : undefined)
      setChats(res.data.data ?? [])
    } catch {
      showToast('Failed to load chats', 'error')
    } finally {
      setLoading(false)
    }
  }

  const loadChatDetail = async (chatId: string) => {
    try {
      const res = await adminApi.chats.get(chatId)
      setSelectedChat(res.data.data)
      scrollToBottom()
    } catch {
      showToast('Failed to load chat details', 'error')
    }
  }

  const sendMessage = async () => {
    if (!selectedChat || !messageText.trim() || sending) return
    setSending(true)
    try {
      await adminApi.chats.sendMessage(selectedChat.id, { content: messageText.trim() })
      await loadChatDetail(selectedChat.id)
      await loadChats()
      setMessageText('')
      scrollToBottom()
    } catch {
      showToast('Failed to send message', 'error')
    } finally {
      setSending(false)
    }
  }

  const updateStatus = async (chatId: string, status: 'OPEN' | 'RESOLVED') => {
    try {
      await adminApi.chats.updateStatus(chatId, { status })
      if (selectedChat?.id === chatId) {
        setSelectedChat(null)
        setMessageText('')
      }
      await loadChats()
      showToast(`Chat marked as ${status.toLowerCase()}. Removed from active list.`, 'success')
    } catch {
      showToast('Failed to update status', 'error')
    }
  }

  const handleDelete = async () => {
    if (!deletingChat) return
    setDeleting(true)
    try {
      await adminApi.chats.delete(deletingChat.id)
      if (selectedChat?.id === deletingChat.id) {
        setSelectedChat(null)
        setMessageText('')
      }
      await loadChats()
      showToast('Chat deleted successfully', 'success')
      setDeletingChat(null)
    } catch {
      showToast('Failed to delete chat', 'error')
    } finally {
      setDeleting(false)
    }
  }

  const scrollToBottom = () => {
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }, 100)
  }

  useEffect(() => {
    loadChats()
  }, [statusFilter])

  useEffect(() => {
    if (selectedChat) {
      loadChatDetail(selectedChat.id)
      scrollToBottom()
      
      // Poll for new messages every 3 seconds
      pollIntervalRef.current = setInterval(() => {
        loadChatDetail(selectedChat.id)
        loadChats() // Also refresh chat list to update last message
      }, 3000)
    }
    
    return () => {
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current)
        pollIntervalRef.current = null
      }
    }
  }, [selectedChat])

  const filteredChats = chats.filter((chat) => {
    if (!searchQuery) return true
    const query = searchQuery.toLowerCase()
    return (
      chat.user?.name.toLowerCase().includes(query) ||
      chat.user?.email.toLowerCase().includes(query) ||
      chat.lastMessage?.toLowerCase().includes(query)
    )
  })

  const formatTime = (dateString?: string | null) => {
    if (!dateString) return ''
    const date = new Date(dateString)
    const now = new Date()
    const diff = now.getTime() - date.getTime()
    const minutes = Math.floor(diff / 60000)
    const hours = Math.floor(minutes / 60)
    const days = Math.floor(hours / 24)

    if (minutes < 1) return 'Just now'
    if (minutes < 60) return `${minutes}m ago`
    if (hours < 24) return `${hours}h ago`
    if (days < 7) return `${days}d ago`
    return date.toLocaleDateString()
  }

  return (
    <div className="p-4 sm:p-6">
      <div className="flex flex-col h-[calc(100vh-180px)] min-h-[600px]">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-xl sm:text-2xl font-semibold text-gray-800 dark:text-gray-100">User Support Chats</h1>
        </div>

        <div className="flex gap-4 flex-1 min-h-0 overflow-hidden">
          {/* Chat List */}
          <div className="w-80 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 flex flex-col min-w-0 flex-shrink-0">
            {/* Filters */}
            <div className="p-4 border-b border-gray-200 dark:border-gray-700 space-y-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                <input
                  type="text"
                  placeholder="Search chats..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 text-sm"
                />
              </div>
              <div className="flex gap-2 flex-wrap">
                <button
                  onClick={() => setStatusFilter('all')}
                  className={`flex-1 min-w-[60px] px-3 py-1.5 text-xs rounded-lg transition-colors whitespace-nowrap ${
                    statusFilter === 'all'
                      ? 'bg-indigo-600 text-white'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                  }`}
                >
                  All
                </button>
                <button
                  onClick={() => setStatusFilter('OPEN')}
                  className={`flex-1 min-w-[60px] px-3 py-1.5 text-xs rounded-lg transition-colors whitespace-nowrap ${
                    statusFilter === 'OPEN'
                      ? 'bg-indigo-600 text-white'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                  }`}
                >
                  Open
                </button>
                <button
                  onClick={() => setStatusFilter('RESOLVED')}
                  className={`flex-1 min-w-[60px] px-3 py-1.5 text-xs rounded-lg transition-colors whitespace-nowrap ${
                    statusFilter === 'RESOLVED'
                      ? 'bg-indigo-600 text-white'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                  }`}
                >
                  Resolved
                </button>
              </div>
            </div>

            {/* Chat List */}
            <div className="flex-1 overflow-y-auto min-h-0">
              {loading ? (
                <div className="p-4 text-center text-gray-500 dark:text-gray-400 text-sm">Loading...</div>
              ) : filteredChats.length === 0 ? (
                <div className="p-4 text-center text-gray-500 dark:text-gray-400 text-sm">No chats found</div>
              ) : (
                filteredChats.map((chat) => (
                  <div
                    key={chat.id}
                    className={`w-full border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors ${
                      selectedChat?.id === chat.id ? 'bg-indigo-50 dark:bg-indigo-900/20' : ''
                    }`}
                  >
                    <button
                      onClick={() => loadChatDetail(chat.id)}
                      className="w-full p-4 text-left"
                    >
                      <div className="flex items-start justify-between mb-1">
                        <div className="flex-1 min-w-0">
                          <div className="font-semibold text-sm text-gray-900 dark:text-gray-100 truncate">
                            {chat.user?.name || 'Unknown User'}
                          </div>
                          <div className="text-xs text-gray-500 dark:text-gray-400 truncate">{chat.user?.email}</div>
                        </div>
                        {chat.status === 'OPEN' ? (
                          <CheckCircle size={16} className="text-green-500 flex-shrink-0 ml-2" />
                        ) : (
                          <XCircle size={16} className="text-gray-400 flex-shrink-0 ml-2" />
                        )}
                      </div>
                      {chat.lastMessage && (
                        <div className="text-xs text-gray-600 dark:text-gray-400 truncate mt-1">{chat.lastMessage}</div>
                      )}
                      <div className="flex items-center justify-between mt-2">
                        <span className="text-xs text-gray-500 dark:text-gray-400">{formatTime(chat.lastMessageAt)}</span>
                        {chat.unreadCount > 0 && (
                          <span className="bg-indigo-600 text-white text-xs px-2 py-0.5 rounded-full">{chat.unreadCount}</span>
                        )}
                      </div>
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        setDeletingChat(chat)
                      }}
                      className="w-full px-4 pb-4 flex items-center justify-center gap-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors text-sm"
                      title="Delete chat"
                    >
                      <Trash2 size={14} />
                      <span>Delete</span>
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Chat Messages */}
          <div className="flex-1 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 flex flex-col">
            {selectedChat ? (
              <>
                {/* Chat Header */}
                <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
                  <div>
                    <div className="font-semibold text-gray-900 dark:text-gray-100">
                      {selectedChat.user?.name || 'Unknown User'}
                    </div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">{selectedChat.user?.email}</div>
                  </div>
                  <div className="flex gap-2">
                    {selectedChat.status === 'OPEN' ? (
                      <Button
                        onClick={() => updateStatus(selectedChat.id, 'RESOLVED')}
                        className="px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 text-sm"
                      >
                        Mark Resolved
                      </Button>
                    ) : (
                      <Button
                        onClick={() => updateStatus(selectedChat.id, 'OPEN')}
                        className="px-4 py-2 bg-indigo-600 text-white hover:bg-indigo-700 text-sm"
                      >
                        Reopen
                      </Button>
                    )}
                    <Button
                      onClick={() => setDeletingChat({ id: selectedChat.id, userId: selectedChat.userId, user: selectedChat.user, status: selectedChat.status, messageCount: selectedChat.messages.length, unreadCount: 0 } as Chat)}
                      className="px-4 py-2 bg-red-600 text-white hover:bg-red-700 text-sm flex items-center gap-2"
                    >
                      <Trash2 size={16} />
                      Delete
                    </Button>
                  </div>
                </div>

                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4 min-h-0">
                  {selectedChat.messages.map((msg) => {
                    const isAdmin = msg.sender?.email !== selectedChat.user?.email
                    return (
                      <div key={msg.id} className={`flex ${isAdmin ? 'justify-end' : 'justify-start'}`}>
                        <div
                          className={`max-w-[70%] rounded-lg px-4 py-2 ${
                            isAdmin
                              ? 'bg-indigo-600 text-white'
                              : 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-gray-100'
                          }`}
                        >
                          <div className="text-xs mb-1 opacity-75">{msg.sender?.name || 'Unknown'}</div>
                          
                          {/* Product Card if message has product */}
                          {msg.type === 'PRODUCT' && msg.product && (
                            <Link
                              to={`/dashboard/products?search=${encodeURIComponent(msg.product.name)}`}
                              target="_blank"
                              className="block mt-2 mb-2 p-3 bg-white/10 dark:bg-gray-800/50 rounded-lg border border-white/20 dark:border-gray-600 hover:bg-white/20 dark:hover:bg-gray-700/50 transition-colors"
                            >
                              <div className="flex gap-3">
                                {msg.product.images && msg.product.images.length > 0 ? (
                                  <img
                                    src={toImageUrl(msg.product.images[0])}
                                    alt={msg.product.name}
                                    className="w-16 h-16 object-cover rounded"
                                  />
                                ) : (
                                  <div className="w-16 h-16 bg-white/10 dark:bg-gray-700 rounded flex items-center justify-center">
                                    <Package size={24} className="text-white/60 dark:text-gray-400" />
                                  </div>
                                )}
                                <div className="flex-1 min-w-0">
                                  <div className="font-medium text-sm truncate">{msg.product.name}</div>
                                  <div className="text-xs opacity-75 mt-1">৳{typeof msg.product.price === 'number' ? msg.product.price.toFixed(2) : Number(msg.product.price || 0).toFixed(2)}</div>
                                  <div className="text-xs opacity-60 mt-1">Click to view in admin</div>
                                </div>
                              </div>
                            </Link>
                          )}
                          
                          {msg.content && (
                            <div className="text-sm">{msg.content}</div>
                          )}
                          {msg.createdAt && (
                            <div className="text-xs mt-1 opacity-75">{formatTime(msg.createdAt)}</div>
                          )}
                        </div>
                      </div>
                    )
                  })}
                  <div ref={messagesEndRef} />
                </div>

                {/* Message Input */}
                <div className="p-4 border-t border-gray-200 dark:border-gray-700 flex gap-2">
                  <input
                    type="text"
                    value={messageText}
                    onChange={(e) => setMessageText(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && sendMessage()}
                    placeholder="Type a message..."
                    disabled={sending || selectedChat.status === 'RESOLVED'}
                    className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100"
                  />
                  <Button
                    onClick={sendMessage}
                    disabled={sending || !messageText.trim() || selectedChat.status === 'RESOLVED'}
                    className="px-6 py-2 bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-50"
                  >
                    <Send size={18} />
                  </Button>
                </div>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center">
                <div className="text-center">
                  <MessageSquare className="mx-auto text-gray-400 mb-4" size={48} />
                  <p className="text-gray-600 dark:text-gray-400">Select a chat to view messages</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        open={!!deletingChat}
        title="Delete Chat"
        message={deletingChat ? `Are you sure you want to delete this chat with ${deletingChat.user?.name || 'Unknown User'}? This will permanently delete all messages and cannot be undone.` : ''}
        confirmLabel="Delete"
        danger
        loading={deleting}
        onConfirm={handleDelete}
        onCancel={() => setDeletingChat(null)}
      />
    </div>
  )
}
