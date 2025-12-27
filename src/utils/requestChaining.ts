/**
 * Request chaining and variable extraction utilities
 */

export interface ChainVariable {
    name: string
    path: string  // JSONPath or simple path like "data.id"
    source: 'response' | 'header' | 'cookie'
}

export interface ChainedRequest {
    id: string
    name: string
    dependsOn?: string  // ID of previous request
    extractVariables?: ChainVariable[]
}

/**
 * Extract value from response using path
 */
export function extractValueFromResponse(response: any, path: string, source: 'response' | 'header' | 'cookie' = 'response'): any {
    if (source === 'header') {
        return response.headers?.[path]
    }

    if (source === 'cookie') {
        // Parse Set-Cookie header
        const cookieHeader = response.headers?.['set-cookie']
        if (cookieHeader) {
            const cookies = parseCookies(cookieHeader)
            return cookies[path]
        }
        return undefined
    }

    // Response body extraction using dot notation
    return getNestedValue(response.body, path)
}

/**
 * Get nested value from object using dot notation
 * Supports: "data.user.id", "items[0].name", "results.data[2].value"
 */
function getNestedValue(obj: any, path: string): any {
    const keys = path.split(/[.\[\]]+/).filter(Boolean)
    let current = obj

    for (const key of keys) {
        if (current === null || current === undefined) {
            return undefined
        }
        current = current[key]
    }

    return current
}

/**
 * Replace chain variables in string
 * {{variableName}} will be replaced with extracted values
 */
export function replaceChainVariables(text: string, variables: Record<string, any>): string {
    let result = text

    Object.entries(variables).forEach(([key, value]) => {
        const regex = new RegExp(`{{\\s*${key}\\s*}}`, 'g')
        result = result.replace(regex, String(value))
    })

    return result
}

/**
 * Execute chained requests in sequence
 */
export async function executeChainedRequests(
    requests: ChainedRequest[],
    executeFunction: (request: any, variables: Record<string, any>) => Promise<any>,
    onProgress?: (current: number, total: number, variables: Record<string, any>) => void
): Promise<{
    results: any[]
    variables: Record<string, any>
}> {
    const results: any[] = []
    const chainVariables: Record<string, any> = {}

    // Sort requests by dependencies
    const sortedRequests = topologicalSort(requests)

    for (let i = 0; i < sortedRequests.length; i++) {
        const request = sortedRequests[i]

        try {
            // Execute request with current chain variables
            const response = await executeFunction(request, chainVariables)
            results.push(response)

            // Extract variables from response
            if (request.extractVariables && request.extractVariables.length > 0) {
                request.extractVariables.forEach(variable => {
                    const value = extractValueFromResponse(response, variable.path, variable.source)
                    if (value !== undefined) {
                        chainVariables[variable.name] = value
                        console.log(`🔗 Extracted ${variable.name} = ${value}`)
                    }
                })
            }

            onProgress?.(i + 1, sortedRequests.length, chainVariables)
        } catch (error) {
            console.error(`Failed to execute chained request: ${request.name}`, error)
            throw error
        }
    }

    return { results, variables: chainVariables }
}

/**
 * Topological sort for request dependencies
 */
function topologicalSort(requests: ChainedRequest[]): ChainedRequest[] {
    const sorted: ChainedRequest[] = []
    const visited = new Set<string>()
    const visiting = new Set<string>()

    function visit(request: ChainedRequest) {
        if (visited.has(request.id)) return
        if (visiting.has(request.id)) {
            throw new Error('Circular dependency detected in request chain')
        }

        visiting.add(request.id)

        if (request.dependsOn) {
            const dependency = requests.find(r => r.id === request.dependsOn)
            if (dependency) {
                visit(dependency)
            }
        }

        visiting.delete(request.id)
        visited.add(request.id)
        sorted.push(request)
    }

    requests.forEach(request => visit(request))

    return sorted
}

/**
 * Parse cookies from Set-Cookie header
 */
function parseCookies(setCookieHeader: string | string[]): Record<string, string> {
    const cookies: Record<string, string> = {}
    const headers = Array.isArray(setCookieHeader) ? setCookieHeader : [setCookieHeader]

    headers.forEach(header => {
        const [nameValue] = header.split(';')
        const [name, value] = nameValue.split('=')
        if (name && value) {
            cookies[name.trim()] = value.trim()
        }
    })

    return cookies
}

/**
 * Create chain variable suggestions based on response
 */
export function suggestChainVariables(response: any): ChainVariable[] {
    const suggestions: ChainVariable[] = []

    // Scan response body for common patterns
    if (response.body) {
        scanObject(response.body, '', suggestions)
    }

    // Common headers
    if (response.headers) {
        Object.keys(response.headers).forEach(header => {
            if (['authorization', 'x-auth-token', 'x-api-key'].includes(header.toLowerCase())) {
                suggestions.push({
                    name: header.replace(/-/g, '_'),
                    path: header,
                    source: 'header'
                })
            }
        })
    }

    return suggestions.slice(0, 10)  // Limit suggestions
}

function scanObject(obj: any, prefix: string, suggestions: ChainVariable[]) {
    if (typeof obj !== 'object' || obj === null) return

    Object.entries(obj).forEach(([key, value]) => {
        const path = prefix ? `${prefix}.${key}` : key

        // Suggest common patterns
        if (['id', 'token', 'key', 'code', 'username', 'email'].includes(key.toLowerCase())) {
            suggestions.push({
                name: path.replace(/\./g, '_'),
                path,
                source: 'response'
            })
        }

        // Recurse for nested objects (limit depth)
        if (typeof value === 'object' && prefix.split('.').length < 3) {
            scanObject(value, path, suggestions)
        }
    })
}
