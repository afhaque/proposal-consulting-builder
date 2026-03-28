import { NextRequest, NextResponse } from "next/server";

interface GenerateRequest {
  content: string;
  clientInfo: {
    name: string;
    company: string;
    email: string;
  };
  model: string;
  systemPrompt: string;
  tone: string;
  length: string;
}

const SYSTEM_PROMPTS: Record<string, string> = {
  "Professional Consultant":
    "You are a professional business consultant drafting formal proposals and consulting agreements. Use precise language, clear deliverables, and professional formatting.",
  "Friendly Advisor":
    "You are a friendly and approachable business advisor. Write proposals that are warm, conversational, yet still professional. Make the client feel comfortable and valued.",
  "Technical Expert":
    "You are a technical expert drafting detailed project proposals. Include technical specifications, architecture decisions, and methodology breakdowns. Be thorough and precise.",
};

function buildPrompt(req: GenerateRequest): string {
  const toneInstruction =
    req.tone === "Formal"
      ? "Use formal, corporate language."
      : req.tone === "Friendly"
        ? "Use warm, conversational language while remaining professional."
        : "Use a balanced mix of professional and approachable language.";

  const lengthInstruction =
    req.length === "Brief"
      ? "Keep the proposal concise, around 300-500 words."
      : req.length === "Detailed"
        ? "Create a comprehensive proposal with 1000-1500 words, covering all aspects in detail."
        : "Write a standard-length proposal of 600-900 words.";

  return `Generate a professional consulting proposal/agreement based on the following information.

Client Name: ${req.clientInfo.name || "TBD"}
Client Company: ${req.clientInfo.company || "TBD"}
Client Email: ${req.clientInfo.email || "TBD"}

Project Details:
${req.content}

Instructions:
- ${toneInstruction}
- ${lengthInstruction}
- Include sections: Executive Summary, Scope of Work, Deliverables, Timeline, Pricing, Terms & Conditions
- Format with clear headings and bullet points
- Make it ready to present to the client
- Replace any [CLIENT_COMPANY] placeholders with the actual company name`;
}

export async function POST(request: NextRequest) {
  try {
    const body: GenerateRequest = await request.json();
    const apiKey = process.env.ANTHROPIC_API_KEY;

    if (!apiKey) {
      return NextResponse.json(
        { error: "ANTHROPIC_API_KEY not configured" },
        { status: 500 }
      );
    }

    const systemPrompt =
      SYSTEM_PROMPTS[body.systemPrompt] || body.systemPrompt || SYSTEM_PROMPTS["Professional Consultant"];
    const userPrompt = buildPrompt(body);

    // Route to appropriate API based on model selection
    let generatedText: string;

    if (body.model === "gpt-4o") {
      // OpenAI API
      const response = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${process.env.OPENAI_API_KEY || apiKey}`,
        },
        body: JSON.stringify({
          model: "gpt-4o",
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userPrompt },
          ],
          max_tokens: 4096,
        }),
      });

      if (!response.ok) {
        throw new Error(`OpenAI API error: ${response.status}`);
      }

      const data = await response.json();
      generatedText = data.choices[0].message.content;
    } else if (body.model === "gemini-2.0-flash-001") {
      // Google Gemini API
      const geminiKey = process.env.GOOGLE_API_KEY || apiKey;
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-001:generateContent?key=${geminiKey}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            systemInstruction: { parts: [{ text: systemPrompt }] },
            contents: [{ parts: [{ text: userPrompt }] }],
          }),
        }
      );

      if (!response.ok) {
        throw new Error(`Gemini API error: ${response.status}`);
      }

      const data = await response.json();
      generatedText = data.candidates[0].content.parts[0].text;
    } else {
      // Default: Anthropic Claude
      const response = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": apiKey,
          "anthropic-version": "2023-06-01",
        },
        body: JSON.stringify({
          model: "claude-sonnet-4-6",
          max_tokens: 4096,
          system: systemPrompt,
          messages: [{ role: "user", content: userPrompt }],
        }),
      });

      if (!response.ok) {
        const errText = await response.text();
        throw new Error(`Anthropic API error: ${response.status} - ${errText}`);
      }

      const data = await response.json();
      generatedText = data.content[0].text;
    }

    return NextResponse.json({ proposal: generatedText });
  } catch (error) {
    console.error("Generation error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to generate proposal" },
      { status: 500 }
    );
  }
}
