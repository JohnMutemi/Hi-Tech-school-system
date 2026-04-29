# Backup Storage Setup (S3 / Cloudflare R2)

Backups are stored using an adapter:

- Local disk by default (`backups/schools/...`)
- S3/R2 when `BACKUP_STORAGE_PROVIDER=s3` or `BACKUP_S3_BUCKET` is set

## Environment Variables

Set these in your deployment environment:

```env
BACKUP_STORAGE_PROVIDER=s3
BACKUP_S3_BUCKET=your-backup-bucket
BACKUP_S3_REGION=auto
BACKUP_S3_ENDPOINT=https://<accountid>.r2.cloudflarestorage.com
BACKUP_S3_ACCESS_KEY_ID=...
BACKUP_S3_SECRET_ACCESS_KEY=...
BACKUP_S3_PREFIX=backups/schools
BACKUP_S3_FORCE_PATH_STYLE=false
```

Notes:

- For AWS S3, `BACKUP_S3_ENDPOINT` is optional.
- For Cloudflare R2, set `BACKUP_S3_ENDPOINT` and keep `BACKUP_S3_REGION=auto`.
- `storagePath` in DB is stored as `s3://<bucket>/<key>` for remote artifacts.

## Validation

1. Run a manual backup from Settings (`Backup Now`) or:
   - `npm run backup:run-scheduled`
2. Verify the `SchoolBackup.storagePath` starts with `s3://`.
3. Run restore from backup history and confirm cloned school creation.
