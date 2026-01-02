import { Request, Response, NextFunction } from 'express';

/**
 * School-level metrics tracking middleware.
 *
 * This middleware tracks API usage per school to enable:
 * - Identifying which school is causing high load
 * - Detecting slow queries per school
 * - Tracking API usage patterns
 * - Proactive issue detection before system-wide problems occur
 *
 * Critical for multi-tenancy monitoring at scale (100+ schools).
 *
 * Usage:
 * Apply AFTER authentication middleware so req.user or req.school is available.
 *
 * @example
 * app.use(authenticate);
 * app.use(trackSchoolMetrics);
 * app.use('/api', routes);
 */

interface RequestMetric {
  timestamp: Date;
  schoolId: string;
  method: string;
  path: string;
  statusCode: number;
  durationMs: number;
  userAgent: string;
  ip: string;
}

/**
 * Tracks request metrics per school.
 */
export const trackSchoolMetrics = (req: Request, res: Response, next: NextFunction) => {
  const startTime = Date.now();

  // Listen for response finish event to calculate duration
  res.on('finish', () => {
    const duration = Date.now() - startTime;
    const resolvedSchoolId =
      res.locals?.schoolId?.toString() ||
      (req as any).schoolContextId ||
      (req.user as any)?.schoolId ||
      (req as any).school?._id?.toString() ||
      'unauthenticated';

    const metric: RequestMetric = {
      timestamp: new Date(),
      schoolId: resolvedSchoolId,
      method: req.method,
      path: req.path,
      statusCode: res.statusCode,
      durationMs: duration,
      userAgent: req.get('user-agent') || 'unknown',
      ip: req.ip || 'unknown',
    };

    // Log slow queries (> 2 seconds)
    if (duration > 2000) {
      console.warn(
        `[SLOW QUERY] School ${resolvedSchoolId}: ${req.method} ${req.path} took ${duration}ms`,
        {
          schoolId: resolvedSchoolId,
          path: metric.path,
          duration: metric.durationMs,
          statusCode: metric.statusCode,
        }
      );
    }

    // Log very slow queries (> 5 seconds) as errors
    if (duration > 5000) {
      console.error(
        `[CRITICAL SLOW QUERY] School ${resolvedSchoolId}: ${req.method} ${req.path} took ${duration}ms`,
        {
          schoolId: resolvedSchoolId,
          path: metric.path,
          duration: metric.durationMs,
          statusCode: metric.statusCode,
        }
      );
    }

    // Log failed requests (5xx errors)
    if (res.statusCode >= 500) {
      console.error(
        `[SERVER ERROR] School ${resolvedSchoolId}: ${req.method} ${req.path} returned ${res.statusCode}`,
        {
          schoolId: resolvedSchoolId,
          path: metric.path,
          duration: metric.durationMs,
          statusCode: metric.statusCode,
        }
      );
    }

    // Log all requests in development mode (verbose)
    if (process.env.NODE_ENV === 'development') {
      console.log(
        `[API] ${metric.method} ${metric.path} - ${metric.statusCode} - ${metric.durationMs}ms - School: ${metric.schoolId}`
      );
    }

    // In production, you can send metrics to external monitoring service
    // Examples:
    // - DataDog: datadog.track('api.request', metric);
    // - New Relic: newrelic.recordCustomEvent('APIRequest', metric);
    // - CloudWatch: cloudwatch.putMetricData(...);
    // - Custom metrics DB: MetricsModel.create(metric);

    // Optional: Store metrics in database for dashboard (not implemented yet)
    // This would require creating a Metrics model and collection
    // storeMetricAsync(metric).catch(console.error);
  });

  next();
};

/**
 * Middleware to track specific route performance.
 * Can be applied to individual routes for detailed monitoring.
 *
 * @param routeName - Name of the route for logging
 *
 * @example
 * router.get('/students', trackRoutePerformance('getStudents'), getStudents);
 */
export const trackRoutePerformance = (routeName: string) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const startTime = Date.now();
    const schoolId = (req.user as any)?.schoolId || (req as any).school?._id;

    res.on('finish', () => {
      const duration = Date.now() - startTime;

      console.log(`[ROUTE] ${routeName} - School ${schoolId} - ${duration}ms - ${res.statusCode}`);

      if (duration > 1000) {
        console.warn(`[ROUTE WARNING] ${routeName} took ${duration}ms for school ${schoolId}`);
      }
    });

    next();
  };
};

