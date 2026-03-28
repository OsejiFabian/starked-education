import { useEffect, useState, useCallback, useRef } from 'react';
import PerformanceMonitoringService, { PerformanceMetric, ResourceTiming, BundleAnalysis } from '../lib/performanceMonitoring';

interface PerformanceData {
  coreWebVitals: PerformanceMetric[];
  resourceTiming: ResourceTiming[];
  bundleAnalysis: BundleAnalysis[];
  recommendations: string[];
  isMonitoring: boolean;
}

interface UsePerformanceMonitoringOptions {
  endpoint?: string;
  apiKey?: string;
  sampleRate?: number;
  debug?: boolean;
  autoStart?: boolean;
  sendInterval?: number;
}

export const usePerformanceMonitoring = (options: UsePerformanceMonitoringOptions = {}) => {
  const [performanceData, setPerformanceData] = useState<PerformanceData>({
    coreWebVitals: [],
    resourceTiming: [],
    bundleAnalysis: [],
    recommendations: [],
    isMonitoring: false
  });

  const [isInitialized, setIsInitialized] = useState(false);
  const monitoringServiceRef = useRef<PerformanceMonitoringService | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const {
    endpoint = process.env.NEXT_PUBLIC_PERFORMANCE_ENDPOINT || '/api/performance/metrics',
    apiKey = process.env.NEXT_PUBLIC_PERFORMANCE_API_KEY || '',
    sampleRate = 1,
    debug = process.env.NODE_ENV === 'development',
    autoStart = true,
    sendInterval = 30000
  } = options;

  /**
   * Initialize performance monitoring
   */
  const initialize = useCallback(() => {
    if (typeof window === 'undefined' || isInitialized) return;

    try {
      monitoringServiceRef.current = new PerformanceMonitoringService({
        endpoint,
        apiKey,
        sampleRate,
        debug
      });

      monitoringServiceRef.current.initialize();
      setIsInitialized(true);
      setPerformanceData(prev => ({ ...prev, isMonitoring: true }));

      // Set up periodic data collection
      if (sendInterval > 0) {
        intervalRef.current = setInterval(() => {
          updatePerformanceData();
        }, sendInterval);
      }

      console.log('Performance monitoring initialized');
    } catch (error) {
      console.error('Failed to initialize performance monitoring:', error);
    }
  }, [endpoint, apiKey, sampleRate, debug, sendInterval, isInitialized]);

  /**
   * Update performance data
   */
  const updatePerformanceData = useCallback(() => {
    if (!monitoringServiceRef.current) return;

    try {
      const report = monitoringServiceRef.current.getPerformanceReport();
      setPerformanceData(prev => ({
        ...prev,
        coreWebVitals: report.coreWebVitals,
        resourceTiming: report.resourceTiming,
        bundleAnalysis: report.bundleAnalysis,
        recommendations: report.recommendations
      }));
    } catch (error) {
      console.error('Failed to update performance data:', error);
    }
  }, []);

  /**
   * Start monitoring
   */
  const start = useCallback(() => {
    if (!isInitialized) {
      initialize();
    } else {
      setPerformanceData(prev => ({ ...prev, isMonitoring: true }));
    }
  }, [isInitialized, initialize]);

  /**
   * Stop monitoring
   */
  const stop = useCallback(() => {
    setPerformanceData(prev => ({ ...prev, isMonitoring: false }));
    
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  /**
   * Get current performance score
   */
  const getPerformanceScore = useCallback(() => {
    const { coreWebVitals } = performanceData;
    
    if (coreWebVitals.length === 0) return null;

    const ratings = coreWebVitals.map(metric => {
      switch (metric.rating) {
        case 'good': return 100;
        case 'needs-improvement': return 50;
        case 'poor': return 0;
        default: return 0;
      }
    });

    const averageScore = ratings.reduce((sum, rating) => sum + rating, 0) / ratings.length;
    return Math.round(averageScore);
  }, [performanceData]);

  /**
   * Get performance grade
   */
  const getPerformanceGrade = useCallback(() => {
    const score = getPerformanceScore();
    
    if (score === null) return 'N/A';
    if (score >= 90) return 'A';
    if (score >= 80) return 'B';
    if (score >= 70) return 'C';
    if (score >= 60) return 'D';
    return 'F';
  }, [getPerformanceScore]);

  /**
   * Check if performance is good
   */
  const isPerformanceGood = useCallback(() => {
    const score = getPerformanceScore();
    return score !== null && score >= 80;
  }, [getPerformanceScore]);

  /**
   * Get specific metric
   */
  const getMetric = useCallback((name: string): PerformanceMetric | undefined => {
    return performanceData.coreWebVitals.find(metric => metric.name === name);
  }, [performanceData.coreWebVitals]);

  /**
   * Get slow resources
   */
  const getSlowResources = useCallback((threshold = 2000): ResourceTiming[] => {
    return performanceData.resourceTiming.filter(resource => resource.duration > threshold);
  }, [performanceData.resourceTiming]);

  /**
   * Get large bundles
   */
  const getLargeBundles = useCallback((threshold = 1024 * 1024): BundleAnalysis[] => {
    return performanceData.bundleAnalysis.filter(bundle => bundle.size > threshold);
  }, [performanceData.bundleAnalysis]);

  /**
   * Manually record a custom metric
   */
  const recordCustomMetric = useCallback((name: string, value: number, rating: 'good' | 'needs-improvement' | 'poor' = 'good') => {
    if (!monitoringServiceRef.current) return;

    const metric: PerformanceMetric = {
      name,
      value,
      rating,
      timestamp: Date.now(),
      url: window.location.href,
      userAgent: navigator.userAgent,
      deviceInfo: {
        memory: (navigator as any).deviceMemory,
        hardwareConcurrency: navigator.hardwareConcurrency || 1,
        platform: navigator.platform,
        vendor: navigator.vendor,
        screenResolution: `${screen.width}x${screen.height}`,
        pixelRatio: window.devicePixelRatio || 1
      },
      networkInfo: {
        effectiveType: (navigator as any).connection?.effectiveType,
        downlink: (navigator as any).connection?.downlink,
        rtt: (navigator as any).connection?.rtt,
        saveData: (navigator as any).connection?.saveData
      }
    };

    // This would need to be implemented in the service
    console.log('Custom metric recorded:', metric);
  }, []);

  /**
   * Export performance data
   */
  const exportData = useCallback(() => {
    const data = {
      ...performanceData,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      url: window.location.href
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `performance-report-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, [performanceData]);

  // Initialize on mount if autoStart is enabled
  useEffect(() => {
    if (autoStart) {
      initialize();
    }

    return () => {
      // Cleanup on unmount
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      if (monitoringServiceRef.current) {
        monitoringServiceRef.current.cleanup();
      }
    };
  }, [autoStart, initialize]);

  return {
    ...performanceData,
    isInitialized,
    performanceScore: getPerformanceScore(),
    performanceGrade: getPerformanceGrade(),
    isPerformanceGood: isPerformanceGood(),
    initialize,
    start,
    stop,
    updateData: updatePerformanceData,
    getMetric,
    getSlowResources,
    getLargeBundles,
    recordCustomMetric,
    exportData
  };
};

export default usePerformanceMonitoring;
