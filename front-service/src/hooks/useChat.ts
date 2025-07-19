import { useState, useEffect } from 'react';

export interface ChatMessage {
  id: string;
  content: string;
  isUser: boolean;
  timestamp: Date;
  read: boolean;
}

export const useChat = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const sendMessage = async (content: string, tabType: string = 'chat') => {
    setIsLoading(true);
    
    // Thêm tin nhắn của user
    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      content,
      isUser: true,
      timestamp: new Date(),
      read: true
    };
    
    setMessages(prev => [...prev, userMessage]);
    
    // Giả lập phản hồi từ AI
    setTimeout(() => {
      const aiMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        content: `Đây là phản hồi từ AI cho tin nhắn: "${content}"`,
        isUser: false,
        timestamp: new Date(),
        read: false
      };
      setMessages(prev => [...prev, aiMessage]);
      setIsLoading(false);
    }, 1000);
  };

  return {
    messages,
    isLoading,
    sendMessage
  };
}; 