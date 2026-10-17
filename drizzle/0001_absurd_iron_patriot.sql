CREATE TABLE `mp_edges` (
	`id` text PRIMARY KEY NOT NULL,
	`actor` text NOT NULL,
	`target` text NOT NULL,
	`kind` text NOT NULL,
	`status` text NOT NULL
);
--> statement-breakpoint
CREATE INDEX `mp_edge_actor` ON `mp_edges` (`actor`);--> statement-breakpoint
CREATE INDEX `mp_edge_target` ON `mp_edges` (`target`);--> statement-breakpoint
CREATE TABLE `mp_listings` (
	`id` text PRIMARY KEY NOT NULL,
	`seller` text NOT NULL,
	`buyer` text,
	`place` text NOT NULL,
	`price` integer NOT NULL,
	`status` text NOT NULL,
	`version` integer DEFAULT 0 NOT NULL,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE INDEX `mp_market_status` ON `mp_listings` (`status`,`created_at`);--> statement-breakpoint
CREATE TABLE `mp_messages` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`author` text NOT NULL,
	`district` text NOT NULL,
	`body` text NOT NULL,
	`created_at` integer NOT NULL,
	`hidden` integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE INDEX `mp_chat_district` ON `mp_messages` (`district`,`created_at`);--> statement-breakpoint
CREATE TABLE `mp_profiles` (
	`user_id` text PRIMARY KEY NOT NULL,
	`public_id` text NOT NULL,
	`name` text NOT NULL,
	`online` integer DEFAULT 0 NOT NULL,
	`last_seen` integer DEFAULT 0 NOT NULL,
	`cx` integer DEFAULT 0 NOT NULL,
	`cz` integer DEFAULT 0 NOT NULL,
	`last_action` integer DEFAULT 0 NOT NULL,
	`last_chat` integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `mp_public_id` ON `mp_profiles` (`public_id`);--> statement-breakpoint
CREATE INDEX `mp_nearby` ON `mp_profiles` (`online`,`cx`,`cz`,`last_seen`);--> statement-breakpoint
CREATE TABLE `mp_receipts` (
	`id` text PRIMARY KEY NOT NULL,
	`kind` text NOT NULL,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `mp_reports` (
	`id` text PRIMARY KEY NOT NULL,
	`reporter` text NOT NULL,
	`target` text NOT NULL,
	`message_id` integer,
	`reason` text NOT NULL,
	`created_at` integer NOT NULL,
	`status` text DEFAULT 'received' NOT NULL
);
--> statement-breakpoint
CREATE TABLE `mp_sessions` (
	`id` text PRIMARY KEY NOT NULL,
	`host` text NOT NULL,
	`guest` text,
	`kind` text NOT NULL,
	`place` text NOT NULL,
	`status` text NOT NULL,
	`expires_at` integer NOT NULL,
	`version` integer DEFAULT 0 NOT NULL,
	`payload` text,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE INDEX `mp_session_host` ON `mp_sessions` (`host`,`status`);--> statement-breakpoint
CREATE INDEX `mp_session_guest` ON `mp_sessions` (`guest`,`status`);