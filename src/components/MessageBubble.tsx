'use client'

import { useState, useRef, useEffect } from 'react'
import { Send, Loader2, Terminal, MessageSquare, Zap, Settings, FolderPlus } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import toast from 'react-hot-toast'
import { useAIStore } from '@/store/useAIStore'

// Import your components (these would be your actual components)
const MessageBubble = ({ message }: any) => (
  <div className="p-4 bg-gray-800 rounded-lg mb-4 text-white">
    <strong>{message.role}:</strong> {message.content}
  </div>
)

const CursorInterface = () => <div className="p-4 bg-purple-900 rounded-lg text-white">Cursor Interface</div>



type ChatMode = 'regular' | 'cursor'

export default function IntegratedChatInterface() {
  const {
    messages,
    isTyping,
    llmConfig,
    cursorSessions,
    activeCursorSession,
    isGeneratingCommands,
    sendMessage,
    createCursorSession,
    generateCommands
  } = useAIStore()
  
  const [input, setInput] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [chatMode, setChatMode] = useState<ChatMode>('regular')
  const [showModeSelector, setShowModeSelector] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages, isTyping])

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault()
    
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
      if (chatMode === 'cursor') {
        // Extract project name from input
        const projectName = extractProjectName(messageToSend)
        await createCursorSession(projectName, messageToSend)
        await generateCommands(messageToSend)
        toast.success('Terminal commands generated!')
      } else {
        await sendMessage(messageToSend)
      }
    } catch (error) {
      toast.error('Failed to process request. Please check your API configuration.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmit()
    }
  }

  const adjustTextareaHeight = () => {
    const textarea = textareaRef.current
    if (textarea) {
      textarea.style.height = 'auto'
      textarea.style.height = Math.min(textarea.scrollHeight, 120) + 'px'
    }
  }

  const extractProjectName = (prompt: string): string => {
    const words = prompt.toLowerCase().split(' ')
    const projectTypes = ['calculator', 'todo', 'portfolio', 'landing', 'dashboard', 'blog', 'website', 'app']
    const foundType = projectTypes.find(type => words.some(word => word.includes(type)))
    return foundType || 'web-project'
  }

  const isConfigValid = llmConfig.apiKey && 
    (llmConfig.provider !== 'custom' || llmConfig.baseURL)

  const getPlaceholderText = () => {
    if (chatMode === 'cursor') {
      return "Describe the website you want to build... (e.g., 'Create a modern calculator with glassmorphism design')"
    }
    return "Ask me anything about web development or request code..."
  }

  const getModeIcon = (mode: ChatMode) => {
    return mode === 'cursor' ? <Terminal className="w-4 h-4" /> : <MessageSquare className="w-4 h-4" />
  }

  const getModeColor = (mode: ChatMode) => {
    return mode === 'cursor' ? 'from-purple-500 to-pink-500' : 'from-blue-500 to-indigo-500'
  }

  const ActiveSession = activeCursorSession ? cursorSessions.find(s => s.id === activeCursorSession) : null

  return (
    <div className="flex flex-col h-full max-w-none bg-gray-900">
      {/* Header with Mode Selector */}
      <div className="border-b border-gray-700 bg-gray-800/50 backdrop-blur-sm">
        <div className="max-w-6xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <h1 className="text-xl font-bold text-white">AI Assistant</h1>
              
              {/* Mode Toggle */}
              <div className="relative">
                <button
                  onClick={() => setShowModeSelector(!showModeSelector)}
                  className={`flex items-center space-x-2 px-4 py-2 bg-gradient-to-r ${getModeColor(chatMode)} text-white rounded-lg transition-all duration-200 hover:shadow-lg`}
                >
                  {getModeIcon(chatMode)}
                  <span className="font-medium capitalize">{chatMode} Mode</span>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                {/* Mode Selector Dropdown */}
                <AnimatePresence>
                  {showModeSelector && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="absolute top-full mt-2 w-64 bg-gray-800 border border-gray-700 rounded-lg shadow-xl z-50"
                    >
                      <div className="p-2">
                        <button
                          onClick={() => {
                            setChatMode('regular')
                            setShowModeSelector(false)
                          }}
                          className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg transition-colors ${
                            chatMode === 'regular' ? 'bg-blue-600 text-white' : 'text-gray-300 hover:bg-gray-700'
                          }`}
                        >
                          <MessageSquare className="w-4 h-4" />
                          <div className="text-left">
                            <div className="font-medium">Regular Chat</div>
                            <div className="text-xs opacity-75">Normal conversation & code help</div>
                          </div>
                        </button>
                        
                        <button
                          onClick={() => {
                            setChatMode('cursor')
                            setShowModeSelector(false)
                          }}
                          className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg transition-colors ${
                            chatMode === 'cursor' ? 'bg-purple-600 text-white' : 'text-gray-300 hover:bg-gray-700'
                          }`}
                        >
                          <Terminal className="w-4 h-4" />
                          <div className="text-left">
                            <div className="font-medium">Cursor Mode</div>
                            <div className="text-xs opacity-75">Generate terminal commands to build projects</div>
                          </div>
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>

            {/* Active Session Info */}
            {ActiveSession && (
              <div className="flex items-center space-x-2 text-gray-400">
                <FolderPlus className="w-4 h-4" />
                <span className="text-sm">{ActiveSession.projectName}</span>
                <span className="text-xs px-2 py-1 bg-purple-600 text-white rounded">
                  {ActiveSession.commands.length} commands
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Messages Container */}
      <div className="flex-1 overflow-y-auto px-4 py-6 space-y-6">
        <div className="max-w-6xl mx-auto">
          <AnimatePresence mode="popLayout">
            {messages.length === 0 && !ActiveSession ? (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex flex-col items-center justify-center h-full text-center"
              >
                <div className="p-8 bg-gradient-to-br from-gray-800 to-gray-900 rounded-3xl max-w-lg border border-gray-700 shadow-2xl">
                  <div className="text-6xl mb-6">
                    {chatMode === 'cursor' ? '⚡' : '🤖'}
                  </div>
                  <h2 className="text-2xl font-bold text-white mb-3">
                    {chatMode === 'cursor' ? 'Ready to Build?' : 'Ready to Chat?'}
                  </h2>
                  <p className="text-gray-400 mb-6 leading-relaxed">
                    {chatMode === 'cursor' 
                      ? 'Describe your project and I\'ll generate terminal commands to build it step by step.'
                      : 'Ask me anything about web development, request code, or get help with your projects.'
                    }
                  </p>
                  <div className="text-sm text-gray-500 bg-gray-800 rounded-lg p-4">
                    <div className="font-medium text-purple-400 mb-2">Try asking:</div>
                    <div className="space-y-1">
                      {chatMode === 'cursor' ? (
                        <>
                          <div>"Create a modern calculator app"</div>
                          <div>"Build a todo list with animations"</div>
                          <div>"Make a portfolio website"</div>
                        </>
                      ) : (
                        <>
                          <div>"Create a responsive navbar"</div>
                          <div>"Help me debug this JavaScript"</div>
                          <div>"Explain CSS Grid layout"</div>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </motion.div>
            ) : (
              <>
                {/* Show either regular messages OR cursor interface, not both */}
                {chatMode === 'regular' ? (
                  // Regular chat messages
                  messages.map((message) => (
                    <MessageBubble key={message.id} message={message} />
                  ))
                ) : (
                  // Cursor interface when in cursor mode
                  ActiveSession && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      className="cursor-interface"
                    >
                      <CursorInterface />
                    </motion.div>
                  )
                )}
              </>
            )}
          </AnimatePresence>

          {/* Typing Indicator */}
          <AnimatePresence>
            {(isTyping || isGeneratingCommands) && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="flex items-center space-x-3 p-4"
              >
                <div className="w-8 h-8 bg-gray-700 rounded-full flex items-center justify-center">
                  {chatMode === 'cursor' ? (
                    <Terminal className="w-4 h-4 text-purple-400" />
                  ) : (
                    <div className="w-4 h-4 border-2 border-purple-400 border-t-transparent rounded-full animate-spin" />
                  )}
                </div>
                <div className="text-gray-400">
                  {isGeneratingCommands ? 'Generating terminal commands...' : 'AI is thinking...'}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input Container */}
      <div className="border-t border-gray-700 bg-gray-900/50 backdrop-blur-sm">
        <div className="max-w-4xl mx-auto p-6">
          <div className="flex space-x-4">
            <div className="flex-1 relative">
              <textarea
                ref={textareaRef}
                value={input}
                onChange={(e) => {
                  setInput(e.target.value)
                  adjustTextareaHeight()
                }}
                onKeyDown={handleKeyDown}
                placeholder={getPlaceholderText()}
                className="w-full px-4 py-3 pr-12 bg-gray-800 border border-gray-700 rounded-2xl text-white placeholder-gray-400 resize-none focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-transparent transition-all duration-200 min-h-[50px] max-h-[120px]"
                disabled={isSubmitting || !isConfigValid}
                rows={1}
              />
              
              {/* Send Button */}
              <button
                onClick={handleSubmit}
                disabled={!input.trim() || isSubmitting || !isConfigValid}
                className={`absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-gradient-to-r ${getModeColor(chatMode)} rounded-xl text-white disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-lg transition-all duration-200 disabled:hover:shadow-none`}
              >
                {isSubmitting || isGeneratingCommands ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : chatMode === 'cursor' ? (
                  <Zap className="w-5 h-5" />
                ) : (
                  <Send className="w-5 h-5" />
                )}
              </button>
            </div>
          </div>

          {/* Status Text */}
          <div className="flex justify-between items-center mt-3 text-xs text-gray-500">
            <span>
              {!isConfigValid 
                ? 'AI provider configuration required' 
                : chatMode === 'cursor'
                  ? 'Describe your project to generate terminal commands'
                  : 'Press Enter to send, Shift+Enter for new line'
              }
            </span>
            <div className="flex items-center space-x-4">
              <span className="text-gray-600">{input.length}/2000</span>
              {chatMode === 'cursor' && (
                <div className="flex items-center space-x-1">
                  <Terminal className="w-3 h-3" />
                  <span>Cursor Mode</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Click outside to close mode selector */}
      {showModeSelector && (
        <div 
          className="fixed inset-0 z-40" 
          onClick={() => setShowModeSelector(false)}
        />
      )}
    </div>
  )
}