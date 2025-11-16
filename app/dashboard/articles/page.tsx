"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Plus, FileText, Loader2, ExternalLink, Calendar } from "lucide-react"
import Link from "next/link"
import { useQuery } from "@tanstack/react-query"

export default function ArticlesPage() {
  const { data: articles = [], isLoading } = useQuery({
    queryKey: ["articles"],
    queryFn: async () => {
      const response = await fetch("/api/articles")
      if (!response.ok) throw new Error("Failed to fetch articles")
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
          <h1 className="text-3xl font-bold">Articles</h1>
          <p className="text-muted-foreground mt-2">
            Manage your AI-generated SEO articles
          </p>
        </div>
        <Link href="/dashboard/articles/new">
          <Button size="lg">
            <Plus className="mr-2 h-5 w-5" />
            Generate Article
          </Button>
        </Link>
      </div>

      {articles.length === 0 ? (
        <Card className="border-2 border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-16">
            <FileText className="h-16 w-16 text-muted-foreground mb-4" />
            <h3 className="text-xl font-semibold mb-2">No articles yet</h3>
            <p className="text-muted-foreground text-center max-w-md mb-6">
              Generate your first AI-powered SEO article from a content cluster
            </p>
            <Link href="/dashboard/articles/new">
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Generate Your First Article
              </Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {articles.map((article: any) => (
            <Card key={article.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="line-clamp-1">{article.title}</CardTitle>
                    <CardDescription className="line-clamp-2 mt-2">
                      {article.metaDescription || "No meta description"}
                    </CardDescription>
                  </div>
                  <div className={`px-3 py-1 rounded-full text-xs font-medium ${
                    article.status === 'published'
                      ? 'bg-green-100 text-green-700'
                      : 'bg-gray-100 text-gray-700'
                  }`}>
                    {article.status}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      <span>{new Date(article.createdAt).toLocaleDateString()}</span>
                    </div>
                    {article.targetKeywords && article.targetKeywords.length > 0 && (
                      <div className="flex gap-1">
                        {article.targetKeywords.slice(0, 3).map((kw: string, i: number) => (
                          <span
                            key={i}
                            className="px-2 py-0.5 rounded-full bg-primary/10 text-primary text-xs"
                          >
                            {kw}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <Link href={`/dashboard/articles/${article.id}`}>
                      <Button variant="outline" size="sm">
                        <ExternalLink className="mr-2 h-4 w-4" />
                        View
                      </Button>
                    </Link>
                    <Link href={`/dashboard/articles/${article.id}/edit`}>
                      <Button size="sm">
                        Edit
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
