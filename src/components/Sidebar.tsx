'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { 
  Code, 
  Globe, 
  Sparkles, 
  Zap, 
  Palette, 
  Bug,
  ChevronLeft,
  ChevronRight,
  Rocket
} from 'lucide-react'

interface SidebarProps {
  isOpen: boolean
  onToggle: () => void
}

export default function Sidebar({ isOpen, onToggle }: SidebarProps) {
  const features = [
    { icon: Code, text: 'Code Generation', color: 'text-blue-400' },
    { icon: Globe, text: 'Live Preview', color: 'text-green-400' },
    { icon: Palette, text: 'Modern UI/UX', color: 'text-pink-400' },
    { icon: Zap, text: 'Instant Results', color: 'text-yellow-400' },
    { icon: Bug, text: 'Debug Assistant', color: 'text-red-400' },
    { icon: Sparkles, text: 'AI-Powered', color: 'text-purple-400' },
  ]

  const quickPrompts = [
    'Create a modern landing page',
    'Build a todo app with animations',
    'Design a responsive dashboard',
    'Make a creative portfolio site',
    'Build a calculator with glassmorphism',
  ]

  return (
    <>
      {/* Toggle Button */}
      <button
        onClick={onToggle}
        className="fixed top-4 left-4 z-50 p-2 glass-strong rounded-lg hover:bg-white/20 transition-all duration-200"
      >
        {isOpen ? <ChevronLeft className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
      </button>

      {/* Sidebar */}
      <AnimatePresence>
        {isOpen && (
          <motion.aside
            initial={{ x: -300, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -300, opacity: 0 }}
            transition={{ duration: 0.3, ease: 'easeInOut' }}
            className="fixed left-0 top-0 h-full w-80 glass border-r border-white/10 z-40 overflow-y-auto"
          >
            <div className="p-6 space-y-6 mt-16">
              {/* Welcome Section */}
              <div className="glass-strong rounded-xl p-6">
                <div className="flex items-center space-x-3 mb-4">
                  <div className="p-2 gradient-primary rounded-lg">
                    <Rocket className="w-5 h-5 text-white" />
                  </div>
                  <h2 className="text-lg font-bold text-white">Welcome!</h2>
                </div>
                <p className="text-gray-300 text-sm leading-relaxed">
                  I'm your AI web development assistant. I can help you create modern websites, 
                  debug code, and build interactive applications with just a simple description.
                </p>
              </div>

              {/* Features */}
              <div className="glass-strong rounded-xl p-6">
                <h3 className="text-md font-semibold text-white mb-4 flex items-center">
                  <Sparkles className="w-4 h-4 mr-2 text-purple-400" />
                  Features
                </h3>
                <div className="space-y-3">
                  {features.map((feature, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="flex items-center space-x-3 p-2 rounded-lg hover:bg-white/5 transition-colors"
                    >
                      <feature.icon className={`w-4 h-4 ${feature.color}`} />
                      <span className="text-sm text-gray-300">{feature.text}</span>
                    </motion.div>
                  ))}
                </div>
              </div>

              {/* Quick Start Prompts */}
              <div className="glass-strong rounded-xl p-6">
                <h3 className="text-md font-semibold text-white mb-4 flex items-center">
                  <Zap className="w-4 h-4 mr-2 text-yellow-400" />
                  Quick Start
                </h3>
                <div className="space-y-2">
                  {quickPrompts.map((prompt, index) => (
                    <motion.button
                      key={index}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="w-full text-left p-3 text-sm text-gray-300 hover:text-white hover:bg-white/10 rounded-lg transition-all duration-200 border border-transparent hover:border-white/20"
                      onClick={() => {
                        // You can implement this to auto-fill the chat input
                        const event = new CustomEvent('quick-prompt', { detail: prompt })
                        window.dispatchEvent(event)
                      }}
                    >
                      {prompt}
                    </motion.button>
                  ))}
                </div>
              </div>

              {/* Usage Tips */}
              <div className="glass-strong rounded-xl p-6">
                <h3 className="text-md font-semibold text-white mb-4">💡 Tips</h3>
                <div className="space-y-2 text-xs text-gray-400">
                  <p>• Be specific about design preferences</p>
                  <p>• Mention target devices (mobile, desktop)</p>
                  <p>• Ask for explanations if you're learning</p>
                  <p>• Use "Preview" to see HTML code live</p>
                  <p>• Copy code blocks to use in your projects</p>
                </div>
              </div>
            </div>
          </motion.aside>
        )}
      </AnimatePresence>

      {/* Backdrop */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onToggle}
            className="fixed inset-0 bg-black/20 backdrop-blur-sm z-30 lg:hidden"
          />
        )}
      </AnimatePresence>
    </>
  )
}