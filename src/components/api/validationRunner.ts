// Validation execution utility

interface Validation {
    id: string
    type: 'status' | 'time' | 'json_path' | 'header'
    field?: string
    operator: '==' | '!=' | '<' | '>' | '<=' | '>=' | 'contains' | 'exists'
    value: any
}

interface ApiResponse {
    status: number
    statusText: string
    body: any
    headers: Record<string, string>
    time: number
}

interface ValidationResult {
    validation: Validation
    passed: boolean
    message: string
}

export function runValidations(response: ApiResponse, validations: Validation[]): ValidationResult[] {
    return validations.map(validation => {
        try {
            let passed = false
            let message = ''

            switch (validation.type) {
                case 'status':
                    passed = compareValues(response.status, validation.operator, validation.value)
                    message = `Status ${response.status} ${validation.operator} ${validation.value}: ${passed ? 'PASS' : 'FAIL'}`
                    break

                case 'time':
                    passed = compareValues(response.time, validation.operator, validation.value)
                    message = `Time ${response.time}ms ${validation.operator} ${validation.value}ms: ${passed ? 'PASS' : 'FAIL'}`
                    break

                case 'json_path':
                    if (validation.operator === 'exists') {
                        passed = getJsonPath(response.body, validation.field || '') !== undefined
                        message = `Field ${validation.field} exists: ${passed ? 'PASS' : 'FAIL'}`
                    } else {
                        const actualValue = getJsonPath(response.body, validation.field || '')
                        passed = compareValues(actualValue, validation.operator, validation.value)
                        message = `${validation.field} (${actualValue}) ${validation.operator} ${validation.value}: ${passed ? 'PASS' : 'FAIL'}`
                    }
                    break

                case 'header':
                    if (validation.operator === 'exists') {
                        passed = validation.field ? validation.field in response.headers : false
                        message = `Header ${validation.field} exists: ${passed ? 'PASS' : 'FAIL'}`
                    } else {
                        const headerValue = validation.field ? response.headers[validation.field.toLowerCase()] : ''
                        passed = compareValues(headerValue, validation.operator, validation.value)
                        message = `Header ${validation.field} (${headerValue}) ${validation.operator} ${validation.value}: ${passed ? 'PASS' : 'FAIL'}`
                    }
                    break
            }

            return { validation, passed, message }
        } catch (error: any) {
            return {
                validation,
                passed: false,
                message: `Error: ${error.message}`
            }
        }
    })
}

function compareValues(actual: any, operator: string, expected: any): boolean {
    switch (operator) {
        case '==':
            return actual == expected
        case '!=':
            return actual != expected
        case '<':
            return actual < expected
        case '>':
            return actual > expected
        case '<=':
            return actual <= expected
        case '>=':
            return actual >= expected
        case 'contains':
            return String(actual).includes(String(expected))
        default:
            return false
    }
}

function getJsonPath(obj: any, path: string): any {
    if (!path) return undefined
    const parts = path.split('.')
    let current = obj
    for (const part of parts) {
        if (current === null || current === undefined) return undefined
        current = current[part]
    }
    return current
}
