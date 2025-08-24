'use client'

import { useState } from 'react'
import { Brain, Settings, ChevronDown, X } from 'lucide-react'
import { useAIStore } from '@/store/useAIStore'
import toast from 'react-hot-toast'
import ProviderSelector, { PROVIDERS } from './ProvidorSelector'

export default function Header() {
  const { llmConfig, setLLMConfig, clearMessages } = useAIStore()
  const [showConfig, setShowConfig] = useState(!llmConfig.apiKey)

  const currentProvider = PROVIDERS.find(p => p.id === llmConfig.provider)

  const handleSaveConfig = () => {
    if (!llmConfig.apiKey?.trim()) {
      toast.error('Please enter a valid API key')
      return
    }

    if (llmConfig.provider === 'custom' && !llmConfig.baseURL?.trim()) {
      toast.error('Base URL is required for custom API')
      return
    }

    setShowConfig(false)
    toast.success(`${currentProvider?.name} configured successfully!`)
  }

  const handleClearChat = () => {
    clearMessages()
    toast.success('Chat cleared!')
  }

  const isConfigValid = llmConfig.apiKey && 
    (llmConfig.provider !== 'custom' || llmConfig.baseURL)

  return (
    <>
      <header className="glass border-b border-white/10 px-6 py-4 relative z-30">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center space-x-3">
            <div className="p-2 gradient-primary rounded-xl">
              <Brain className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">
                Multi-LLM Assistant
              </h1>
              <p className="text-xs text-gray-400">
                {currentProvider?.name} • {llmConfig.model}
              </p>
            </div>
          </div>

          {/* Controls */}
          <div className="flex items-center space-x-4">
            {/* Provider Status */}
            <div className="hidden sm:flex items-center space-x-2">
              <div className={`w-2 h-2 rounded-full ${isConfigValid ? currentProvider?.color : 'bg-red-400'}`} />
              <span className="text-sm text-gray-300">
                {isConfigValid ? `${currentProvider?.name} Ready` : 'Setup Required'}
              </span>
            </div>

            {/* Provider Button */}
            <button
              onClick={() => setShowConfig(!showConfig)}
              className="flex items-center space-x-2 px-3 py-2 glass-strong rounded-lg hover:bg-white/20 transition-all duration-200"
              title="Configure AI Provider"
            >
              <span className="text-xl">{currentProvider?.icon}</span>
              <span className="hidden sm:block text-sm font-medium">{currentProvider?.name}</span>
              <ChevronDown className={`w-4 h-4 transition-transform ${showConfig ? 'rotate-180' : ''}`} />
            </button>

            {/* Clear Chat */}
            <button
              onClick={handleClearChat}
              className="p-2 glass-strong rounded-lg hover:bg-white/20 transition-all duration-200"
              title="Clear Chat"
            >
              <Settings className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* Configuration Modal/Panel */}
      {showConfig && (
        <>
          {/* Backdrop */}
          <div 
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40"
            onClick={() => setShowConfig(false)}
          />
          
          {/* Configuration Panel */}
          <div className="fixed inset-x-4 top-20 bottom-4 md:inset-x-8 lg:inset-x-16 xl:inset-x-32 glass-strong border border-white/20 rounded-2xl z-50 overflow-hidden">
            <div className="flex flex-col h-full">
              {/* Header */}
              <div className="flex items-center justify-between p-6 border-b border-white/10">
                <div className="flex items-center space-x-3">
                  <div className="p-2 gradient-primary rounded-lg">
                    <Brain className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-white">AI Provider Configuration</h2>
                    <p className="text-sm text-gray-400">Choose and configure your preferred AI provider</p>
                  </div>
                </div>
                
                <button
                  onClick={() => setShowConfig(false)}
                  className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                  title="Close"
                >
                  <X className="w-5 h-5 text-gray-400" />
                </button>
              </div>

              {/* Content - Fixed ProviderSelector integration */}
              <div className="flex-1 overflow-y-auto p-6">
                <ProviderSelector
                  selectedProvider={llmConfig.provider}
                  onProviderChange={(provider) => setLLMConfig({ ...llmConfig, provider })}
                  config={llmConfig}
                  onConfigChange={(updates) => setLLMConfig({ ...llmConfig, ...updates })}
                />
              </div>

              {/* Footer */}
              <div className="p-6 border-t border-white/10 bg-black/20">
                <div className="flex flex-col sm:flex-row gap-3 sm:justify-between sm:items-center">
                  <div className="text-xs text-gray-400">
                    Your API keys are stored locally and never sent to our servers.
                  </div>
                  
                  <div className="flex space-x-3">
                    <button
                      onClick={() => setShowConfig(false)}
                      className="px-4 py-2 text-sm text-gray-300 hover:text-white border border-white/20 rounded-lg hover:bg-white/5 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleSaveConfig}
                      disabled={!isConfigValid}
                      className="px-6 py-2 text-sm gradient-primary text-white rounded-lg font-medium hover:shadow-lg hover:shadow-purple-500/25 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:shadow-none"
                    >
                      Save & Continue
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </>
  )
}