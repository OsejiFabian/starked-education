import { getCLS, getFID, getFCP, getLCP, getTTFB, getINP } from 'web-vitals';

interface PerformanceMetric {
  name: string;
  value: number;
  rating: 'good' | 'needs-improvement' | 'poor';
  timestamp: number;
  url: string;
  userAgent: string;
  deviceInfo: DeviceInfo;
  networkInfo: NetworkInfo;
}

interface DeviceInfo {
  memory?: number;
  hardwareConcurrency: number;
  platform: string;
  vendor: string;
  screenResolution: string;
  pixelRatio: number;
}

interface NetworkInfo {
  effectiveType?: string;
  downlink?: number;
  rtt?: number;
  saveData?: boolean;
}

interface PerformanceEntry {
  name: string;
  entryType: string;
  startTime: number;
  duration: number;
  size?: number;
}

interface BundleAnalysis {
  name: string;
  size: number;
  gzippedSize: number;
  loadTime: number;
  chunks: Array<{
    name: string;
    size: number;
  }>;
}

interface ResourceTiming {
  name: string;
  type: string;
  duration: number;
  size: number;
  cached: boolean;
}

class PerformanceMonitoringService {
  private metrics: PerformanceMetric[] = [];
  private observers: PerformanceObserver[] = [];
  private config: {
    endpoint: string;
    apiKey: string;
    sampleRate: number;
    debug: boolean;
  };

  constructor(config: { endpoint: string; apiKey: string; sampleRate?: number; debug?: boolean }) {
    this.config = {
      endpoint: config.endpoint,
      apiKey: config.apiKey,
      sampleRate: config.sampleRate || 1,
      debug: config.debug || false
    };
  }

  /**
   * Initialize performance monitoring
   */
  initialize(): void {
    if (typeof window === 'undefined') return;

    // Check if we should sample this session
    if (Math.random() > this.config.sampleRate) {
      this.log('Session not sampled for performance monitoring');
      return;
    }

    this.log('Initializing performance monitoring');
    
    // Setup Core Web Vitals monitoring
    this.setupCoreWebVitals();
    
    // Setup Performance Observers
    this.setupPerformanceObservers();
    
    // Setup resource timing monitoring
    this.setupResourceTimingMonitoring();
    
    // Setup error tracking
    this.setupErrorTracking();
    
    // Setup user interaction monitoring
    this.setupUserInteractionMonitoring();
  }

  /**
   * Setup Core Web Vitals monitoring
   */
  private setupCoreWebVitals(): void {
    // Largest Contentful Paint (LCP)
    getLCP((metric) => {
      this.recordMetric({
        name: 'LCP',
        value: metric.value,
        rating: this.getLCPRating(metric.value),
        timestamp: Date.now(),
        url: window.location.href,
        userAgent: navigator.userAgent,
        deviceInfo: this.getDeviceInfo(),
        networkInfo: this.getNetworkInfo()
      });
    });

    // First Input Delay (FID)
    getFID((metric) => {
      this.recordMetric({
        name: 'FID',
        value: metric.value,
        rating: this.getFIDRating(metric.value),
        timestamp: Date.now(),
        url: window.location.href,
        userAgent: navigator.userAgent,
        deviceInfo: this.getDeviceInfo(),
        networkInfo: this.getNetworkInfo()
      });
    });

    // Interaction to Next Paint (INP)
    getINP((metric) => {
      this.recordMetric({
        name: 'INP',
        value: metric.value,
        rating: this.getINPRating(metric.value),
        timestamp: Date.now(),
        url: window.location.href,
        userAgent: navigator.userAgent,
        deviceInfo: this.getDeviceInfo(),
        networkInfo: this.getNetworkInfo()
      });
    });

    // Cumulative Layout Shift (CLS)
    getCLS((metric) => {
      this.recordMetric({
        name: 'CLS',
        value: metric.value,
        rating: this.getCLSRating(metric.value),
        timestamp: Date.now(),
        url: window.location.href,
        userAgent: navigator.userAgent,
        deviceInfo: this.getDeviceInfo(),
        networkInfo: this.getNetworkInfo()
      });
    });

    // First Contentful Paint (FCP)
    getFCP((metric) => {
      this.recordMetric({
        name: 'FCP',
        value: metric.value,
        rating: this.getFCPRating(metric.value),
        timestamp: Date.now(),
        url: window.location.href,
        userAgent: navigator.userAgent,
        deviceInfo: this.getDeviceInfo(),
        networkInfo: this.getNetworkInfo()
      });
    });

    // Time to First Byte (TTFB)
    getTTFB((metric) => {
      this.recordMetric({
        name: 'TTFB',
        value: metric.value,
        rating: this.getTTFBRating(metric.value),
        timestamp: Date.now(),
        url: window.location.href,
        userAgent: navigator.userAgent,
        deviceInfo: this.getDeviceInfo(),
        networkInfo: this.getNetworkInfo()
      });
    });
  }

