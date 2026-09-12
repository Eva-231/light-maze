import { sql } from "drizzle-orm";
import { check, index, integer, primaryKey, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const leaderboardEntries = sqliteTable("leaderboard_entries", {
  participantId: text("participant_id").notNull(),
  board: text("board", { enum: ["daily", "abyss", "skill"] }).notNull(),
  period: text("period").notNull(),
  playerName: text("player_name").notNull(),
  rankValue: integer("rank_value").notNull(),
  score: integer("score").notNull(),
  elapsedMs: integer("elapsed_ms").notNull(),
  trialLevel: integer("trial_level").notNull(),
  floor: integer("floor").notNull(),
  submittedAt: integer("submitted_at").notNull(),
}, (table) => [
  primaryKey({ columns: [table.participantId, table.board, table.period] }),
  check("leaderboard_board_check", sql`${table.board} IN ('daily', 'abyss', 'skill')`),
  index("idx_leaderboard_board_period_rank").on(table.board, table.period, table.rankValue.desc(), table.submittedAt.asc()),
]);
