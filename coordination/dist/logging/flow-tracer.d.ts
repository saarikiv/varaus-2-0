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
export declare class FlowTracer {
    private logger;
    private tracer;
    private activeFlows;
    constructor(logger: Logger, tracer: RequestTracer);
    /**
     * Start tracking a new request flow
     */
    startFlow(correlationId?: string): string;
    /**
     * Add a stage to the flow
     */
    addStage(correlationId: string, name: string, application: ApplicationName, metadata?: Record<string, any>): void;
    /**
     * Complete a stage in the flow
     */
    completeStage(correlationId: string, stageName: string, error?: string): void;
    /**
     * End the flow and calculate timing breakdown
     */
    endFlow(correlationId: string): FlowTrace | undefined;
    /**
     * Get a flow by correlation ID
     */
    getFlow(correlationId: string): FlowTrace | undefined;
    /**
     * Get all active flows
     */
    getAllFlows(): FlowTrace[];
    /**
     * Get complete request flow with timing information
     */
    getRequestFlow(correlationId: string): {
        flow: FlowTrace | undefined;
        events: TraceEvent[];
        timeline: string;
    };
    /**
     * Calculate timing breakdown from flow stages
     */
    private calculateTimingBreakdown;
    /**
     * Format timeline as human-readable string
     */
    private formatTimeline;
    /**
     * Clear old flows (cleanup)
     */
    clearOldFlows(maxAgeMs?: number): void;
    /**
     * Log complete request flow
     */
    logRequestFlow(correlationId: string): void;
}
/**
 * Create a flow tracer instance
 */
export declare function createFlowTracer(logger: Logger, tracer: RequestTracer): FlowTracer;
