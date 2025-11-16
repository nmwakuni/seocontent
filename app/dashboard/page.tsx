"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { FolderKanban, FileText, BarChart3, Plus, TrendingUp } from "lucide-react"
import Link from "next/link"
import { useSession } from "@/lib/auth-client"

export default function DashboardPage() {
  const { data: session } = useSession()

  const stats = [
    {
      title: "Total Projects",
      value: "0",
      description: "Active SEO projects",
      icon: FolderKanban,
      href: "/dashboard/projects",
    },
    {
      title: "Content Clusters",
      value: "0",
      description: "Generated this month",
      icon: BarChart3,
      href: "/dashboard/clusters",
    },
    {
      title: "Articles",
      value: "0",
      description: "Total articles created",
      icon: FileText,
      href: "/dashboard/articles",
    },
    {
      title: "Growth",
      value: "0%",
      description: "Content growth rate",
      icon: TrendingUp,
      href: "/dashboard",
    },
  ]

  return (
    <div className="space-y-8">
      {/* Welcome Section */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">
            Welcome back, {session?.user?.name?.split(" ")[0] || "there"}!
          </h1>
          <p className="text-muted-foreground mt-2">
            Here's what's happening with your SEO content today.
          </p>
        </div>
        <Link href="/dashboard/projects/new">
          <Button size="lg">
            <Plus className="mr-2 h-5 w-5" />
            New Project
          </Button>
        </Link>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Link key={stat.title} href={stat.href}>
            <Card className="hover:shadow-lg transition-shadow cursor-pointer">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {stat.title}
                </CardTitle>
                <stat.icon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{stat.value}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  {stat.description}
                </p>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>
            Get started with these common tasks
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-3">
          <Link href="/dashboard/projects/new">
            <Card className="hover:shadow-md transition-shadow cursor-pointer border-2">
              <CardHeader>
                <FolderKanban className="h-8 w-8 text-primary mb-2" />
                <CardTitle className="text-lg">Create Project</CardTitle>
                <CardDescription>
                  Start a new SEO content project
                </CardDescription>
              </CardHeader>
            </Card>
          </Link>

          <Link href="/dashboard/keywords">
            <Card className="hover:shadow-md transition-shadow cursor-pointer border-2">
              <CardHeader>
                <BarChart3 className="h-8 w-8 text-primary mb-2" />
                <CardTitle className="text-lg">Research Keywords</CardTitle>
                <CardDescription>
                  Find valuable keyword opportunities
                </CardDescription>
              </CardHeader>
            </Card>
          </Link>

          <Link href="/dashboard/clusters/new">
            <Card className="hover:shadow-md transition-shadow cursor-pointer border-2">
              <CardHeader>
                <FileText className="h-8 w-8 text-primary mb-2" />
                <CardTitle className="text-lg">Generate Content</CardTitle>
                <CardDescription>
                  Create AI-powered content clusters
                </CardDescription>
              </CardHeader>
            </Card>
          </Link>
        </CardContent>
      </Card>

      {/* Getting Started Guide */}
      <Card>
        <CardHeader>
          <CardTitle>Getting Started</CardTitle>
          <CardDescription>
            Follow these steps to create your first content cluster
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-start gap-4">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground font-bold">
                1
              </div>
              <div className="flex-1">
                <h4 className="font-semibold">Create a Project</h4>
                <p className="text-sm text-muted-foreground">
                  Set up your first SEO project with your target audience and brand voice
                </p>
              </div>
              <Link href="/dashboard/projects/new">
                <Button variant="outline" size="sm">Start</Button>
              </Link>
            </div>

            <div className="flex items-start gap-4">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted text-muted-foreground font-bold">
                2
              </div>
              <div className="flex-1">
                <h4 className="font-semibold">Research Keywords</h4>
                <p className="text-sm text-muted-foreground">
                  Find high-value keywords and analyze competitors
                </p>
              </div>
              <Button variant="outline" size="sm" disabled>Next</Button>
            </div>

            <div className="flex items-start gap-4">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted text-muted-foreground font-bold">
                3
              </div>
              <div className="flex-1">
                <h4 className="font-semibold">Generate Content Cluster</h4>
                <p className="text-sm text-muted-foreground">
                  Let AI create a complete content strategy for your keywords
                </p>
              </div>
              <Button variant="outline" size="sm" disabled>Next</Button>
            </div>

            <div className="flex items-start gap-4">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted text-muted-foreground font-bold">
                4
              </div>
              <div className="flex-1">
                <h4 className="font-semibold">Create Articles</h4>
                <p className="text-sm text-muted-foreground">
                  Generate SEO-optimized articles and publish them
                </p>
              </div>
              <Button variant="outline" size="sm" disabled>Next</Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
