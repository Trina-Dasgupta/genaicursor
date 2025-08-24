'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Check, ExternalLink, Info } from 'lucide-react'
import { LLMProvider, LLMConfig } from '@/store/useAIStore'

export interface ProviderConfig {
  id: LLMProvider
  name: string
  models: string[]
  placeholder: string
  color: string
  description: string
  icon: string
  pricing?: string
  features: string[]
  getApiKeyUrl: string
  apiKeyPattern?: RegExp
}

export const PROVIDERS: ProviderConfig[] = [
  {
    id: 'openai',
    name: 'OpenAI',
    models: ['gpt-4', 'gpt-4-turbo', 'gpt-3.5-turbo', 'gpt-4o'],
    placeholder: 'sk-proj-...',
    color: 'bg-green-500',
    description: 'Most popular AI models with excellent code generation',
    icon: '🤖',
    pricing: '$0.03/1K tokens',
    features: ['Advanced reasoning', 'Code generation', 'Large context'],
    getApiKeyUrl: 'https://platform.openai.com/api-keys',
    apiKeyPattern: /^sk-/
  },
  {
    id: 'gemini',
    name: 'Google Gemini',
    models: ['gemini-pro', 'gemini-pro-vision', 'gemini-1.5-pro'],
    placeholder: 'AIzaSy...',
    color: 'bg-blue-500',
    description: 'Google\'s powerful multimodal AI with competitive pricing',
    icon: '🔷',
    pricing: '$0.0005/1K tokens',
    features: ['Multimodal', 'Fast responses', 'Cost effective'],
    getApiKeyUrl: 'https://makersuite.google.com/app/apikey',
    apiKeyPattern: /^AIzaSy/
  },
  {
    id: 'claude',
    name: 'Anthropic Claude',
    models: ['claude-3-opus-20240229', 'claude-3-sonnet-20240229', 'claude-3-haiku-20240307'],
    placeholder: 'sk-ant-...',
    color: 'bg-orange-500',
    description: 'Helpful, harmless, and honest AI with strong reasoning',
    icon: '🎭',
    pricing: '$0.015/1K tokens',
    features: ['Safety focused', 'Long context', 'Constitutional AI'],
    getApiKeyUrl: 'https://console.anthropic.com/',
    apiKeyPattern: /^sk-ant-/
  },
  {
    id: 'custom',
    name: 'Custom API',
    models: ['custom-model', 'llama-2', 'mistral', 'other'],
    placeholder: 'your-api-key',
    color: 'bg-purple-500',
    description: 'Connect to any OpenAI-compatible API endpoint',
    icon: '⚙️',
    pricing: 'Varies',
    features: ['Self-hosted', 'Open source', 'Full control'],
    getApiKeyUrl: '#',
    apiKeyPattern: /.+/
  }
]

interface ProviderSelectorProps {
  selectedProvider: LLMProvider
  onProviderChange: (provider: LLMProvider) => void
  config: LLMConfig
  onConfigChange: (config: Partial<LLMConfig>) => void
}

