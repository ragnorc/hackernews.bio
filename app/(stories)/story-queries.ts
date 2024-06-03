import { db, usersTable, storiesTable, votesTable } from "@/app/db";
import { desc } from "drizzle-orm";
import { and, sql, ilike } from "drizzle-orm";
import { getTableConfig } from "drizzle-orm/pg-core";

export const PER_PAGE = 30;
const storiesTableName = getTableConfig(storiesTable).name;

export async function getStoriesCount() {
  // high performance, estimative count
  const statement = sql`SELECT reltuples::BIGINT AS estimate
    FROM pg_class
    WHERE relname = ${storiesTableName}`;

  const res = await db.execute(statement);
  if (!res.rows[0]) return 0;
  const row: { estimate: number } = res.rows[0] as any;
  return row.estimate ?? 0;
}

export async function getStories({
  isNewest,
  page,
  type,
  q,
  limit = PER_PAGE,
}: {
  isNewest: boolean;
  page: number;
  type: string | null;
  q: string | null;
  limit?: number;
}) {
  return await db
    .select({
      id: storiesTable.id,
      title: storiesTable.title,
      url: storiesTable.url,
      domain: storiesTable.domain,
      username: storiesTable.username,
      points: storiesTable.points,
      submitted_by: usersTable.username,
      comments_count: storiesTable.comments_count,
      created_at: storiesTable.created_at,
    })
    .from(storiesTable)
    .orderBy(desc(storiesTable.created_at))
    .where(
      storiesWhere({
        isNewest,
        type,
        q,
      })
    )
    .limit(limit)
    .offset((page - 1) * limit)
    .leftJoin(usersTable, sql`${usersTable.id} = ${storiesTable.submitted_by}`);
}

function storiesWhere({
  isNewest,
  type,
  q,
}: {
  isNewest: boolean;
  type: string | null;
  q: string | null;
}) {
  return and(
    isNewest
      ? sql`${storiesTable.submitted_by} IS NOT NULL`
      : and(
          // search includes all stories, with submitters or not
          q != null ? undefined : sql`${storiesTable.submitted_by} IS NULL`,
          type != null ? sql`${storiesTable.type} = ${type}` : undefined
        ),
    q != null && q.length ? ilike(storiesTable.title, `%${q}%`) : undefined
  );
}

export async function hasMoreStories({
  isNewest,
  page,
  type,
  q,
}: {
  isNewest: boolean;
  page: number;
  type: string | null;
  q: string | null;
}) {
  const count = await db
    .select({
      id: storiesTable.id,
    })
    .from(storiesTable)
    .where(
      storiesWhere({
        isNewest,
        type,
        q,
      })
    )
    .limit(PER_PAGE)
    .offset(page * PER_PAGE);

  return count.length > 0;
}
