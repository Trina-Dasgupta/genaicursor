'use client'

import { useState } from 'react'
import { Terminal, Play, Copy, FolderPlus, FileText, Code, Zap } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import toast from 'react-hot-toast'

// Enhanced store interface for Cursor functionality
interface CursorCommand {
  id: string
  command: string
  description: string
  status: 'pending' | 'executing' | 'completed' | 'error'
  output?: string
  timestamp: Date
}

interface CursorSession {
  id: string
  projectName: string
  commands: CursorCommand[]
  isActive: boolean
}

// Mock store extension - you'll integrate this with your actual useAIStore
const useCursorStore = () => {
  const [sessions, setSessions] = useState<CursorSession[]>([]);
  const [activeSession, setActiveSession] = useState<CursorSession | null>(null);
  const [isGeneratingCommands, setIsGeneratingCommands] = useState(false);

  const createSession = (projectName: string) => {
    const newSession: CursorSession = {
      id: Date.now().toString(),
      projectName,
      commands: [],
      isActive: true
    };
    setSessions(prev => [...prev, newSession]);
    setActiveSession(newSession);
    return newSession;
  };

  const executeCommand = async (command: string) => {
    console.log('Executing:', command);
    return { success: true, output: 'Command executed successfully' };
  };

  const generateCommands = async (prompt: string) => {
    setIsGeneratingCommands(true);
    try {
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      if (activeSession) {
        const newCommands: CursorCommand[] = [
          {
            id: '1',
            command: 'mkdir ' + activeSession.projectName,
            description: 'Create project directory',
            status: 'pending',
            timestamp: new Date()
          },
          {
            id: '2', 
            command: 'cd ' + activeSession.projectName,
            description: 'Navigate to project directory',
            status: 'pending',
            timestamp: new Date()
          },
          {
            id: '3',
            command: 'npm init -y',
            description: 'Initialize npm project',
            status: 'pending', 
            timestamp: new Date()
          }
        ];
        
        setActiveSession({
          ...activeSession,
          commands: newCommands
        });
      }
    } catch (error) {
      console.error('Failed to generate commands:', error);
    } finally {
      setIsGeneratingCommands(false);
    }
  };

  return {
    sessions,
    activeSession,
    isGeneratingCommands,
    createSession,
    executeCommand,
    generateCommands
  };
};

