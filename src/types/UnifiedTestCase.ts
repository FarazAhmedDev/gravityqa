/**
 * UNIFIED TEST CASE SCHEMA
 * Phase 1: Foundation & Stability
 * 
 * This is the core type system for ALL test cases across mobile, web, and API testing.
 * Replaces the old TestCase interface with a more comprehensive, metadata-rich version.
 */

import { UnifiedAction, Platform, ResultType } from './UnifiedAction'

// ============================================
// CORE TYPES
// ============================================

export type TestCaseStatus = 'draft' | 'ready' | 'executed' | 'blocked' | 'archived'
export type TestPriority = 'low' | 'medium' | 'high' | 'critical'
export type TestType = 'mobile' | 'web' | 'api' | 'hybrid'

// ============================================
// RISK AREAS
// ============================================

export const RISK_AREAS = [
    'Authentication',
    'Payment',
    'Data Entry',
    'Navigation',
    'Critical Path',
    'Edge Case',
    'Integration',
    'Security',
    'Performance',
    'UI/UX'
] as const

export type RiskArea = typeof RISK_AREAS[number]

// ============================================
// EXECUTION RESULT
// ============================================

export interface ExecutionResult {
    id: string
    timestamp: number
    duration: number  // milliseconds
    result: ResultType

    // Step results
    totalSteps: number
    passedSteps: number
    failedSteps: number
    flakySteps: number
    blockedSteps: number
    skippedSteps: number

    // Details
    stepResults: {
        step: number
        status: ResultType
        error?: string
        retriesUsed: number
        screenshot?: string
        duration: number
    }[]

    // Environment
    executedOn: {
        platform: Platform
        device?: string
        browser?: string
        osVersion?: string
    }

    // Settings used
    settings?: {
        restartApp: boolean
        clearData: boolean
        retryPerStep: number
        failureBehaviour: 'stop' | 'skip' | 'continue'
    }
}

// ============================================
// LIFECYCLE EVENTS
// ============================================

export interface LifecycleEvent {
    timestamp: number
    by?: string  // user/system
    reason?: string
}

export interface TestCaseLifecycle {
    created: LifecycleEvent
    lastModified: LifecycleEvent
    lastExecuted?: LifecycleEvent & { result: ResultType }
    blocked?: LifecycleEvent
    archived?: LifecycleEvent
    transitions: {
        from: TestCaseStatus
        to: TestCaseStatus
        timestamp: number
        reason?: string
    }[]
}

// ============================================
// METADATA
// ============================================

export interface QAMetadata {
    // Test purpose & expectations
    purpose?: string
    expectedResult?: string

    // Classification
    riskArea?: RiskArea[]
    priority: TestPriority

    // Organization
    tags: string[]
    category?: string
    epic?: string
    storyId?: string

    // Owner ship
    createdBy?: string
    assignedTo?: string
    reviewedBy?: string

    // Environment requirements
    requiresDevice?: string[]
    requiresBrowser?: string[]
    requiresData?: boolean
}

// ============================================
// DEVICE/APP INFO (Mobile Specific)
// ============================================

export interface DeviceInfo {
    id: string
    name: string
    platform?: string
    osVersion?: string
    manufacturer?: string
}

export interface AppInfo {
    name: string
    package: string
    version: string
    activity?: string
    bundleId?: string
}

// ============================================
// WEB TEST INFO
// ============================================

export interface WebTestInfo {
    url: string
    browser?: 'chrome' | 'firefox' | 'safari' | 'edge'
    viewport?: {
        width: number
        height: number
    }
    cookies?: Record<string, string>
}

// ============================================
// API TEST INFO
// ============================================

export interface ApiTestInfo {
    baseUrl: string
    environment?: 'dev' | 'staging' | 'production'
    authentication?: {
        type: 'bearer' | 'basic' | 'apikey'
        credentials?: Record<string, string>
    }
}

// ============================================
// UNIFIED TEST CASE
// ============================================

export interface UnifiedTestCase {
    // Core identification
    id: string
    name: string
    description: string
    type: TestType

