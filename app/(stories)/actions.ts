"use server";

import { signOut } from "@/app/auth";
import z from "zod";
import {
  db,
  usersTable,
  storiesTable,
  upvotesTable,
  genUpvoteId,
} from "@/app/db";
import { auth } from "@/app/auth";
import { sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { upvoteRateLimit } from "@/lib/rate-limit";

export async function signOutAction() {
  await signOut();
  return {};
}

const UpvoteActionSchema = z.object({
  storyId: z.string(),
});

export type UpvoteActionData = {
  error?:
    | {
        code: "INTERNAL_ERROR";
        message: string;
      }
    | {
        code: "VALIDATION_ERROR";
        fieldErrors: {
          [field: string]: string[];
        };
      }
    | {
        code: "RATE_LIMIT_ERROR";
        message: string;
      }
    | {
        code: "AUTH_ERROR";
        message: string;
      }
    | {
        code: "ALREADY_UPVOTED_ERROR";
        message: string;
      }
    | {
        code: "SELF_UPVOTE_ERROR";
        message: string;
      };
};

export async function upvoteAction(
  formData: FormData
): Promise<UpvoteActionData | void> {
  const session = await auth();

  if (!session?.user?.id) {
    return {
      error: {
        code: "AUTH_ERROR",
        message: "You must be logged in to reply.",
      },
    };
  }

  const data = UpvoteActionSchema.safeParse({
    storyId: formData.get("storyId"),
  });

  if (!data.success) {
    return {
      error: {
        code: "VALIDATION_ERROR",
        fieldErrors: data.error.flatten().fieldErrors,
      },
    };
  }

  const user = (
    await db
      .select()
      .from(usersTable)
      .where(sql`${usersTable.id} = ${session.user.id}`)
      .limit(1)
  )[0];

  if (!user) {
    return {
      error: {
        code: "INTERNAL_ERROR",
        message: "User not found",
      },
    };
  }

  const rl = await upvoteRateLimit.limit(user.id);

  if (!rl.success) {
    return {
      error: {
        code: "RATE_LIMIT_ERROR",
        message: "Too many comments. Try again later",
      },
    };
  }

  // TODO: use transactions, but Neon doesn't support them yet
  // in the serverless http driver :raised-eyebrow:
  // await db.transaction(async (tx) => {
  // TODO: don't check first, just update and catch the error
  const tx = db;
  try {
    const story = (
      await tx
        .select({
          id: storiesTable.id,
          username: storiesTable.username,
          submitted_by: storiesTable.submitted_by,
          upvote_id: upvotesTable.id,
        })
        .from(storiesTable)
        .where(sql`${storiesTable.id} = ${data.data.storyId}`)
        .limit(1)
        .leftJoin(
          upvotesTable,
          sql`${storiesTable.id} = ${upvotesTable.story_id} AND ${upvotesTable.user_id} = ${user.id}`
        )
    )[0];

    if (!story) {
      throw new Error("Story not found");
    }

    if (story.upvote_id) {
      return {
        error: {
          code: "ALREADY_UPVOTED_ERROR",
          message: "You already upvoted this story",
        },
      };
    }

    if (story.submitted_by === user.id) {
      return {
        error: {
          code: "SELF_UPVOTE_ERROR",
          message: "You can't upvote your own story",
        },
      };
    }

    await Promise.all([
      tx.insert(upvotesTable).values({
        id: genUpvoteId(),
        user_id: user.id,
        story_id: story.id,
      }),
      tx
        .update(storiesTable)
        .set({
          points: sql`${storiesTable.points} + 1`,
        })
        .where(sql`${storiesTable.id} = ${story.id}`),
      tx
        .update(usersTable)
        .set({
          karma: sql`${usersTable.karma} + 1`,
        })
        .where(sql`${usersTable.username} = ${story.username}`),
    ]);

    revalidatePath("/");

    return {};
  } catch (err) {
    console.error(err);
    return {
      error: {
        code: "INTERNAL_ERROR",
        message: "Something went wrong",
      },
    };
  }
}
