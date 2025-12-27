/**
 * Bulk test execution utilities
 */

export interface BulkTestResult {
    testId: string
    testName: string
    status: 'success' | 'failed' | 'skipped'
    statusCode: number
    responseTime: number
    error?: string
    timestamp: number
}

export interface BulkExecutionOptions {
    parallel?: boolean
    maxConcurrent?: number
    stopOnError?: boolean
    delay?: number  // Delay between requests in ms
}

/**
 * Execute multiple tests in sequence or parallel
 */
export async function bulkExecuteTests(
    tests: any[],
    executeFunction: (test: any) => Promise<any>,
    options: BulkExecutionOptions = {},
    onProgress?: (current: number, total: number, result: BulkTestResult) => void
): Promise<BulkTestResult[]> {
    const {
        parallel = false,
        maxConcurrent = 5,
        stopOnError = false,
        delay = 0
    } = options

    const results: BulkTestResult[] = []

    if (parallel) {
        // Parallel execution with concurrency limit
        const chunks = chunkArray(tests, maxConcurrent)

        for (const chunk of chunks) {
            const chunkPromises = chunk.map(async (test, index) => {
                try {
                    const startTime = Date.now()
                    const response = await executeFunction(test)
                    const responseTime = Date.now() - startTime

                    const result: BulkTestResult = {
                        testId: test.id,
                        testName: test.name,
                        status: response.status >= 200 && response.status < 300 ? 'success' : 'failed',
                        statusCode: response.status,
                        responseTime,
                        timestamp: Date.now()
                    }

                    results.push(result)
                    onProgress?.(results.length, tests.length, result)

                    if (delay > 0 && index < chunk.length - 1) {
                        await sleep(delay)
                    }

                    return result
                } catch (error: any) {
                    const result: BulkTestResult = {
                        testId: test.id,
                        testName: test.name,
                        status: 'failed',
                        statusCode: 0,
                        responseTime: 0,
                        error: error.message,
                        timestamp: Date.now()
                    }

                    results.push(result)
                    onProgress?.(results.length, tests.length, result)

                    if (stopOnError) {
                        throw error
                    }

                    return result
                }
            })

            await Promise.all(chunkPromises)

            if (stopOnError && results.some(r => r.status === 'failed')) {
                break
            }
        }
    } else {
        // Sequential execution
        for (let i = 0; i < tests.length; i++) {
            const test = tests[i]

            try {
                const startTime = Date.now()
                const response = await executeFunction(test)
                const responseTime = Date.now() - startTime

                const result: BulkTestResult = {
                    testId: test.id,
                    testName: test.name,
                    status: response.status >= 200 && response.status < 300 ? 'success' : 'failed',
                    statusCode: response.status,
                    responseTime,
                    timestamp: Date.now()
                }

                results.push(result)
                onProgress?.(i + 1, tests.length, result)

                if (delay > 0 && i < tests.length - 1) {
                    await sleep(delay)
                }
            } catch (error: any) {
                const result: BulkTestResult = {
                    testId: test.id,
                    testName: test.name,
                    status: 'failed',
                    statusCode: 0,
                    responseTime: 0,
                    error: error.message,
                    timestamp: Date.now()
                }

                results.push(result)
                onProgress?.(i + 1, tests.length, result)

                if (stopOnError) {
                    break
                }
            }
        }
    }

    return results
}

/**
 * Generate summary report from bulk execution results
 */
export function generateBulkReport(results: BulkTestResult[]) {
    const total = results.length
    const successful = results.filter(r => r.status === 'success').length
    const failed = results.filter(r => r.status === 'failed').length
    const avgResponseTime = results.reduce((sum, r) => sum + r.responseTime, 0) / total

    const statusCodeDistribution = results.reduce((acc, r) => {
        acc[r.statusCode] = (acc[r.statusCode] || 0) + 1
        return acc
    }, {} as Record<number, number>)

    return {
        total,
        successful,
        failed,
        successRate: (successful / total) * 100,
        avgResponseTime,
        statusCodeDistribution,
        results
    }
}

// Helper functions
function chunkArray<T>(array: T[], size: number): T[][] {
    const chunks: T[][] = []
    for (let i = 0; i < array.length; i += size) {
        chunks.push(array.slice(i, i + size))
    }
    return chunks
}

function sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
}
