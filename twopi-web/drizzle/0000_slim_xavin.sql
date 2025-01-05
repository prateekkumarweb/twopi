CREATE TABLE `account` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`account_type` text NOT NULL,
	`currency` text NOT NULL,
	`starting_balance` integer DEFAULT 0 NOT NULL,
	`created_at` integer DEFAULT datetime('now') NOT NULL,
	`account_extra` text,
	FOREIGN KEY (`currency`) REFERENCES `currency`(`code`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `category` (
	`name` text PRIMARY KEY NOT NULL,
	`group` text
);
--> statement-breakpoint
CREATE TABLE `currency` (
	`code` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`base` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `transaction_item` (
	`id` text PRIMARY KEY NOT NULL,
	`transaction` text NOT NULL,
	`account` text NOT NULL,
	`amount` integer DEFAULT 0 NOT NULL,
	`currency` text NOT NULL,
	`currency_amount` integer DEFAULT 0 NOT NULL,
	FOREIGN KEY (`transaction`) REFERENCES `transaction`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`account`) REFERENCES `account`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`currency`) REFERENCES `currency`(`code`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `transaction` (
	`id` text PRIMARY KEY NOT NULL,
	`category` text,
	`timestamp` integer DEFAULT datetime('now') NOT NULL,
	FOREIGN KEY (`category`) REFERENCES `category`(`name`) ON UPDATE no action ON DELETE set null
);
