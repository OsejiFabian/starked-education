const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../../middleware/auth');
const Joi = require('joi');

// Validation schema for performance metrics
const performanceMetricSchema = Joi.object({
  name: Joi.string().required(),
  value: Joi.number().required(),
  rating: Joi.string().valid('good', 'needs-improvement', 'poor').required(),
  timestamp: Joi.number().required(),
  url: Joi.string().uri().required(),
  userAgent: Joi.string().required(),
  deviceInfo: Joi.object({
    memory: Joi.number().optional(),
    hardwareConcurrency: Joi.number().required(),
    platform: Joi.string().required(),
    vendor: Joi.string().required(),
    screenResolution: Joi.string().required(),
    pixelRatio: Joi.number().required()
  }).required(),
  networkInfo: Joi.object({
    effectiveType: Joi.string().optional(),
    downlink: Joi.number().optional(),
    rtt: Joi.number().optional(),
    saveData: Joi.boolean().optional()
  }).required()
});

const performanceReportSchema = Joi.object({
  metrics: Joi.array().items(performanceMetricSchema).required(),
  timestamp: Joi.number().required(),
  version: Joi.string().required()
});

// In-memory storage for demo purposes
// In production, this would be stored in a database
const performanceMetrics = [];
const performanceReports = [];

/**
 * POST /api/performance/metrics
 * Receive performance metrics from frontend
 */
