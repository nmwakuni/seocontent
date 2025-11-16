import { pgTable, text, timestamp, uuid, varchar, integer, boolean, jsonb, index } from "drizzle-orm/pg-core"

// Users table (Better Auth compatible)
export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: varchar("name", { length: 255 }),
  email: varchar("email", { length: 255 }).notNull().unique(),
  emailVerified: boolean("email_verified").default(false),
  image: text("image"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => ({
  emailIdx: index("email_idx").on(table.email),
}))

export const sessions = pgTable("sessions", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  token: text("token").notNull().unique(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
})

export const accounts = pgTable("accounts", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  accountId: text("account_id").notNull(),
  providerId: text("provider_id").notNull(),
  accessToken: text("access_token"),
  refreshToken: text("refresh_token"),
  expiresAt: timestamp("expires_at"),
  password: text("password"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
})

export const verifications = pgTable("verifications", {
  id: uuid("id").primaryKey().defaultRandom(),
  identifier: text("identifier").notNull(),
  value: text("value").notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
})

// Projects table - each user can have multiple SEO projects
export const projects = pgTable("projects", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  domain: varchar("domain", { length: 255 }),
  targetAudience: text("target_audience"),
  brandVoice: text("brand_voice"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => ({
  userIdx: index("project_user_idx").on(table.userId),
}))

// Keywords table - keyword research data
export const keywords = pgTable("keywords", {
  id: uuid("id").primaryKey().defaultRandom(),
  projectId: uuid("project_id").references(() => projects.id, { onDelete: "cascade" }).notNull(),
  keyword: varchar("keyword", { length: 500 }).notNull(),
  searchVolume: integer("search_volume"),
  difficulty: integer("difficulty"),
  cpc: integer("cpc"), // in cents
  competitorUrls: jsonb("competitor_urls").$type<string[]>(),
  isTarget: boolean("is_target").default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => ({
  projectIdx: index("keyword_project_idx").on(table.projectId),
  keywordIdx: index("keyword_idx").on(table.keyword),
}))

// Content clusters - AI-generated content strategy
export const contentClusters = pgTable("content_clusters", {
  id: uuid("id").primaryKey().defaultRandom(),
  projectId: uuid("project_id").references(() => projects.id, { onDelete: "cascade" }).notNull(),
  name: varchar("name", { length: 500 }).notNull(),
  pillarTopic: text("pillar_topic").notNull(),
  clusterStrategy: jsonb("cluster_strategy").$type<{
    pillarArticle: {
      title: string
      description: string
      targetKeywords: string[]
    }
    supportingArticles: Array<{
      title: string
      description: string
      targetKeywords: string[]
    }>
  }>(),
  status: varchar("status", { length: 50 }).default("draft"), // draft, in_progress, completed
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => ({
  projectIdx: index("cluster_project_idx").on(table.projectId),
}))

// Articles - generated content
export const articles = pgTable("articles", {
  id: uuid("id").primaryKey().defaultRandom(),
  projectId: uuid("project_id").references(() => projects.id, { onDelete: "cascade" }).notNull(),
  clusterId: uuid("cluster_id").references(() => contentClusters.id, { onDelete: "set null" }),
  title: varchar("title", { length: 500 }).notNull(),
  slug: varchar("slug", { length: 500 }).notNull(),
  content: text("content").notNull(),
  metaDescription: text("meta_description"),
  targetKeywords: jsonb("target_keywords").$type<string[]>(),
  status: varchar("status", { length: 50 }).default("draft"), // draft, published
  publishedAt: timestamp("published_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => ({
  projectIdx: index("article_project_idx").on(table.projectId),
  clusterIdx: index("article_cluster_idx").on(table.clusterId),
  slugIdx: index("article_slug_idx").on(table.slug),
}))

// Subscriptions - user subscription/payment data
export const subscriptions = pgTable("subscriptions", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").references(() => users.id, { onDelete: "cascade" }).notNull().unique(),
  plan: varchar("plan", { length: 50 }).notNull(), // free, starter, pro, enterprise
  status: varchar("status", { length: 50 }).notNull(), // active, cancelled, past_due
  stripeCustomerId: varchar("stripe_customer_id", { length: 255 }),
  stripeSubscriptionId: varchar("stripe_subscription_id", { length: 255 }),
  stripePriceId: varchar("stripe_price_id", { length: 255 }),
  currentPeriodEnd: timestamp("current_period_end"),
  cancelAtPeriodEnd: boolean("cancel_at_period_end").default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => ({
  userIdx: index("subscription_user_idx").on(table.userId),
}))

// Usage tracking - track API usage per user
export const usageTracking = pgTable("usage_tracking", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  articlesGenerated: integer("articles_generated").default(0),
  keywordResearches: integer("keyword_researches").default(0),
  month: varchar("month", { length: 7 }).notNull(), // YYYY-MM format
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => ({
  userMonthIdx: index("usage_user_month_idx").on(table.userId, table.month),
}))
