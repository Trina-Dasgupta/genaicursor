import { create } from 'zustand'
import { OpenAI } from 'openai'
import { GoogleGenerativeAI } from '@google/generative-ai'

export interface Message {
  id: string
  content: string
  role: 'user' | 'assistant'
  timestamp: Date
  codeBlocks?: CodeBlock[]
}

export interface CodeBlock {
  id: string
  language: string
  code: string
}

export type LLMProvider = 'openai' | 'gemini' | 'claude' | 'custom'

export interface LLMConfig {
  provider: LLMProvider
  apiKey: string
  model: string
  baseURL?: string // For custom endpoints
  headers?: Record<string, string> // For custom headers
}

interface AIStore {
  // State
  llmConfig: LLMConfig
  messages: Message[]
  isTyping: boolean
  isPreviewOpen: boolean
  previewContent: string
  openaiClient: OpenAI | null
  geminiClient: GoogleGenerativeAI | null
  
  // Actions
  setLLMConfig: (config: Partial<LLMConfig>) => void
  addMessage: (message: Omit<Message, 'id' | 'timestamp'>) => void
  setIsTyping: (typing: boolean) => void
  setPreviewOpen: (open: boolean) => void
  setPreviewContent: (content: string) => void
  sendMessage: (content: string) => Promise<void>
  clearMessages: () => void
}

export const useAIStore = create<AIStore>((set, get) => ({
  // Initial state
  llmConfig: {
    provider: 'openai',
    apiKey: '',
    model: 'gpt-4',
  },
  messages: [],
  isTyping: false,
  isPreviewOpen: false,
  previewContent: '',
  openaiClient: null,
  geminiClient: null,

  // Actions
  setLLMConfig: (config: Partial<LLMConfig>) => {
    const currentConfig = get().llmConfig
    const newConfig = { ...currentConfig, ...config }
    
    // Initialize clients based on provider
    let openaiClient = null
    let geminiClient = null
    
    if (newConfig.provider === 'openai' && newConfig.apiKey) {
      openaiClient = new OpenAI({
        apiKey: newConfig.apiKey,
        dangerouslyAllowBrowser: true,
        ...(newConfig.baseURL && { baseURL: newConfig.baseURL }),
      })
    } else if (newConfig.provider === 'gemini' && newConfig.apiKey) {
      geminiClient = new GoogleGenerativeAI(newConfig.apiKey)
    }

    set({ 
      llmConfig: newConfig, 
      openaiClient, 
      geminiClient 
    })
  },

  addMessage: (message) => {
    const newMessage: Message = {
      ...message,
      id: Date.now().toString(),
      timestamp: new Date(),
    }
    set((state) => ({ messages: [...state.messages, newMessage] }))
  },

  setIsTyping: (typing) => set({ isTyping: typing }),
  setPreviewOpen: (open) => set({ isPreviewOpen: open }),
  setPreviewContent: (content) => set({ previewContent: content }),

  sendMessage: async (content: string) => {
    const { llmConfig, openaiClient, geminiClient, addMessage, setIsTyping } = get()
    
    if (!llmConfig.apiKey) {
      throw new Error('API key not set')
    }

    // Add user message
    addMessage({ content, role: 'user' })
    setIsTyping(true)

    try {
      const messages = get().messages
      let assistantMessage = ''

      // Route to appropriate LLM provider
      switch (llmConfig.provider) {
        case 'openai':
          assistantMessage = await sendToOpenAI(openaiClient, messages, llmConfig)
          break
        case 'gemini':
          assistantMessage = await sendToGemini(geminiClient, messages, llmConfig)
          break
        case 'claude':
          assistantMessage = await sendToClaude(messages, llmConfig)
          break
        case 'custom':
          assistantMessage = await sendToCustomAPI(messages, llmConfig)
          break
        default:
          throw new Error('Unsupported LLM provider')
      }
      
      // Extract code blocks
      const codeBlocks = extractCodeBlocks(assistantMessage)
      
      addMessage({ 
        content: assistantMessage, 
        role: 'assistant',
        codeBlocks 
      })
    } catch (error) {
      console.error('LLM API Error:', error)
      addMessage({ 
        content: `Error: ${error instanceof Error ? error.message : 'Unknown error occurred'}`, 
        role: 'assistant' 
      })
    } finally {
      setIsTyping(false)
    }
  },

  clearMessages: () => set({ messages: [] }),
}))



