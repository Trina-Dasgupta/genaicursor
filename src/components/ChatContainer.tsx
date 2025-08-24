'use client'

import { useState, useRef, useEffect } from 'react'
import { Send, Loader2 } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { useAIStore } from '@/store/useAIStore'
import MessageBubble from './MessageBubble'
import TypingIndicator from './TypingIndicator'
import toast from 'react-hot-toast'

export default function ChatContainer() {
  const {
    messages,
    isTyping,
    llmConfig,
    sendMessage
  } = useAIStore()
  
  const [input, setInput] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages, isTyping])

  // Listen for quick prompts from sidebar
  useEffect(() => {
    const handleQuickPrompt = (event: any) => {
      setInput(event.detail)
      textareaRef.current?.focus()
    }

    window.addEventListener('quick-prompt', handleQuickPrompt)
    return () => window.removeEventListener('quick-prompt', handleQuickPrompt)
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!input.trim()) return
    
    if (!llmConfig.apiKey) {
      toast.error('Please configure your AI provider first')
      return
    }

    setIsSubmitting(true)
    const messageToSend = input.trim()
    setInput('')
    
    // Reset textarea height
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
    }

    try {
      await sendMessage(messageToSend)
    } catch (error) {
      toast.error('Failed to send message. Please check your API configuration.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmit(e)
    }
  }

  const adjustTextareaHeight = () => {
    const textarea = textareaRef.current
    if (textarea) {
      textarea.style.height = 'auto'
      textarea.style.height = Math.min(textarea.scrollHeight, 120) + 'px'
    }
  }

  const isConfigValid = llmConfig.apiKey && 
    (llmConfig.provider !== 'custom' || llmConfig.baseURL)

  return (
    <div className="flex flex-col h-full">
      {/* Messages Container */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        <AnimatePresence mode="popLayout">
          {messages.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex flex-col items-center justify-center h-full text-center"
            >
              <div className="p-6 glass-strong rounded-2xl max-w-md">
                <div className="text-6xl mb-4">🚀</div>
                <h2 className="text-2xl font-bold text-white mb-2">
                  Ready to Build Something Amazing?
                </h2>
                <p className="text-gray-400 mb-6">
                  Describe what you want to create and I'll generate the code for you. 
                  From simple components to full applications!
                </p>
                <div className="text-sm text-gray-500">
                  Try: "Create a modern landing page for a tech startup"
                </div>
              </div>
            </motion.div>
          ) : (
            messages.map((message) => (
              <MessageBubble key={message.id} message={message} />
            ))
          )}
        </AnimatePresence>

        {/* Typing Indicator */}
        <AnimatePresence>
          {isTyping && <TypingIndicator />}
        </AnimatePresence>

        <div ref={messagesEndRef} />
      </div>

      {/* Input Container */}
      <div className="p-6 glass border-t border-white/10">
        <form onSubmit={handleSubmit} className="flex space-x-4">
          <div className="flex-1 relative">
            <textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => {
                setInput(e.target.value)
                adjustTextareaHeight()
              }}
              onKeyDown={handleKeyDown}
              placeholder="Describe what you want to build..."
              className="w-full px-4 py-3 pr-12 glass-strong rounded-2xl text-white placeholder-gray-400 resize-none focus:outline-none focus:ring-2 focus:ring-purple-500/50 transition-all duration-200 min-h-[50px] max-h-[120px]"
              disabled={isSubmitting || !isConfigValid}
              rows={1}
            />
            
            {/* Send Button */}
            <button
              type="submit"
              disabled={!input.trim() || isSubmitting || !isConfigValid}
              className="absolute right-2 top-1/2 -translate-y-1/2 p-2 gradient-primary rounded-xl text-white disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-lg hover:shadow-purple-500/25 transition-all duration-200 disabled:hover:shadow-none"
            >
              {isSubmitting ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <Send className="w-5 h-5" />
              )}
            </button>
          </div>
        </form>

        {/* Status Text */}
        <div className="flex justify-between items-center mt-3 text-xs text-gray-500">
          <span>
            {!isConfigValid ? 'AI provider configuration required' : 'Press Enter to send, Shift+Enter for new line'}
          </span>
          <span>{input.length}/2000</span>
        </div>
      </div>
    </div>
  )
}