'use client'

import { useState } from 'react'
import Sidebar from '@/components/Sidebar'
import { useAIStore } from '@/store/useAIStore'
import Header from '@/components/Header'
import ChatContainer from '@/components/ChatContainer'
import CodePreview from '@/components/CodePreview'

export default function Home() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true)
  const { isPreviewOpen } = useAIStore()

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Sidebar */}
      <Sidebar 
        isOpen={isSidebarOpen} 
        onToggle={() => setIsSidebarOpen(!isSidebarOpen)} 
      />
      
      {/* Main Content */}
      <div className={`flex-1 flex flex-col transition-all duration-300 ${
        isSidebarOpen ? 'ml-0' : 'ml-0'
      }`}>
        <Header />
        <ChatContainer />
      </div>
      
      {/* Code Preview Panel */}
      <CodePreview />
    </div>
  )
}