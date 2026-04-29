import { backupService } from "@/lib/services/backup-service";

async function main() {
  const now = new Date();
  const result = await backupService.runScheduledBackups(now);
  console.log(`[backup-scheduler] ${now.toISOString()} triggered=${result.triggered}`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("[backup-scheduler] failed", error);
    process.exit(1);
  });
