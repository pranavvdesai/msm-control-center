import { PrismaClient } from "@prisma/client";
import { sendFeatureAnnouncement } from "../src/lib/feature-announcement-send";

const prisma = new PrismaClient();

const mode = process.argv.includes("--all") ? "all" : "test";

async function main() {
  const result = await sendFeatureAnnouncement({ mode });

  if (!result.ok && "error" in result) {
    console.error(result.error);
    process.exit(1);
  }

  if (result.mode === "test" && "previewTo" in result) {
    console.log(`Preview sent to ${result.previewTo}`);
  } else if (result.mode === "all") {
    console.log(`\nDone. Sent: ${result.sent}, failed: ${result.failed}, total: ${result.total}`);
    if (result.failures?.length) {
      console.log("Failed rolls:", result.failures.join(", "));
    }
  }

  process.exit(result.ok ? 0 : 1);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
