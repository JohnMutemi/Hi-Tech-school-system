import type { PrismaClient } from '@prisma/client';

export type ReplicationSyncReport = {
  /** True if this connection is to a physical standby (read replica). */
  inRecovery: boolean;
  /** Standby: WAL receiver row if streaming replication is configured. */
  walReceiver: {
    status: string | null;
    secondsSinceLastMessage: number | null;
  } | null;
  /** Primary: outbound replicas and their states (empty if none or no permission). */
  outboundReplicas: Array<{
    applicationName: string | null;
    state: string | null;
    syncState: string | null;
  }>;
  /** True when standby WAL receiver exists and status is "streaming". */
  standbyActivelyStreaming: boolean;
  /** True when any outbound replica is not in steady "streaming" state. */
  primaryReplicasCatchingUp: boolean;
  skippedReason?: string;
};

async function safeQuery<T>(run: () => Promise<T>): Promise<T | null> {
  try {
    return await run();
  } catch {
    return null;
  }
}

/**
 * Inspects PostgreSQL replication views. Managed providers (Neon, RDS, etc.) may hide
 * some stats for non-superusers; missing data is treated as "unknown", not an error.
 */
export async function getReplicationSyncReport(
  prisma: PrismaClient
): Promise<ReplicationSyncReport> {
  const recoveryRow = await safeQuery(() =>
    prisma.$queryRaw<{ in_recovery: boolean }[]>`
      SELECT pg_is_in_recovery() AS in_recovery
    `
  );
  const inRecovery = recoveryRow?.[0]?.in_recovery ?? false;

  const walRows = await safeQuery(() =>
    prisma.$queryRaw<
      { status: string | null; seconds_since_last_msg: number | null }[]
    >`
      SELECT
        status::text AS status,
        EXTRACT(EPOCH FROM (NOW() - last_msg_receipt_time))::float AS seconds_since_last_msg
      FROM pg_stat_wal_receiver
      LIMIT 1
    `
  );

  const wal = walRows?.[0];
  const walReceiver =
    wal && (wal.status != null || wal.seconds_since_last_msg != null)
      ? {
          status: wal.status,
          secondsSinceLastMessage:
            wal.seconds_since_last_msg != null &&
            !Number.isNaN(wal.seconds_since_last_msg)
              ? Math.round(wal.seconds_since_last_msg)
              : null,
        }
      : null;

  const replRows = await safeQuery(() =>
    prisma.$queryRaw<
      {
        application_name: string | null;
        state: string | null;
        sync_state: string | null;
      }[]
    >`
      SELECT
        application_name::text AS application_name,
        state::text AS state,
        sync_state::text AS sync_state
      FROM pg_stat_replication
    `
  );

  const outboundReplicas = (replRows ?? []).map((r) => ({
    applicationName: r.application_name,
    state: r.state,
    syncState: r.sync_state,
  }));

  const standbyActivelyStreaming =
    inRecovery &&
    walReceiver?.status === 'streaming';

  const primaryReplicasCatchingUp = outboundReplicas.some(
    (r) => r.state != null && r.state !== 'streaming'
  );

  return {
    inRecovery,
    walReceiver,
    outboundReplicas,
    standbyActivelyStreaming,
    primaryReplicasCatchingUp,
  };
}

export function formatSyncReport(report: ReplicationSyncReport): string {
  const lines: string[] = ['[DB sync / replication]'];

  lines.push(
    report.inRecovery
      ? '  Role: standby (read replica) — pg_is_in_recovery() = true'
      : '  Role: primary (or non-physical-replica connection)'
  );

  if (report.walReceiver) {
    lines.push(
      `  WAL receiver: status=${report.walReceiver.status ?? 'unknown'}, ` +
        `seconds since last message=${report.walReceiver.secondsSinceLastMessage ?? 'n/a'}`
    );
    if (report.standbyActivelyStreaming) {
      lines.push('  → Standby is actively streaming WAL from primary (sync link up).');
    }
  } else if (report.inRecovery) {
    lines.push('  WAL receiver: no row in pg_stat_wal_receiver (non-streaming standby or stats hidden).');
  }

  if (report.outboundReplicas.length > 0) {
    lines.push(`  Outbound replicas (${report.outboundReplicas.length}):`);
    for (const r of report.outboundReplicas) {
      lines.push(
        `    - ${r.applicationName ?? 'unnamed'}: state=${r.state ?? '?'}, sync_state=${r.syncState ?? '?'}`
      );
    }
    if (report.primaryReplicasCatchingUp) {
      lines.push('  → At least one replica is not in steady "streaming" state (may still be catching up).');
    } else {
      lines.push('  → All visible replicas report state "streaming".');
    }
  } else {
    lines.push('  Outbound replicas: none visible (or pg_stat_replication not exposed).');
  }

  return lines.join('\n');
}
