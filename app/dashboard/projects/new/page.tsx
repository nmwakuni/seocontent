"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { ArrowLeft, Loader2 } from "lucide-react"
import Link from "next/link"
import { useToast } from "@/hooks/use-toast"

const projectSchema = z.object({
  name: z.string().min(3, "Name must be at least 3 characters").max(255),
  description: z.string().optional(),
  domain: z.string().url("Please enter a valid URL").or(z.literal("")).optional(),
  targetAudience: z.string().optional(),
  brandVoice: z.string().optional(),
})

type ProjectForm = z.infer<typeof projectSchema>

export default function NewProjectPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ProjectForm>({
    resolver: zodResolver(projectSchema),
  })

  const onSubmit = async (data: ProjectForm) => {
    setIsLoading(true)
    try {
      const response = await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      })

      if (!response.ok) {
        throw new Error("Failed to create project")
      }

      const project = await response.json()

      toast({
        title: "Success",
        description: "Project created successfully!",
      })

      router.push(`/dashboard/projects/${project.id}`)
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create project. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="max-w-3xl space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/dashboard/projects">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold">Create New Project</h1>
          <p className="text-muted-foreground mt-2">
            Set up a new SEO content project
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Project Details</CardTitle>
          <CardDescription>
            Provide information about your SEO project to help AI generate better content
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="name">
                Project Name <span className="text-destructive">*</span>
              </Label>
              <Input
                id="name"
                placeholder="My Awesome SaaS Blog"
                {...register("name")}
                disabled={isLoading}
              />
              {errors.name && (
                <p className="text-sm text-destructive">{errors.name.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                placeholder="Describe your project and its goals..."
                rows={4}
                {...register("description")}
                disabled={isLoading}
              />
              {errors.description && (
                <p className="text-sm text-destructive">{errors.description.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="domain">Website Domain</Label>
              <Input
                id="domain"
                type="url"
                placeholder="https://example.com"
                {...register("domain")}
                disabled={isLoading}
              />
              {errors.domain && (
                <p className="text-sm text-destructive">{errors.domain.message}</p>
              )}
              <p className="text-xs text-muted-foreground">
                Optional: Your website URL for better SEO optimization
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="targetAudience">Target Audience</Label>
              <Textarea
                id="targetAudience"
                placeholder="E.g., B2B SaaS founders, tech-savvy marketers, developers..."
                rows={3}
                {...register("targetAudience")}
                disabled={isLoading}
              />
              {errors.targetAudience && (
                <p className="text-sm text-destructive">{errors.targetAudience.message}</p>
              )}
              <p className="text-xs text-muted-foreground">
                Describe who you're writing for to tailor the content
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="brandVoice">Brand Voice & Tone</Label>
              <Textarea
                id="brandVoice"
                placeholder="E.g., Professional yet approachable, technical but easy to understand, conversational and friendly..."
                rows={3}
                {...register("brandVoice")}
                disabled={isLoading}
              />
              {errors.brandVoice && (
                <p className="text-sm text-destructive">{errors.brandVoice.message}</p>
              )}
              <p className="text-xs text-muted-foreground">
                Define your brand's unique voice for consistent content
              </p>
            </div>

            <div className="flex gap-4">
              <Link href="/dashboard/projects" className="flex-1">
                <Button type="button" variant="outline" className="w-full" disabled={isLoading}>
                  Cancel
                </Button>
              </Link>
              <Button type="submit" className="flex-1" disabled={isLoading}>
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Create Project
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
