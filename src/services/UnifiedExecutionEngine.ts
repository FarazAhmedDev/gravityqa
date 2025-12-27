/**
 * CENTRAL EXECUTION ENGINE
 * Phase 1: Foundation & Stability
 * 
 * Unified execution engine that routes test execution to appropriate platform handlers.
 * Supports mobile (Appium), web (Playwright), and API testing.
 */

import axios from 'axios'
import { UnifiedTestCase, ExecutionResult, TestType } from '../types/UnifiedTestCase'
import { UnifiedAction, ResultType, isActionExecutable } from '../types/UnifiedAction'

// ============================================
// EXECUTION SETTINGS
// ============================================

export interface ExecutionSettings {
    // App preparation (mobile/web)
    restartApp?: boolean
    clearData?: boolean

    // Failure handling
    retryPerStep: number
    failureBehaviour: 'stop' | 'skip' | 'continue'

    // Timeouts
    stepTimeout?: number  // seconds
    totalTimeout?: number  // seconds

    // Screenshots
    captureScreenshots?: boolean
    captureOnlyOnFailure?: boolean

    // Environment
    deviceId?: string
    browser?: string
    environment?: string
}

export const DEFAULT_SETTINGS: ExecutionSettings = {
    restartApp: true,
    clearData: true,
    retryPerStep: 1,
    failureBehaviour: 'stop',
    stepTimeout: 30,
    totalTimeout: 300,
    captureScreenshots: true,
    captureOnlyOnFailure: false
}

// ============================================
// EXECUTION ENGINE CLASS
// ============================================

export class UnifiedExecutionEngine {
    private apiBaseUrl: string

    constructor(apiBaseUrl: string = 'http://localhost:8000') {
        this.apiBaseUrl = apiBaseUrl
    }

    /**
     * Execute a unified test case
     */
    async execute(
        testCase: UnifiedTestCase,
        settings: ExecutionSettings = DEFAULT_SETTINGS
    ): Promise<ExecutionResult> {
        console.log(`[ExecutionEngine] Starting execution of: ${testCase.name}`)
        console.log(`[ExecutionEngine] Type: ${testCase.type}, Steps: ${testCase.steps.length}`)

        const startTime = Date.now()

        try {
            // Route to appropriate executor
            switch (testCase.type) {
                case 'mobile':
                    return await this.executeMobile(testCase, settings)

                case 'web':
                    return await this.executeWeb(testCase, settings)

                case 'api':
                    return await this.executeAPI(testCase, settings)

                case 'hybrid':
                    return await this.executeHybrid(testCase, settings)

                default:
                    throw new Error(`Unsupported test type: ${testCase.type}`)
            }
        } catch (error: any) {
            console.error(`[ExecutionEngine] Execution failed:`, error)

            // Return failed result
            return {
                id: this.generateResultId(),
                timestamp: startTime,
                duration: Date.now() - startTime,
                result: 'fail',
                totalSteps: testCase.steps.length,
                passedSteps: 0,
                failedSteps: testCase.steps.length,
                flakySteps: 0,
                blockedSteps: 0,
                skippedSteps: 0,
                stepResults: [],
                executedOn: {
                    platform: testCase.type as any
                },
                settings
            }
        }
    }

    /**
     * Execute mobile test case
     */
    private async executeMobile(
        testCase: UnifiedTestCase,
        settings: ExecutionSettings
    ): Promise<ExecutionResult> {
        console.log(`[ExecutionEngine] Executing mobile test`)

        if (!testCase.flowId) {
            throw new Error('Mobile test requires flowId')
        }

        if (!testCase.deviceInfo?.id) {
            throw new Error('Mobile test requires device ID')
        }

        const startTime = Date.now()

        try {
            // Call backend playback API
            const response = await axios.post(`${this.apiBaseUrl}/api/playback/start`, {
                flow_id: parseInt(testCase.flowId),
                device_id: testCase.deviceInfo.id,
                settings: {
                    restart_app: settings.restartApp,
                    clear_data: settings.clearData,
                    retry_per_step: settings.retryPerStep,
                    failure_behaviour: settings.failureBehaviour
                }
            })

            const data = response.data

            // Determine overall result
            let overallResult: ResultType = 'pass'
            if (data.failed_steps > 0) {
                overallResult = 'fail'
            } else if (data.flaky_steps > 0) {
                overallResult = 'flaky'
            }

            // Build execution result
            const result: ExecutionResult = {
                id: this.generateResultId(),
                timestamp: startTime,
                duration: Date.now() - startTime,
                result: overallResult,
                totalSteps: data.total_steps || testCase.steps.length,
                passedSteps: data.successful_steps || 0,
                failedSteps: data.failed_steps || 0,
                flakySteps: data.flaky_steps || 0,
                blockedSteps: data.blocked_steps || 0,
                skippedSteps: data.skipped_steps || 0,
                stepResults: data.results || [],
                executedOn: {
                    platform: 'mobile',
                    device: testCase.deviceInfo.name,
                    osVersion: testCase.deviceInfo.osVersion
                },
                settings
            }

            console.log(`[ExecutionEngine] Mobile execution complete:`, result)
            return result

        } catch (error: any) {
            console.error(`[ExecutionEngine] Mobile execution error:`, error)
            throw error
        }
    }

