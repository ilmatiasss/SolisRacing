CREATE TABLE "integration_requests" (
	"id" serial PRIMARY KEY NOT NULL,
	"method" text NOT NULL,
	"path" text NOT NULL,
	"query" text,
	"headers" jsonb,
	"body" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX "integration_requests_created_at_index" ON "integration_requests" USING btree ("created_at");