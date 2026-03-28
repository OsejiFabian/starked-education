import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { 
  Activity, 
  AlertTriangle, 
  CheckCircle, 
  Clock, 
  Download, 
  TrendingUp,
  Zap,
  Monitor,
  Globe
} from 'lucide-react';
import usePerformanceMonitoring from '@/hooks/usePerformanceMonitoring';

interface PerformanceDashboardProps {
  className?: string;
}

const PerformanceDashboard: React.FC<PerformanceDashboardProps> = ({ className }) => {
  const {
    coreWebVitals,
    resourceTiming,
    bundleAnalysis,
    recommendations,
    isInitialized,
    performanceScore,
    performanceGrade,
    isPerformanceGood,
    updateData,
    exportData,
    getSlowResources,
    getLargeBundles
  } = usePerformanceMonitoring({
    debug: true,
    autoStart: true
  });

  const [refreshInterval, setRefreshInterval] = useState<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // Set up auto-refresh
    const interval = setInterval(() => {
      updateData();
    }, 10000); // Refresh every 10 seconds
    
    setRefreshInterval(interval);
    
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [updateData]);

  const getMetricColor = (rating: string) => {
    switch (rating) {
      case 'good': return 'text-green-600';
      case 'needs-improvement': return 'text-yellow-600';
      case 'poor': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  const getMetricBadgeVariant = (rating: string) => {
    switch (rating) {
      case 'good': return 'default';
      case 'needs-improvement': return 'secondary';
      case 'poor': return 'destructive';
      default: return 'outline';
    }
  };

  const formatMetricValue = (name: string, value: number) => {
    switch (name) {
      case 'LCP':
      case 'FCP':
      case 'TTFB':
        return `${Math.round(value)}ms`;
      case 'FID':
      case 'INP':
        return `${Math.round(value)}ms`;
      case 'CLS':
        return value.toFixed(3);
      default:
        return Math.round(value).toString();
    }
  };

  const getMetricDescription = (name: string) => {
    switch (name) {
      case 'LCP': return 'Largest Contentful Paint';
      case 'FID': return 'First Input Delay';
      case 'INP': return 'Interaction to Next Paint';
      case 'CLS': return 'Cumulative Layout Shift';
      case 'FCP': return 'First Contentful Paint';
      case 'TTFB': return 'Time to First Byte';
      default: return name;
    }
  };

  const slowResources = getSlowResources();
  const largeBundles = getLargeBundles();

  const performanceData = coreWebVitals.map(metric => ({
    name: metric.name,
    value: metric.value,
    rating: metric.rating,
    timestamp: new Date(metric.timestamp).toLocaleTimeString()
  }));

  const resourceData = resourceTiming.slice(0, 10).map(resource => ({
    name: resource.name.split('/').pop() || 'unknown',
    duration: Math.round(resource.duration),
    size: Math.round(resource.size / 1024), // KB
    type: resource.type
  }));

  const bundleData = bundleAnalysis.map(bundle => ({
    name: bundle.name,
    size: Math.round(bundle.size / 1024), // KB
    gzippedSize: Math.round(bundle.gzippedSize / 1024), // KB
    loadTime: Math.round(bundle.loadTime)
  }));

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

  if (!isInitialized) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <Activity className="h-8 w-8 animate-spin mx-auto mb-2" />
          <p>Initializing performance monitoring...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Performance Dashboard</h1>
          <p className="text-muted-foreground">Monitor and optimize your application performance</p>
        </div>
        <div className="flex items-center space-x-2">
          <Button onClick={() => updateData()} variant="outline" size="sm">
            <Activity className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button onClick={exportData} variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Performance Score Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Performance Score</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{performanceScore || 'N/A'}</div>
            <p className="text-xs text-muted-foreground">
              Grade: <span className={`font-semibold ${
                performanceGrade === 'A' ? 'text-green-600' :
                performanceGrade === 'B' ? 'text-blue-600' :
                performanceGrade === 'C' ? 'text-yellow-600' :
                'text-red-600'
              }`}>{performanceGrade}</span>
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Performance Status</CardTitle>
            {isPerformanceGood ? (
              <CheckCircle className="h-4 w-4 text-green-600" />
            ) : (
              <AlertTriangle className="h-4 w-4 text-yellow-600" />
            )}
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {isPerformanceGood ? 'Good' : 'Needs Improvement'}
            </div>
            <p className="text-xs text-muted-foreground">
              Based on Core Web Vitals
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Recommendations</CardTitle>
            <Zap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{recommendations.length}</div>
            <p className="text-xs text-muted-foreground">
              Optimization suggestions
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Core Web Vitals */}
      <Card>
        <CardHeader>
          <CardTitle>Core Web Vitals</CardTitle>
          <CardDescription>
            Key performance metrics that impact user experience
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {coreWebVitals.map((metric) => (
              <div key={metric.name} className="border rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-medium">{getMetricDescription(metric.name)}</h3>
                  <Badge variant={getMetricBadgeVariant(metric.rating)}>
                    {metric.rating}
                  </Badge>
                </div>
                <div className={`text-2xl font-bold ${getMetricColor(metric.rating)}`}>
                  {formatMetricValue(metric.name, metric.value)}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {new Date(metric.timestamp).toLocaleTimeString()}
                </p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Detailed Analytics */}
      <Tabs defaultValue="resources" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="resources">Resources</TabsTrigger>
          <TabsTrigger value="bundles">Bundles</TabsTrigger>
          <TabsTrigger value="recommendations">Recommendations</TabsTrigger>
          <TabsTrigger value="charts">Charts</TabsTrigger>
        </TabsList>

        <TabsContent value="resources" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Resource Performance</CardTitle>
              <CardDescription>
                Analysis of loaded resources and their performance
              </CardDescription>
            </CardHeader>
            <CardContent>
              {slowResources.length > 0 && (
                <div className="mb-4">
                  <h4 className="font-medium text-red-600 mb-2">Slow Resources</h4>
                  <div className="space-y-2">
                    {slowResources.slice(0, 5).map((resource, index) => (
                      <div key={index} className="flex items-center justify-between p-2 border rounded">
                        <div className="flex items-center space-x-2">
                          <Clock className="h-4 w-4 text-red-600" />
                          <span className="text-sm truncate max-w-xs">
                            {resource.name}
                          </span>
                        </div>
                        <div className="text-sm font-medium">
                          {Math.round(resource.duration)}ms
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={resourceData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="duration" fill="#8884d8" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="bundles" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Bundle Analysis</CardTitle>
              <CardDescription>
                JavaScript bundle sizes and loading performance
              </CardDescription>
            </CardHeader>
            <CardContent>
              {largeBundles.length > 0 && (
                <div className="mb-4">
                  <h4 className="font-medium text-yellow-600 mb-2">Large Bundles</h4>
                  <div className="space-y-2">
                    {largeBundles.map((bundle, index) => (
                      <div key={index} className="flex items-center justify-between p-2 border rounded">
                        <div className="flex items-center space-x-2">
                          <Monitor className="h-4 w-4 text-yellow-600" />
                          <span className="text-sm">{bundle.name}</span>
                        </div>
                        <div className="text-sm font-medium">
                          {Math.round(bundle.size / 1024)}KB
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={bundleData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="size" fill="#82ca9d" />
                    <Bar dataKey="gzippedSize" fill="#8884d8" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="recommendations" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Optimization Recommendations</CardTitle>
              <CardDescription>
                Suggestions to improve your application performance
              </CardDescription>
            </CardHeader>
            <CardContent>
              {recommendations.length === 0 ? (
                <div className="text-center py-8">
                  <CheckCircle className="h-12 w-12 text-green-600 mx-auto mb-2" />
                  <p className="text-lg font-medium">Great job!</p>
                  <p className="text-muted-foreground">
                    No performance recommendations at this time.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {recommendations.map((recommendation, index) => (
                    <div key={index} className="flex items-start space-x-3 p-3 border rounded-lg">
                      <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="text-sm">{recommendation}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="charts" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Performance Metrics Over Time</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={performanceData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="timestamp" />
                      <YAxis />
                      <Tooltip />
                      <Line type="monotone" dataKey="value" stroke="#8884d8" />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Resource Types Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={resourceTiming.reduce((acc: any[], resource) => {
                          const existing = acc.find(item => item.name === resource.type);
                          if (existing) {
                            existing.value += 1;
                          } else {
                            acc.push({ name: resource.type, value: 1 });
                          }
                          return acc;
                        }, [])}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {resourceTiming.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default PerformanceDashboard;
