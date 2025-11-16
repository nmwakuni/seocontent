import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { articles } from "@/lib/db/schema"
import { auth } from "@/lib/auth"
import { headers } from "next/headers"

export async function GET(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    })

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get all projects for the user first
    const userProjects = await db.query.projects.findMany({
      where: (projects, { eq }) => eq(projects.userId, session.user.id),
    })

    const projectIds = userProjects.map(p => p.id)

    if (projectIds.length === 0) {
      return NextResponse.json([])
    }

    // Get articles for user's projects
    const userArticles = await db.query.articles.findMany({
      where: (articles, { inArray }) =>
        inArray(articles.projectId, projectIds),
      orderBy: (articles, { desc }) => [desc(articles.createdAt)],
    })

    return NextResponse.json(userArticles)
  } catch (error) {
    console.error("Error fetching articles:", error)
    return NextResponse.json(
      { error: "Failed to fetch articles" },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    })

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { projectId, clusterId, title, slug, content, metaDescription, targetKeywords } = body

    if (!projectId || !title || !content) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      )
    }

    // Verify project belongs to user
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

    const [article] = await db
      .insert(articles)
      .values({
        projectId,
        clusterId: clusterId || null,
        title,
        slug: slug || title.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
        content,
        metaDescription,
        targetKeywords: targetKeywords || [],
        status: "draft",
      })
      .returning()

    return NextResponse.json(article, { status: 201 })
  } catch (error) {
    console.error("Error creating article:", error)
    return NextResponse.json(
      { error: "Failed to create article" },
      { status: 500 }
    )
  }
}
