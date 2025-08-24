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
  baseURL?: string
  headers?: Record<string, string>
}

// New Cursor interfaces
export interface CursorCommand {
  id: string
  command: string
  description: string
  status: 'pending' | 'executing' | 'completed' | 'error'
  output?: string
  timestamp: Date
}

export interface CursorSession {
  id: string
  projectName: string
  description: string
  commands: CursorCommand[]
  isActive: boolean
  createdAt: Date
}

export type ChatMode = 'regular' | 'cursor'

interface AIStore {
  // Existing state
  llmConfig: LLMConfig
  messages: Message[]
  isTyping: boolean
  isPreviewOpen: boolean
  previewContent: string
  openaiClient: OpenAI | null
  geminiClient: GoogleGenerativeAI | null
  
  // New Cursor state
  cursorSessions: CursorSession[]
  activeCursorSession: string | null
  isGeneratingCommands: boolean
  chatMode: ChatMode
  
  // Existing actions
  setLLMConfig: (config: Partial<LLMConfig>) => void
  addMessage: (message: Omit<Message, 'id' | 'timestamp'>) => void
  setIsTyping: (typing: boolean) => void
  setPreviewOpen: (open: boolean) => void
  setPreviewContent: (content: string) => void
  sendMessage: (content: string) => Promise<void>
  clearMessages: () => void
  
  // New Cursor actions
  setChatMode: (mode: ChatMode) => void
  createCursorSession: (projectName: string, description: string) => Promise<void>
  generateCommands: (description: string) => Promise<void>
  executeCommand: (sessionId: string, commandId: string) => Promise<void>
  setActiveCursorSession: (sessionId: string | null) => void
  clearCursorSessions: () => void
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
  
  // New Cursor state
  cursorSessions: [],
  activeCursorSession: null,
  isGeneratingCommands: false,
  chatMode: 'regular',

  // Existing actions
  setLLMConfig: (config: Partial<LLMConfig>) => {
    const currentConfig = get().llmConfig
    const newConfig = { ...currentConfig, ...config }
    
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
  clearMessages: () => set({ messages: [] }),

  sendMessage: async (content: string) => {
    const { llmConfig, openaiClient, geminiClient, addMessage, setIsTyping, chatMode } = get()
    
    if (!llmConfig.apiKey) {
      throw new Error('API key not set')
    }

    // Handle cursor mode differently
    if (chatMode === 'cursor') {
      const projectName = extractProjectName(content)
      await get().createCursorSession(projectName, content)
      await get().generateCommands(content)
      return
    }

    // Regular chat mode
    addMessage({ content, role: 'user' })
    setIsTyping(true)

    try {
      const messages = get().messages
      let assistantMessage = ''

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

  // New Cursor actions
  setChatMode: (mode: ChatMode) => set({ chatMode: mode }),

  createCursorSession: async (projectName: string, description: string) => {
    const newSession: CursorSession = {
      id: Date.now().toString(),
      projectName,
      description,
      commands: [],
      isActive: true,
      createdAt: new Date()
    }

    set((state) => ({
      cursorSessions: [...state.cursorSessions, newSession],
      activeCursorSession: newSession.id
    }))
  },

  generateCommands: async (description: string) => {
    const { llmConfig, openaiClient, geminiClient, activeCursorSession } = get()
    
    if (!llmConfig.apiKey || !activeCursorSession) {
      throw new Error('API key or active session not set')
    }

    set({ isGeneratingCommands: true })

    try {
      let commands: CursorCommand[] = []

      // Generate commands using selected LLM
      switch (llmConfig.provider) {
        case 'openai':
          commands = await generateCommandsOpenAI(openaiClient, description, llmConfig)
          break
        case 'gemini':
          commands = await generateCommandsGemini(geminiClient, description, llmConfig)
          break
        case 'claude':
          commands = await generateCommandsClaude(description, llmConfig)
          break
        case 'custom':
          commands = await generateCommandsCustom(description, llmConfig)
          break
        default:
          throw new Error('Unsupported LLM provider')
      }

      // Update the active session with generated commands
      set((state) => ({
        cursorSessions: state.cursorSessions.map(session =>
          session.id === activeCursorSession
            ? { ...session, commands }
            : session
        )
      }))

    } catch (error) {
      console.error('Command generation error:', error)
      throw error
    } finally {
      set({ isGeneratingCommands: false })
    }
  },

  executeCommand: async (sessionId: string, commandId: string) => {
    // Update command status to executing
    set((state) => ({
      cursorSessions: state.cursorSessions.map(session =>
        session.id === sessionId
          ? {
              ...session,
              commands: session.commands.map(cmd =>
                cmd.id === commandId
                  ? { ...cmd, status: 'executing' as const }
                  : cmd
              )
            }
          : session
      )
    }))

    try {
      // Simulate execution
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      const session = get().cursorSessions.find(s => s.id === sessionId)
      const command = session?.commands.find(c => c.id === commandId)
      
      if (!command) throw new Error('Command not found')

      const output = `Command executed: ${command.command}`

      // Update command status to completed
      set((state) => ({
        cursorSessions: state.cursorSessions.map(session =>
          session.id === sessionId
            ? {
                ...session,
                commands: session.commands.map(cmd =>
                  cmd.id === commandId
                    ? { ...cmd, status: 'completed' as const, output }
                    : cmd
                )
              }
            : session
        )
      }))

    } catch (error) {
      // Update command status to error
      set((state) => ({
        cursorSessions: state.cursorSessions.map(session =>
          session.id === sessionId
            ? {
                ...session,
                commands: session.commands.map(cmd =>
                  cmd.id === commandId
                    ? { 
                        ...cmd, 
                        status: 'error' as const, 
                        output: `Error: ${error instanceof Error ? error.message : 'Unknown error'}` 
                      }
                    : cmd
                )
              }
            : session
        )
      }))
      throw error
    }
  },

  setActiveCursorSession: (sessionId: string | null) => {
    set({ activeCursorSession: sessionId })
  },

  clearCursorSessions: () => {
    set({ cursorSessions: [], activeCursorSession: null })
  }
}))

// Helper functions
function extractProjectName(prompt: string): string {
  const words = prompt.toLowerCase().split(' ')
  const projectTypes = ['calculator', 'todo', 'portfolio', 'landing', 'dashboard', 'blog', 'website', 'app']
  const foundType = projectTypes.find(type => words.some(word => word.includes(type)))
  return foundType || 'web-project'
}

// System prompts
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

const getCursorSystemPrompt = () => {
  const platform = typeof window !== 'undefined' ? 'web' : 'unknown'
  
  return `You are a website builder expert similar to Cursor. You generate terminal/shell commands to create web projects.

Current platform: ${platform}

Your job:
1. Analyze the user's request for what type of website they want to build
2. Generate a sequence of terminal commands to create the project
3. Always create: folder structure, HTML, CSS, and JavaScript files
4. Provide complete working code in the files

Command sequence should be:
1. Create project folder (mkdir projectname)
2. Navigate to folder (cd projectname)  
3. Create index.html (echo "content" > index.html)
4. Create style.css (echo "content" > style.css)
5. Create script.js (echo "content" > script.js)

Return your response in this JSON format:
{
  "commands": [
    {
      "command": "mkdir calculator",
      "description": "Create project folder"
    },
    {
      "command": "cd calculator", 
      "description": "Navigate to project folder"
    },
    {
      "command": "echo '<!DOCTYPE html>...' > index.html",
      "description": "Create HTML file with complete structure"
    }
  ]
}

Make sure all HTML/CSS/JS code is complete and functional. The website should work immediately after running these commands.`
}

// Command generation functions
async function generateCommandsOpenAI(
  client: OpenAI | null,
  description: string,
  config: LLMConfig
): Promise<CursorCommand[]> {
  if (!client) throw new Error('OpenAI client not initialized')

  const response = await client.chat.completions.create({
    model: config.model,
    messages: [
      { role: 'system', content: getCursorSystemPrompt() },
      { role: 'user', content: description }
    ],
    temperature: 0.3,
    max_tokens: 2000,
  })

  const content = response.choices[0]?.message?.content || ''
  return parseCommandsFromResponse(content)
}

async function generateCommandsGemini(
  client: GoogleGenerativeAI | null,
  description: string,
  config: LLMConfig
): Promise<CursorCommand[]> {
  if (!client) throw new Error('Gemini client not initialized')

  const model = client.getGenerativeModel({ model: config.model })
  
  const result = await model.generateContent([
    { text: getCursorSystemPrompt() },
    { text: description }
  ])

  const content = result.response.text() || ''
  return parseCommandsFromResponse(content)
}

async function generateCommandsClaude(
  description: string,
  config: LLMConfig
): Promise<CursorCommand[]> {
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
      system: getCursorSystemPrompt(),
      messages: [{ role: 'user', content: description }],
    })
  })

  if (!response.ok) {
    throw new Error(`Claude API error: ${response.statusText}`)
  }

  const data = await response.json()
  const content = data.content[0]?.text || ''
  return parseCommandsFromResponse(content)
}

