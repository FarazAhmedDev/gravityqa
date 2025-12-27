/**
 * Test Runner with Retry Logic
 * Executes actions with configurable retry and failure capture
 */

import axios from 'axios'

interface RecordedAction {
    step: number
    action: string
    x?: number
    y?: number
    x2?: number
    y2?: number
    duration?: number
    element?: any
    description: string
    timestamp: number
    enabled?: boolean
    text?: string
    clearBeforeType?: boolean
    pressEnter?: boolean
    waitType?: 'visible' | 'clickable'
    timeoutSec?: number
    assertType?: 'visible' | 'text'
    expectedText?: string
    retryCount?: number
    retryDelayMs?: number
}

export const executeAction = async (action: RecordedAction, deviceId: string): Promise<any> => {
    console.log(`[Execute] Running action: ${action.action}`)

    try {
        switch (action.action) {
            case 'type_text':
                const typeRes = await axios.post('http://localhost:8000/api/actions/type-text', {
                    device_id: deviceId,
                    element: action.element,
                    text: action.text,
                    clearBeforeType: action.clearBeforeType,
                    pressEnter: action.pressEnter
                })
                return typeRes.data

            case 'wait_visible':
            case 'wait_clickable':
                const waitRes = await axios.post('http://localhost:8000/api/actions/wait-for-element', {
                    device_id: deviceId,
                    element: action.element,
                    waitType: action.action === 'wait_visible' ? 'visible' : 'clickable',
                    timeoutSec: action.timeoutSec || 10
                })

                if (!waitRes.data.success) {
                    throw new Error(waitRes.data.error)
                }
                return waitRes.data

            case 'assert_visible':
            case 'assert_text':
                const assertRes = await axios.post('http://localhost:8000/api/actions/assert-element', {
                    device_id: deviceId,
                    element: action.element,
                    assertType: action.action === 'assert_visible' ? 'visible' : 'text',
                    expectedText: action.expectedText,
                    timeoutSec: action.timeoutSec || 10
                })

                if (!assertRes.data.success || assertRes.data.assertion === 'failed') {
                    throw new Error(assertRes.data.error || 'Assertion failed')
                }
                return assertRes.data

            case 'tap':
            case 'inspector_tap':
                const tapRes = await axios.post('http://localhost:8000/api/tap', {
                    device_id: deviceId,
                    x: action.x,
                    y: action.y
                })
                return tapRes.data

            case 'swipe':
                const swipeRes = await axios.post('http://localhost:8000/api/swipe', {
                    device_id: deviceId,
                    x1: action.x,
                    y1: action.y,
                    x2: action.x2,
                    y2: action.y2,
                    duration: action.duration
                })
                return swipeRes.data

            case 'wait':
                await new Promise(resolve => setTimeout(resolve, action.duration || 1000))
                return { success: true }

            default:
                throw new Error(`Unknown action type: ${action.action}`)
        }
    } catch (error: any) {
        console.error(`[Execute] ❌ Failed:`, error)
        throw error
    }
}

export const executeActionWithRetry = async (
    action: RecordedAction,
    actionIndex: number,
    deviceId: string
): Promise<any> => {
    const maxAttempts = (action.retryCount || 0) + 1
    const retryDelay = action.retryDelayMs || 500

    const executionLogs: string[] = []

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
        try {
            const timestamp = new Date().toLocaleTimeString()
            console.log(`[Runner] Step ${action.step} - Attempt ${attempt}/${maxAttempts}`)
            executionLogs.push(`[${timestamp}] Attempt ${attempt}/${maxAttempts} - ${action.description}`)

            const result = await executeAction(action, deviceId)

            executionLogs.push(`[${timestamp}] ✓ Success on attempt ${attempt}`)

            return {
                success: true,
                attempt,
                logs: executionLogs,
                stepIndex: actionIndex
            }

        } catch (error: any) {
            const timestamp = new Date().toLocaleTimeString()
            const errorMsg = error.response?.data?.detail || error.message

            console.error(`[Runner] Attempt ${attempt} failed:`, errorMsg)
            executionLogs.push(`[${timestamp}] ✗ Attempt ${attempt} failed: ${errorMsg}`)

            if (attempt < maxAttempts) {
                console.log(`[Runner] Retrying in ${retryDelay}ms...`)
                executionLogs.push(`[${timestamp}] Retrying in ${retryDelay}ms...`)
                await new Promise(resolve => setTimeout(resolve, retryDelay))
            } else {
                // Final attempt failed - capture screenshot
                try {
                    const screenshot = await axios.get(`http://localhost:8000/api/actions/capture-failure-screenshot/${deviceId}`)

                    return {
                        success: false,
                        attempt,
                        error: errorMsg,
                        logs: executionLogs,
                        stepIndex: actionIndex,
                        failedStep: action,
                        screenshot: screenshot.data.screenshot
                    }
                } catch (screenshotError) {
                    return {
                        success: false,
                        attempt,
                        error: errorMsg,
                        logs: executionLogs,
                        stepIndex: actionIndex,
                        failedStep: action
                    }
                }
            }
        }
    }

    return { success: false, error: 'Unknown error' }
}

export const runTestWithReporting = async (
    actions: RecordedAction[],
    deviceId: string,
    onProgress: (progress: number, status: string) => void,
    onComplete: (report: any) => void
) => {
    const allLogs: any[] = []

    try {
        for (let i = 0; i < actions.length; i++) {
            const action = actions[i]

            // Skip disabled actions
            if (action.enabled === false) {
                console.log(`[Runner] ⏭️ Skipping disabled step ${action.step}`)
                allLogs.push({
                    timestamp: new Date().toLocaleTimeString(),
                    message: `⏭️ Skipped step ${action.step} (disabled)`,
                    success: true
                })
                continue
            }

            onProgress(((i + 1) / actions.length) * 100, `📍 Step ${action.step}/${actions.length}: ${action.description}`)

            const result = await executeActionWithRetry(action, i, deviceId)

            // Add logs
            result.logs.forEach((log: string) => {
                allLogs.push({
                    timestamp: new Date().toLocaleTimeString(),
                    message: log,
                    success: result.success
                })
            })

            if (!result.success) {
                // Test failed
                onComplete({
                    status: 'failed',
                    failedStep: result.failedStep,
                    error: result.error,
                    screenshot: result.screenshot,
                    logs: allLogs
                })
                return
            }
        }

        // All steps passed!
        onComplete({
            status: 'passed',
            logs: allLogs
        })

    } catch (error: any) {
        console.error('[Runner] ❌ Fatal error:', error)
        onComplete({
            status: 'failed',
            error: error.message,
            logs: allLogs
        })
    }
}
