ALTER TABLE "conversations" ADD COLUMN "temperature" real DEFAULT 0.7;--> statement-breakpoint
ALTER TABLE "conversations" ADD COLUMN "max_tokens" integer DEFAULT 2048;