  /**
   * Setup Performance Observers
   */
  private setupPerformanceObservers(): void {
    // Long tasks observer
    if ('PerformanceObserver' in window) {
      const longTaskObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          this.recordMetric({
            name: 'LongTask',
            value: entry.duration,
            rating: entry.duration > 50 ? 'poor' : 'good',
            timestamp: Date.now(),
            url: window.location.href,
            userAgent: navigator.userAgent,
            deviceInfo: this.getDeviceInfo(),
            networkInfo: this.getNetworkInfo()
          });
        }
      });
      
      longTaskObserver.observe({ entryTypes: ['longtask'] });
      this.observers.push(longTaskObserver);
    }

    // Navigation timing observer
    if ('PerformanceObserver' in window) {
      const navigationObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (entry.entryType === 'navigation') {
            const navEntry = entry as PerformanceNavigationTiming;
            
            // Record various navigation metrics
            this.recordMetric({
              name: 'DOMInteractive',
              value: navEntry.domInteractive - navEntry.navigationStart,
              rating: this.getNavigationRating(navEntry.domInteractive - navEntry.navigationStart),
              timestamp: Date.now(),
              url: window.location.href,
              userAgent: navigator.userAgent,
              deviceInfo: this.getDeviceInfo(),
              networkInfo: this.getNetworkInfo()
            });

            this.recordMetric({
              name: 'LoadComplete',
              value: navEntry.loadEventEnd - navEntry.navigationStart,
              rating: this.getNavigationRating(navEntry.loadEventEnd - navEntry.navigationStart),
              timestamp: Date.now(),
              url: window.location.href,
              userAgent: navigator.userAgent,
              deviceInfo: this.getDeviceInfo(),
              networkInfo: this.getNetworkInfo()
            });
          }
        }
      });
      
      navigationObserver.observe({ entryTypes: ['navigation'] });
      this.observers.push(navigationObserver);
    }
  }

  /**
   * Setup resource timing monitoring
   */
  private setupResourceTimingMonitoring(): void {
    if ('PerformanceObserver' in window) {
      const resourceObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (entry.entryType === 'resource') {
            const resourceEntry = entry as PerformanceResourceTiming;
            
            // Track slow resources
            if (resourceEntry.duration > 1000) {
              this.recordMetric({
                name: 'SlowResource',
                value: resourceEntry.duration,
                rating: 'poor',
                timestamp: Date.now(),
                url: window.location.href,
                userAgent: navigator.userAgent,
                deviceInfo: this.getDeviceInfo(),
                networkInfo: this.getNetworkInfo()
              });
            }
          }
        }
      });
      
      resourceObserver.observe({ entryTypes: ['resource'] });
      this.observers.push(resourceObserver);
    }
  }

  /**
   * Setup error tracking
   */
  private setupErrorTracking(): void {
    // JavaScript errors
    window.addEventListener('error', (event) => {
      this.recordMetric({
        name: 'JavaScriptError',
        value: 1,
        rating: 'poor',
        timestamp: Date.now(),
        url: window.location.href,
        userAgent: navigator.userAgent,
        deviceInfo: this.getDeviceInfo(),
        networkInfo: this.getNetworkInfo()
      });
    });

    // Unhandled promise rejections
    window.addEventListener('unhandledrejection', (event) => {
      this.recordMetric({
        name: 'UnhandledPromiseRejection',
        value: 1,
        rating: 'poor',
        timestamp: Date.now(),
        url: window.location.href,
        userAgent: navigator.userAgent,
        deviceInfo: this.getDeviceInfo(),
        networkInfo: this.getNetworkInfo()
      });
    });
  }

  /**
   * Setup user interaction monitoring
   */
  private setupUserInteractionMonitoring(): void {
    let clickCount = 0;
    let scrollDepth = 0;
    let timeOnPage = 0;

    // Track clicks
    document.addEventListener('click', () => {
      clickCount++;
    });

    // Track scroll depth
    let maxScroll = 0;
    window.addEventListener('scroll', () => {
      const scrollPercentage = (window.scrollY / (document.body.scrollHeight - window.innerHeight)) * 100;
      maxScroll = Math.max(maxScroll, scrollPercentage);
    });

    // Track time on page
    const startTime = Date.now();
    window.addEventListener('beforeunload', () => {
      timeOnPage = Date.now() - startTime;
      scrollDepth = maxScroll;

      this.recordMetric({
        name: 'UserEngagement',
        value: timeOnPage,
        rating: 'good',
        timestamp: Date.now(),
        url: window.location.href,
        userAgent: navigator.userAgent,
        deviceInfo: this.getDeviceInfo(),
        networkInfo: this.getNetworkInfo()
      });
    });
  }

  /**
   * Get device information
   */
  private getDeviceInfo(): DeviceInfo {
    return {
      memory: (navigator as any).deviceMemory,
      hardwareConcurrency: navigator.hardwareConcurrency || 1,
      platform: navigator.platform,
      vendor: navigator.vendor,
      screenResolution: `${screen.width}x${screen.height}`,
      pixelRatio: window.devicePixelRatio || 1
    };
  }

  /**
   * Get network information
   */
  private getNetworkInfo(): NetworkInfo {
    const connection = (navigator as any).connection || (navigator as any).mozConnection || (navigator as any).webkitConnection;
    
    return {
      effectiveType: connection?.effectiveType,
      downlink: connection?.downlink,
      rtt: connection?.rtt,
      saveData: connection?.saveData
    };
  }

  /**
   * Record a performance metric
   */
  private recordMetric(metric: PerformanceMetric): void {
    this.metrics.push(metric);
    
    if (this.config.debug) {
      this.log(`Performance metric recorded: ${metric.name} = ${metric.value} (${metric.rating})`);
    }

    // Send metrics immediately for critical issues
    if (metric.rating === 'poor') {
      this.sendMetrics([metric]);
    }
  }

  /**
   * Send metrics to the server
   */
  private async sendMetrics(metrics: PerformanceMetric[]): Promise<void> {
    if (metrics.length === 0) return;

    try {
      const response = await fetch(this.config.endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.config.apiKey}`
        },
        body: JSON.stringify({
          metrics,
          timestamp: Date.now(),
          version: '1.0.0'
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      this.log(`Sent ${metrics.length} performance metrics`);
    } catch (error) {
      this.log('Failed to send performance metrics:', error);
    }
  }

  /**
   * Get resource timing data
   */
  getResourceTimingData(): ResourceTiming[] {
    const resources = performance.getEntriesByType('resource') as PerformanceResourceTiming[];
    
    return resources.map(resource => ({
      name: resource.name,
      type: this.getResourceType(resource.name),
      duration: resource.duration,
      size: resource.transferSize || 0,
      cached: resource.transferSize === 0 && resource.decodedBodySize > 0
    }));
  }

  /**
   * Analyze bundle size
   */
  analyzeBundleSize(): BundleAnalysis[] {
    // This would typically be done at build time
    // For runtime analysis, we can estimate based on loaded resources
    const scripts = performance.getEntriesByType('resource')
      .filter(entry => entry.name.includes('.js') && !entry.name.includes('node_modules'))
      .map(entry => ({
        name: entry.name.split('/').pop() || 'unknown',
        size: (entry as PerformanceResourceTiming).transferSize || 0,
        gzippedSize: Math.floor(((entry as PerformanceResourceTiming).transferSize || 0) * 0.3), // Estimate
        loadTime: entry.duration,
        chunks: []
      }));

    return scripts;
  }

  /**
   * Get performance report
   */
  getPerformanceReport(): {
    coreWebVitals: PerformanceMetric[];
    resourceTiming: ResourceTiming[];
    bundleAnalysis: BundleAnalysis[];
    recommendations: string[];
  } {
    const coreWebVitals = this.metrics.filter(metric => 
      ['LCP', 'FID', 'INP', 'CLS', 'FCP', 'TTFB'].includes(metric.name)
    );

    const resourceTiming = this.getResourceTimingData();
    const bundleAnalysis = this.analyzeBundleSize();
    const recommendations = this.generateRecommendations(coreWebVitals, resourceTiming, bundleAnalysis);

    return {
      coreWebVitals,
      resourceTiming,
      bundleAnalysis,
      recommendations
    };
  }

  /**
   * Generate performance recommendations
   */
  private generateRecommendations(
    coreWebVitals: PerformanceMetric[],
    resourceTiming: ResourceTiming[],
    bundleAnalysis: BundleAnalysis[]
  ): string[] {
    const recommendations: string[] = [];

    // Core Web Vitals recommendations
    coreWebVitals.forEach(metric => {
      if (metric.rating === 'poor') {
        switch (metric.name) {
          case 'LCP':
            recommendations.push('Optimize largest contentful paint by optimizing images and server response times');
            break;
          case 'FID':
            recommendations.push('Reduce first input delay by minimizing JavaScript execution time');
            break;
          case 'INP':
            recommendations.push('Improve interaction to next paint by optimizing JavaScript and reducing main thread work');
            break;
          case 'CLS':
            recommendations.push('Reduce cumulative layout shift by specifying image dimensions and avoiding layout shifts');
            break;
          case 'FCP':
            recommendations.push('Improve first contentful paint by optimizing server response and render-blocking resources');
            break;
          case 'TTFB':
            recommendations.push('Reduce time to first byte by optimizing server response time and CDN usage');
            break;
        }
      }
    });

    // Resource timing recommendations
    const slowResources = resourceTiming.filter(resource => resource.duration > 2000);
    if (slowResources.length > 0) {
      recommendations.push(`Optimize ${slowResources.length} slow resources (images, scripts, or stylesheets)`);
    }

    // Bundle size recommendations
    const largeBundles = bundleAnalysis.filter(bundle => bundle.size > 1024 * 1024); // > 1MB
    if (largeBundles.length > 0) {
      recommendations.push('Implement code splitting to reduce initial bundle size');
    }

    return recommendations;
  }

  /**
   * Helper methods for rating metrics
   */
  private getLCPRating(value: number): 'good' | 'needs-improvement' | 'poor' {
    if (value <= 2500) return 'good';
    if (value <= 4000) return 'needs-improvement';
    return 'poor';
  }

  private getFIDRating(value: number): 'good' | 'needs-improvement' | 'poor' {
    if (value <= 100) return 'good';
    if (value <= 300) return 'needs-improvement';
    return 'poor';
  }

  private getINPRating(value: number): 'good' | 'needs-improvement' | 'poor' {
    if (value <= 200) return 'good';
    if (value <= 500) return 'needs-improvement';
    return 'poor';
  }

  private getCLSRating(value: number): 'good' | 'needs-improvement' | 'poor' {
    if (value <= 0.1) return 'good';
    if (value <= 0.25) return 'needs-improvement';
    return 'poor';
  }

  private getFCPRating(value: number): 'good' | 'needs-improvement' | 'poor' {
    if (value <= 1800) return 'good';
    if (value <= 3000) return 'needs-improvement';
    return 'poor';
  }

  private getTTFBRating(value: number): 'good' | 'needs-improvement' | 'poor' {
    if (value <= 800) return 'good';
    if (value <= 1800) return 'needs-improvement';
    return 'poor';
  }

  private getNavigationRating(value: number): 'good' | 'needs-improvement' | 'poor' {
    if (value <= 3000) return 'good';
    if (value <= 5000) return 'needs-improvement';
    return 'poor';
  }

  private getResourceType(url: string): string {
    if (url.includes('.js')) return 'script';
    if (url.includes('.css')) return 'stylesheet';
    if (url.match(/\.(jpg|jpeg|png|gif|webp|svg)$/i)) return 'image';
    if (url.match(/\.(woff|woff2|ttf|eot)$/i)) return 'font';
    return 'other';
  }

  /**
   * Send metrics periodically
   */
  sendMetricsPeriodically(): void {
    setInterval(() => {
      if (this.metrics.length > 0) {
        this.sendMetrics([...this.metrics]);
        this.metrics = []; // Clear sent metrics
      }
    }, 30000); // Send every 30 seconds
  }

  /**
   * Cleanup observers
   */
  cleanup(): void {
    this.observers.forEach(observer => observer.disconnect());
    this.observers = [];
  }

  /**
   * Debug logging
   */
  private log(...args: any[]): void {
    if (this.config.debug) {
      console.log('[PerformanceMonitoring]', ...args);
    }
  }
}

export default PerformanceMonitoringService;
export type {
  PerformanceMetric,
  DeviceInfo,
  NetworkInfo,
  PerformanceEntry,
  BundleAnalysis,
  ResourceTiming
};
