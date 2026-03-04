import axiosInstance from '@/utils/axiosInstance'

export interface Chat {
  id: string
  userId: string
  status: string
  createdAt?: string
  updatedAt?: string
}

export interface ChatMessage {
  id: string
  chatId: string
  senderId: string
  sender: { id: string; name: string } | null
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

interface ChatsRes {
  data: Chat[]
}

interface ChatRes {
  message: string
  data: Chat
}

interface MessagesRes {
  data: ChatMessage[]
}

interface MessageRes {
  message: string
  data: { id: string; content: string | null; createdAt?: string }
}

export const chatApi = {
  list: () => axiosInstance.get<ChatsRes>('/chat').then((r) => r.data.data ?? []),
  create: () => axiosInstance.post<ChatRes>('/chat').then((r) => r.data.data),
  getMessages: (id: string) => axiosInstance.get<MessagesRes>(`/chat/${id}/messages`).then((r) => r.data.data ?? []),
  sendMessage: (id: string, body: { content?: string; type?: 'TEXT' | 'IMAGE' | 'PRODUCT'; url?: string; productId?: string }) =>
    axiosInstance.post<MessageRes>(`/chat/${id}/messages`, body).then((r) => r.data.data),
}