router.post('/metrics', async (req, res) => {
  try {
    const { error, value } = performanceReportSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        details: error.details.map(d => d.message)
      });
    }

    // Store metrics
    performanceReports.push({
      ...value,
      id: performanceReports.length + 1,
      receivedAt: new Date()
    });

    // Store individual metrics for easier querying
    value.metrics.forEach(metric => {
      performanceMetrics.push({
        ...metric,
        reportId: performanceReports.length,
        receivedAt: new Date()
      });
    });

    // Keep only last 1000 metrics to prevent memory issues
    if (performanceMetrics.length > 1000) {
      performanceMetrics.splice(0, performanceMetrics.length - 1000);
    }

    // Check for performance alerts
    const alerts = generatePerformanceAlerts(value.metrics);

    res.json({
      success: true,
      message: 'Metrics received successfully',
      alerts: alerts.length > 0 ? alerts : undefined,
      metricsCount: value.metrics.length
    });
  } catch (error) {
    console.error('Performance metrics error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

/**
 * GET /api/performance/metrics
 * Get stored performance metrics
 */
router.get('/metrics', authenticateToken, async (req, res) => {
  try {
    const {
      page = 1,
      limit = 50,
      metricName,
      rating,
      startDate,
      endDate,
      url
    } = req.query;

    let filteredMetrics = [...performanceMetrics];

    // Apply filters
    if (metricName) {
      filteredMetrics = filteredMetrics.filter(m => m.name === metricName);
    }

    if (rating) {
      filteredMetrics = filteredMetrics.filter(m => m.rating === rating);
    }

    if (startDate) {
      const start = new Date(startDate);
      filteredMetrics = filteredMetrics.filter(m => new Date(m.timestamp) >= start);
    }

    if (endDate) {
      const end = new Date(endDate);
      filteredMetrics = filteredMetrics.filter(m => new Date(m.timestamp) <= end);
    }

    if (url) {
      filteredMetrics = filteredMetrics.filter(m => m.url.includes(url));
    }

    // Sort by timestamp (newest first)
    filteredMetrics.sort((a, b) => b.timestamp - a.timestamp);

    // Pagination
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + parseInt(limit);
    const paginatedMetrics = filteredMetrics.slice(startIndex, endIndex);

    res.json({
      success: true,
      data: paginatedMetrics,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: filteredMetrics.length,
        pages: Math.ceil(filteredMetrics.length / limit)
      }
    });
  } catch (error) {
    console.error('Get performance metrics error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

/**
 * GET /api/performance/reports
 * Get performance reports
 */
router.get('/reports', authenticateToken, async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      startDate,
      endDate
    } = req.query;

    let filteredReports = [...performanceReports];

    // Apply filters
    if (startDate) {
      const start = new Date(startDate);
      filteredReports = filteredReports.filter(r => new Date(r.timestamp) >= start);
    }

    if (endDate) {
      const end = new Date(endDate);
      filteredReports = filteredReports.filter(r => new Date(r.timestamp) <= end);
    }

    // Sort by receivedAt (newest first)
    filteredReports.sort((a, b) => new Date(b.receivedAt) - new Date(a.receivedAt));

    // Pagination
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + parseInt(limit);
    const paginatedReports = filteredReports.slice(startIndex, endIndex);

    res.json({
      success: true,
      data: paginatedReports,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: filteredReports.length,
        pages: Math.ceil(filteredReports.length / limit)
      }
    });
  } catch (error) {
    console.error('Get performance reports error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

/**
 * GET /api/performance/summary
 * Get performance summary and analytics
 */
router.get('/summary', authenticateToken, async (req, res) => {
  try {
    const { dateRange = '7d' } = req.query;

    const startDate = getDateRangeStart(dateRange);
    const recentMetrics = performanceMetrics.filter(m => 
      new Date(m.timestamp) >= startDate
    );

    // Calculate summary statistics
    const summary = {
      totalMetrics: recentMetrics.length,
      averagePerformanceScore: calculateAveragePerformanceScore(recentMetrics),
      metricsByType: groupMetricsByType(recentMetrics),
      metricsByRating: groupMetricsByRating(recentMetrics),
      topSlowPages: getTopSlowPages(recentMetrics),
      deviceBreakdown: getDeviceBreakdown(recentMetrics),
      networkBreakdown: getNetworkBreakdown(recentMetrics),
      performanceTrends: getPerformanceTrends(recentMetrics),
      alerts: generatePerformanceAlerts(recentMetrics)
    };

    res.json({
      success: true,
      data: summary,
      dateRange,
      generatedAt: new Date()
    });
  } catch (error) {
    console.error('Performance summary error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

/**
 * GET /api/performance/alerts
 * Get performance alerts
 */
router.get('/alerts', authenticateToken, async (req, res) => {
  try {
    const { acknowledged = 'false' } = req.query;
    
    // Get recent metrics from last 24 hours
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const recentMetrics = performanceMetrics.filter(m => 
      new Date(m.timestamp) >= yesterday
    );

    const alerts = generatePerformanceAlerts(recentMetrics);

    // Filter by acknowledgment status
    const filteredAlerts = acknowledged === 'true' 
      ? alerts.filter(a => a.acknowledged)
      : alerts.filter(a => !a.acknowledged);

    res.json({
      success: true,
      data: filteredAlerts,
      total: alerts.length
    });
  } catch (error) {
    console.error('Performance alerts error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

/**
 * POST /api/performance/alerts/:id/acknowledge
 * Acknowledge a performance alert
 */
router.post('/alerts/:id/acknowledge', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    
    // In a real implementation, this would update the database
    // For demo purposes, we'll just return success
    
    res.json({
      success: true,
      message: 'Alert acknowledged successfully'
    });
  } catch (error) {
    console.error('Acknowledge alert error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

/**
 * GET /api/performance/export
 * Export performance data
 */
router.get('/export', authenticateToken, async (req, res) => {
  try {
    const { format = 'json', dateRange = '30d' } = req.query;

    const startDate = getDateRangeStart(dateRange);
    const exportData = {
      metrics: performanceMetrics.filter(m => new Date(m.timestamp) >= startDate),
      reports: performanceReports.filter(r => new Date(r.timestamp) >= startDate),
      exportedAt: new Date(),
      dateRange
    };

    switch (format) {
      case 'csv':
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', 'attachment; filename="performance-metrics.csv"');
        // Simple CSV conversion
        const csv = convertToCSV(exportData.metrics);
        res.send(csv);
        break;
      case 'json':
      default:
        res.json({
          success: true,
          data: exportData
        });
    }
  } catch (error) {
    console.error('Export performance data error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Helper functions

function generatePerformanceAlerts(metrics) {
  const alerts = [];
  const now = Date.now();
  const oneHourAgo = now - (60 * 60 * 1000);

  // Check for poor performance metrics in the last hour
  const recentPoorMetrics = metrics.filter(m => 
    m.rating === 'poor' && m.timestamp > oneHourAgo
  );

  // Group by metric type
  const poorMetricsByType = recentPoorMetrics.reduce((acc, metric) => {
    if (!acc[metric.name]) {
      acc[metric.name] = [];
    }
    acc[metric.name].push(metric);
    return acc;
  }, {});

  // Generate alerts for each metric type with poor performance
  Object.entries(poorMetricsByType).forEach(([metricType, metrics]) => {
    if (metrics.length >= 3) { // Alert if 3+ poor readings in an hour
      alerts.push({
        id: `alert-${metricType}-${Date.now()}`,
        type: 'performance_degradation',
        severity: 'high',
        metric: metricType,
        count: metrics.length,
        message: `${metricType} performance degraded with ${metrics.length} poor readings in the last hour`,
        timestamp: Date.now(),
        acknowledged: false
      });
    }
  });

  // Check for error spikes
  const errorMetrics = metrics.filter(m => 
    (m.name === 'JavaScriptError' || m.name === 'UnhandledPromiseRejection') && 
    m.timestamp > oneHourAgo
  );

  if (errorMetrics.length >= 5) {
    alerts.push({
      id: `alert-errors-${Date.now()}`,
      type: 'error_spike',
      severity: 'critical',
      count: errorMetrics.length,
      message: `Error spike detected: ${errorMetrics.length} errors in the last hour`,
      timestamp: Date.now(),
      acknowledged: false
    });
  }

  return alerts;
}

function calculateAveragePerformanceScore(metrics) {
  if (metrics.length === 0) return 0;

  const ratings = metrics.map(metric => {
    switch (metric.rating) {
      case 'good': return 100;
      case 'needs-improvement': return 50;
      case 'poor': return 0;
      default: return 0;
    }
  });

  const averageScore = ratings.reduce((sum, rating) => sum + rating, 0) / ratings.length;
  return Math.round(averageScore);
}

function groupMetricsByType(metrics) {
  return metrics.reduce((acc, metric) => {
    if (!acc[metric.name]) {
      acc[metric.name] = 0;
    }
    acc[metric.name]++;
    return acc;
  }, {});
}

function groupMetricsByRating(metrics) {
  return metrics.reduce((acc, metric) => {
    if (!acc[metric.rating]) {
      acc[metric.rating] = 0;
    }
    acc[metric.rating]++;
    return acc;
  }, {});
}

function getTopSlowPages(metrics, limit = 10) {
  const pageMetrics = metrics.reduce((acc, metric) => {
    if (!acc[metric.url]) {
      acc[metric.url] = { count: 0, totalTime: 0, metrics: [] };
    }
    acc[metric.url].count++;
    acc[metric.url].metrics.push(metric);
    return acc;
  }, {});

  return Object.entries(pageMetrics)
    .map(([url, data]) => ({
      url,
      metricCount: data.count,
      averageLoadTime: data.metrics.reduce((sum, m) => sum + m.value, 0) / data.metrics.length
    }))
    .sort((a, b) => b.averageLoadTime - a.averageLoadTime)
    .slice(0, limit);
}

function getDeviceBreakdown(metrics) {
  return metrics.reduce((acc, metric) => {
    const platform = metric.deviceInfo.platform;
    if (!acc[platform]) {
      acc[platform] = 0;
    }
    acc[platform]++;
    return acc;
  }, {});
}

function getNetworkBreakdown(metrics) {
  return metrics.reduce((acc, metric) => {
    const effectiveType = metric.networkInfo.effectiveType || 'unknown';
    if (!acc[effectiveType]) {
      acc[effectiveType] = 0;
    }
    acc[effectiveType]++;
    return acc;
  }, {});
}

function getPerformanceTrends(metrics) {
  // Group metrics by day
  const dailyMetrics = metrics.reduce((acc, metric) => {
    const date = new Date(metric.timestamp).toISOString().split('T')[0];
    if (!acc[date]) {
      acc[date] = [];
    }
    acc[date].push(metric);
    return acc;
  }, {});

  return Object.entries(dailyMetrics).map(([date, dayMetrics]) => ({
    date,
    averageScore: calculateAveragePerformanceScore(dayMetrics),
    metricCount: dayMetrics.length
  })).sort((a, b) => new Date(a.date) - new Date(b.date));
}

function getDateRangeStart(range) {
  const now = new Date();
  switch (range) {
    case '1d':
      return new Date(now.getTime() - 24 * 60 * 60 * 1000);
    case '7d':
      return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    case '30d':
      return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    case '90d':
      return new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
    default:
      return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  }
}

function convertToCSV(metrics) {
  if (metrics.length === 0) return '';

  const headers = Object.keys(metrics[0]).join(',');
  const rows = metrics.map(metric => 
    Object.values(metric).map(value => 
      typeof value === 'string' && value.includes(',') ? `"${value}"` : value
    ).join(',')
  );

  return [headers, ...rows].join('\n');
}

module.exports = router;
