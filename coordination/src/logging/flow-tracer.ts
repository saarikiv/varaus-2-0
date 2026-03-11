/**
 * Request Flow Tracer
 * Tracks complete request flow from frontend through backend with timing information
 */

import { ApplicationName, FlowTrace, FlowStage, TimingBreakdown } from '../types';
import { Logger, RequestTracer, TraceEvent } from './index';

export type { FlowTrace, FlowStage, TimingBreakdown };

/**
 * Flow Tracer Implementation
 */
export class FlowTracer {
  private logger: Logger;
  private tracer: RequestTracer;
  private activeFlows: Map<string, FlowTrace> = new Map();

  constructor(logger: Logger, tracer: RequestTracer) {
    this.logger = logger;
    this.tracer = tracer;
  }

  /**
   * Start tracking a new request flow
   */
  startFlow(correlationId?: string): string {
    const id = correlationId || this.logger.createCorrelationId();
    
    const flow: FlowTrace = {
      correlationId: id,
      startTime: new Date(),
      stages: [],
      timingBreakdown: {
        frontendProcessing: 0,
        networkLatency: 0,
        backendProcessing: 0,
        databaseOperations: 0,
        totalRoundTrip: 0
      }
    };

    this.activeFlows.set(id, flow);
    this.tracer.startTrace(id);
    this.logger.info(`Flow trace started`, id);

    return id;
  }

  /**
   * Add a stage to the flow
   */
  addStage(
    correlationId: string,
    name: string,
    application: ApplicationName,
    metadata?: Record<string, any>
  ): void {
    const flow = this.activeFlows.get(correlationId);
    if (!flow) {
      this.logger.warn(`Flow not found for correlation ID: ${correlationId}`);
      return;
    }

    const stage: FlowStage = {
      name,
      application: application === 'both' ? 'frontend' : application,
      startTime: new Date(),
      status: 'pending',
      metadata
    };

    flow.stages.push(stage);
    this.tracer.addEvent(correlationId, application, `Stage started: ${name}`, undefined, metadata);
    this.logger.debug(`Flow stage added: ${name}`, correlationId);
  }

  /**
   * Complete a stage in the flow
   */
  completeStage(
    correlationId: string,
    stageName: string,
    error?: string
  ): void {
    const flow = this.activeFlows.get(correlationId);
    if (!flow) {
      this.logger.warn(`Flow not found for correlation ID: ${correlationId}`);
      return;
    }

    // Find the most recent pending stage with this name
    const stage = [...flow.stages].reverse().find(
      s => s.name === stageName && s.status === 'pending'
    );

    if (!stage) {
      this.logger.warn(`Stage not found: ${stageName}`, correlationId);
      return;
    }

    stage.endTime = new Date();
    stage.duration = stage.endTime.getTime() - stage.startTime.getTime();
    stage.status = error ? 'failed' : 'completed';
    stage.error = error;

    this.tracer.addEvent(
      correlationId,
      stage.application,
      `Stage ${error ? 'failed' : 'completed'}: ${stageName}`,
      stage.duration
    );

    this.logger.debug(
      `Flow stage ${error ? 'failed' : 'completed'}: ${stageName} (${stage.duration}ms)`,
      correlationId
    );
  }

  /**
   * End the flow and calculate timing breakdown
   */
  endFlow(correlationId: string): FlowTrace | undefined {
    const flow = this.activeFlows.get(correlationId);
    if (!flow) {
      this.logger.warn(`Flow not found for correlation ID: ${correlationId}`);
      return undefined;
    }

    flow.endTime = new Date();
    flow.totalDuration = flow.endTime.getTime() - flow.startTime.getTime();

    // Calculate timing breakdown
    flow.timingBreakdown = this.calculateTimingBreakdown(flow);

    this.tracer.endTrace(correlationId);
    this.logger.info(
      `Flow trace completed (${flow.totalDuration}ms)`,
      correlationId
    );

    return flow;
  }

  /**
   * Get a flow by correlation ID
   */
  getFlow(correlationId: string): FlowTrace | undefined {
    return this.activeFlows.get(correlationId);
  }

