"use client";

import { upvoteAction } from "@/app/(stories)/actions";

export function UpvoteForm({ storyId }: { storyId: string }) {
  return (
    <form action={upvoteAction}>
      <input type="hidden" name="storyId" value={storyId} />
      <button>
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 12 12"
          width="12"
          height="12"
        >
          <polygon points="6,1 12,12 1,12" fill="currentColor" />
        </svg>
      </button>
    </form>
  );
}
