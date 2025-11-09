import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const { title } = await request.json();

    console.log("Received title:", title);
    console.log("API Key exists:", !!process.env.ABACUS_AI_API_KEY);

    if (!title || typeof title !== "string") {
      return NextResponse.json(
        { error: "Title is required and must be a string" },
        { status: 400 }
      );
    }

    if (!process.env.ABACUS_AI_API_KEY) {
      console.error("ABACUS_AI_API_KEY is not configured!");
      return NextResponse.json(
        { error: "Abacus AI API key not configured" },
        { status: 500 }
      );
    }

    console.log("Calling Abacus RouteLLM API...");
    console.log("API Key starts with:", process.env.ABACUS_AI_API_KEY?.substring(0, 10));

    // Get the AI prompt instruction from environment or use default
    const promptInstruction = process.env.AI_PROMPT_INSTRUCTION || "generate a detailed development prompt that breaks down the task into actionable steps. The prompt should be practical and help a developer understand what needs to be built. Format it as a clear, concise list of steps or requirements.";

    // Use the correct Abacus RouteLLM endpoint
    const llmResponse = await fetch("https://routellm.abacus.ai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${process.env.ABACUS_AI_API_KEY}`,
      },
      body: JSON.stringify({
        model: "route-llm",
        messages: [
          {
            role: "user",
            content: `Based on the task title "${title}", ${promptInstruction}`,
          },
        ],
        stream: false,
      }),
    });

    console.log("LLM Response status:", llmResponse.status);
    const responseText = await llmResponse.text();
    console.log("Raw response:", responseText.substring(0, 300));

    if (!llmResponse.ok) {
      console.error("Abacus LLM error response:", responseText);
      return NextResponse.json(
        { error: `API Error: ${llmResponse.status} - ${responseText.substring(0, 200)}` },
        { status: llmResponse.status }
      );
    }

    // Try to parse as JSON, but handle if it's not
    let llmData;
    try {
      llmData = JSON.parse(responseText);
    } catch (e) {
      console.error("Failed to parse response as JSON:", e);
      console.error("Response text:", responseText);
      return NextResponse.json(
        { error: "Received invalid response from Abacus AI - not JSON" },
        { status: 500 }
      );
    }

    console.log("Abacus response:", llmData);

    // Extract the response text from different possible response formats
    const prompt =
      llmData.choices?.[0]?.message?.content || // OpenAI format
      llmData.result?.text ||
      llmData.text ||
      llmData.response ||
      llmData.message ||
      llmData.choices?.[0]?.text ||
      "";

    console.log("Generated prompt:", prompt);

    if (!prompt) {
      console.error("No prompt text found in response:", llmData);
      return NextResponse.json(
        { error: "No text received from API" },
        { status: 500 }
      );
    }

    return NextResponse.json({ prompt });
  } catch (error) {
    console.error("Error generating prompt:", error);
    console.error("Error details:", JSON.stringify(error, null, 2));

    if (error instanceof Error) {
      return NextResponse.json(
        { error: error.message || "Failed to generate prompt" },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { error: "An unexpected error occurred" },
      { status: 500 }
    );
  }
}
