import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { auth } from "@/lib/auth"
import { headers } from "next/headers"
import { teamInvitations, projects, users, teamMembers } from "@/lib/db/schema"
import { eq, and } from "drizzle-orm"
import { Resend } from "resend"
import crypto from "crypto"

// Lazy initialization to avoid build-time errors
function getResendClient() {
  return new Resend(process.env.RESEND_API_KEY || "")
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
    const { projectId, email, role } = body

    if (!projectId || !email || !role) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      )
    }

    // Validate role
    if (!["admin", "editor", "viewer"].includes(role)) {
      return NextResponse.json({ error: "Invalid role" }, { status: 400 })
    }

    // Check if user has permission to invite (must be project owner or admin)
    const project = await db.query.projects.findFirst({
      where: (projects, { eq }) => eq(projects.id, projectId),
    })

    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 })
    }

    const isOwner = project.userId === session.user.id
    const teamMember = await db.query.teamMembers.findFirst({
      where: (teamMembers, { and, eq }) =>
        and(
          eq(teamMembers.projectId, projectId),
          eq(teamMembers.userId, session.user.id),
          eq(teamMembers.role, "admin")
        ),
    })

    if (!isOwner && !teamMember) {
      return NextResponse.json(
        { error: "You don't have permission to invite members to this project" },
        { status: 403 }
      )
    }

    // Check if user is already a team member
    const existingUser = await db.query.users.findFirst({
      where: (users, { eq }) => eq(users.email, email),
    })

    if (existingUser) {
      const existing = await db.query.teamMembers.findFirst({
        where: (teamMembers, { and, eq }) =>
          and(
            eq(teamMembers.projectId, projectId),
            eq(teamMembers.userId, existingUser.id)
          ),
      })

      if (existing) {
        return NextResponse.json(
          { error: "User is already a team member" },
          { status: 400 }
        )
      }
    }

    // Create invitation token
    const token = crypto.randomBytes(32).toString("hex")
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days

    // Create invitation
    const [invitation] = await db
      .insert(teamInvitations)
      .values({
        projectId,
        email,
        role,
        invitedBy: session.user.id,
        token,
        expiresAt,
      })
      .returning()

    // Send invitation email
    if (process.env.RESEND_API_KEY) {
      const inviteUrl = `${process.env.NEXT_PUBLIC_BETTER_AUTH_URL}/team/accept-invite?token=${token}`
      const resend = getResendClient()

      await resend.emails.send({
        from: "SEO Content Cluster <team@yourdomain.com>",
        to: [email],
        subject: `You've been invited to join ${project.name}`,
        html: `
          <h2>Team Invitation</h2>
          <p>You've been invited to join the project "${project.name}" as a ${role}.</p>
          <p><a href="${inviteUrl}">Click here to accept the invitation</a></p>
          <p>This invitation will expire in 7 days.</p>
        `,
      })
    }

    return NextResponse.json({ success: true, invitation })
  } catch (error: any) {
    console.error("Error inviting team member:", error)
    return NextResponse.json(
      { error: "Failed to invite team member", details: error.message },
      { status: 500 }
    )
  }
}
