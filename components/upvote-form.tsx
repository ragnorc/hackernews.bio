"use client";

import { upvoteAction } from "@/app/(stories)/actions";
import { VoteIcon } from "@/components/icons/vote-icon";

export function UpvoteForm({ storyId }: { storyId: string }) {
  return (
    <form action={upvoteAction}>
      <input type="hidden" name="storyId" value={storyId} />
      <button>
        <VoteIcon />
      </button>
    </form>
  );
}