    // Status & Priority
    status: TestCaseStatus
    priority: TestPriority

    // QA Metadata
    metadata: QAMetadata

    // Test Definition
    steps: UnifiedAction[]

    // Platform-specific info
    deviceInfo?: DeviceInfo  // Mobile
    appInfo?: AppInfo  // Mobile
    webInfo?: WebTestInfo  // Web
    apiInfo?: ApiTestInfo  // API

    // Execution history
    executionHistory: ExecutionResult[]
    lastRun?: ExecutionResult

    // Statistics
    stats: {
        totalRuns: number
        passCount: number
        failCount: number
        flakyCount: number
        passRate: number
        averageDuration: number
    }

    // Lifecycle tracking
    lifecycle: TestCaseLifecycle

    // Timestamps
    createdAt: number
    updatedAt: number

    // Legacy support
    flowId?: string  // Reference to old flow system
}

// ============================================
// FACTORY FUNCTIONS
// ============================================

/**
 * Create a new test case
 */
export function createTestCase(
    name: string,
    type: TestType,
    options?: Partial<UnifiedTestCase>
): UnifiedTestCase {
    const now = Date.now()

    return {
        id: generateTestCaseId(),
        name,
        description: options?.description || '',
        type,
        status: 'draft',
        priority: 'medium',

        metadata: {
            priority: options?.metadata?.priority || 'medium',
            tags: options?.metadata?.tags || [],
            riskArea: options?.metadata?.riskArea || [],
            ...options?.metadata
        },

        steps: options?.steps || [],

        executionHistory: [],
        lastRun: undefined,

        stats: {
            totalRuns: 0,
            passCount: 0,
            failCount: 0,
            flakyCount: 0,
            passRate: 0,
            averageDuration: 0
        },

        lifecycle: {
            created: { timestamp: now },
            lastModified: { timestamp: now },
            transitions: []
        },

        createdAt: now,
        updatedAt: now,

        ...options
    }
}

/**
 * Create mobile test case
 */
export function createMobileTestCase(
    name: string,
    deviceInfo: DeviceInfo,
    appInfo: AppInfo,
    steps: UnifiedAction[]
): UnifiedTestCase {
    return createTestCase(name, 'mobile', {
        deviceInfo,
        appInfo,
        steps,
        metadata: {
            priority: 'medium',
            tags: ['mobile', appInfo.name],
            riskArea: []
        }
    })
}

/**
 * Create web test case
 */
export function createWebTestCase(
    name: string,
    url: string,
    steps: UnifiedAction[]
): UnifiedTestCase {
    return createTestCase(name, 'web', {
        webInfo: { url },
        steps,
        metadata: {
            priority: 'medium',
            tags: ['web', extractDomain(url)],
            riskArea: []
        }
    })
}

/**
 * Create API test case
 */
export function createApiTestCase(
    name: string,
    baseUrl: string,
    steps: UnifiedAction[]
): UnifiedTestCase {
    return createTestCase(name, 'api', {
        apiInfo: { baseUrl },
        steps,
        metadata: {
            priority: 'medium',
            tags: ['api'],
            riskArea: []
        }
    })
}

// ============================================
// MIGRATION HELPERS
// ============================================

/**
 * Migrate old test case to unified format
 */
export function migrateOldTestCase(oldTestCase: any): UnifiedTestCase {
    const now = Date.now()

    return {
        id: oldTestCase.id || generateTestCaseId(),
        name: oldTestCase.name,
        description: oldTestCase.description || '',
        type: oldTestCase.type || 'mobile',

        status: oldTestCase.status || 'draft',
        priority: oldTestCase.priority || 'medium',

        metadata: {
            priority: oldTestCase.priority || 'medium',
            tags: oldTestCase.tags || [],
            riskArea: oldTestCase.riskArea ? [oldTestCase.riskArea] : [],
            purpose: oldTestCase.purpose,
            expectedResult: oldTestCase.expectedResult
        },

        steps: oldTestCase.steps || [],

        deviceInfo: oldTestCase.deviceInfo,
        appInfo: oldTestCase.appInfo,
        webInfo: oldTestCase.webInfo,
        apiInfo: oldTestCase.apiInfo,

        executionHistory: [],
        lastRun: oldTestCase.lastRun,

        stats: {
            totalRuns: 0,
            passCount: 0,
            failCount: 0,
            flakyCount: 0,
            passRate: 0,
            averageDuration: 0
        },

        lifecycle: {
            created: { timestamp: oldTestCase.createdAt || now },
            lastModified: { timestamp: oldTestCase.updatedAt || now },
            transitions: []
        },

        createdAt: oldTestCase.createdAt || now,
        updatedAt: oldTestCase.updatedAt || now,

        flowId: oldTestCase.flowId
    }
}