export default function CursorInterface() {
  const [prompt, setPrompt] = useState('')
  const [showTerminal, setShowTerminal] = useState(false)
  const { 
    sessions, 
    activeSession, 
    isGeneratingCommands,
    createSession,
    executeCommand,
    generateCommands 
  } = useCursorStore()

  const handleGenerateProject = async () => {
    if (!prompt.trim()) {
      toast.error('Please describe what you want to build')
      return
    }

    try {
      // Extract project name from prompt or generate one
      const projectName = extractProjectName(prompt)
      createSession(projectName)
      await generateCommands(prompt)
      setShowTerminal(true)
      toast.success('Project commands generated!')
    } catch (error) {
      toast.error('Failed to generate project')
    }
  }

  const extractProjectName = (prompt: string): string => {
    // Simple extraction - you can make this smarter
    const words = prompt.toLowerCase().split(' ')
    const projectTypes = ['calculator', 'todo', 'portfolio', 'landing', 'dashboard', 'blog']
    const foundType = projectTypes.find(type => words.some(word => word.includes(type)))
    return foundType || 'web-project'
  }

  const copyCommand = async (command: string) => {
    try {
      await navigator.clipboard.writeText(command)
      toast.success('Command copied to clipboard!')
    } catch (error) {
      toast.error('Failed to copy command')
    }
  }

  return (
    <div className="space-y-6">
      {/* Cursor Input Interface */}
      <div className="bg-gradient-to-r from-purple-900 to-blue-900 rounded-2xl p-6 border border-purple-500/20">
        <div className="flex items-center space-x-3 mb-4">
          <div className="p-2 bg-white/10 rounded-lg">
            <Zap className="w-6 h-6 text-yellow-400" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-white">Cursor Mode</h3>
            <p className="text-purple-200 text-sm">Generate terminal commands to build your project</p>
          </div>
        </div>

        <div className="space-y-4">
          <div className="relative">
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Describe the website you want to build... (e.g., 'Create a modern calculator with glassmorphism design')"
              className="w-full p-4 bg-black/30 border border-white/20 rounded-xl text-white placeholder-gray-400 resize-none focus:outline-none focus:ring-2 focus:ring-purple-500/50 min-h-[100px]"
              rows={3}
            />
          </div>

          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-2 text-sm text-purple-200">
              <Terminal className="w-4 h-4" />
              <span>Commands will be generated for your OS</span>
            </div>
            
            <button
              onClick={handleGenerateProject}
              disabled={isGeneratingCommands || !prompt.trim()}
              className="flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-xl hover:shadow-lg hover:shadow-purple-500/25 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isGeneratingCommands ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Generating...</span>
                </>
              ) : (
                <>
                  <Play className="w-4 h-4" />
                  <span>Generate Project</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Terminal Commands Display */}
      <AnimatePresence>
        {showTerminal && activeSession && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="bg-gray-900 rounded-2xl border border-gray-700 overflow-hidden"
          >
            {/* Terminal Header */}
            <div className="flex items-center justify-between p-4 bg-gray-800 border-b border-gray-700">
              <div className="flex items-center space-x-3">
                <div className="flex space-x-1.5">
                  <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                  <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                  <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                </div>
                <span className="text-white font-mono text-sm">terminal — {activeSession.projectName}</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-xs text-gray-400">{activeSession.commands.length} commands</span>
                <button
                  onClick={() => setShowTerminal(false)}
                  className="text-gray-400 hover:text-white p-1"
                >
                  ×
                </button>
              </div>
            </div>

            {/* Commands List */}
            <div className="p-4 max-h-96 overflow-y-auto">
              <div className="space-y-3">
                {activeSession.commands.map((cmd, index) => (
                  <CommandItem
                    key={cmd.id}
                    command={cmd}
                    index={index}
                    onExecute={executeCommand}
                    onCopy={copyCommand}
                  />
                ))}
              </div>
            </div>

            {/* Terminal Footer */}
            <div className="p-4 bg-gray-800 border-t border-gray-700">
              <div className="flex items-center justify-between text-xs text-gray-400">
                <span>Copy and paste these commands in your terminal</span>
                <button
                  onClick={() => {
                    const allCommands = activeSession.commands.map(cmd => cmd.command).join('\n')
                    copyCommand(allCommands)
                  }}
                  className="flex items-center space-x-1 px-2 py-1 bg-gray-700 hover:bg-gray-600 rounded text-gray-300 transition-colors"
                >
                  <Copy className="w-3 h-3" />
                  <span>Copy All</span>
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Project Structure Preview */}
      {activeSession && (
        <div className="bg-gray-800 rounded-xl p-4 border border-gray-700">
          <h4 className="text-white font-semibold mb-3 flex items-center space-x-2">
            <FolderPlus className="w-4 h-4" />
            <span>Project Structure</span>
          </h4>
          <div className="text-sm font-mono text-gray-300 space-y-1">
            <div className="flex items-center space-x-2">
              <FolderPlus className="w-4 h-4 text-blue-400" />
              <span>{activeSession.projectName}/</span>
            </div>
            <div className="ml-6 space-y-1">
              <div className="flex items-center space-x-2">
                <FileText className="w-4 h-4 text-orange-400" />
                <span>index.html</span>
              </div>
              <div className="flex items-center space-x-2">
                <FileText className="w-4 h-4 text-blue-400" />
                <span>style.css</span>
              </div>
              <div className="flex items-center space-x-2">
                <Code className="w-4 h-4 text-yellow-400" />
                <span>script.js</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// Command Item Component
function CommandItem({ 
  command, 
  index, 
  onExecute, 
  onCopy 
}: { 
  command: CursorCommand
  index: number
  onExecute: (cmd: string) => Promise<any>
  onCopy: (cmd: string) => void
}) {
  const [isExecuting, setIsExecuting] = useState(false)

  const handleExecute = async () => {
    setIsExecuting(true)
    try {
      await onExecute(command.command)
      toast.success(`Command ${index + 1} executed successfully!`)
    } catch (error) {
      toast.error(`Command ${index + 1} failed`)
    } finally {
      setIsExecuting(false)
    }
  }

  const getStatusColor = () => {
    switch (command.status) {
      case 'completed': return 'text-green-400'
      case 'executing': return 'text-yellow-400'
      case 'error': return 'text-red-400'
      default: return 'text-gray-400'
    }
  }

  const getStatusIcon = () => {
    switch (command.status) {
      case 'completed': return '✓'
      case 'executing': return '⟳'
      case 'error': return '✗'
      default: return `${index + 1}`
    }
  }

  return (
    <div className="group bg-gray-800 rounded-lg border border-gray-700 hover:border-gray-600 transition-colors">
      <div className="p-3">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center space-x-2">
            <span className={`text-xs font-mono ${getStatusColor()}`}>
              {getStatusIcon()}
            </span>
            <span className="text-xs text-gray-400">{command.description}</span>
          </div>
          <div className="flex space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              onClick={() => onCopy(command.command)}
              className="p-1 text-gray-400 hover:text-white hover:bg-gray-700 rounded transition-colors"
              title="Copy command"
            >
              <Copy className="w-3 h-3" />
            </button>
            <button
              onClick={handleExecute}
              disabled={isExecuting}
              className="p-1 text-gray-400 hover:text-green-400 hover:bg-gray-700 rounded transition-colors disabled:opacity-50"
              title="Execute command"
            >
              {isExecuting ? (
                <div className="w-3 h-3 border border-gray-400 border-t-transparent rounded-full animate-spin" />
              ) : (
                <Play className="w-3 h-3" />
              )}
            </button>
          </div>
        </div>
        
        <div className="bg-black/50 rounded p-2 font-mono text-sm">
          <code className="text-green-400">$ {command.command}</code>
        </div>

        {command.output && (
          <div className="mt-2 p-2 bg-gray-900 rounded text-xs text-gray-300 font-mono">
            {command.output}
          </div>
        )}
      </div>
    </div>
  )
}