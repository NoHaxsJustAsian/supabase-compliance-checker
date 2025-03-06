import { NextResponse } from "next/server"
import { generateText } from "ai"
import { openai } from "@ai-sdk/openai"

export async function POST(request: Request) {
  try {
    const { message } = await request.json()

    if (!message) {
      return NextResponse.json({ error: "Message is required" }, { status: 400 })
    }

    // Use AI SDK to generate a response [^6]
    const { text } = await generateText({
      model: openai("gpt-4o"),
      system: `You are a Supabase compliance assistant. Help users understand and implement security best practices for Supabase.
      Focus on the shared responsibility model, Row Level Security (RLS), Multi-Factor Authentication (MFA), and Point in Time Recovery (PITR).
      Provide specific, actionable advice and explain why these security measures are important.`,
      prompt: message,
    })

    return NextResponse.json({ response: text })
  } catch (error) {
    console.error("Error generating AI response:", error)
    return NextResponse.json({ error: "Failed to generate AI response" }, { status: 500 })
  }
}

