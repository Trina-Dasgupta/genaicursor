'use client'

import { motion } from 'framer-motion'
import { Bot } from 'lucide-react'

export default function TypingIndicator() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3 }}
      className="flex justify-start"
    >
      <div className="flex space-x-3 max-w-4xl">
        {/* Avatar */}
        <div className="flex-shrink-0 w-8 h-8 rounded-full glass-strong border border-white/20 flex items-center justify-center">
          <Bot className="w-4 h-4 text-purple-300" />
        </div>

        {/* Typing Animation */}
        <div className="px-6 py-4 glass-strong border border-white/10 rounded-2xl rounded-bl-md">
          <div className="flex items-center space-x-2">
            <div className="flex space-x-1">
              <div className="w-2 h-2 bg-purple-400 rounded-full typing-dot" />
              <div className="w-2 h-2 bg-purple-400 rounded-full typing-dot" />
              <div className="w-2 h-2 bg-purple-400 rounded-full typing-dot" />
            </div>
            <span className="text-sm text-gray-400 ml-2">
              AI is thinking...
            </span>
          </div>
        </div>
      </div>
    </motion.div>
  )
}