import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { auth } from "@/lib/auth"
import { headers } from "next/headers"
import { sql } from "drizzle-orm"
import { articles, contentClusters, projects, usageTracking } from "@/lib/db/schema"

export async function GET(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    })

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const userId = session.user.id

    // Get current month
    const currentMonth = new Date().toISOString().slice(0, 7) // YYYY-MM

    // Fetch usage statistics
    const [
      projectCount,
      articleCount,
      clusterCount,
      currentMonthUsage,
      recentArticles,
      articlesOverTime,
    ] = await Promise.all([
      // Total projects
      db
        .select({ count: sql<number>`count(*)` })
        .from(projects)
        .where(sql`${projects.userId} = ${userId}`)
        .then((res) => Number(res[0]?.count || 0)),

      // Total articles
      db
        .select({ count: sql<number>`count(*)` })
        .from(articles)
        .innerJoin(projects, sql`${articles.projectId} = ${projects.id}`)
        .where(sql`${projects.userId} = ${userId}`)
        .then((res) => Number(res[0]?.count || 0)),

      // Total clusters
      db
        .select({ count: sql<number>`count(*)` })
        .from(contentClusters)
        .innerJoin(projects, sql`${contentClusters.projectId} = ${projects.id}`)
        .where(sql`${projects.userId} = ${userId}`)
        .then((res) => Number(res[0]?.count || 0)),

      // Current month usage
      db.query.usageTracking.findFirst({
        where: (usageTracking, { and, eq }) =>
          and(
            eq(usageTracking.userId, userId),
            eq(usageTracking.month, currentMonth)
          ),
      }),

      // Recent articles
      db
        .select({
          id: articles.id,
          title: articles.title,
          createdAt: articles.createdAt,
          status: articles.status,
          projectName: projects.name,
        })
        .from(articles)
        .innerJoin(projects, sql`${articles.projectId} = ${projects.id}`)
        .where(sql`${projects.userId} = ${userId}`)
        .orderBy(sql`${articles.createdAt} DESC`)
        .limit(5),

      // Articles created over the last 6 months
      db
        .select({
          month: sql<string>`to_char(${articles.createdAt}, 'YYYY-MM')`,
          count: sql<number>`count(*)`,
        })
        .from(articles)
        .innerJoin(projects, sql`${articles.projectId} = ${projects.id}`)
        .where(sql`${projects.userId} = ${userId} AND ${articles.createdAt} >= NOW() - INTERVAL '6 months'`)
        .groupBy(sql`to_char(${articles.createdAt}, 'YYYY-MM')`)
        .orderBy(sql`to_char(${articles.createdAt}, 'YYYY-MM')`)
        .then((res) =>
          res.map((r) => ({
            month: r.month,
            count: Number(r.count),
          }))
        ),
    ])

    // Calculate statistics
    const stats = {
      totalProjects: projectCount,
      totalArticles: articleCount,
      totalClusters: clusterCount,
      articlesThisMonth: currentMonthUsage?.articlesGenerated || 0,
      keywordResearchesThisMonth: currentMonthUsage?.keywordResearches || 0,
    }

    return NextResponse.json({
      stats,
      recentArticles,
      articlesOverTime,
    })
  } catch (error: any) {
    console.error("Error fetching analytics:", error)
    return NextResponse.json(
      {
        error: "Failed to fetch analytics",
        details: error.message,
      },
      { status: 500 }
    )
  }
}
