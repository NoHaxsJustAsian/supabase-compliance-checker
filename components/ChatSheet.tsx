"use client"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Loader2, Send, Bot, User, Shield, Lock, Clock } from "lucide-react"
import { motion } from "framer-motion"
import { cn } from "@/lib/utils"

interface Message {
  role: "user" | "assistant"
  content: string
  isTyping?: boolean
}

const QuickAction = ({
  icon: Icon,
  label,
  onClick
}: {
  icon: React.ComponentType<any>
  label: string
  onClick: () => void
}) => (
  <Button
    variant="outline"
    size="sm"
    className="flex items-center gap-1.5 text-xs h-8 bg-muted/50 border-muted-foreground/20 hover:bg-primary/10 transition-all"
    onClick={onClick}
  >
    <Icon className="h-3.5 w-3.5 mr-1" />
    {label}
  </Button>
)

export function ChatSheet() {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content:
        "Hello! I'm your Supabase compliance assistant. How can I help you with your compliance issues today?",
    },
  ])
  const [input, setInput] = useState("")
  const [loading, setLoading] = useState(false)
  const [currentTypingIndex, setCurrentTypingIndex] = useState<number | null>(null)
  const [typingContent, setTypingContent] = useState("")
  const [typingSpeed, setTypingSpeed] = useState(20) // ms per character
  const scrollAreaRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    // Scroll to bottom when messages change
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight
    }
  }, [messages, typingContent])

  // Typing animation effect
  useEffect(() => {
    if (currentTypingIndex !== null) {
      const message = messages[currentTypingIndex];
      if (!message || !message.isTyping) return;
      
      if (typingContent.length < message.content.length) {
        const timeout = setTimeout(() => {
          setTypingContent(message.content.substring(0, typingContent.length + 1));
        }, typingSpeed);
        
        return () => clearTimeout(timeout);
      } else {
        // Typing complete
        setMessages(prevMessages => {
          const newMessages = [...prevMessages];
          newMessages[currentTypingIndex] = { ...message, isTyping: false };
          return newMessages;
        });
        setCurrentTypingIndex(null);
        setTypingContent("");
      }
    }
  }, [currentTypingIndex, typingContent, messages, typingSpeed]);

  const handleSendMessage = async (messageText: string = input) => {
    if (!messageText.trim()) return;

    const userMessage = messageText.trim();
    setInput("");

    // Add user message to chat
    setMessages((prev) => [...prev, { role: "user", content: userMessage }]);

    // Set loading state
    setLoading(true);

    try {
      // Send message to AI
      const response = await fetch("/api/ai-chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ message: userMessage }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to get AI response");
      }

      // Add AI response to chat with typing indicator
      const newMessageIndex = messages.length + 1;
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: data.response, isTyping: true }
      ]);
      
      // Start typing animation
      setCurrentTypingIndex(newMessageIndex);
      setTypingContent("");
      
    } catch (error) {
      console.error("Error getting AI response:", error);
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "I'm sorry, I encountered an error processing your request. Please try again.",
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleQuickAction = (question: string) => {
    handleSendMessage(question);
  };

  return (
    <div className="flex flex-col h-[calc(100vh-120px)] bg-background">
      <ScrollArea className="flex-1 p-4 overflow-y-auto" ref={scrollAreaRef as any}>
        <div className="space-y-5 pb-4">
          {messages.map((message, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className={cn(
                "flex",
                message.role === "assistant" ? "justify-start" : "justify-end"
              )}
            >
              <div
                className={cn(
                  "flex items-start space-x-2 max-w-[85%]",
                  message.role === "assistant" ? "" : "flex-row-reverse space-x-reverse"
                )}
              >
                <Avatar 
                  style={{ backgroundColor: "#1d4ed8" }}
                  className={cn(
                    "h-8 w-8",
                    message.role === "assistant" 
                      ? "text-white shadow-md" 
                      : "bg-muted text-muted-foreground"
                  )}
                >
                  <AvatarFallback style={message.role === "assistant" ? { backgroundColor: "#1d4ed8", color: "white" } : {}}>
                    {message.role === "assistant" ? <Bot className="h-4 w-4" /> : <User className="h-4 w-4" />}
                  </AvatarFallback>
                </Avatar>
                <div
                  className={cn(
                    "rounded-lg px-4 py-3 text-sm shadow-sm",
                    message.role === "assistant"
                      ? "bg-muted text-muted-foreground"
                      : "bg-primary text-primary-foreground"
                  )}
                >
                  {message.isTyping && index === currentTypingIndex ? (
                    <>
                      <p className="whitespace-pre-wrap">{typingContent}</p>
                      <span className="inline-block w-1.5 h-4 ml-0.5 bg-current opacity-70 animate-pulse"></span>
                    </>
                  ) : (
                    <p className="whitespace-pre-wrap">{message.content}</p>
                  )}
                </div>
              </div>
            </motion.div>
          ))}
          {loading && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex justify-start"
            >
              <div className="flex items-start space-x-2 max-w-[85%]">
                <Avatar style={{ backgroundColor: "#1d4ed8" }} className="h-8 w-8 text-white shadow-md">
                  <AvatarFallback style={{ backgroundColor: "#1d4ed8", color: "white" }}>
                    <Bot className="h-4 w-4" />
                  </AvatarFallback>
                </Avatar>
                <div className="rounded-lg px-4 py-3 bg-muted text-muted-foreground">
                  <div className="flex space-x-1.5">
                    <span className="h-2 w-2 rounded-full bg-current opacity-60 animate-bounce"></span>
                    <span className="h-2 w-2 rounded-full bg-current opacity-60 animate-bounce" style={{ animationDelay: "0.2s" }}></span>
                    <span className="h-2 w-2 rounded-full bg-current opacity-60 animate-bounce" style={{ animationDelay: "0.4s" }}></span>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </div>
      </ScrollArea>
      
      <div className="px-4 pt-2 pb-4">
        <div className="flex gap-2 mb-2.5 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-muted-foreground/20 scrollbar-track-transparent">
          <QuickAction 
            icon={Shield} 
            label="How do I enable MFA?" 
            onClick={() => handleQuickAction("How do I enable MFA in Supabase?")} 
          />
          <QuickAction 
            icon={Lock} 
            label="How do I set up RLS?" 
            onClick={() => handleQuickAction("How do I implement Row Level Security in Supabase?")} 
          />
          <QuickAction 
            icon={Clock} 
            label="How do I configure PITR?" 
            onClick={() => handleQuickAction("How do I set up Point in Time Recovery in Supabase?")} 
          />
        </div>
        <div className="relative">
          <Input
            placeholder="Type your message..."
            className="pr-12 border-muted-foreground/20 bg-muted/50 focus-visible:ring-primary/50"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={loading || currentTypingIndex !== null}
          />
          <Button 
            size="icon" 
            className="absolute right-1 top-1 h-8 w-8 bg-primary/90 hover:bg-primary shadow-none"
            onClick={() => handleSendMessage()} 
            disabled={loading || !input.trim() || currentTypingIndex !== null}
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          </Button>
        </div>
      </div>
    </div>
  );
} 