async function generateCommandsCustom(
  description: string,
  config: LLMConfig
): Promise<CursorCommand[]> {
  if (!config.baseURL) throw new Error('Base URL required for custom API')

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
        { role: 'system', content: getCursorSystemPrompt() },
        { role: 'user', content: description }
      ],
      temperature: 0.3,
      max_tokens: 2000,
    })
  })

  if (!response.ok) {
    throw new Error(`Custom API error: ${response.statusText}`)
  }

  const data = await response.json()
  const content = data.choices[0]?.message?.content || data.content || ''
  return parseCommandsFromResponse(content)
}

// Parse commands from LLM response
function parseCommandsFromResponse(response: string): CursorCommand[] {
  try {
    // Try to parse JSON response
    const jsonMatch = response.match(/\{[\s\S]*\}/)
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0])
      if (parsed.commands && Array.isArray(parsed.commands)) {
        return parsed.commands.map((cmd: any, index: number) => ({
          id: `cmd-${Date.now()}-${index}`,
          command: cmd.command,
          description: cmd.description || `Command ${index + 1}`,
          status: 'pending' as const,
          timestamp: new Date()
        }))
      }
    }

    // Fallback: generate default commands
    return [
      {
        id: `cmd-${Date.now()}-0`,
        command: 'mkdir web-project',
        description: 'Create project folder',
        status: 'pending',
        timestamp: new Date()
      },
      {
        id: `cmd-${Date.now()}-1`,
        command: 'cd web-project',
        description: 'Navigate to project folder',
        status: 'pending',
        timestamp: new Date()
      },
      {
        id: `cmd-${Date.now()}-2`,
        command: 'touch index.html style.css script.js',
        description: 'Create project files',
        status: 'pending',
        timestamp: new Date()
      }
    ]
  } catch (error) {
    console.error('Error parsing commands:', error)
    return []
  }
}

// Keep existing LLM handler functions
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

async function sendToGemini(
  client: GoogleGenerativeAI | null,
  messages: Message[],
  config: LLMConfig
): Promise<string> {
  if (!client) {
    throw new Error('Gemini client not initialized')
  }

  const model = client.getGenerativeModel({ model: config.model })

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