CREATE TABLE `documents` (
	`id` int AUTO_INCREMENT NOT NULL,
	`user_id` int,
	`original_name` text NOT NULL,
	`file_name` text NOT NULL,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`is_modified` boolean DEFAULT false,
	`customizations` json,
	CONSTRAINT `documents_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `templates` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` text NOT NULL,
	`image_path` text NOT NULL,
	`category` text NOT NULL,
	CONSTRAINT `templates_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `users` (
	`id` int AUTO_INCREMENT NOT NULL,
	`username` text NOT NULL,
	`password` text,
	`email` text,
	`linkedin_id` text,
	`linkedin_token` text,
	`profile_picture` text,
	`full_name` text,
	CONSTRAINT `users_id` PRIMARY KEY(`id`),
	CONSTRAINT `users_username_unique` UNIQUE(`username`),
	CONSTRAINT `users_linkedin_id_unique` UNIQUE(`linkedin_id`)
);
--> statement-breakpoint
ALTER TABLE `documents` ADD CONSTRAINT `documents_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;