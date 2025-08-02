import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export interface MonitoringEvent {
  id: string;
  timestamp: Date;
  eventType: 'DATA_LEAK_DETECTED' | 'SCHOOL_CONTEXT_MISSING' | 'VALIDATION_FAILED' | 'API_CALL';
  schoolCode?: string;
  endpoint?: string;
  details: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  resolved: boolean;
}

export interface SchoolDataLeakAlert {
  schoolCode: string;
  entityType: string;
  recordCount: number;
  description: string;
  timestamp: Date;
}

/**
 * School Data Isolation Monitoring System
 * 
 * This system monitors API calls and database queries to ensure proper school data isolation
 * and alerts when potential data leaks are detected.
 */
export class SchoolDataMonitor {
  private static instance: SchoolDataMonitor;
  private monitoringEvents: MonitoringEvent[] = [];
  private alertThresholds = {
    dataLeakCount: 1, // Alert on first data leak
    missingSchoolContext: 3, // Alert after 3 missing school contexts
    validationFailures: 5 // Alert after 5 validation failures
  };

  private constructor() {}

  static getInstance(): SchoolDataMonitor {
    if (!SchoolDataMonitor.instance) {
      SchoolDataMonitor.instance = new SchoolDataMonitor();
    }
    return SchoolDataMonitor.instance;
  }

  /**
   * Log an API call for monitoring
   */
  logApiCall(schoolCode: string, endpoint: string, method: string, success: boolean) {
    const event: MonitoringEvent = {
      id: this.generateEventId(),
      timestamp: new Date(),
      eventType: 'API_CALL',
      schoolCode,
      endpoint: `${method} ${endpoint}`,
      details: `API call to ${endpoint} for school ${schoolCode} - ${success ? 'SUCCESS' : 'FAILED'}`,
      severity: success ? 'LOW' : 'MEDIUM',
      resolved: success
    };

    this.monitoringEvents.push(event);
    this.checkForAnomalies();
  }

  /**
   * Log a missing school context event
   */
  logMissingSchoolContext(endpoint: string, details: string) {
    const event: MonitoringEvent = {
      id: this.generateEventId(),
      timestamp: new Date(),
      eventType: 'SCHOOL_CONTEXT_MISSING',
      endpoint,
      details: `Missing school context in ${endpoint}: ${details}`,
      severity: 'HIGH',
      resolved: false
    };

    this.monitoringEvents.push(event);
    this.checkForAnomalies();
  }

  /**
   * Log a validation failure
   */
  logValidationFailure(schoolCode: string, resourceType: string, resourceId: string, details: string) {
    const event: MonitoringEvent = {
      id: this.generateEventId(),
      timestamp: new Date(),
      eventType: 'VALIDATION_FAILED',
      schoolCode,
      details: `Validation failed for ${resourceType} ${resourceId} in school ${schoolCode}: ${details}`,
      severity: 'MEDIUM',
      resolved: false
    };

    this.monitoringEvents.push(event);
    this.checkForAnomalies();
  }

  /**
   * Log a potential data leak
   */
  logDataLeak(schoolCode: string, entityType: string, recordCount: number, details: string) {
    const event: MonitoringEvent = {
      id: this.generateEventId(),
      timestamp: new Date(),
      eventType: 'DATA_LEAK_DETECTED',
      schoolCode,
      details: `Potential data leak detected for ${entityType} in school ${schoolCode}: ${recordCount} records affected. ${details}`,
      severity: 'CRITICAL',
      resolved: false
    };

    this.monitoringEvents.push(event);
    this.checkForAnomalies();
  }

  /**
   * Check for anomalies and trigger alerts
   */
  private checkForAnomalies() {
    const recentEvents = this.getRecentEvents(24); // Last 24 hours

    // Check for data leaks
    const dataLeaks = recentEvents.filter(e => e.eventType === 'DATA_LEAK_DETECTED');
    if (dataLeaks.length >= this.alertThresholds.dataLeakCount) {
      this.triggerDataLeakAlert(dataLeaks);
    }

    // Check for missing school contexts
    const missingContexts = recentEvents.filter(e => e.eventType === 'SCHOOL_CONTEXT_MISSING');
    if (missingContexts.length >= this.alertThresholds.missingSchoolContext) {
      this.triggerMissingContextAlert(missingContexts);
    }

    // Check for validation failures
    const validationFailures = recentEvents.filter(e => e.eventType === 'VALIDATION_FAILED');
    if (validationFailures.length >= this.alertThresholds.validationFailures) {
      this.triggerValidationFailureAlert(validationFailures);
    }
  }