    /**
     * Execute web test case
     */
    private async executeWeb(
        testCase: UnifiedTestCase,
        settings: ExecutionSettings
    ): Promise<ExecutionResult> {
        console.log(`[ExecutionEngine] Executing web test`)

        if (!testCase.webInfo?.url) {
            throw new Error('Web test requires URL')
        }

        const startTime = Date.now()

        try {
            // TODO: Implement when web automation is added in Phase 5
            // For now, return mock result
            console.warn('[ExecutionEngine] Web execution not yet implemented (Phase 5)')

            return {
                id: this.generateResultId(),
                timestamp: startTime,
                duration: Date.now() - startTime,
                result: 'blocked',
                totalSteps: testCase.steps.length,
                passedSteps: 0,
                failedSteps: 0,
                flakySteps: 0,
                blockedSteps: testCase.steps.length,
                skippedSteps: 0,
                stepResults: [],
                executedOn: {
                    platform: 'web',
                    browser: settings.browser || 'chrome'
                },
                settings
            }

        } catch (error: any) {
            console.error(`[ExecutionEngine] Web execution error:`, error)
            throw error
        }
    }

    /**
     * Execute API test case
     */
    private async executeAPI(
        testCase: UnifiedTestCase,
        settings: ExecutionSettings
    ): Promise<ExecutionResult> {
        console.log(`[ExecutionEngine] Executing API test`)

        const startTime = Date.now()
        const stepResults: any[] = []

        let passedSteps = 0
        let failedSteps = 0

        try {
            for (let i = 0; i < testCase.steps.length; i++) {
                const step = testCase.steps[i]

                if (!isActionExecutable(step)) {
                    stepResults.push({
                        step: i + 1,
                        status: 'skipped',
                        duration: 0,
                        retriesUsed: 0
                    })
                    continue
                }

                const stepStartTime = Date.now()

                try {
                    // Execute API request
                    if (step.type === 'api_request' && step.apiRequest) {
                        const response = await axios({
                            method: step.apiRequest.method,
                            url: step.apiRequest.endpoint,
                            headers: step.apiRequest.headers,
                            data: step.apiRequest.body,
                            timeout: (settings.stepTimeout || 30) * 1000
                        })

                        // Validate status code
                        const statusMatch = step.apiRequest.expectedStatus
                            ? response.status === step.apiRequest.expectedStatus
                            : response.status >= 200 && response.status < 300

                        if (statusMatch) {
                            passedSteps++
                            stepResults.push({
                                step: i + 1,
                                status: 'pass',
                                duration: Date.now() - stepStartTime,
                                retriesUsed: 0
                            })
                        } else {
                            failedSteps++
                            stepResults.push({
                                step: i + 1,
                                status: 'fail',
                                error: `Expected status ${step.apiRequest.expectedStatus}, got ${response.status}`,
                                duration: Date.now() - stepStartTime,
                                retriesUsed: 0
                            })
                        }
                    } else {
                        // Skip non-API steps
                        stepResults.push({
                            step: i + 1,
                            status: 'skipped',
                            error: 'Not an API request step',
                            duration: 0,
                            retriesUsed: 0
                        })
                    }
                } catch (error: any) {
                    failedSteps++
                    stepResults.push({
                        step: i + 1,
                        status: 'fail',
                        error: error.message,
                        duration: Date.now() - stepStartTime,
                        retriesUsed: 0
                    })

                    if (settings.failureBehaviour === 'stop') {
                        break
                    }
                }
            }

            const result: ExecutionResult = {
                id: this.generateResultId(),
                timestamp: startTime,
                duration: Date.now() - startTime,
                result: failedSteps === 0 ? 'pass' : 'fail',
                totalSteps: testCase.steps.length,
                passedSteps,
                failedSteps,
                flakySteps: 0,
                blockedSteps: 0,
                skippedSteps: testCase.steps.length - passedSteps - failedSteps,
                stepResults,
                executedOn: {
                    platform: 'api',
                    device: settings.environment || 'default'
                },
                settings
            }

            console.log(`[ExecutionEngine] API execution complete:`, result)
            return result

        } catch (error: any) {
            console.error(`[ExecutionEngine] API execution error:`, error)
            throw error
        }
    }

