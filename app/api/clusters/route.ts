import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { contentClusters } from "@/lib/db/schema"
import { auth } from "@/lib/auth"
import { headers } from "next/headers"
import { eq } from "drizzle-orm"

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

    // Get clusters for user's projects
    const clusters = await db.query.contentClusters.findMany({
      where: (contentClusters, { inArray }) =>
        inArray(contentClusters.projectId, projectIds),
      orderBy: (contentClusters, { desc }) => [desc(contentClusters.createdAt)],
    })

    return NextResponse.json(clusters)
  } catch (error) {
    console.error("Error fetching clusters:", error)
    return NextResponse.json(
      { error: "Failed to fetch clusters" },
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
    const { projectId, name, pillarTopic, clusterStrategy } = body

    if (!projectId || !name || !pillarTopic || !clusterStrategy) {
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

    const [cluster] = await db
      .insert(contentClusters)
      .values({
        projectId,
        name,
        pillarTopic,
        clusterStrategy,
        status: "draft",
      })
      .returning()

    return NextResponse.json(cluster, { status: 201 })
  } catch (error) {
    console.error("Error creating cluster:", error)
    return NextResponse.json(
      { error: "Failed to create cluster" },
      { status: 500 }
    )
  }
}
