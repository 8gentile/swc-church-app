import type { PoolClient } from 'pg'

const sql = `CREATE TABLE "eventCache" (
	"instanceId" text PRIMARY KEY NOT NULL,
	"eventId" text NOT NULL,
	"name" text NOT NULL,
	"startDatetime" text NOT NULL,
	"endDatetime" text,
	"location" text,
	"description" text,
	"categoryId" text,
	"syncedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "eventSignup" (
	"id" text PRIMARY KEY NOT NULL,
	"userId" text NOT NULL,
	"instanceId" text NOT NULL,
	"status" text DEFAULT 'pending_add' NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL,
	"breezePersonId" text,
	"breezeSyncedAt" timestamp
);
--> statement-breakpoint
CREATE UNIQUE INDEX "eventSignup_user_instance_uniq" ON "eventSignup" ("userId", "instanceId");
--> statement-breakpoint
CREATE INDEX "eventSignup_userId_idx" ON "eventSignup" USING btree ("userId");
--> statement-breakpoint
CREATE INDEX "eventSignup_status_idx" ON "eventSignup" USING btree ("status");`

export async function up(client: PoolClient) {
  await client.query(sql)
}
