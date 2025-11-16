import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { auth } from "@/lib/auth"
import { headers } from "next/headers"
import Anthropic from "@anthropic-ai/sdk"

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY || "",
})

export async function POST(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    })

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { projectId, pillarTopic, keywords, numberOfArticles = 10 } = body

    if (!projectId || !pillarTopic || !keywords) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      )
    }

    // Verify project belongs to user and get project details
    const project = await db.query.projects.findFirst({
      where: (projects, { and, eq }) =>
        and(
          eq(projects.id, projectId),
          eq(projects.userId, session.user.id)
        ),
    })

    if (!project) {
      return NextResponse.json(
        { error: "Project not found" },
        { status: 404 }
      )
    }

    // Prepare prompt for Claude
    const prompt = `You are an expert SEO content strategist. Create a comprehensive content cluster strategy for the following:

PROJECT DETAILS:
- Project Name: ${project.name}
- Target Audience: ${project.targetAudience || "General audience"}
- Brand Voice: ${project.brandVoice || "Professional and informative"}

CONTENT CLUSTER REQUEST:
- Pillar Topic: ${pillarTopic}
- Target Keywords: ${keywords}
- Number of Supporting Articles: ${numberOfArticles}

Please generate a complete content cluster strategy with:

1. ONE pillar article (comprehensive guide covering the main topic)
2. ${numberOfArticles} supporting articles (focused sub-topics that link back to the pillar)

For EACH article, provide:
- Title (SEO-optimized, compelling)
- Description (2-3 sentences explaining what the article will cover)
- Target Keywords (3-5 relevant keywords)

The strategy should:
- Create topical authority around the pillar topic
- Cover different aspects and user intents
- Support internal linking between articles
- Target a mix of informational, transactional, and navigational keywords
- Be optimized for search engines while remaining valuable to readers

Format your response as valid JSON with this exact structure:
{
  "pillarArticle": {
    "title": "string",
    "description": "string",
    "targetKeywords": ["keyword1", "keyword2", "keyword3"]
  },
  "supportingArticles": [
    {
      "title": "string",
      "description": "string",
      "targetKeywords": ["keyword1", "keyword2", "keyword3"]
    }
  ]
}

IMPORTANT: Return ONLY valid JSON, no markdown code blocks, no explanations.`

    // Call Claude API
    const message = await anthropic.messages.create({
      model: "claude-3-5-sonnet-20241022",
      max_tokens: 8000,
      messages: [
        {
          role: "user",
          content: prompt,
        },
      ],
    })

    // Extract text content
    const content = message.content[0]
    if (content.type !== "text") {
      throw new Error("Unexpected response type from Claude")
    }

    // Parse the JSON response
    let clusterStrategy
    try {
      // Remove any markdown code blocks if present
      let jsonText = content.text.trim()
      if (jsonText.startsWith("```json")) {
        jsonText = jsonText.replace(/```json\n?/g, "").replace(/```\n?/g, "")
      } else if (jsonText.startsWith("```")) {
        jsonText = jsonText.replace(/```\n?/g, "")
      }

      clusterStrategy = JSON.parse(jsonText)
    } catch (parseError) {
      console.error("Failed to parse Claude response:", content.text)
      throw new Error("Failed to parse AI response")
    }

    // Validate the structure
    if (
      !clusterStrategy.pillarArticle ||
      !clusterStrategy.supportingArticles ||
      !Array.isArray(clusterStrategy.supportingArticles)
    ) {
      throw new Error("Invalid cluster strategy structure")
    }

    // Return the generated cluster (not saved yet)
    const generatedCluster = {
      projectId,
      name: pillarTopic,
      pillarTopic,
      clusterStrategy,
      status: "draft",
    }

    return NextResponse.json(generatedCluster)
  } catch (error: any) {
    console.error("Error generating cluster:", error)
    return NextResponse.json(
      {
        error: "Failed to generate cluster",
        details: error.message,
      },
      { status: 500 }
    )
  }
}
