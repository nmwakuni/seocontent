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
    const { projectId, title, keywords, outline, model = "claude-3-5-sonnet-20241022" } = body

    if (!projectId || !title || !keywords) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      )
    }

    // Validate model
    const validModels = [
      "claude-3-5-sonnet-20241022",
      "claude-3-opus-20240229",
      "claude-3-haiku-20240307",
    ]

    if (!validModels.includes(model)) {
      return NextResponse.json(
        { error: "Invalid AI model selected" },
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
    const prompt = `You are an expert SEO content writer. Write a comprehensive, SEO-optimized article based on the following:

PROJECT DETAILS:
- Project: ${project.name}
- Target Audience: ${project.targetAudience || "General audience interested in the topic"}
- Brand Voice: ${project.brandVoice || "Professional, informative, and engaging"}
${project.domain ? `- Website: ${project.domain}` : ""}

ARTICLE REQUIREMENTS:
- Title: ${title}
- Target Keywords: ${keywords}
${outline ? `- Suggested Outline:\n${outline}` : ""}

Please write a complete, SEO-optimized article that:

1. Is comprehensive (1500-2500 words)
2. Naturally incorporates the target keywords
3. Has a clear structure with headings (H2, H3)
4. Includes an engaging introduction
5. Provides actionable, valuable insights
6. Uses examples and data where appropriate
7. Ends with a strong conclusion
8. Is written for both search engines AND human readers

Also provide:
- A compelling meta description (150-160 characters)
- Natural keyword integration without stuffing

Format: Write the article in markdown format with proper headings (##, ###) for structure.

IMPORTANT: Write ONLY the article content and meta description. No additional commentary.

Start your response with:
META_DESCRIPTION: [your meta description here]

ARTICLE_CONTENT:
[your article content in markdown]`

    // Call Claude API with selected model
    const message = await anthropic.messages.create({
      model,
      max_tokens: 16000,
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

    // Parse the response
    const responseText = content.text.trim()
    let metaDescription = ""
    let articleContent = ""

    // Extract meta description
    const metaMatch = responseText.match(/META_DESCRIPTION:\s*([\s\S]+?)(?:\n|ARTICLE_CONTENT:)/)
    if (metaMatch) {
      metaDescription = metaMatch[1].trim()
    }

    // Extract article content
    const contentMatch = responseText.match(/ARTICLE_CONTENT:\s*([\s\S]+)/);
    if (contentMatch) {
      articleContent = contentMatch[1].trim()
    } else {
      // Fallback: if no ARTICLE_CONTENT marker, use everything after META_DESCRIPTION
      const parts = responseText.split("ARTICLE_CONTENT:")
      if (parts.length > 1) {
        articleContent = parts[1].trim()
      } else {
        // Last resort: use the whole response
        articleContent = responseText
      }
    }

    // Return the generated content
    return NextResponse.json({
      content: articleContent,
      metaDescription,
    })
  } catch (error: any) {
    console.error("Error generating article:", error)
    return NextResponse.json(
      {
        error: "Failed to generate article",
        details: error.message,
      },
      { status: 500 }
    )
  }
}