  /**
   * Get all active flows
   */
  getAllFlows(): FlowTrace[] {
    return Array.from(this.activeFlows.values());
  }

  /**
   * Get complete request flow with timing information
   */
  getRequestFlow(correlationId: string): {
    flow: FlowTrace | undefined;
    events: TraceEvent[];
    timeline: string;
  } {
    const flow = this.activeFlows.get(correlationId);
    const events = this.tracer.getRequestFlow(correlationId);
    const timeline = this.formatTimeline(events);

    return { flow, events, timeline };
  }

  /**
   * Calculate timing breakdown from flow stages
   */
  private calculateTimingBreakdown(flow: FlowTrace): TimingBreakdown {
    let frontendProcessing = 0;
    let backendProcessing = 0;
    let databaseOperations = 0;

    flow.stages.forEach(stage => {
      if (stage.duration) {
        if (stage.application === 'frontend') {
          frontendProcessing += stage.duration;
        } else if (stage.application === 'backend') {
          if (stage.name.toLowerCase().includes('database') || 
              stage.name.toLowerCase().includes('db') ||
              stage.name.toLowerCase().includes('firebase')) {
            databaseOperations += stage.duration;
          } else {
            backendProcessing += stage.duration;
          }
        }
      }
    });

    const totalRoundTrip = flow.totalDuration || 0;
    
    // Network latency is the time not accounted for by processing
    const accountedTime = frontendProcessing + backendProcessing + databaseOperations;
    const networkLatency = Math.max(0, totalRoundTrip - accountedTime);

    return {
      frontendProcessing,
      networkLatency,
      backendProcessing,
      databaseOperations,
      totalRoundTrip
    };
  }

  /**
   * Format timeline as human-readable string
   */
  private formatTimeline(events: TraceEvent[]): string {
    if (events.length === 0) {
      return 'No events recorded';
    }

    const lines: string[] = ['Request Flow Timeline:', ''];
    const startTime = events[0].timestamp.getTime();

    events.forEach((event, index) => {
      const elapsed = event.timestamp.getTime() - startTime;
      const app = event.application.padEnd(8);
      const duration = event.duration ? ` (${event.duration}ms)` : '';
      
      lines.push(`  ${index + 1}. [+${elapsed}ms] [${app}] ${event.event}${duration}`);
    });

    return lines.join('\n');
  }

  /**
   * Clear old flows (cleanup)
   */
  clearOldFlows(maxAgeMs: number = 3600000): void {
    const now = Date.now();
    const toDelete: string[] = [];

    this.activeFlows.forEach((flow, id) => {
      const flowAge = now - flow.startTime.getTime();
      if (flowAge > maxAgeMs) {
        toDelete.push(id);
      }
    });

    toDelete.forEach(id => this.activeFlows.delete(id));
    
    if (toDelete.length > 0) {
      this.logger.debug(`Cleared ${toDelete.length} old flows`);
    }
  }

  /**
   * Log complete request flow
   */
  logRequestFlow(correlationId: string): void {
    const { flow, events, timeline } = this.getRequestFlow(correlationId);

    if (!flow) {
      this.logger.warn(`No flow found for correlation ID: ${correlationId}`);
      return;
    }

    this.logger.info(`\n${timeline}`, correlationId);
    
    if (flow.totalDuration) {
      const breakdown = flow.timingBreakdown;
      this.logger.info(
        `Timing Breakdown: Frontend=${breakdown.frontendProcessing}ms, ` +
        `Network=${breakdown.networkLatency}ms, ` +
        `Backend=${breakdown.backendProcessing}ms, ` +
        `Database=${breakdown.databaseOperations}ms, ` +
        `Total=${breakdown.totalRoundTrip}ms`,
        correlationId
      );
    }
  }
}

/**
 * Create a flow tracer instance
 */
export function createFlowTracer(logger: Logger, tracer: RequestTracer): FlowTracer {
  return new FlowTracer(logger, tracer);
}
