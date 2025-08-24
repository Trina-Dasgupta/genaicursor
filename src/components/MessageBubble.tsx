'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { User, Bot, Copy, Check, Play, Code, EyeOff, Maximize2, RefreshCw } from 'lucide-react'
import { useState, useMemo } from 'react'
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'
import { atomDark } from 'react-syntax-highlighter/dist/esm/styles/prism'
import toast from 'react-hot-toast'

interface Message {
  id: string
  content: string
  role: 'user' | 'assistant'
  timestamp: Date
  codeBlocks?: CodeBlock[]
}

interface CodeBlock {
  id: string
  language: string
  code: string
}

interface MessageBubbleProps {
  message: Message
}

export default function MessageBubble({ message }: MessageBubbleProps) {
  const [copiedBlocks, setCopiedBlocks] = useState<Set<string>>(new Set())
  const [showCombinedPreview, setShowCombinedPreview] = useState(false)
  const [previewKey, setPreviewKey] = useState(0)
  
  const isUser = message.role === 'user'

  // Extract and combine all code blocks from the message
  const combinedCode = useMemo(() => {
    const extractCodeBlocks = (content: string) => {
      const parts = content.split(/(```[\w]*\n[\s\S]*?```)/g)
      const blocks: { [key: string]: string } = {
        html: '',
        css: '',
        javascript: ''
      }
      
      parts.forEach(part => {
        const codeMatch = part.match(/```(\w+)?\n([\s\S]*?)```/)
        if (codeMatch) {
          const [, language = 'text', code] = codeMatch
          const lang = language.toLowerCase()
          
          if (lang === 'html') {
            blocks.html += code + '\n'
          } else if (lang === 'css') {
            blocks.css += code + '\n'
          } else if (lang === 'javascript' || lang === 'js') {
            blocks.javascript += code + '\n'
          }
        }
      })
      
      return blocks
    }

    // Use codeBlocks if available, otherwise extract from content
    if (message.codeBlocks?.length) {
      const blocks: { [key: string]: string } = {
        html: '',
        css: '',
        javascript: ''
      }
      
      message.codeBlocks.forEach(block => {
        const lang = block.language.toLowerCase()
        if (lang === 'html') {
          blocks.html += block.code + '\n'
        } else if (lang === 'css') {
          blocks.css += block.code + '\n'
        } else if (lang === 'javascript' || lang === 'js') {
          blocks.javascript += block.code + '\n'
        }
      })
      
      return blocks
    }
    
    return extractCodeBlocks(message.content)
  }, [message])

  // Check if there are any web technologies to preview
  const hasWebCode = useMemo(() => {
    return combinedCode.html.trim() || combinedCode.css.trim() || combinedCode.javascript.trim()
  }, [combinedCode])

  // Create complete HTML document with all code combined
  const createCombinedPreview = () => {
    const { html, css, javascript } = combinedCode
    
    // Check if HTML already contains a complete document
    const hasCompleteHtml = html.includes('<!DOCTYPE') || html.includes('<html')
    
    if (hasCompleteHtml && !css && !javascript) {
      return html
    }
    
    // Create a complete document combining all code
    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Live Preview</title>
  <style>
    /* Reset and base styles */
    * {
      box-sizing: border-box;
    }
    
    body {
      margin: 0;
      padding: 20px;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
      line-height: 1.6;
      color: #333;
      background: #fff;
    }
    
    /* User CSS */
    ${css}
  </style>
</head>
<body>
  ${html}
  
  <script>
    // Error handling
    window.addEventListener('error', function(e) {
      console.error('Runtime Error:', e.error?.message || e.message);
    });
    
    // User JavaScript
    ${javascript}
  </script>
</body>
</html>`
  }

  const copyToClipboard = async (text: string, blockId: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopiedBlocks(prev => new Set(prev).add(blockId))
      toast.success('Code copied to clipboard!')
      
      setTimeout(() => {
        setCopiedBlocks(prev => {
          const newSet = new Set(prev)
          newSet.delete(blockId)
          return newSet
        })
      }, 2000)
    } catch (error) {
      toast.error('Failed to copy code')
    }
  }

  const copyAllCode = async () => {
    const { html, css, javascript } = combinedCode
    let combinedText = ''
    
    if (html.trim()) {
      combinedText += `HTML:\n\`\`\`html\n${html.trim()}\n\`\`\`\n\n`
    }
    if (css.trim()) {
      combinedText += `CSS:\n\`\`\`css\n${css.trim()}\n\`\`\`\n\n`
    }
    if (javascript.trim()) {
      combinedText += `JavaScript:\n\`\`\`javascript\n${javascript.trim()}\n\`\`\`\n\n`
    }
    
    try {
      await navigator.clipboard.writeText(combinedText)
      toast.success('All code copied to clipboard!')
    } catch (error) {
      toast.error('Failed to copy code')
    }
  }

  const refreshPreview = () => {
    setPreviewKey(prev => prev + 1)
  }

  const createBlobUrl = (content: string) => {
    const blob = new Blob([content], { type: 'text/html' })
    return URL.createObjectURL(blob)
  }

  const renderContent = () => {
    if (isUser) {
      return <div className="whitespace-pre-wrap">{message.content}</div>
    }

    // For AI messages, parse and render with combined preview option
    const parts = message.content.split(/(```[\w]*\n[\s\S]*?```)/g)
    
    return (
      <div className="space-y-4">
        {/* Combined Preview Button and Preview */}
        {hasWebCode && (
          <div className="space-y-3">
            {/* Preview Controls */}
            <div className="flex items-center justify-between p-3 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg">
              <div className="flex items-center space-x-2">
                <Code className="w-4 h-4 text-white" />
                <span className="text-white font-medium">Interactive Preview Available</span>
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={copyAllCode}
                  className="flex items-center space-x-1 px-3 py-1 text-xs bg-white/20 hover:bg-white/30 text-white rounded transition-colors"
                >
                  <Copy className="w-3 h-3" />
                  <span>Copy All</span>
                </button>
                <button
                  onClick={() => setShowCombinedPreview(!showCombinedPreview)}
                  className={`flex items-center space-x-1 px-3 py-1 text-xs rounded transition-colors ${
                    showCombinedPreview
                      ? 'bg-white text-blue-600'
                      : 'bg-white/20 hover:bg-white/30 text-white'
                  }`}
                >
                  {showCombinedPreview ? (
                    <>
                      <EyeOff className="w-3 h-3" />
                      <span>Hide Preview</span>
                    </>
                  ) : (
                    <>
                      <Play className="w-3 h-3" />
                      <span>Show Preview</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Combined Live Preview - Claude Style */}
            <AnimatePresence>
              {showCombinedPreview && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="rounded-xl overflow-hidden border border-gray-300 bg-white shadow-xl"
                >
                  {/* Preview Header */}
                  <div className="bg-gray-50 px-4 py-3 border-b border-gray-200 flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="flex space-x-1.5">
                        <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                        <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                        <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                      </div>
                      <span className="text-sm text-gray-700 font-medium">Live Preview</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={refreshPreview}
                        className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-200 rounded-md transition-colors"
                        title="Refresh Preview"
                      >
                        <RefreshCw className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setShowCombinedPreview(false)}
                        className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-200 rounded-md transition-colors"
                        title="Close Preview"
                      >
                        <EyeOff className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  
                  {/* Preview Content */}
                  <div className="relative bg-white">
                    <iframe
                      key={previewKey}
                      src={createBlobUrl(createCombinedPreview())}
                      className="w-full border-none bg-white"
                      style={{ height: '500px', minHeight: '400px' }}
                      title="Combined Code Preview"
                      sandbox="allow-scripts allow-same-origin allow-forms allow-modals allow-popups"
                    />
                  </div>
                  
                  {/* Preview Footer */}
                  <div className="bg-gray-50 px-4 py-2 border-t border-gray-200 text-xs text-gray-500">
                    <div className="flex justify-between items-center">
                      <span>
                        Combined: {combinedCode.html.trim() ? 'HTML' : ''} 
                        {combinedCode.css.trim() ? (combinedCode.html.trim() ? ' + CSS' : 'CSS') : ''} 
                        {combinedCode.javascript.trim() ? (combinedCode.html.trim() || combinedCode.css.trim() ? ' + JS' : 'JS') : ''}
                      </span>
                      <span className="text-gray-400">Sandboxed execution</span>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}

        {/* Individual Code Blocks */}
        {parts.map((part, index) => {
          const codeMatch = part.match(/```(\w+)?\n([\s\S]*?)```/)
          
          if (codeMatch) {
            const [, language = 'text', code] = codeMatch
            const blockId = `${message.id}-${index}`
            const isCopied = copiedBlocks.has(blockId)
            
            return (
              <div key={index} className="code-block rounded-xl overflow-hidden bg-gray-900 border border-gray-700">
                <div className="flex items-center justify-between p-3 bg-gray-800 border-b border-gray-700">
                  <span className="text-xs font-mono text-blue-300 uppercase tracking-wider">
                    {language}
                  </span>
                  <button
                    onClick={() => copyToClipboard(code, blockId)}
                    className="flex items-center space-x-1 px-2 py-1 text-xs bg-gray-700 hover:bg-gray-600 rounded transition-colors text-gray-300"
                    title="Copy code"
                  >
                    {isCopied ? (
                      <>
                        <Check className="w-3 h-3" />
                        <span>Copied!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3 h-3" />
                        <span>Copy</span>
                      </>
                    )}
                  </button>
                </div>
                
                <SyntaxHighlighter
                  language={language}
                  style={atomDark}
                  customStyle={{
                    margin: 0,
                    background: 'transparent',
                    padding: '1.25rem',
                    fontSize: '14px',
                    lineHeight: '1.5',
                  }}
                  wrapLines
                  showLineNumbers={language !== 'text'}
                >
                  {code}
                </SyntaxHighlighter>
              </div>
            )
          }
          
          return part ? (
            <div key={index} className="whitespace-pre-wrap leading-relaxed text-gray-200">
              {part}
            </div>
          ) : null
        })}
      </div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}
    >
      <div className={`flex space-x-3 max-w-6xl w-full ${isUser ? 'flex-row-reverse space-x-reverse' : ''}`}>
        {/* Avatar */}
        <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
          isUser 
            ? 'bg-gradient-to-br from-purple-500 to-pink-500' 
            : 'bg-gray-700 border border-gray-600'
        }`}>
          {isUser ? (
            <User className="w-4 h-4 text-white" />
          ) : (
            <Bot className="w-4 h-4 text-purple-300" />
          )}
        </div>

        {/* Message Content */}
        <div className={`px-6 py-4 rounded-2xl flex-1 ${
          isUser
            ? 'bg-gradient-to-br from-purple-500 to-pink-500 text-white'
            : 'bg-gray-800 border border-gray-700 text-gray-100'
        } ${isUser ? 'rounded-br-md' : 'rounded-bl-md'}`}>
          
          {/* Header */}
          <div className="flex items-center space-x-2 mb-3">
            <span className={`font-semibold text-sm ${
              isUser ? 'text-white' : 'text-gray-200'
            }`}>
              {isUser ? 'You' : 'AI Assistant'}
            </span>
            <span className={`text-xs ${
              isUser ? 'text-purple-100' : 'text-gray-500'
            }`}>
              {message.timestamp.toLocaleTimeString([], { 
                hour: '2-digit', 
                minute: '2-digit' 
              })}
            </span>
          </div>

          {/* Content */}
          <div className="text-sm">
            {renderContent()}
          </div>
        </div>
      </div>
    </motion.div>
  )
}