/**
 * Optional: Store metrics in database for historical analysis.
 * This is a placeholder for future implementation.
 *
 * To implement:
 * 1. Create a Metrics model (e.g., RequestMetric.model.ts)
 * 2. Create aggregation pipeline for dashboard queries
 * 3. Add cleanup job to delete old metrics (retention policy)
 */
/*
async function storeMetricAsync(metric: RequestMetric): Promise<void> {
  try {
    // Example implementation:
    // await RequestMetricModel.create(metric);

    // Or batch metrics to reduce DB writes:
    // metricsQueue.push(metric);
    // if (metricsQueue.length >= 100) {
    //   await RequestMetricModel.insertMany(metricsQueue);
    //   metricsQueue = [];
    // }
  } catch (error) {
    console.error('[Metrics] Failed to store metric:', error);
  }
}
*/

/**
 * Middleware to detect and log potential memory leaks per school.
 * Logs memory usage when it exceeds threshold.
 */
export const trackMemoryUsage = (req: Request, res: Response, next: NextFunction) => {
  const schoolId = (req.user as any)?.schoolId || (req as any).school?._id;

  res.on('finish', () => {
    const memoryUsage = process.memoryUsage();
    const heapUsedMB = Math.round(memoryUsage.heapUsed / 1024 / 1024);
    const heapTotalMB = Math.round(memoryUsage.heapTotal / 1024 / 1024);

    // Log if memory usage is high (> 1GB heap used)
    if (heapUsedMB > 1024) {
      console.warn(`[MEMORY WARNING] High memory usage: ${heapUsedMB}MB / ${heapTotalMB}MB`, {
        schoolId: schoolId?.toString() || 'unknown',
        path: req.path,
        heapUsed: heapUsedMB,
        heapTotal: heapTotalMB,
      });
    }
  });

  next();
};

/**
 * Simple in-memory metrics aggregator for quick stats.
 * Resets on server restart.
 */
class MetricsAggregator {
  private metrics: Map<string, { count: number; totalDuration: number; errors: number }> = new Map();

  track(schoolId: string, duration: number, isError: boolean = false) {
    const current = this.metrics.get(schoolId) || { count: 0, totalDuration: 0, errors: 0 };
    current.count++;
    current.totalDuration += duration;
    if (isError) current.errors++;
    this.metrics.set(schoolId, current);
  }

  getStats(schoolId: string) {
    const data = this.metrics.get(schoolId);
    if (!data) return null;

    return {
      requestCount: data.count,
      averageDuration: Math.round(data.totalDuration / data.count),
      errorCount: data.errors,
      errorRate: ((data.errors / data.count) * 100).toFixed(2) + '%',
    };
  }

  getAllStats() {
    const stats: any[] = [];
    this.metrics.forEach((data, schoolId) => {
      stats.push({
        schoolId,
        requestCount: data.count,
        averageDuration: Math.round(data.totalDuration / data.count),
        errorCount: data.errors,
        errorRate: ((data.errors / data.count) * 100).toFixed(2) + '%',
      });
    });
    return stats.sort((a, b) => b.requestCount - a.requestCount);
  }

  reset() {
    this.metrics.clear();
  }
}

export const metricsAggregator = new MetricsAggregator();

/**
 * Middleware that tracks aggregated metrics per school.
 * Useful for quick diagnostics without external monitoring tools.
 */
export const trackAggregatedMetrics = (req: Request, res: Response, next: NextFunction) => {
  const startTime = Date.now();

  res.on('finish', () => {
    const duration = Date.now() - startTime;
    const isError = res.statusCode >= 500;
    const resolvedSchoolId =
      res.locals?.schoolId?.toString() ||
      (req as any).schoolContextId ||
      (req.user as any)?.schoolId ||
      (req as any).school?._id?.toString();

    if (resolvedSchoolId) {
      metricsAggregator.track(resolvedSchoolId, duration, isError);
    }
  });

  next();
};
