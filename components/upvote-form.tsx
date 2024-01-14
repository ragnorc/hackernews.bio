"use client";

import { unvoteAction, voteAction } from "@/app/(stories)/actions";
import { VoteIcon } from "@/components/icons/vote-icon";
import { useFormStatus } from "react-dom";

export function UpvoteForm({
  storyId,
  upvotedByMe,
}: {
  storyId: string;
  upvotedByMe: boolean;
}) {
  return (
    <form action={voteAction} className="w-3.5">
      <UpvoteFormFields storyId={storyId} upvotedByMe={upvotedByMe} />
    </form>
  );
}

function UpvoteFormFields({
  storyId,
  upvotedByMe,
}: {
  storyId: string;
  upvotedByMe: boolean;
}) {
  const { pending } = useFormStatus();

  return (
    <>
      <input type="hidden" name="storyId" value={storyId} />
      {!upvotedByMe && !pending && (
        <button>
          <VoteIcon />
        </button>
      )}
    </>
  );
}

export function UnvoteForm({ storyId }: { storyId: string }) {
  return (
    <form action={unvoteAction} style={{ display: "inline" }}>
      <UnvoteFormFields storyId={storyId} />
    </form>
  );
}

function UnvoteFormFields({ storyId }: { storyId: string }) {
  const { pending } = useFormStatus();

  return (
    <>
      <input type="hidden" name="storyId" value={storyId} />
      {!pending && (
        <>
          {" "}
          | <button>unvote</button>
        </>
      )}
    </>
  );
}
