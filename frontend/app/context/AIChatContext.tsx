"use client";
import React, { createContext, useContext, useState, useEffect } from 'react';
import { aiApi } from '../lib/api';
import { useAppContext } from './AppContext';

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'model' | 'function';
  content: string;
  timestamp: Date;
  sqlQuery?: string | null;
  dbResults?: any[] | null;
}

export interface AIConversation {
  id: string;
  user_id: string;
  title: string;
  created_at: string;
  updated_at: string;
}

interface AIChatContextType {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  messages: ChatMessage[];
  conversations: AIConversation[];
  currentConversationId: string | null;
  isTyping: boolean;
  sendMessage: (content: string) => Promise<void>;
  clearChat: () => void;
  selectConversation: (id: string) => Promise<void>;
  deleteConversation: (id: string) => Promise<void>;
  renameConversation: (id: string, title: string) => Promise<void>;
  startNewChat: () => void;
  loadConversations: () => Promise<void>;
}

const AIChatContext = createContext<AIChatContextType | undefined>(undefined);

export function AIChatProvider({ children }: { children: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [conversations, setConversations] = useState<AIConversation[]>([]);
  const [currentConversationId, setCurrentConversationId] = useState<string | null>(null);
  const [isTyping, setIsTyping] = useState(false);
  const { isLoggedIn } = useAppContext();

  // Load conversations list on login
  useEffect(() => {
    if (isLoggedIn) {
      loadConversations();
    } else {
      setConversations([]);
      setMessages([]);
      setCurrentConversationId(null);
    }
  }, [isLoggedIn]);

  const loadConversations = async () => {
    try {
      const res = await aiApi.getConversations();
      if (res && res.success) {
        setConversations(res.conversations || []);
      }
    } catch (err) {
      console.error("Failed to load AI conversations:", err);
    }
  };

  const selectConversation = async (id: string) => {
    setIsTyping(true);
    try {
      const res = await aiApi.getMessages(id);
      if (res && res.success) {
        setCurrentConversationId(id);
        
        // Map messages from db schema to state
        const dbMessages = res.messages || [];
        const mappedMessages: ChatMessage[] = [];
        
        dbMessages.forEach((msg: any) => {
          // Bỏ qua tin nhắn trung gian (function, model call tool) để giữ chat log sạch và dễ đọc ở frontend
          if (msg.role === 'function' || msg.function_name) {
            return;
          }
          
          let content = msg.content;
          let sqlQuery: string | null = null;
          let dbResults: any[] | null = null;

          // Tìm xem tin nhắn kề tiếp có phải functionCall/functionResponse không để hiển thị bảng SQL kèm theo
          const currentMsgIndex = dbMessages.findIndex((m: any) => m.id === msg.id);
          if (currentMsgIndex !== -1) {
            // Xem tin nhắn tiếp theo trong DB có phải model functionCall không
            const nextMsg = dbMessages[currentMsgIndex + 1];
            if (nextMsg && nextMsg.role === 'model' && nextMsg.function_name === 'execute_sql_query') {
              try {
                const parsedCall = JSON.parse(nextMsg.content);
                sqlQuery = parsedCall.sql_query;
              } catch (e) {}
            }
            // Xem tiếp tin nhắn sau đó nữa có phải functionResponse không
            const afterNextMsg = dbMessages[currentMsgIndex + 2];
            if (afterNextMsg && afterNextMsg.role === 'function') {
              try {
                dbResults = JSON.parse(afterNextMsg.content);
              } catch (e) {}
            }
          }

          mappedMessages.push({
            id: msg.id,
            role: msg.role === 'model' ? 'assistant' : 'user',
            content: content,
            timestamp: new Date(msg.created_at || msg.timestamp),
            sqlQuery,
            dbResults
          });
        });

        setMessages(mappedMessages);
      }
    } catch (err) {
      console.error("Failed to load conversation messages:", err);
    } finally {
      setIsTyping(false);
    }
  };

  const startNewChat = () => {
    setMessages([]);
    setCurrentConversationId(null);
  };

  const clearChat = () => {
    startNewChat();
  };

  const renameConversation = async (id: string, title: string) => {
    if (!title.trim()) return;
    try {
      const res = await aiApi.updateConversation(id, title);
      if (res && res.success) {
        setConversations(prev =>
          prev.map(c => c.id === id ? { ...c, title, updated_at: new Date().toISOString() } : c)
        );
      }
    } catch (err) {
      console.error("Failed to rename conversation:", err);
    }
  };

  const deleteConversation = async (id: string) => {
    try {
      const res = await aiApi.deleteConversation(id);
      if (res && res.success) {
        setConversations(prev => prev.filter(c => c.id !== id));
        if (currentConversationId === id) {
          startNewChat();
        }
      }
    } catch (err) {
      console.error("Failed to delete conversation:", err);
    }
  };

  const sendMessage = async (content: string) => {
    if (!content.trim()) return;

    // Tạm thời tạo message ở phía client để tạo cảm giác mượt mà
    const tempUserMsgId = Math.random().toString(36).substr(2, 9);
    const userMsg: ChatMessage = {
      id: tempUserMsgId,
      role: 'user',
      content,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMsg]);
    setIsTyping(true);

    try {
      const res = await aiApi.chat(content, currentConversationId);
      
      if (res && res.success) {
        const isNewChat = !currentConversationId;
        const newConvId = res.conversation_id;
        
        if (isNewChat && newConvId) {
          setCurrentConversationId(newConvId);
          loadConversations();
        }

        const assistantMsg: ChatMessage = {
          id: Math.random().toString(36).substr(2, 9),
          role: 'assistant',
          content: res.answer || res.response || 'Không có câu trả lời.',
          timestamp: new Date(),
          sqlQuery: res.sql_query,
          dbResults: res.db_results
        };

        // Cập nhật lại tin nhắn từ server, bỏ tin nhắn tạm thời đi và thêm tin nhắn AI
        setMessages(prev => {
          const filtered = prev.filter(m => m.id !== tempUserMsgId);
          return [...filtered, { ...userMsg, id: res.user_message_id || tempUserMsgId }, assistantMsg];
        });
      } else {
        throw new Error(res.error || "Gửi tin nhắn thất bại");
      }
    } catch (error: any) {
      const errorMsg: ChatMessage = {
        id: Math.random().toString(36).substr(2, 9),
        role: 'assistant',
        content: error.message || 'Không thể kết nối tới máy chủ AI. Vui lòng kiểm tra lại cấu hình.',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <AIChatContext.Provider value={{
      isOpen,
      setIsOpen,
      messages,
      conversations,
      currentConversationId,
      isTyping,
      sendMessage,
      clearChat,
      selectConversation,
      deleteConversation,
      renameConversation,
      startNewChat,
      loadConversations
    }}>
      {children}
    </AIChatContext.Provider>
  );
}

export function useAIChat() {
  const context = useContext(AIChatContext);
  if (!context) {
    throw new Error('useAIChat must be used within an AIChatProvider');
  }
  return context;
}
