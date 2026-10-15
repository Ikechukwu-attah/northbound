import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';
export const games = sqliteTable('games', {userId:text('user_id').primaryKey(),state:text('state').notNull(),revision:integer('revision').notNull().default(0),updatedAt:text('updated_at').notNull()});
