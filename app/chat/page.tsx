"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Loader2, Send, Bot, User } from "lucide-react"
import Link from "next/link"
import { ShieldAlert } from "lucide-react"

interface Message {
  role: "user" | "assistant"
  content: string
}

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content:
        "Hello! I'm your Supabase compliance assistant. How can I help you with your Supabase security and compliance needs today?",
    },
  ])
  const [input, setInput] = useState("")
  const [loading, setLoading] = useState(false)
  const scrollAreaRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    // Scroll to bottom when messages change
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight
    }
  }, [messages])

  const handleSendMessage = async () => {
    if (!input.trim()) return

    const userMessage = input.trim()
    setInput("")

    // Add user message to chat
    setMessages((prev) => [...prev, { role: "user", content: userMessage }])

    // Set loading state
    setLoading(true)

    try {
      // Send message to AI
      const response = await fetch("/api/ai-chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ message: userMessage }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to get AI response")
      }

      // Add AI response to chat
      setMessages((prev) => [...prev, { role: "assistant", content: data.response }])
    } catch (error) {
      console.error("Error getting AI response:", error)
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "I'm sorry, I encountered an error processing your request. Please try again.",
        },
      ])
    } finally {
      setLoading(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-14 items-center">
          <div className="mr-4 flex">
            <Link href="/" className="flex items-center space-x-2">
              <ShieldAlert className="h-6 w-6" />
              <span className="font-bold">Supabase Compliance Checker</span>
            </Link>
          </div>
          <div className="flex flex-1 items-center justify-end space-x-2">
            <nav className="flex items-center space-x-4">
              <Link href="/dashboard" className="text-sm font-medium">
                Dashboard
              </Link>
              <Link href="/auth" className="text-sm font-medium">
                Login
              </Link>
            </nav>
          </div>
        </div>
      </header>
      <main className="flex-1 container py-6">
        <div className="mx-auto max-w-4xl">
          <Card className="h-[calc(100vh-10rem)]">
            <CardHeader>
              <CardTitle>Compliance Assistant</CardTitle>
              <CardDescription>Ask questions about Supabase security and compliance best practices</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <ScrollArea className="h-[calc(100vh-16rem)] p-4" ref={scrollAreaRef}>
                <div className="space-y-4">
                  {messages.map((message, index) => (
                    <div
                      key={index}
                      className={`flex ${message.role === "assistant" ? "justify-start" : "justify-end"}`}
                    >
                      <div
                        className={`flex items-start space-x-2 max-w-[80%] ${
                          message.role === "assistant" ? "" : "flex-row-reverse space-x-reverse"
                        }`}
                      >
                        <Avatar className={message.role === "assistant" ? "bg-primary" : "bg-muted"}>
                          <AvatarFallback>
                            {message.role === "assistant" ? <Bot className="h-5 w-5" /> : <User className="h-5 w-5" />}
                          </AvatarFallback>
                        </Avatar>
                        <div
                          className={`rounded-lg px-4 py-2 ${
                            message.role === "assistant"
                              ? "bg-muted text-muted-foreground"
                              : "bg-primary text-primary-foreground"
                          }`}
                        >
                          <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                  {loading && (
                    <div className="flex justify-start">
                      <div className="flex items-start space-x-2 max-w-[80%]">
                        <Avatar className="bg-primary">
                          <AvatarFallback>
                            <Bot className="h-5 w-5" />
                          </AvatarFallback>
                        </Avatar>
                        <div className="rounded-lg px-4 py-2 bg-muted text-muted-foreground">
                          <Loader2 className="h-5 w-5 animate-spin" />
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </ScrollArea>
            </CardContent>
            <CardFooter className="pt-4">
              <div className="flex w-full items-center space-x-2">
                <Input
                  placeholder="Type your message..."
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  disabled={loading}
                />
                <Button size="icon" onClick={handleSendMessage} disabled={loading || !input.trim()}>
                  {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5" />}
                </Button>
              </div>
            </CardFooter>
          </Card>
        </div>
      </main>
    </div>
  )
}

