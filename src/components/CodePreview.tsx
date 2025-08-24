'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { X, Maximize2, Minimize2, RefreshCw, ExternalLink } from 'lucide-react'
import { useAIStore } from '@/store/useAIStore'
import { useState } from 'react'

export default function CodePreview() {
  const { isPreviewOpen, previewContent, setPreviewOpen } = useAIStore()
  const [isMaximized, setIsMaximized] = useState(false)
  const [iframeKey, setIframeKey] = useState(0)

  // Create blob URL for iframe content with proper HTML structure
  const createBlobUrl = (content: string) => {
    // Check if content is already a full HTML document
    if (content.includes('<!DOCTYPE') || content.includes('<html')) {
      const blob = new Blob([content], { type: 'text/html' })
      return URL.createObjectURL(blob)
    }
    
    // If it's just HTML fragments, wrap them in a proper HTML document
    const fullHtml = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Code Preview</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      margin: 0;
      padding: 20px;
      background: white;
      color: #333;
    }
    * {
      box-sizing: border-box;
    }
  </style>
</head>
<body>
  ${content}
</body>
</html>`
    
    const blob = new Blob([fullHtml], { type: 'text/html' })
    return URL.createObjectURL(blob)
  }

  const refreshPreview = () => {
    setIframeKey(prev => prev + 1)
  }

  const openInNewTab = () => {
    if (!previewContent) return
    
    const newWindow = window.open()
    if (newWindow) {
      // Create a complete HTML document
      const fullHtml = previewContent.includes('<!DOCTYPE') 
        ? previewContent 
        : `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Code Preview</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 20px; }
  </style>
</head>
<body>${previewContent}</body>
</html>`
      
      newWindow.document.write(fullHtml)
      newWindow.document.close()
    }
  }

  return (
    <AnimatePresence>
      {isPreviewOpen && (
        <>
          {/* Backdrop for mobile */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setPreviewOpen(false)}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 lg:hidden"
          />

          {/* Preview Panel */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            className={`fixed top-0 right-0 bg-white shadow-2xl z-50 flex flex-col ${
              isMaximized 
                ? 'w-full h-full' 
                : 'w-full lg:w-1/2 h-full'
            }`}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 bg-gray-50 border-b border-gray-200">
              <div className="flex items-center space-x-3">
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-red-500 rounded-full" />
                  <div className="w-3 h-3 bg-yellow-500 rounded-full" />
                  <div className="w-3 h-3 bg-green-500 rounded-full" />
                </div>
                <h3 className="font-semibold text-gray-900">Live Preview</h3>
              </div>

              <div className="flex items-center space-x-2">
                {/* Refresh */}
                <button
                  onClick={refreshPreview}
                  className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-200 rounded-lg transition-colors"
                  title="Refresh Preview"
                >
                  <RefreshCw className="w-4 h-4" />
                </button>

                {/* Open in New Tab */}
                <button
                  onClick={openInNewTab}
                  className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-200 rounded-lg transition-colors"
                  title="Open in New Tab"
                >
                  <ExternalLink className="w-4 h-4" />
                </button>

                {/* Maximize/Minimize */}
                <button
                  onClick={() => setIsMaximized(!isMaximized)}
                  className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-200 rounded-lg transition-colors hidden lg:block"
                  title={isMaximized ? 'Minimize' : 'Maximize'}
                >
                  {isMaximized ? (
                    <Minimize2 className="w-4 h-4" />
                  ) : (
                    <Maximize2 className="w-4 h-4" />
                  )}
                </button>

                {/* Close */}
                <button
                  onClick={() => setPreviewOpen(false)}
                  className="p-2 text-gray-500 hover:text-gray-700 hover:bg-red-100 hover:text-red-600 rounded-lg transition-colors"
                  title="Close Preview"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Preview Content */}
            <div className="flex-1 relative">
              {previewContent ? (
                <iframe
                  key={iframeKey}
                  src={createBlobUrl(previewContent)}
                  className="w-full h-full border-none"
                  title="Code Preview"
                  sandbox="allow-scripts allow-same-origin allow-forms allow-modals"
                />
              ) : (
                <div className="flex items-center justify-center h-full bg-gray-50">
                  <div className="text-center p-8">
                    <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
                      <ExternalLink className="w-8 h-8 text-gray-400" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      No Preview Available
                    </h3>
                    <p className="text-gray-500 text-sm">
                      Generate HTML code to see a live preview here
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Footer with URL */}
            <div className="px-4 py-2 bg-gray-50 border-t border-gray-200">
              <div className="flex items-center text-xs text-gray-500">
                <span className="truncate">
                  {previewContent ? 'blob:preview-content' : 'No content loaded'}
                </span>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}