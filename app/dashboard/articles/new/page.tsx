"use client"

import { useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { ArrowLeft, Loader2, Sparkles, FileText } from "lucide-react"
import Link from "next/link"
import { useToast } from "@/hooks/use-toast"
import { useQuery } from "@tanstack/react-query"

const articleSchema = z.object({
  projectId: z.string().min(1, "Please select a project"),
  title: z.string().min(10, "Title must be at least 10 characters"),
  keywords: z.string().min(3, "Please enter at least one keyword"),
  outline: z.string().optional(),
})

type ArticleForm = z.infer<typeof articleSchema>

export default function NewArticlePage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { toast } = useToast()
  const [isGenerating, setIsGenerating] = useState(false)
  const [generatedContent, setGeneratedContent] = useState("")
  const [metaDescription, setMetaDescription] = useState("")

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
  } = useForm<ArticleForm>({
    resolver: zodResolver(articleSchema),
    defaultValues: {
      projectId: searchParams.get("project") || "",
    },
  })

  const onSubmit = async (data: ArticleForm) => {
    setIsGenerating(true)
    setGeneratedContent("")
    setMetaDescription("")

    try {
      const response = await fetch("/api/articles/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      })

      if (!response.ok) {
        throw new Error("Failed to generate article")
      }

      const result = await response.json()
      setGeneratedContent(result.content)
      setMetaDescription(result.metaDescription)

      toast({
        title: "Success!",
        description: "Article generated successfully!",
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to generate article. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsGenerating(false)
    }
  }

  const handleSaveArticle = async () => {
    if (!generatedContent) return

    const formData = watch()

    try {
      const response = await fetch("/api/articles", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectId: formData.projectId,
          title: formData.title,
          content: generatedContent,
          metaDescription,
          targetKeywords: formData.keywords.split(",").map((k: string) => k.trim()),
          slug: formData.title
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, "-")
            .replace(/(^-|-$)/g, ""),
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to save article")
      }

      const saved = await response.json()

      toast({
        title: "Saved!",
        description: "Article saved successfully!",
      })

      router.push(`/dashboard/articles/${saved.id}`)
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save article. Please try again.",
        variant: "destructive",
      })
    }
  }

  const wordCount = generatedContent.split(/\s+/).filter(Boolean).length

  return (
    <div className="max-w-6xl space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/dashboard/articles">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold">Generate Article</h1>
          <p className="text-muted-foreground mt-2">
            Create SEO-optimized content with AI
          </p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-5">
        {/* Input Form */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Article Configuration</CardTitle>
            <CardDescription>
              Provide details for your SEO article
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
                <Label htmlFor="title">
                  Article Title <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="title"
                  placeholder="How to Master Email Marketing in 2025"
                  {...register("title")}
                  disabled={isGenerating}
                />
                {errors.title && (
                  <p className="text-sm text-destructive">{errors.title.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="keywords">
                  Target Keywords <span className="text-destructive">*</span>
                </Label>
                <Textarea
                  id="keywords"
                  placeholder="email marketing, email campaigns, newsletter tips..."
                  rows={3}
                  {...register("keywords")}
                  disabled={isGenerating}
                />
                {errors.keywords && (
                  <p className="text-sm text-destructive">{errors.keywords.message}</p>
                )}
                <p className="text-xs text-muted-foreground">
                  Comma-separated keywords
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="outline">Custom Outline (Optional)</Label>
                <Textarea
                  id="outline"
                  placeholder="1. Introduction&#10;2. Main points...&#10;3. Conclusion"
                  rows={5}
                  {...register("outline")}
                  disabled={isGenerating}
                />
                <p className="text-xs text-muted-foreground">
                  Provide a custom outline for the article
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
                    Generating Article...
                  </>
                ) : (
                  <>
                    <Sparkles className="mr-2 h-4 w-4" />
                    Generate with AI
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

        {/* Generated Content */}
        <Card className={`lg:col-span-3 ${generatedContent ? "border-primary" : ""}`}>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Generated Article</CardTitle>
                <CardDescription>
                  {generatedContent
                    ? `${wordCount} words · Ready to save`
                    : "Your article will appear here"}
                </CardDescription>
              </div>
              {generatedContent && (
                <Button onClick={handleSaveArticle}>Save Article</Button>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {!generatedContent && !isGenerating && (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <FileText className="h-16 w-16 text-muted-foreground mb-4" />
                <p className="text-sm text-muted-foreground max-w-md">
                  Fill out the form and click generate to create your SEO-optimized article
                </p>
              </div>
            )}

            {isGenerating && (
              <div className="flex flex-col items-center justify-center py-16">
                <Loader2 className="h-16 w-16 animate-spin text-primary mb-4" />
                <p className="text-sm font-medium mb-2">Generating article content...</p>
                <p className="text-xs text-muted-foreground max-w-md text-center">
                  This may take 30-60 seconds as AI writes high-quality, SEO-optimized content
                </p>
              </div>
            )}

            {generatedContent && (
              <div className="space-y-4">
                {metaDescription && (
                  <div className="p-4 rounded-lg bg-muted">
                    <h4 className="text-sm font-semibold mb-2">Meta Description</h4>
                    <p className="text-sm text-muted-foreground">{metaDescription}</p>
                  </div>
                )}

                <div className="prose prose-sm max-w-none">
                  <div
                    className="whitespace-pre-wrap"
                    dangerouslySetInnerHTML={{ __html: generatedContent.replace(/\n/g, "<br/>") }}
                  />
                </div>

                <div className="flex gap-3 pt-4 border-t">
                  <Button variant="outline" className="flex-1" onClick={() => setGeneratedContent("")}>
                    Generate New
                  </Button>
                  <Button className="flex-1" onClick={handleSaveArticle}>
                    Save Article
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
