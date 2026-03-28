'use client';

import React from 'react';
import PerformanceDashboard from '@/components/PerformanceDashboard';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Performance Monitoring - StarkEd',
  description: 'Monitor and optimize your application performance with comprehensive analytics and insights.',
};

const PerformanceMonitoringPage: React.FC = () => {
  return (
    <div className="container mx-auto py-6">
      <PerformanceDashboard />
    </div>
  );
};

export default PerformanceMonitoringPage;
