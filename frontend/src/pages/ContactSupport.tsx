import { useEffect, useState, useRef } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { MessageSquare, Send, Plus, Loader2, Package } from 'lucide-react'
import MainLayout from '@/components/templates/MainLayout'
import Button from '@/components/atoms/Button'
import { useAuth } from '@/hooks/useAuth'
import { chatApi, type Chat, type ChatMessage } from '@/api/chat'
import useToast from '@/hooks/useToast'
import { toImageUrl } from '@/utils/imageUrl'

export default function ContactSupport() {
  const { isAuthenticated, isLoading } = useAuth()
  const navigate = useNavigate()
  const { showToast } = useToast()
  const [chats, setChats] = useState<Chat[]>([])
  const [selectedChat, setSelectedChat] = useState<Chat | null>(null)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [messageText, setMessageText] = useState('')
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [loadingMessages, setLoadingMessages] = useState(false)
  const [isPolling, setIsPolling] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const pollIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const chatListPollRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const lastMessageCountRef = useRef<number>(0)
  const isInitialLoadRef = useRef<boolean>(true)
  const shouldScrollRef = useRef<boolean>(false)

  const loadChats = async () => {
    try {
      const data = await chatApi.list()
      setChats(data)
      if (data.length > 0 && !selectedChat) {
        setSelectedChat(data[0])
      }
    } catch {
      showToast('Failed to load chats', 'error')
    } finally {
      setLoading(false)
    }
  }

  const loadMessages = async (chatId: string, silent = false) => {
    if (!silent) {
      setLoadingMessages(true)
    }
    try {
      const data = await chatApi.getMessages(chatId)
      const previousCount = lastMessageCountRef.current
      const hasNewMessages = data.length > previousCount && previousCount > 0
      lastMessageCountRef.current = data.length
      setMessages(data)
      
      // Only scroll if:
      // 1. It's not the initial load (previousCount > 0)
      // 2. There are actually new messages
      // 3. User explicitly wants to scroll (shouldScrollRef)
      if (shouldScrollRef.current || (hasNewMessages && !isInitialLoadRef.current)) {
        scrollToBottom()
        shouldScrollRef.current = false
      }
      
      // Mark initial load as complete after first load
      if (isInitialLoadRef.current) {
        isInitialLoadRef.current = false
      }
    } catch {
      if (!silent) {
        showToast('Failed to load messages', 'error')
      }
    } finally {
      if (!silent) {
        setLoadingMessages(false)
      }
    }
  }

  const createNewChat = async () => {
    try {
      const newChat = await chatApi.create()
      setChats((prev) => [newChat, ...prev])
      setSelectedChat(newChat)
      setMessages([])
      showToast('New chat created', 'success')
    } catch {
      showToast('Failed to create chat', 'error')
    }
  }

  const sendMessage = async () => {
    if (!selectedChat || !messageText.trim() || sending) return
    setSending(true)
    try {
      await chatApi.sendMessage(selectedChat.id, { content: messageText.trim() })
      setMessageText('')
      shouldScrollRef.current = true // User sent message, so scroll to bottom
      await loadMessages(selectedChat.id)
      await loadChats()
    } catch {
      showToast('Failed to send message', 'error')
    } finally {
      setSending(false)
    }
  }

  const scrollToBottom = () => {
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }, 100)
  }

  useEffect(() => {
    // Wait for auth to finish loading before checking
    if (isLoading) {
      return
    }

    // Check both isAuthenticated and localStorage as fallback
    const token = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null
    const userStr = typeof window !== 'undefined' ? localStorage.getItem('user') : null
    
    if (!isAuthenticated && !token && !userStr) {
      navigate('/sign-in')
      return
    }

    // User is authenticated, proceed with loading chats
    loadChats()
    // Poll chat list less frequently - every 30 seconds instead of 10
    chatListPollRef.current = setInterval(() => {
      setIsPolling(true)
      loadChats().finally(() => setIsPolling(false))
    }, 30000)
    return () => {
      if (chatListPollRef.current) {
        clearInterval(chatListPollRef.current)
        chatListPollRef.current = null
      }
    }
  }, [isAuthenticated, isLoading, navigate])

  useEffect(() => {
    if (selectedChat && chats.length > 0 && !chats.some((c) => c.id === selectedChat.id)) {
      setSelectedChat(null)
      setMessages([])
      showToast('This chat was resolved by support.', 'info')
    }
  }, [chats, selectedChat])

  useEffect(() => {
    if (selectedChat) {
      lastMessageCountRef.current = 0
      isInitialLoadRef.current = true // Reset for new chat selection
      shouldScrollRef.current = false // Don't auto-scroll on chat selection
      loadMessages(selectedChat.id)
      // Poll messages less frequently - every 5 seconds instead of 3, and only if chat is OPEN
      if (selectedChat.status === 'OPEN') {
        pollIntervalRef.current = setInterval(() => {
          setIsPolling(true)
          loadMessages(selectedChat.id, true).finally(() => setIsPolling(false))
        }, 5000)
      }
    }
    return () => {
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current)
        pollIntervalRef.current = null
      }
      lastMessageCountRef.current = 0
      isInitialLoadRef.current = true
      shouldScrollRef.current = false
    }
  }, [selectedChat])

  // Removed automatic scroll on messages change - only scroll when explicitly needed
  // (when user sends message or new messages arrive during active session)

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

  // Show loading while checking authentication
  if (isLoading) {
    return (
      <MainLayout>
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
          <Loader2 className="animate-spin text-indigo-600" size={32} />
        </div>
      </MainLayout>
    )
  }

  // Check authentication with fallback to localStorage
  const token = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null
  const userStr = typeof window !== 'undefined' ? localStorage.getItem('user') : null
  
  if (!isAuthenticated && !token && !userStr) {
    return null
  }

  return (
    <MainLayout>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-gray-100">Contact Support</h1>
            <Button
              onClick={createNewChat}
              className="flex items-center gap-2 bg-indigo-600 dark:bg-indigo-500 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 dark:hover:bg-indigo-600"
            >
              <Plus size={18} />
              New Chat
            </Button>
          </div>

          <div className="flex flex-col lg:flex-row gap-4 h-[calc(100vh-250px)] min-h-[600px]">
            {/* Chat List */}
            <div className="w-full lg:w-80 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 flex flex-col">
              <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                <h2 className="font-semibold text-gray-900 dark:text-gray-100">Your Chats</h2>
              </div>
              <div className="flex-1 overflow-y-auto">
                {loading ? (
                  <div className="p-4 text-center text-gray-500 dark:text-gray-400 text-sm">Loading...</div>
                ) : chats.length === 0 ? (
                  <div className="p-4 text-center text-gray-500 dark:text-gray-400 text-sm">
                    <MessageSquare className="mx-auto mb-2 text-gray-300" size={32} />
                    <p>No chats yet</p>
                    <p className="text-xs mt-1">Create a new chat to get started</p>
                  </div>
                ) : (
                  chats.map((chat) => (
                    <button
                      key={chat.id}
                      onClick={() => setSelectedChat(chat)}
                      className={`w-full p-4 border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors text-left ${
                        selectedChat?.id === chat.id ? 'bg-indigo-50 dark:bg-indigo-900/20' : ''
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-semibold text-sm text-gray-900 dark:text-gray-100">
                          Chat #{chat.id.substring(0, 8)}
                        </span>
                        {chat.status === 'OPEN' ? (
                          <span className="text-xs bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 px-2 py-0.5 rounded">
                            Open
                          </span>
                        ) : (
                          <span className="text-xs bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 px-2 py-0.5 rounded">
                            Resolved
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">{formatTime(chat.updatedAt)}</div>
                    </button>
                  ))
                )}
              </div>
            </div>

            {/* Chat Messages */}
            <div className="flex-1 w-full border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 flex flex-col min-w-0">
              {selectedChat ? (
                <>
                  {/* Chat Header */}
                  <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <div className="font-semibold text-gray-900 dark:text-gray-100">
                            Chat #{selectedChat.id.substring(0, 8)}
                          </div>
                          {isPolling && selectedChat.status === 'OPEN' && (
                            <Loader2 className="animate-spin text-indigo-600 dark:text-indigo-400" size={16} />
                          )}
                        </div>
                        <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                          {selectedChat.status === 'OPEN' ? 'Support team will respond soon' : 'This chat is resolved'}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Messages */}
                  <div className="flex-1 overflow-y-auto p-4 space-y-4">
                    {loadingMessages ? (
                      <div className="flex items-center justify-center h-full">
                        <Loader2 className="animate-spin text-indigo-600" size={24} />
                      </div>
                    ) : messages.length === 0 ? (
                      <div className="flex items-center justify-center h-full">
                        <div className="text-center">
                          <MessageSquare className="mx-auto text-gray-300 dark:text-gray-600 mb-4" size={48} />
                          <p className="text-gray-600 dark:text-gray-400">No messages yet</p>
                          <p className="text-sm text-gray-500 dark:text-gray-500 mt-1">Start the conversation</p>
                        </div>
                      </div>
                    ) : (
                      messages.map((msg) => {
                        const isUser = msg.senderId === selectedChat.userId
                        return (
                          <div key={msg.id} className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
                            <div
                              className={`max-w-[70%] rounded-lg px-4 py-2 ${
                                isUser
                                  ? 'bg-indigo-600 text-white'
                                  : 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-gray-100'
                              }`}
                            >
                              <div className="text-xs mb-1 opacity-75">{msg.sender?.name || 'Support'}</div>
                              
                              {/* Product Card if message has product */}
                              {msg.type === 'PRODUCT' && msg.product && (
                                <Link
                                  to={`/product/${msg.product.slug}`}
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
                                      <div className="text-xs opacity-60 mt-1">Click to view details</div>
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
                      })
                    )}
                    <div ref={messagesEndRef} />
                  </div>

                  {/* Message Input */}
                  {selectedChat.status === 'OPEN' && (
                    <div className="p-4 border-t border-gray-200 dark:border-gray-700 flex gap-2">
                      <input
                        type="text"
                        value={messageText}
                        onChange={(e) => setMessageText(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && sendMessage()}
                        placeholder="Type your message..."
                        disabled={sending}
                        className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400"
                      />
                      <Button
                        onClick={sendMessage}
                        disabled={sending || !messageText.trim()}
                        className="px-6 py-2 bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      >
                        {sending ? <Loader2 className="animate-spin" size={18} /> : <Send size={18} />}
                      </Button>
                    </div>
                  )}
                </>
              ) : (
                <div className="flex-1 flex items-center justify-center">
                  <div className="text-center">
                    <MessageSquare className="mx-auto text-gray-400 mb-4" size={48} />
                    <p className="text-gray-600 dark:text-gray-400">Select a chat or create a new one</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  )
}
