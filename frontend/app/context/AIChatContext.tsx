"use client";
import React, { createContext, useContext, useState, useEffect } from 'react';
import { aiApi } from '../lib/api';
import { useAppContext } from './AppContext';

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  sqlQuery?: string | null;
  dbResults?: any[] | null;
}

interface AIChatContextType {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  messages: ChatMessage[];
  sendMessage: (content: string) => Promise<void>;
  isTyping: boolean;
  clearChat: () => void;
}

const AIChatContext = createContext<AIChatContextType | undefined>(undefined);

export function AIChatProvider({ children }: { children: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const { isLoggedIn } = useAppContext();

  // Load chat history from localStorage on mount (for persistent user experience)
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('ai_chat_history');
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          setMessages(
            parsed.map((msg: any) => ({
              ...msg,
              timestamp: new Date(msg.timestamp)
            }))
          );
        } catch (e) {
          console.error("Failed to parse saved chat history:", e);
        }
      }
    }
  }, []);

  // Save history when it changes
  useEffect(() => {
    if (typeof window !== 'undefined' && messages.length > 0) {
      localStorage.setItem('ai_chat_history', JSON.stringify(messages));
    }
  }, [messages]);

  // Clear chat history on logout
  useEffect(() => {
    if (!isLoggedIn) {
      clearChat();
    }
  }, [isLoggedIn]);

  const clearChat = () => {
    setMessages([]);
    if (typeof window !== 'undefined') {
      localStorage.removeItem('ai_chat_history');
    }
  };

  const sendMessage = async (content: string) => {
    if (!content.trim()) return;

    // Add user message
    const userMsg: ChatMessage = {
      id: Math.random().toString(36).substr(2, 9),
      role: 'user',
      content,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMsg]);
    setIsTyping(true);

    try {
      const res = await aiApi.chat(content);
      
      const assistantMsg: ChatMessage = {
        id: Math.random().toString(36).substr(2, 9),
        role: 'assistant',
        content: res.response || res.error || 'Có lỗi xảy ra khi tải câu trả lời.',
        timestamp: new Date(),
        sqlQuery: res.sql_query,
        dbResults: res.db_results
      };

      setMessages(prev => [...prev, assistantMsg]);
    } catch (error: any) {
      const errorMsg: ChatMessage = {
        id: Math.random().toString(36).substr(2, 9),
        role: 'assistant',
        content: error.message || 'Không thể kết nối tới máy chủ AI. Vui lòng kiểm tra cấu hình GEMINI_API_KEY ở backend.',
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
      sendMessage,
      isTyping,
      clearChat
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