    /**
     * Execute hybrid test case (mobile + API or web + API)
     */
    private async executeHybrid(
        testCase: UnifiedTestCase,
        settings: ExecutionSettings
    ): Promise<ExecutionResult> {
        console.log(`[ExecutionEngine] Executing hybrid test`)

        // Group steps by platform
        const mobileSteps = testCase.steps.filter(s => s.platform === 'mobile')
        const webSteps = testCase.steps.filter(s => s.platform === 'web')
        const apiSteps = testCase.steps.filter(s => s.platform === 'api')

        // Execute in sequence (can be optimized later)
        // For now, return blocked status
        console.warn('[ExecutionEngine] Hybrid execution not fully implemented yet')

        return {
            id: this.generateResultId(),
            timestamp: Date.now(),
            duration: 0,
            result: 'blocked',
            totalSteps: testCase.steps.length,
            passedSteps: 0,
            failedSteps: 0,
            flakySteps: 0,
            blockedSteps: testCase.steps.length,
            skippedSteps: 0,
            stepResults: [],
            executedOn: {
                platform: 'mobile'  // Primary platform
            },
            settings
        }
    }

    /**
     * Execute multiple test cases (suite)
     */
    async executeSuite(
        testCases: UnifiedTestCase[],
        settings: ExecutionSettings = DEFAULT_SETTINGS
    ): Promise<ExecutionResult[]> {
        console.log(`[ExecutionEngine] Executing test suite: ${testCases.length} tests`)

        const results: ExecutionResult[] = []

        for (const testCase of testCases) {
            try {
                const result = await this.execute(testCase, settings)
                results.push(result)
            } catch (error: any) {
                console.error(`[ExecutionEngine] Suite test failed: ${testCase.name}`, error)

                // Add failed result
                results.push({
                    id: this.generateResultId(),
                    timestamp: Date.now(),
                    duration: 0,
                    result: 'fail',
                    totalSteps: testCase.steps.length,
                    passedSteps: 0,
                    failedSteps: testCase.steps.length,
                    flakySteps: 0,
                    blockedSteps: 0,
                    skippedSteps: 0,
                    stepResults: [],
                    executedOn: {
                        platform: testCase.type as any
                    },
                    settings
                })

                // Stop on first failure if configured
                if (settings.failureBehaviour === 'stop') {
                    break
                }
            }
        }

        console.log(`[ExecutionEngine] Suite execution complete: ${results.length} results`)
        return results
    }

    /**
     * Validate test case before execution
     */
    validateTestCase(testCase: UnifiedTestCase): { valid: boolean, errors: string[] } {
        const errors: string[] = []

        if (!testCase.steps || testCase.steps.length === 0) {
            errors.push('Test case has no steps')
        }

        if (testCase.status === 'archived') {
            errors.push('Cannot execute archived test')
        }

        if (testCase.status === 'blocked') {
            errors.push('Test is blocked')
        }

        // Platform-specific validation
        if (testCase.type === 'mobile') {
            if (!testCase.deviceInfo) {
                errors.push('Mobile test requires device info')
            }
            if (!testCase.appInfo) {
                errors.push('Mobile test requires app info')
            }
        }

        if (testCase.type === 'web') {
            if (!testCase.webInfo?.url) {
                errors.push('Web test requires URL')
            }
        }

        if (testCase.type === 'api') {
            if (!testCase.apiInfo?.baseUrl) {
                errors.push('API test requires base URL')
            }
        }

        return {
            valid: errors.length === 0,
            errors
        }
    }

    // ============================================
    // UTILITIES
    // ============================================

    private generateResultId(): string {
        return `result_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    }
}

// ============================================
// SINGLETON INSTANCE
// ============================================

let engineInstance: UnifiedExecutionEngine | null = null

export function getExecutionEngine(apiBaseUrl?: string): UnifiedExecutionEngine {
    if (!engineInstance) {
        engineInstance = new UnifiedExecutionEngine(apiBaseUrl)
    }
    return engineInstance
}

// ============================================
// CONVENIENCE FUNCTIONS
// ============================================

/**
 * Execute a test case (convenience function)
 */
export async function executeTest(
    testCase: UnifiedTestCase,
    settings?: ExecutionSettings
): Promise<ExecutionResult> {
    const engine = getExecutionEngine()
    return await engine.execute(testCase, settings)
}

/**
 * Execute multiple tests (convenience function)
 */
export async function executeTests(
    testCases: UnifiedTestCase[],
    settings?: ExecutionSettings
): Promise<ExecutionResult[]> {
    const engine = getExecutionEngine()
    return await engine.executeSuite(testCases, settings)
}

// ============================================
// EXPORTS
// ============================================

export default UnifiedExecutionEngine
