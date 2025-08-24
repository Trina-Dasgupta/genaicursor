"use client";

import { useState, useRef, useEffect } from "react";
import {
  Send,
  Loader2,
  Terminal,
  MessageSquare,
  Zap,
  FolderPlus,
  Copy,
  Play,
  ChevronDown,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useAIStore } from "@/store/useAIStore";
import MessageBubble from "./MessageBubble";
import TypingIndicator from "./TypingIndicator";
import toast from "react-hot-toast";

// Types for Cursor functionality
interface CursorCommand {
  id: string;
  command: string;
  description: string;
  status: "pending" | "executing" | "completed" | "error";
  output?: string;
  timestamp: Date;
}

interface CursorSession {
  id: string;
  projectName: string;
  description: string;
  commands: CursorCommand[];
  isActive: boolean;
  createdAt: Date;
}

type ChatMode = "regular" | "cursor";

export default function ChatContainer() {
  const {
    messages,
    isTyping,
    llmConfig,
    sendMessage,
    // Cursor functionality from enhanced store
    cursorSessions = [],
    activeCursorSession = null,
    isGeneratingCommands = false,
    chatMode = "regular",
    setChatMode,
    executeCommand,
  } = useAIStore() as any; // Cast to any for now since your store might not have all cursor props yet

  const [input, setInput] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showModeSelector, setShowModeSelector] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const modeSelectorRef = useRef<HTMLDivElement>(null);

  // Get active session
  const ActiveSession = activeCursorSession
    ? cursorSessions.find((s: CursorSession) => s.id === activeCursorSession)
    : null;

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping, ActiveSession]);

  // Close mode selector when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        modeSelectorRef.current &&
        !modeSelectorRef.current.contains(event.target as Node)
      ) {
        setShowModeSelector(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Listen for quick prompts from sidebar
  useEffect(() => {
    const handleQuickPrompt = (event: any) => {
      setInput(event.detail);
      textareaRef.current?.focus();
    };

    window.addEventListener("quick-prompt", handleQuickPrompt);
    return () => window.removeEventListener("quick-prompt", handleQuickPrompt);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!input.trim()) return;

    if (!llmConfig.apiKey) {
      toast.error("Please configure your AI provider first");
      return;
    }

    setIsSubmitting(true);
    const messageToSend = input.trim();
    setInput("");

    // Reset textarea height
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }

    try {
      await sendMessage(messageToSend);
      if (chatMode === "cursor") {
        toast.success("Terminal commands generated!");
      }
    } catch (error) {
      toast.error(
        "Failed to send message. Please check your API configuration."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const adjustTextareaHeight = () => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = "auto";
      textarea.style.height = Math.min(textarea.scrollHeight, 120) + "px";
    }
  };

  const isConfigValid =
    llmConfig.apiKey && (llmConfig.provider !== "custom" || llmConfig.baseURL);

  const getPlaceholderText = () => {
    if (chatMode === "cursor") {
      return "Describe the website you want to build... (e.g., 'Create a modern calculator with glassmorphism design')";
    }
    return "Describe what you want to build...";
  };

  const getModeIcon = (mode: ChatMode) => {
    return mode === "cursor" ? (
      <Terminal className="w-4 h-4" />
    ) : (
      <MessageSquare className="w-4 h-4" />
    );
  };

  const getModeColor = (mode: ChatMode) => {
    return mode === "cursor"
      ? "from-purple-500 to-pink-500"
      : "from-blue-500 to-indigo-500";
  };

  // Handle mode changes (with fallback if setChatMode doesn't exist)
  const handleModeChange = (mode: ChatMode) => {
    if (setChatMode) {
      setChatMode(mode);
    }
    setShowModeSelector(false);
  };

  const copyCommand = async (command: string) => {
    try {
      await navigator.clipboard.writeText(command);
      toast.success("Command copied to clipboard!");
    } catch (error) {
      toast.error("Failed to copy command");
    }
  };

  const copyAllCommands = async () => {
    if (!ActiveSession) return;
    const allCommands = ActiveSession.commands
      .map((cmd: CursorCommand) => cmd.command)
      .join("\n");
    try {
      await navigator.clipboard.writeText(allCommands);
      toast.success("All commands copied!");
    } catch (error) {
      toast.error("Failed to copy commands");
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header with Mode Selector */}
      <div className="border-b border-white/10 glass">
        <div className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              {/* Mode Toggle */}
              <div className="relative" ref={modeSelectorRef}>
                <button
                  onClick={() => setShowModeSelector(!showModeSelector)}
                  className={`flex items-center space-x-2 px-4 py-2 bg-gradient-to-r ${getModeColor(
                    chatMode
                  )} text-white rounded-lg transition-all duration-200 hover:shadow-lg`}
                >
                  {getModeIcon(chatMode)}
                  <span className="font-medium capitalize">
                    {chatMode} Mode
                  </span>
                  <ChevronDown
                    className={`w-4 h-4 transition-transform ${
                      showModeSelector ? "rotate-180" : ""
                    }`}
                  />
                </button>

                {/* Mode Selector Dropdown */}
                <AnimatePresence>
                  {showModeSelector && (
                    <motion.div
                      initial={{ opacity: 0, y: -10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -10, scale: 0.95 }}
                      transition={{ duration: 0.2 }}
      className="absolute top-16 left-4 w-64 bg-gray-900 border border-gray-700 rounded-lg shadow-xl z-[9999]"
                    >
                      <div className="p-2 space-y-1">
                        <button
                          onClick={() => handleModeChange("regular")}
                          className={`w-full flex items-center space-x-3 px-3 py-3 rounded-lg transition-all ${
                            chatMode === "regular"
                              ? "bg-blue-600 text-white border border-blue-500"
                              : "text-gray-300 hover:bg-gray-800"
                          }`}
                        >
                          <div
                            className={`p-2 rounded-lg ${
                              chatMode === "regular"
                                ? "bg-blue-700"
                                : "bg-gray-800"
                            }`}
                          >
                            <MessageSquare className="w-4 h-4" />
                          </div>
                          <div className="text-left">
                            <div className="font-medium">Regular Chat</div>
                            <div className="text-xs opacity-75 mt-1">
                              Normal conversation & code help
                            </div>
                          </div>
                          {chatMode === "regular" && (
                            <div className="w-2 h-2 bg-blue-400 rounded-full ml-auto"></div>
                          )}
                        </button>

                        <button
                          onClick={() => handleModeChange("cursor")}
                          className={`w-full flex items-center space-x-3 px-3 py-3 rounded-lg transition-all ${
                            chatMode === "cursor"
                              ? "bg-purple-600 text-white border border-purple-500"
                              : "text-gray-300 hover:bg-gray-800"
                          }`}
                        >
                          <div
                            className={`p-2 rounded-lg ${
                              chatMode === "cursor"
                                ? "bg-purple-700"
                                : "bg-gray-800"
                            }`}
                          >
                            <Terminal className="w-4 h-4" />
                          </div>
                          <div className="text-left">
                            <div className="font-medium">Cursor Mode</div>
                            <div className="text-xs opacity-75 mt-1">
                              Generate terminal commands to build projects
                            </div>
                          </div>
                          {chatMode === "cursor" && (
                            <div className="w-2 h-2 bg-purple-400 rounded-full ml-auto"></div>
                          )}
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
                <span className="text-xs px-2 py-1 gradient-primary text-white rounded">
                  {ActiveSession.commands.length} commands
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Messages Container */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        <AnimatePresence mode="popLayout">
          {/* Empty State */}
          {((chatMode === "regular" && messages.length === 0) ||
            (chatMode === "cursor" && !ActiveSession)) && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex flex-col items-center justify-center h-full text-center"
            >
              <div className="p-6 glass-strong rounded-2xl max-w-md">
                <div className="text-6xl mb-4">
                  {chatMode === "cursor" ? "⚡" : "🚀"}
                </div>
                <h2 className="text-2xl font-bold text-white mb-2">
                  {chatMode === "cursor"
                    ? "Ready to Build?"
                    : "Ready to Build Something Amazing?"}
                </h2>
                <p className="text-gray-400 mb-6">
                  {chatMode === "cursor"
                    ? "Describe your project and I'll generate terminal commands to build it step by step."
                    : "Describe what you want to create and I'll generate the code for you. From simple components to full applications!"}
                </p>
                <div className="text-sm text-gray-500">
                  <div className="font-medium text-purple-400 mb-2">
                    Try asking:
                  </div>
                  {chatMode === "cursor" ? (
                    <div className="space-y-1">
                      <div>"Create a modern calculator app"</div>
                      <div>"Build a todo list with animations"</div>
                      <div>"Make a portfolio website"</div>
                    </div>
                  ) : (
                    <div>"Create a modern landing page for a tech startup"</div>
                  )}
                </div>
              </div>
            </motion.div>
          )}

          {/* Regular Chat Messages */}
          {chatMode === "regular" &&
            messages.map((message:any) => (
              <MessageBubble key={message.id} message={message} />
            ))}

          {/* Cursor Terminal Interface */}
          {chatMode === "cursor" && ActiveSession && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-4"
            >
              {/* Project Header */}
              <div className="bg-gradient-to-r from-purple-900 to-blue-900 rounded-2xl p-6 border border-purple-500/20">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-white/10 rounded-lg">
                      <FolderPlus className="w-6 h-6 text-purple-400" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-white">
                        {ActiveSession.projectName}
                      </h3>
                      <p className="text-purple-200 text-sm">
                        {ActiveSession.description}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    <span className="text-xs text-purple-300 bg-white/10 px-2 py-1 rounded-full">
                      {ActiveSession.commands.length} commands
                    </span>
                    <button
                      onClick={copyAllCommands}
                      className="flex items-center space-x-1 px-3 py-1 text-xs bg-white/20 hover:bg-white/30 text-white rounded transition-colors"
                    >
                      <Copy className="w-3 h-3" />
                      <span>Copy All</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Terminal Commands */}
              <div className="glass-strong rounded-2xl border border-white/10 overflow-hidden">
                {/* Terminal Header */}
                <div className="flex items-center justify-between p-4 glass border-b border-white/10">
                  <div className="flex items-center space-x-3">
                    <div className="flex space-x-1.5">
                      <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                      <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                      <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                    </div>
                    <span className="text-white font-mono text-sm">
                      terminal — {ActiveSession.projectName}
                    </span>
                  </div>
                </div>

                {/* Commands List */}
                <div className="p-4 max-h-96 overflow-y-auto">
                  <div className="space-y-3">
                    {ActiveSession.commands.map(
                      (command: CursorCommand, index: number) => (
                        <CommandItem
                          key={command.id}
                          command={command}
                          index={index}
                          onCopy={copyCommand}
                        />
                      )
                    )}
                  </div>
                </div>

                {/* Terminal Footer */}
                <div className="p-4 glass border-t border-white/10">
                  <div className="flex items-center justify-between text-xs text-gray-400">
                    <span>Copy and paste these commands in your terminal</span>
                    <div className="flex items-center space-x-2">
                      <Terminal className="w-3 h-3" />
                      <span>Ready to execute</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Project Structure Preview */}
              <div className="glass-strong rounded-xl p-4 border border-white/10">
                <h4 className="text-white font-semibold mb-3 flex items-center space-x-2">
                  <FolderPlus className="w-4 h-4" />
                  <span>Project Structure</span>
                </h4>
                <div className="text-sm font-mono text-gray-300 space-y-1">
                  <div className="flex items-center space-x-2">
                    <FolderPlus className="w-4 h-4 text-blue-400" />
                    <span>{ActiveSession.projectName}/</span>
                  </div>
                  <div className="ml-6 space-y-1">
                    <div className="flex items-center space-x-2">
                      <div className="w-4 h-4 text-orange-400">📄</div>
                      <span>index.html</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="w-4 h-4 text-blue-400">🎨</div>
                      <span>style.css</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="w-4 h-4 text-yellow-400">⚡</div>
                      <span>script.js</span>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Typing Indicator */}
        <AnimatePresence>
          {(isTyping || isGeneratingCommands) && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              {chatMode === "cursor" ? (
                <div className="flex items-center space-x-3 p-4">
                  <div className="w-8 h-8 glass-strong rounded-full flex items-center justify-center">
                    <Terminal className="w-4 h-4 text-purple-400" />
                  </div>
                  <div className="text-gray-400">
                    Generating terminal commands...
                  </div>
                </div>
              ) : (
                <TypingIndicator />
              )}
            </motion.div>
          )}
        </AnimatePresence>

        <div ref={messagesEndRef} />
      </div>

      {/* Input Container */}
      <div className="p-6 glass border-t border-white/10">
        <div className="flex space-x-4">
          <div className="flex-1 relative">
            <textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => {
                setInput(e.target.value);
                adjustTextareaHeight();
              }}
              onKeyDown={handleKeyDown}
              placeholder={getPlaceholderText()}
              className="w-full px-4 py-3 pr-12 glass-strong rounded-2xl text-white placeholder-gray-400 resize-none focus:outline-none focus:ring-2 focus:ring-purple-500/50 transition-all duration-200 min-h-[50px] max-h-[120px]"
              disabled={isSubmitting || !isConfigValid}
              rows={1}
            />

            {/* Send Button */}
            <button
              onClick={handleSubmit}
              disabled={!input.trim() || isSubmitting || !isConfigValid}
              className={`absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-gradient-to-r ${getModeColor(
                chatMode
              )} rounded-xl text-white disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-lg transition-all duration-200 disabled:hover:shadow-none`}
            >
              {isSubmitting || isGeneratingCommands ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : chatMode === "cursor" ? (
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
              ? "AI provider configuration required"
              : chatMode === "cursor"
              ? "Describe your project to generate terminal commands"
              : "Press Enter to send, Shift+Enter for new line"}
          </span>
          <div className="flex items-center space-x-4">
            <span>{input.length}/2000</span>
            {chatMode === "cursor" && (
              <div className="flex items-center space-x-1">
                <Terminal className="w-3 h-3" />
                <span>Cursor Mode</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// Command Item Component - Removed execute functionality
function CommandItem({
  command,
  index,
  onCopy,
}: {
  command: CursorCommand;
  index: number;
  onCopy: (cmd: string) => void;
}) {
  const getStatusColor = () => {
    switch (command.status) {
      case "completed":
        return "text-green-400";
      case "executing":
        return "text-yellow-400";
      case "error":
        return "text-red-400";
      default:
        return "text-gray-400";
    }
  };

  const getStatusIcon = () => {
    switch (command.status) {
      case "completed":
        return "✓";
      case "executing":
        return "⟳";
      case "error":
        return "✗";
      default:
        return `${index + 1}`;
    }
  };

  return (
    <div className="group glass rounded-lg border border-white/10 hover:border-white/20 transition-colors">
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
              className="p-1 text-gray-400 hover:text-white hover:bg-white/10 rounded transition-colors"
              title="Copy command"
            >
              <Copy className="w-3 h-3" />
            </button>
          </div>
        </div>

        <div className="bg-black/50 rounded p-2 font-mono text-sm">
          <code className="text-green-400">$ {command.command}</code>
        </div>

        {command.output && (
          <div className="mt-2 p-2 bg-black/30 rounded text-xs text-gray-300 font-mono">
            {command.output}
          </div>
        )}
      </div>
    </div>
  );
}
