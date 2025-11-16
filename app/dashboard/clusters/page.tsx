"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Plus, BarChart3, Loader2, FileText, Clock } from "lucide-react"
import Link from "next/link"
import { useQuery } from "@tanstack/react-query"

export default function ClustersPage() {
  const { data: clusters = [], isLoading } = useQuery({
    queryKey: ["clusters"],
    queryFn: async () => {
      const response = await fetch("/api/clusters")
      if (!response.ok) throw new Error("Failed to fetch clusters")
      return response.json()
    },
  })

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Content Clusters</h1>
          <p className="text-muted-foreground mt-2">
            AI-generated content strategies for your SEO projects
          </p>
        </div>
        <Link href="/dashboard/clusters/new">
          <Button size="lg">
            <Plus className="mr-2 h-5 w-5" />
            Generate Cluster
          </Button>
        </Link>
      </div>

      {clusters.length === 0 ? (
        <Card className="border-2 border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-16">
            <BarChart3 className="h-16 w-16 text-muted-foreground mb-4" />
            <h3 className="text-xl font-semibold mb-2">No content clusters yet</h3>
            <p className="text-muted-foreground text-center max-w-md mb-6">
              Generate your first AI-powered content cluster strategy to dominate SEO rankings
            </p>
            <Link href="/dashboard/clusters/new">
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Generate Your First Cluster
              </Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {clusters.map((cluster: any) => (
            <Card key={cluster.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="line-clamp-1">{cluster.name}</CardTitle>
                    <CardDescription className="line-clamp-1 mt-2">
                      {cluster.pillarTopic}
                    </CardDescription>
                  </div>
                  <div className={`px-2 py-1 rounded-full text-xs font-medium ${
                    cluster.status === 'completed'
                      ? 'bg-green-100 text-green-700'
                      : cluster.status === 'in_progress'
                      ? 'bg-blue-100 text-blue-700'
                      : 'bg-gray-100 text-gray-700'
                  }`}>
                    {cluster.status}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <FileText className="h-4 w-4" />
                      <span>
                        {cluster.clusterStrategy?.supportingArticles?.length || 0} articles
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Clock className="h-4 w-4" />
                      <span>{new Date(cluster.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Link href={`/dashboard/clusters/${cluster.id}`} className="flex-1">
                      <Button variant="outline" className="w-full">
                        View Details
                      </Button>
                    </Link>
                    <Link href={`/dashboard/articles/new?cluster=${cluster.id}`}>
                      <Button>
                        Generate Articles
                      </Button>
                    </Link>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