// System prompt for all providers
const getSystemPrompt = () => `You are an expert web development AI assistant. When users ask you to create websites, applications, or code:

1. Provide complete, working code with modern practices
2. Use semantic HTML5, modern CSS (flexbox, grid, animations), and vanilla JavaScript or modern frameworks
3. Make designs responsive and visually appealing
4. Always wrap complete HTML code in \`\`\`html code blocks
5. Wrap CSS in \`\`\`css blocks and JavaScript in \`\`\`javascript blocks
6. Explain your code and provide usage instructions
7. For debugging, provide clear explanations and corrected code
8. Focus on creating beautiful, functional web experiences

Keep responses concise but comprehensive. Always provide working, complete code when requested.`

// OpenAI API handler
async function sendToOpenAI(
  client: OpenAI | null, 
  messages: Message[], 
  config: LLMConfig
): Promise<string> {
  if (!client) {
    throw new Error('OpenAI client not initialized')
  }

  const conversation = messages.map(msg => ({
    role: msg.role as 'user' | 'assistant',
    content: msg.content
  }))

  const response = await client.chat.completions.create({
    model: config.model,
    messages: [
      { role: 'system', content: getSystemPrompt() },
      ...conversation,
    ],
    temperature: 0.7,
    max_tokens: 2000,
  })

  return response.choices[0]?.message?.content || 'Sorry, I could not generate a response.'
}

// Gemini API handler
async function sendToGemini(
  client: GoogleGenerativeAI | null,
  messages: Message[],
  config: LLMConfig
): Promise<string> {
  if (!client) {
    throw new Error('Gemini client not initialized')
  }

  const model = client.getGenerativeModel({ model: config.model })

  // Convert conversation to Gemini format
  const history = messages.slice(0, -1).map(msg => ({
    role: msg.role === 'user' ? 'user' : 'model',
    parts: [{ text: msg.content }]
  }))

  const chat = model.startChat({
    history,
    generationConfig: {
      maxOutputTokens: 2000,
      temperature: 0.7,
    },
  })

  const lastMessage = messages[messages.length - 1]
  const result = await chat.sendMessage([
    { text: getSystemPrompt() },
    { text: lastMessage.content }
  ])

  return result.response.text() || 'Sorry, I could not generate a response.'
}

// Claude API handler (via Anthropic)
async function sendToClaude(
  messages: Message[],
  config: LLMConfig
): Promise<string> {
  const conversation = messages.map(msg => ({
    role: msg.role,
    content: msg.content
  }))

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': config.apiKey,
      'anthropic-version': '2023-06-01',
      ...(config.headers || {})
    },
    body: JSON.stringify({
      model: config.model,
      max_tokens: 2000,
      system: getSystemPrompt(),
      messages: conversation,
    })
  })

  if (!response.ok) {
    throw new Error(`Claude API error: ${response.statusText}`)
  }

  const data = await response.json()
  return data.content[0]?.text || 'Sorry, I could not generate a response.'
}

// Custom API handler
async function sendToCustomAPI(
  messages: Message[],
  config: LLMConfig
): Promise<string> {
  if (!config.baseURL) {
    throw new Error('Base URL required for custom API')
  }

  const conversation = messages.map(msg => ({
    role: msg.role,
    content: msg.content
  }))

  const response = await fetch(config.baseURL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${config.apiKey}`,
      ...(config.headers || {})
    },
    body: JSON.stringify({
      model: config.model,
      messages: [
        { role: 'system', content: getSystemPrompt() },
        ...conversation
      ],
      temperature: 0.7,
      max_tokens: 2000,
    })
  })

  if (!response.ok) {
    throw new Error(`Custom API error: ${response.statusText}`)
  }

  const data = await response.json()
  return data.choices[0]?.message?.content || data.content || 'Sorry, I could not generate a response.'
}

// Helper function to extract code blocks
function extractCodeBlocks(content: string): CodeBlock[] {
  const codeBlockRegex = /```(\w+)?\n([\s\S]*?)```/g
  const blocks: CodeBlock[] = []
  let match

  while ((match = codeBlockRegex.exec(content)) !== null) {
    blocks.push({
      id: Date.now().toString() + Math.random(),
      language: match[1] || 'text',
      code: match[2].trim(),
    })
  }

  return blocks
}