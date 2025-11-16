"use client"

import { Suspense, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { ArrowLeft, Loader2, Sparkles, CheckCircle2 } from "lucide-react"
import Link from "next/link"
import { useToast } from "@/hooks/use-toast"
import { useQuery } from "@tanstack/react-query"

export const dynamic = "force-dynamic"

const clusterSchema = z.object({
  projectId: z.string().min(1, "Please select a project"),
  pillarTopic: z.string().min(3, "Topic must be at least 3 characters"),
  keywords: z.string().min(3, "Please enter at least one keyword"),
  numberOfArticles: z.coerce.number().min(3).max(20).default(10),
})

type ClusterForm = z.infer<typeof clusterSchema>

function NewClusterContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { toast } = useToast()
  const [isGenerating, setIsGenerating] = useState(false)
  const [generatedCluster, setGeneratedCluster] = useState<any>(null)

  const { data: projects = [] } = useQuery({
    queryKey: ["projects"],
    queryFn: async () => {
      const response = await fetch("/api/projects")
      if (!response.ok) throw new Error("Failed to fetch projects")
      return response.json()
    },
  })

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(clusterSchema),
    defaultValues: {
      projectId: searchParams.get("project") || "",
      numberOfArticles: 10,
    },
  })

  const onSubmit = async (data: ClusterForm) => {
    setIsGenerating(true)
    setGeneratedCluster(null)

    try {
      const response = await fetch("/api/clusters/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      })

      if (!response.ok) {
        throw new Error("Failed to generate cluster")
      }

      const cluster = await response.json()
      setGeneratedCluster(cluster)

      toast({
        title: "Success!",
        description: "Content cluster strategy generated successfully!",
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to generate cluster. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsGenerating(false)
    }
  }

  const handleSaveCluster = async () => {
    if (!generatedCluster) return

    try {
      const response = await fetch("/api/clusters", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(generatedCluster),
      })

      if (!response.ok) {
        throw new Error("Failed to save cluster")
      }

      const saved = await response.json()

      toast({
        title: "Saved!",
        description: "Content cluster saved successfully!",
      })

      router.push(`/dashboard/clusters/${saved.id}`)
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save cluster. Please try again.",
        variant: "destructive",
      })
    }
  }

  return (
    <div className="max-w-5xl space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/dashboard/clusters">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold">Generate Content Cluster</h1>
          <p className="text-muted-foreground mt-2">
            AI-powered content strategy for your SEO project
          </p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Input Form */}
        <Card>
          <CardHeader>
            <CardTitle>Cluster Configuration</CardTitle>
            <CardDescription>
              Provide details to generate your content cluster strategy
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="projectId">
                  Project <span className="text-destructive">*</span>
                </Label>
                <select
                  id="projectId"
                  {...register("projectId")}
                  className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                  disabled={isGenerating}
                >
                  <option value="">Select a project</option>
                  {projects.map((project: any) => (
                    <option key={project.id} value={project.id}>
                      {project.name}
                    </option>
                  ))}
                </select>
                {errors.projectId && (
                  <p className="text-sm text-destructive">{errors.projectId.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="pillarTopic">
                  Pillar Topic <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="pillarTopic"
                  placeholder="E.g., Email Marketing Best Practices"
                  {...register("pillarTopic")}
                  disabled={isGenerating}
                />
                {errors.pillarTopic && (
                  <p className="text-sm text-destructive">{errors.pillarTopic.message}</p>
                )}
                <p className="text-xs text-muted-foreground">
                  The main topic for your content cluster
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="keywords">
                  Target Keywords <span className="text-destructive">*</span>
                </Label>
                <Textarea
                  id="keywords"
                  placeholder="email marketing, email campaigns, newsletter best practices, email automation..."
                  rows={4}
                  {...register("keywords")}
                  disabled={isGenerating}
                />
                {errors.keywords && (
                  <p className="text-sm text-destructive">{errors.keywords.message}</p>
                )}
                <p className="text-xs text-muted-foreground">
                  Comma-separated list of keywords to target
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="numberOfArticles">
                  Number of Supporting Articles
                </Label>
                <Input
                  id="numberOfArticles"
                  type="number"
                  min={3}
                  max={20}
                  {...register("numberOfArticles", { valueAsNumber: true })}
                  disabled={isGenerating}
                />
                {errors.numberOfArticles && (
                  <p className="text-sm text-destructive">{errors.numberOfArticles.message}</p>
                )}
                <p className="text-xs text-muted-foreground">
                  Between 3 and 20 articles (recommended: 10)
                </p>
              </div>

              <Button
                type="submit"
                className="w-full"
                disabled={isGenerating || !projects.length}
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Generating with AI...
                  </>
                ) : (
                  <>
                    <Sparkles className="mr-2 h-4 w-4" />
                    Generate Cluster Strategy
                  </>
                )}
              </Button>

              {!projects.length && (
                <p className="text-sm text-center text-muted-foreground">
                  Please create a project first
                </p>
              )}
            </form>
          </CardContent>
        </Card>

        {/* Generated Result */}
        <Card className={generatedCluster ? "border-primary" : ""}>
          <CardHeader>
            <CardTitle>Generated Strategy</CardTitle>
            <CardDescription>
              {generatedCluster
                ? "Review your AI-generated content cluster"
                : "Your content strategy will appear here"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {!generatedCluster && !isGenerating && (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <Sparkles className="h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-sm text-muted-foreground max-w-xs">
                  Fill out the form and click generate to create your content cluster strategy
                </p>
              </div>
            )}

            {isGenerating && (
              <div className="flex flex-col items-center justify-center py-12">
                <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
                <p className="text-sm font-medium mb-2">Generating content strategy...</p>
                <p className="text-xs text-muted-foreground max-w-xs text-center">
                  AI is analyzing your topic and creating a comprehensive content cluster
                </p>
              </div>
            )}

            {generatedCluster && (
              <div className="space-y-6">
                <div className="flex items-center gap-2 text-green-600">
                  <CheckCircle2 className="h-5 w-5" />
                  <span className="font-medium">Strategy Generated!</span>
                </div>

                {/* Pillar Article */}
                <div className="space-y-3">
                  <h4 className="font-semibold">Pillar Article</h4>
                  <div className="rounded-lg border p-4 bg-primary/5">
                    <h5 className="font-medium mb-2">
                      {generatedCluster.clusterStrategy.pillarArticle.title}
                    </h5>
                    <p className="text-sm text-muted-foreground mb-3">
                      {generatedCluster.clusterStrategy.pillarArticle.description}
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {generatedCluster.clusterStrategy.pillarArticle.targetKeywords.map(
                        (kw: string, i: number) => (
                          <span
                            key={i}
                            className="text-xs px-2 py-1 rounded-full bg-primary/10 text-primary"
                          >
                            {kw}
                          </span>
                        )
                      )}
                    </div>
                  </div>
                </div>

                {/* Supporting Articles */}
                <div className="space-y-3">
                  <h4 className="font-semibold">
                    Supporting Articles ({generatedCluster.clusterStrategy.supportingArticles.length})
                  </h4>
                  <div className="space-y-2 max-h-96 overflow-y-auto">
                    {generatedCluster.clusterStrategy.supportingArticles.map(
                      (article: any, i: number) => (
                        <div key={i} className="rounded-lg border p-3">
                          <h6 className="font-medium text-sm mb-1">{article.title}</h6>
                          <p className="text-xs text-muted-foreground mb-2">
                            {article.description}
                          </p>
                          <div className="flex flex-wrap gap-1">
                            {article.targetKeywords.slice(0, 3).map((kw: string, j: number) => (
                              <span
                                key={j}
                                className="text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground"
                              >
                                {kw}
                              </span>
                            ))}
                          </div>
                        </div>
                      )
                    )}
                  </div>
                </div>

                <div className="flex gap-3">
                  <Button variant="outline" className="flex-1" onClick={() => setGeneratedCluster(null)}>
                    Generate New
                  </Button>
                  <Button className="flex-1" onClick={handleSaveCluster}>
                    Save & Continue
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default function NewClusterPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    }>
      <NewClusterContent />
    </Suspense>
  )
}
