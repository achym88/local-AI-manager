export async function generatePromptFromTitle(title: string): Promise<string> {
  try {
    console.log("Calling /api/generate-prompt with title:", title);
    const response = await fetch("/api/generate-prompt", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ title }),
    });

    console.log("Response status:", response.status);
    console.log("Response ok:", response.ok);

    if (!response.ok) {
      const error = await response.json();
      console.error("API error response:", error);
      throw new Error(error.error || "Failed to generate prompt");
    }

    const data = await response.json();
    console.log("API success response:", data);
    return data.prompt;
  } catch (error) {
    console.error("Error generating prompt:", error);
    throw error;
  }
}
