CREATE TABLE `leaderboard_entries` (
	`participant_id` text NOT NULL,
	`board` text NOT NULL,
	`period` text NOT NULL,
	`player_name` text NOT NULL,
	`rank_value` integer NOT NULL,
	`score` integer NOT NULL,
	`elapsed_ms` integer NOT NULL,
	`trial_level` integer NOT NULL,
	`floor` integer NOT NULL,
	`submitted_at` integer NOT NULL,
	PRIMARY KEY(`participant_id`, `board`, `period`),
	CONSTRAINT `leaderboard_board_check` CHECK (`board` IN ('daily', 'abyss', 'skill'))
);
--> statement-breakpoint
CREATE INDEX `idx_leaderboard_board_period_rank` ON `leaderboard_entries` (`board`,`period`,`rank_value` DESC,`submitted_at` ASC);
--> statement-breakpoint
PRAGMA optimize;
