'use client';

/**
 * Isolates render failures in map, chart, and KPI regions so one bad panel
 * does not blank the entire dashboard (React error boundary — DEV-95 review).
 */
import { Component, type ErrorInfo, type ReactNode } from 'react';

import { ErrorState } from './error-state';

type DashboardRegionErrorBoundaryProps = {
  children: ReactNode;
  regionLabel: string;
};

type DashboardRegionErrorBoundaryState = {
  hasError: boolean;
};

export class DashboardRegionErrorBoundary extends Component<
  DashboardRegionErrorBoundaryProps,
  DashboardRegionErrorBoundaryState
> {
  state: DashboardRegionErrorBoundaryState = { hasError: false };

  static getDerivedStateFromError(): DashboardRegionErrorBoundaryState {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    if (process.env.NODE_ENV === 'development') {
      console.error(`[dashboard:${this.props.regionLabel}]`, error, info.componentStack);
    }
  }

  private handleRetry = (): void => {
    this.setState({ hasError: false });
  };

  render(): ReactNode {
    if (this.state.hasError) {
      return (
        <ErrorState
          message={`Unable to display ${this.props.regionLabel}. Please try again.`}
          onRetry={this.handleRetry}
        />
      );
    }

    return this.props.children;
  }
}
