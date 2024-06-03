import { db, genStoryId, storiesTable } from "@/app/db";

// Function to generate a random number between min and max (inclusive)
function getRandomNumber(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

// Function to generate a random date within the last week
function getRandomDateWithinLastWeek(): Date {
  const now = new Date();
  const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  return new Date(getRandomNumber(oneWeekAgo.getTime(), now.getTime()));
}

// Function to seed the database with stories
async function seedDatabase(): Promise<void> {
  const numberOfStories = 100; // Change this to the desired number of stories

  for (let i = 0; i < numberOfStories; i++) {
    const points = getRandomNumber(0, 500);
    const createdAt = getRandomDateWithinLastWeek();

    await db.insert(storiesTable).values({
      id: genStoryId(),
      title: `Story ${i + 1}`,
      type: "story",
      points,
      created_at: createdAt,
    });
  }

  console.log(`Seeded the database with ${numberOfStories} stories.`);
}

seedDatabase().catch((error) => {
  console.error("Error seeding the database:", error);
});