  /**
   * Trigger data leak alert
   */
  private triggerDataLeakAlert(events: MonitoringEvent[]) {
    console.error('🚨 CRITICAL: Data leak detected!');
    console.error('Affected schools:', [...new Set(events.map(e => e.schoolCode))]);
    console.error('Event details:', events.map(e => e.details));
    
    // In a production environment, you would:
    // 1. Send email/SMS alerts to administrators
    // 2. Log to external monitoring service
    // 3. Trigger automated response procedures
    // 4. Create incident tickets
  }

  /**
   * Trigger missing context alert
   */
  private triggerMissingContextAlert(events: MonitoringEvent[]) {
    console.warn('⚠️ HIGH: Missing school context detected!');
    console.warn('Affected endpoints:', [...new Set(events.map(e => e.endpoint))]);
    console.warn('Event details:', events.map(e => e.details));
  }

  /**
   * Trigger validation failure alert
   */
  private triggerValidationFailureAlert(events: MonitoringEvent[]) {
    console.warn('⚠️ MEDIUM: Multiple validation failures detected!');
    console.warn('Affected schools:', [...new Set(events.map(e => e.schoolCode))]);
    console.warn('Event details:', events.map(e => e.details));
  }

  /**
   * Get recent events within specified hours
   */
  private getRecentEvents(hours: number): MonitoringEvent[] {
    const cutoffTime = new Date(Date.now() - hours * 60 * 60 * 1000);
    return this.monitoringEvents.filter(event => event.timestamp > cutoffTime);
  }