export default function ProviderSelector({
  selectedProvider,
  onProviderChange,
  config,
  onConfigChange
}: ProviderSelectorProps) {
  const [showDetails, setShowDetails] = useState<string | null>(null)
  
  const currentProvider = PROVIDERS.find(p => p.id === selectedProvider)
  
  const validateApiKey = (key: string, provider: ProviderConfig): boolean => {
    if (!key.trim()) return false
    return provider.apiKeyPattern ? provider.apiKeyPattern.test(key) : true
  }

  const handleProviderChange = (providerId: LLMProvider) => {
    const provider = PROVIDERS.find(p => p.id === providerId)
    if (provider) {
      onProviderChange(providerId)
      // Auto-select the first model for the new provider
      onConfigChange({ 
        provider: providerId, 
        model: provider.models[0],
        baseURL: providerId === 'custom' ? config.baseURL : undefined
      })
    }
  }

  return (
    <div className="space-y-6">
      {/* Provider Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {PROVIDERS.map((provider) => (
          <motion.button
            key={provider.id}
            onClick={() => handleProviderChange(provider.id)}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className={`relative p-4 rounded-xl border-2 text-left transition-all duration-200 ${
              selectedProvider === provider.id
                ? 'border-purple-400 bg-purple-400/10 shadow-lg shadow-purple-500/20'
                : 'border-white/20 hover:border-white/40 hover:bg-white/5'
            }`}
          >
            {/* Selection Indicator */}
            {selectedProvider === provider.id && (
              <div className="absolute -top-2 -right-2 w-6 h-6 bg-purple-500 rounded-full flex items-center justify-center">
                <Check className="w-4 h-4 text-white" />
              </div>
            )}

            {/* Provider Info */}
            <div className="space-y-3">
              <div className="flex items-center space-x-3">
                <span className="text-2xl">{provider.icon}</span>
                <div className={`w-3 h-3 rounded-full ${provider.color}`} />
              </div>
              
              <div>
                <h3 className="font-semibold text-white">{provider.name}</h3>
                <p className="text-xs text-gray-400 mt-1">{provider.description}</p>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-500">{provider.pricing}</span>
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    setShowDetails(showDetails === provider.id ? null : provider.id)
                  }}
                  className="p-1 hover:bg-white/10 rounded transition-colors"
                >
                  <Info className="w-3 h-3 text-gray-400" />
                </button>
              </div>
            </div>

            {/* Expanded Details */}
            {showDetails === provider.id && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="absolute top-full left-0 right-0 mt-2 p-4 glass-strong rounded-lg border border-white/20 z-10"
              >
                <div className="space-y-2">
                  <h4 className="text-sm font-medium text-white">Features:</h4>
                  <ul className="text-xs text-gray-300 space-y-1">
                    {provider.features.map((feature, index) => (
                      <li key={index} className="flex items-center space-x-2">
                        <div className="w-1 h-1 bg-purple-400 rounded-full" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                  
                  {provider.id !== 'custom' && (
                    <a
                      href={provider.getApiKeyUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center space-x-1 text-xs text-purple-400 hover:text-purple-300 mt-2"
                    >
                      <span>Get API Key</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                </div>
              </motion.div>
            )}
          </motion.button>
        ))}
      </div>

      {/* Configuration Form */}
      {currentProvider && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-4"
        >
          <div className="flex items-center space-x-3 mb-4">
            <span className="text-2xl">{currentProvider.icon}</span>
            <div>
              <h3 className="text-lg font-semibold text-white">{currentProvider.name} Configuration</h3>
              <p className="text-sm text-gray-400">{currentProvider.description}</p>
            </div>
          </div>

          {/* API Key Input */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-300">
              API Key
            </label>
            <div className="relative">
              <input
                type="password"
                value={config.apiKey}
                onChange={(e) => onConfigChange({ apiKey: e.target.value })}
                placeholder={currentProvider.placeholder}
                className={`w-full px-4 py-3 bg-black/30 border rounded-lg text-white placeholder-gray-400 focus:outline-none transition-colors ${
                  config.apiKey && validateApiKey(config.apiKey, currentProvider)
                    ? 'border-green-400 focus:border-green-400'
                    : config.apiKey
                    ? 'border-red-400 focus:border-red-400'
                    : 'border-white/20 focus:border-purple-400'
                }`}
              />
              {config.apiKey && (
                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                  {validateApiKey(config.apiKey, currentProvider) ? (
                    <Check className="w-5 h-5 text-green-400" />
                  ) : (
                    <div className="w-5 h-5 rounded-full border-2 border-red-400" />
                  )}
                </div>
              )}
            </div>
            
            {config.apiKey && !validateApiKey(config.apiKey, currentProvider) && (
              <p className="text-xs text-red-400">
                Invalid API key format. Expected format: {currentProvider.placeholder}
              </p>
            )}
          </div>

          {/* Model Selection */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-300">
              Model
            </label>
            <select
              value={config.model}
              onChange={(e) => onConfigChange({ model: e.target.value })}
              className="w-full px-4 py-3 bg-black/30 border border-white/20 rounded-lg text-white focus:border-purple-400 focus:outline-none transition-colors"
            >
              {currentProvider.models.map((model) => (
                <option key={model} value={model} className="bg-gray-800">
                  {model}
                </option>
              ))}
            </select>
          </div>

          {/* Free Tier Notice for Gemini */}
          {selectedProvider === 'gemini' && (
            <div className="p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg">
              <div className="flex items-start space-x-2">
                <Info className="w-4 h-4 text-blue-400 mt-0.5 flex-shrink-0" />
                <div className="text-xs text-blue-200">
                  <p className="font-medium mb-1">Gemini Free Tier:</p>
                  <ul className="space-y-1">
                    <li>• Use <code className="bg-blue-900/30 px-1 rounded">gemini-pro</code> for best free tier compatibility</li>
                    <li>• 15 requests per minute limit</li>
                    <li>• 1 million tokens per day limit</li>
                  </ul>
                </div>
              </div>
            </div>
          )}

          {/* Custom API Configuration */}
          {selectedProvider === 'custom' && (
            <div className="space-y-4 p-4 bg-black/20 rounded-lg border border-white/10">
              <h4 className="text-sm font-medium text-purple-300">Custom API Settings</h4>
              
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-300">
                  Base URL *
                </label>
                <input
                  type="url"
                  value={config.baseURL || ''}
                  onChange={(e) => onConfigChange({ baseURL: e.target.value })}
                  placeholder="https://api.your-provider.com/v1/chat/completions"
                  className="w-full px-4 py-3 bg-black/30 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:border-purple-400 focus:outline-none transition-colors"
                />
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-300">
                  Custom Model Name
                </label>
                <input
                  type="text"
                  value={config.model === 'custom-model' ? '' : config.model}
                  onChange={(e) => onConfigChange({ model: e.target.value || 'custom-model' })}
                  placeholder="llama-2-70b, mistral-7b, etc."
                  className="w-full px-4 py-3 bg-black/30 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:border-purple-400 focus:outline-none transition-colors"
                />
              </div>
            </div>
          )}

          {/* Help Section */}
          <div className="p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg">
            <div className="flex items-start space-x-3">
              <Info className="w-5 h-5 text-blue-400 mt-0.5 flex-shrink-0" />
              <div className="space-y-2">
                <h4 className="text-sm font-medium text-blue-300">
                  How to get your {currentProvider.name} API key:
                </h4>
                <div className="text-xs text-blue-200 space-y-1">
                  {selectedProvider === 'openai' && (
                    <>
                      <p>1. Visit <a href={currentProvider.getApiKeyUrl} target="_blank" rel="noopener noreferrer" className="underline hover:text-white">OpenAI Platform</a></p>
                      <p>2. Sign in and navigate to API Keys</p>
                      <p>3. Create a new secret key</p>
                      <p>4. Copy the key (starts with sk-proj- or sk-)</p>
                    </>
                  )}
                  {selectedProvider === 'gemini' && (
                    <>
                      <p>1. Go to <a href={currentProvider.getApiKeyUrl} target="_blank" rel="noopener noreferrer" className="underline hover:text-white">Google AI Studio</a></p>
                      <p>2. Sign in with your Google account</p>
                      <p>3. Create API key</p>
                      <p>4. Copy the key (starts with AIzaSy)</p>
                      <p className="text-yellow-300">⚠️ Make sure to select <strong>gemini-pro</strong> model for free tier</p>
                    </>
                  )}
                  {selectedProvider === 'claude' && (
                    <>
                      <p>1. Visit <a href={currentProvider.getApiKeyUrl} target="_blank" rel="noopener noreferrer" className="underline hover:text-white">Anthropic Console</a></p>
                      <p>2. Sign up or sign in</p>
                      <p>3. Go to API Keys section</p>
                      <p>4. Create and copy your key (starts with sk-ant-)</p>
                    </>
                  )}
                  {selectedProvider === 'custom' && (
                    <>
                      <p>1. Use any OpenAI-compatible API (Ollama, LM Studio, etc.)</p>
                      <p>2. Ensure the endpoint accepts OpenAI format</p>
                      <p>3. Enter your base URL and authentication</p>
                      <p>4. Test with a simple message</p>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  )
}
    