// ============================================
// STATUS MANAGEMENT
// ============================================

/**
 * Change test case status
 */
export function changeStatus(
    testCase: UnifiedTestCase, new Status: TestCaseStatus,
    reason?: string,
    by?: string
): UnifiedTestCase {
    const now = Date.now()

    const updated: UnifiedTestCase = {
        ...testCase,
        status: newStatus,
        updatedAt: now,
        lifecycle: {
            ...testCase.lifecycle,
            lastModified: { timestamp: now, by, reason },
            transitions: [
                ...testCase.lifecycle.transitions,
                {
                    from: testCase.status,
                    to: newStatus,
                    timestamp: now,
                    reason
                }
            ]
        }
    }

    // Update lifecycle events
    if (newStatus === 'blocked') {
        updated.lifecycle.blocked = { timestamp: now, by, reason }
    } else if (newStatus === 'archived') {
        updated.lifecycle.archived = { timestamp: now, by, reason }
    }

    return updated
}

// ============================================
// EXECUTION TRACKING
// ============================================

/**
 * Add execution result to test case
 */
export function addExecutionResult(
    testCase: UnifiedTestCase,
    result: ExecutionResult
): UnifiedTestCase {
    const history = [...testCase.executionHistory, result]

    // Calculate stats
    const totalRuns = history.length
    const passCount = history.filter(r => r.result === 'pass').length
    const failCount = history.filter(r => r.result === 'fail').length
    const flakyCount = history.filter(r => r.result === 'flaky').length
    const passRate = totalRuns > 0 ? (passCount / totalRuns) * 100 : 0
    const averageDuration = history.reduce((sum, r) => sum + r.duration, 0) / totalRuns

    return {
        ...testCase,
        status: 'executed',
        executionHistory: history,
        lastRun: result,
        stats: {
            totalRuns,
            passCount,
            failCount,
            flakyCount,
            passRate,
            averageDuration
        },
        lifecycle: {
            ...testCase.lifecycle,
            lastExecuted: {
                timestamp: result.timestamp,
                result: result.result
            }
        },
        updatedAt: Date.now()
    }
}

// ============================================
// UTILITIES
// ============================================

function generateTestCaseId(): string {
    return `tc_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
}

function extractDomain(url: string): string {
    try {
        return new URL(url).hostname
    } catch {
        return 'unknown'
    }
}

/**
 * Check if test case is executable
 */
export function isExecutable(testCase: UnifiedTestCase): boolean {
    return (
        testCase.status !== 'archived' &&
        testCase.status !== 'blocked' &&
        testCase.steps.length > 0
    )
}

/**
 * Get test case display status
 */
export function getDisplayStatus(testCase: UnifiedTestCase): string {
    const statusEmojis = {
        draft: '📝',
        ready: '✅',
        executed: '▶️',
        blocked: '🚫',
        archived: '📦'
    }
    return `${statusEmojis[testCase.status]} ${testCase.status.toUpperCase()}`
}

/**
 * Calculate pass rate
 */
export function calculatePassRate(history: ExecutionResult[]): number {
    if (history.length === 0) return 0
    const passed = history.filter(r => r.result === 'pass').length
    return Math.round((passed / history.length) * 100)
}

// ============================================
// EXPORTS
// ============================================

export default UnifiedTestCase
