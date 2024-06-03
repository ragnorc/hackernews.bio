import { TimeAgo } from "@/components/time-ago";
import { headers } from "next/headers";
import { nanoid } from "nanoid";
import { MoreLink } from "./more-link";
import Link from "next/link";
import { Suspense } from "react";
import Highlighter from "react-highlight-words";
import {
  PER_PAGE,
  getStories,
  hasMoreStories,
} from "@/app/(stories)/story-queries";

export async function Stories({
  page = 1,
  isNewest = false,
  type = null,
  q = null,
}: {
  isNewest?: boolean;
  page?: number;
  type?: string | null;
  q?: string | null;
}) {
  const uid = headers().get("x-vercel-id") ?? nanoid();
  console.time(`fetch stories ${uid}`);
  const stories = await getStories({
    page,
    isNewest,
    type,
    q,
  });
  console.timeEnd(`fetch stories ${uid}`);

  const now = Date.now();
  return stories.length ? (
    <div>
      <ul className="space-y-2">
        {stories.map((story, n) => {
          return (
            <li key={story.id} className="flex gap-2">
              <span className="align-top text-[#666] md:text-[#828282] text-right flex-shrink-0 min-w-6 md:min-w-5">
                {n + (page - 1) * PER_PAGE + 1}.
              </span>
              <div>
                {story.url != null ? (
                  <a
                    className="text-[#000000] hover:underline"
                    rel={"nofollow noreferrer"}
                    target={"_blank"}
                    href={story.url}
                  >
                    {story.title}
                  </a>
                ) : (
                  <Link
                    prefetch={true}
                    href={`/item/${story.id.replace(/^story_/, "")}`}
                    className="text-[#000000] hover:underline"
                  >
                    {q == null ? (
                      story.title
                    ) : (
                      <Highlighter
                        searchWords={[q]}
                        autoEscape={true}
                        textToHighlight={story.title}
                      />
                    )}
                  </Link>
                )}
                {story.domain && (
                  <span className="text-xs ml-1 text-[#666] md:text-[#828282]">
                    ({story.domain})
                  </span>
                )}
                <p className="text-xs text-[#666] md:text-[#828282]">
                  {story.points} point{story.points > 1 ? "s" : ""} by{" "}
                  {story.submitted_by ?? story.username}{" "}
                  <TimeAgo now={now} date={story.created_at} /> |{" "}
                  <span
                    className="cursor-default"
                    aria-hidden="true"
                    title="Not implemented"
                  >
                    flag
                  </span>{" "}
                  |{" "}
                  <span
                    className="cursor-default"
                    aria-hidden="true"
                    title="Not implemented"
                  >
                    hide
                  </span>{" "}
                  |{" "}
                  <Link
                    prefetch={true}
                    className="hover:underline"
                    href={`/item/${story.id.replace(/^story_/, "")}`}
                  >
                    {story.comments_count} comments
                  </Link>
                </p>
              </div>
            </li>
          );
        })}
      </ul>

      <div className="mt-4 ml-7">
        <Suspense fallback={null}>
          <More page={page} isNewest={isNewest} type={type} q={q} />
        </Suspense>
      </div>
    </div>
  ) : (
    <div>No stories to show</div>
  );
}

async function More({
  page,
  isNewest,
  type,
  q,
}: {
  isNewest: boolean;
  page: number;
  type: string | null;
  q: string | null;
}) {
  const hasMore = await hasMoreStories({
    isNewest,
    type,
    page,
    q,
  });

  if (hasMore) {
    return <MoreLink q={q} page={page + 1} />;
  } else {
    return null;
  }
}