  /**
   * Generate unique event ID
   */
  private generateEventId(): string {
    return `event_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Get monitoring statistics
   */
  getMonitoringStats() {
    const now = new Date();
    const last24Hours = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const last7Days = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    const events24h = this.monitoringEvents.filter(e => e.timestamp > last24Hours);
    const events7d = this.monitoringEvents.filter(e => e.timestamp > last7Days);

    return {
      totalEvents: this.monitoringEvents.length,
      events24h: events24h.length,
      events7d: events7d.length,
      criticalEvents: this.monitoringEvents.filter(e => e.severity === 'CRITICAL').length,
      unresolvedEvents: this.monitoringEvents.filter(e => !e.resolved).length,
      eventTypes: this.getEventTypeBreakdown(),
      recentAlerts: this.getRecentAlerts()
    };
  }

  /**
   * Get breakdown of event types
   */
  private getEventTypeBreakdown() {
    const breakdown: Record<string, number> = {};
    this.monitoringEvents.forEach(event => {
      breakdown[event.eventType] = (breakdown[event.eventType] || 0) + 1;
    });
    return breakdown;
  }

  /**
   * Get recent alerts
   */
  private getRecentAlerts() {
    const recentEvents = this.getRecentEvents(24);
    return recentEvents
      .filter(e => e.severity === 'HIGH' || e.severity === 'CRITICAL')
      .map(e => ({
        timestamp: e.timestamp,
        severity: e.severity,
        details: e.details,
        schoolCode: e.schoolCode
      }));
  }

  /**
   * Mark event as resolved
   */
  markEventResolved(eventId: string) {
    const event = this.monitoringEvents.find(e => e.id === eventId);
    if (event) {
      event.resolved = true;
    }
  }

  /**
   * Clear old events (older than 30 days)
   */
  clearOldEvents() {
    const cutoffTime = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    this.monitoringEvents = this.monitoringEvents.filter(event => event.timestamp > cutoffTime);
  }
}

/**
 * Database monitoring utilities
 */
export class DatabaseMonitor {
  /**
   * Check for orphaned records (records without schoolId)
   */
  static async checkForOrphanedRecords(): Promise<SchoolDataLeakAlert[]> {
    const alerts: SchoolDataLeakAlert[] = [];

    // Check users
    const orphanedUsers = await prisma.user.count({
      where: { schoolId: null }
    });
    if (orphanedUsers > 0) {
      alerts.push({
        schoolCode: 'GLOBAL',
        entityType: 'users',
        recordCount: orphanedUsers,
        description: 'Users without schoolId found',
        timestamp: new Date()
      });
    }

    // Check students
    const orphanedStudents = await prisma.student.count({
      where: { schoolId: null }
    });
    if (orphanedStudents > 0) {
      alerts.push({
        schoolCode: 'GLOBAL',
        entityType: 'students',
        recordCount: orphanedStudents,
        description: 'Students without schoolId found',
        timestamp: new Date()
      });
    }

    // Check classes
    const orphanedClasses = await prisma.class.count({
      where: { schoolId: null }
    });
    if (orphanedClasses > 0) {
      alerts.push({
        schoolCode: 'GLOBAL',
        entityType: 'classes',
        recordCount: orphanedClasses,
        description: 'Classes without schoolId found',
        timestamp: new Date()
      });
    }

    // Check subjects
    const orphanedSubjects = await prisma.subject.count({
      where: { schoolId: null }
    });
    if (orphanedSubjects > 0) {
      alerts.push({
        schoolCode: 'GLOBAL',
        entityType: 'subjects',
        recordCount: orphanedSubjects,
        description: 'Subjects without schoolId found',
        timestamp: new Date()
      });
    }

    // Check fee structures
    const orphanedFeeStructures = await prisma.termlyFeeStructure.count({
      where: { schoolId: null }
    });
    if (orphanedFeeStructures > 0) {
      alerts.push({
        schoolCode: 'GLOBAL',
        entityType: 'feeStructures',
        recordCount: orphanedFeeStructures,
        description: 'Fee structures without schoolId found',
        timestamp: new Date()
      });
    }

    return alerts;
  }

  /**
   * Check for cross-school data access
   */
  static async checkForCrossSchoolDataAccess(schoolCode: string): Promise<SchoolDataLeakAlert[]> {
    const alerts: SchoolDataLeakAlert[] = [];
    const school = await prisma.school.findUnique({
      where: { code: schoolCode }
    });

    if (!school) {
      return alerts;
    }

    // Check if any queries are returning data from other schools
    // This is a simplified check - in production you'd want more sophisticated monitoring
    
    const totalUsers = await prisma.user.count();
    const schoolUsers = await prisma.user.count({
      where: { schoolId: school.id }
    });

    // If the ratio is suspicious, it might indicate a data leak
    if (totalUsers > 0 && (schoolUsers / totalUsers) > 0.8) {
      alerts.push({
        schoolCode,
        entityType: 'users',
        recordCount: schoolUsers,
        description: 'Suspiciously high number of users for single school',
        timestamp: new Date()
      });
    }

    return alerts;
  }

  /**
   * Get school data isolation health score
   */
  static async getIsolationHealthScore(): Promise<{
    score: number;
    issues: string[];
    recommendations: string[];
  }> {
    const orphanedRecords = await this.checkForOrphanedRecords();
    const issues: string[] = [];
    const recommendations: string[] = [];

    let score = 100; // Start with perfect score

    // Deduct points for orphaned records
    orphanedRecords.forEach(alert => {
      score -= 10;
      issues.push(`${alert.recordCount} ${alert.entityType} without schoolId`);
      recommendations.push(`Assign schoolId to orphaned ${alert.entityType}`);
    });

    // Check for schools with no data isolation
    const schools = await prisma.school.findMany({
      select: { id: true, code: true, name: true }
    });

    for (const school of schools) {
      const crossSchoolAlerts = await this.checkForCrossSchoolDataAccess(school.code);
      if (crossSchoolAlerts.length > 0) {
        score -= 5;
        issues.push(`Potential data leak in school ${school.code}`);
        recommendations.push(`Review data access patterns for school ${school.code}`);
      }
    }

    // Add recommendations based on score
    if (score < 80) {
      recommendations.push('Run the audit script to identify and fix data isolation issues');
    }
    if (score < 60) {
      recommendations.push('Review all API endpoints for proper school context usage');
    }
    if (score < 40) {
      recommendations.push('Critical: Immediate review of database queries and API endpoints required');
    }

    return {
      score: Math.max(0, score),
      issues,
      recommendations
    };
  }
}

/**
 * Middleware for monitoring API calls
 */
export function withMonitoring<T extends any[], R>(
  fn: (...args: T) => Promise<R>,
  schoolCode?: string,
  endpoint?: string
): (...args: T) => Promise<R> {
  return async (...args: T): Promise<R> => {
    const monitor = SchoolDataMonitor.getInstance();
    const startTime = Date.now();

    try {
      const result = await fn(...args);
      const duration = Date.now() - startTime;

      if (schoolCode && endpoint) {
        monitor.logApiCall(schoolCode, endpoint, 'GET', true);
      }

      return result;
    } catch (error) {
      const duration = Date.now() - startTime;

      if (schoolCode && endpoint) {
        monitor.logApiCall(schoolCode, endpoint, 'GET', false);
      }

      throw error;
    }
  };
}

// Export singleton instance
export const schoolDataMonitor = SchoolDataMonitor.getInstance(); 