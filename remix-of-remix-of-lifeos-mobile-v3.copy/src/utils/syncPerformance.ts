/**
 * Performance monitoring for data synchronization
 * Tracks load times, cache hit rates, sync success rates, and network requests
 */

interface SyncMetric {
  entity: string;
  loadTime: number;
  success: boolean;
  cacheHit: boolean;
  timestamp: number;
}

interface PerformanceStats {
  totalLoads: number;
  successfulLoads: number;
  failedLoads: number;
  cacheHits: number;
  cacheMisses: number;
  averageLoadTime: number;
  totalLoadTime: number;
  entityStats: Record<string, {
    count: number;
    successCount: number;
    totalTime: number;
    averageTime: number;
  }>;
}

class SyncPerformanceTracker {
  private metrics: SyncMetric[] = [];
  private readonly MAX_METRICS = 1000; // Keep last 1000 metrics

  /**
   * Record a sync operation
   */
  recordLoad(entity: string, loadTime: number, success: boolean, cacheHit: boolean): void {
    const metric: SyncMetric = {
      entity,
      loadTime,
      success,
      cacheHit,
      timestamp: Date.now(),
    };

    this.metrics.push(metric);

    // Keep only last MAX_METRICS
    if (this.metrics.length > this.MAX_METRICS) {
      this.metrics = this.metrics.slice(-this.MAX_METRICS);
    }

    // Log in development
    if (import.meta.env.DEV) {
      const status = success ? '✓' : '✗';
      const cache = cacheHit ? '[CACHE]' : '[NETWORK]';
      console.log(`[SyncPerf] ${status} ${cache} ${entity}: ${loadTime}ms`);
    }
  }

  /**
   * Get performance statistics
   */
  getStats(): PerformanceStats {
    if (this.metrics.length === 0) {
      return {
        totalLoads: 0,
        successfulLoads: 0,
        failedLoads: 0,
        cacheHits: 0,
        cacheMisses: 0,
        averageLoadTime: 0,
        totalLoadTime: 0,
        entityStats: {},
      };
    }

    const successfulLoads = this.metrics.filter(m => m.success).length;
    const failedLoads = this.metrics.filter(m => !m.success).length;
    const cacheHits = this.metrics.filter(m => m.cacheHit).length;
    const cacheMisses = this.metrics.filter(m => !m.cacheHit).length;
    const totalLoadTime = this.metrics.reduce((sum, m) => sum + m.loadTime, 0);
    const averageLoadTime = totalLoadTime / this.metrics.length;

    // Calculate per-entity stats
    const entityStats: Record<string, {
      count: number;
      successCount: number;
      totalTime: number;
      averageTime: number;
    }> = {};

    this.metrics.forEach(metric => {
      if (!entityStats[metric.entity]) {
        entityStats[metric.entity] = {
          count: 0,
          successCount: 0,
          totalTime: 0,
          averageTime: 0,
        };
      }

      entityStats[metric.entity].count++;
      if (metric.success) {
        entityStats[metric.entity].successCount++;
      }
      entityStats[metric.entity].totalTime += metric.loadTime;
    });

    // Calculate averages
    Object.keys(entityStats).forEach(entity => {
      const stats = entityStats[entity];
      stats.averageTime = stats.totalTime / stats.count;
    });

    return {
      totalLoads: this.metrics.length,
      successfulLoads,
      failedLoads,
      cacheHits,
      cacheMisses,
      averageLoadTime,
      totalLoadTime,
      entityStats,
    };
  }

  /**
   * Get cache hit rate
   */
  getCacheHitRate(): number {
    if (this.metrics.length === 0) return 0;
    const cacheHits = this.metrics.filter(m => m.cacheHit).length;
    return (cacheHits / this.metrics.length) * 100;
  }

  /**
   * Get success rate
   */
  getSuccessRate(): number {
    if (this.metrics.length === 0) return 0;
    const successfulLoads = this.metrics.filter(m => m.success).length;
    return (successfulLoads / this.metrics.length) * 100;
  }

  /**
   * Log performance summary
   */
  logSummary(): void {
    const stats = this.getStats();
    const cacheHitRate = this.getCacheHitRate();
    const successRate = this.getSuccessRate();

    console.log('[SyncPerf] ===== Performance Summary =====');
    console.log(`[SyncPerf] Total loads: ${stats.totalLoads}`);
    console.log(`[SyncPerf] Success rate: ${successRate.toFixed(1)}% (${stats.successfulLoads}/${stats.totalLoads})`);
    console.log(`[SyncPerf] Cache hit rate: ${cacheHitRate.toFixed(1)}% (${stats.cacheHits}/${stats.totalLoads})`);
    console.log(`[SyncPerf] Average load time: ${stats.averageLoadTime.toFixed(0)}ms`);
    console.log(`[SyncPerf] Total load time: ${stats.totalLoadTime.toFixed(0)}ms`);
    
    if (Object.keys(stats.entityStats).length > 0) {
      console.log('[SyncPerf] Per-entity stats:');
      Object.entries(stats.entityStats)
        .sort((a, b) => b[1].averageTime - a[1].averageTime)
        .forEach(([entity, stat]) => {
          const successRate = (stat.successCount / stat.count) * 100;
          console.log(`[SyncPerf]   ${entity}: ${stat.averageTime.toFixed(0)}ms avg, ${successRate.toFixed(1)}% success (${stat.count} loads)`);
        });
    }
    console.log('[SyncPerf] ===============================');
  }

  /**
   * Clear all metrics
   */
  clear(): void {
    this.metrics = [];
  }

  /**
   * Get metrics for a specific entity
   */
  getEntityMetrics(entity: string): SyncMetric[] {
    return this.metrics.filter(m => m.entity === entity);
  }
}

// Singleton instance
export const syncPerformanceTracker = new SyncPerformanceTracker();

/**
 * Helper function to measure load time
 */
export async function measureLoadTime<T>(
  entity: string,
  loadFn: () => Promise<T>,
  cacheHit: boolean = false
): Promise<T> {
  const startTime = Date.now();
  try {
    const result = await loadFn();
    const loadTime = Date.now() - startTime;
    syncPerformanceTracker.recordLoad(entity, loadTime, true, cacheHit);
    return result;
  } catch (error) {
    const loadTime = Date.now() - startTime;
    syncPerformanceTracker.recordLoad(entity, loadTime, false, cacheHit);
    throw error;
  }
}

