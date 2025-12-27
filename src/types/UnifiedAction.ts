/**
 * UNIFIED ACTION SCHEMA
 * Phase 1: Foundation & Stability
 * 
 * This is the core type system for ALL actions across mobile, web, and API testing.
 * Every action in GravityQA should conform to this unified schema.
 */

// ============================================
// CORE ACTION TYPES
// ============================================

export type Platform = 'mobile' | 'web' | 'api'

export type ActionType =
    // Common actions
    | 'tap'
    | 'swipe'
    | 'type'
    | 'wait'
    | 'assertion'
    // Mobile-specific
    | 'tap_element'
    | 'long_press'
    // Web-specific
    | 'click'
    | 'scroll'
    | 'drag'
    // API-specific
    | 'api_request'

export type WaitType = 'fixed' | 'element_visible' | 'element_clickable' | 'element_exists'

export type ResultType = 'pass' | 'fail' | 'flaky' | 'blocked' | 'skipped'

// ============================================
// MOBILE ELEMENT
// ============================================

export interface MobileElement {
    class?: string
    resource_id?: string
    text?: string
    content_desc?: string
    package?: string
    bounds?: {
        x: number
        y: number
        width: number
        height: number
    }
}

// ============================================
// WEB ELEMENT
// ============================================

export interface WebElement {
    tagName: string
    id?: string
    className?: string
    textContent?: string
    selector: string
    selectorType: 'css' | 'xpath' | 'id' | 'class'
}

// ============================================
// UNIFIED ACTION INTERFACE
// ============================================

export interface UnifiedAction {
    // Core identification
    id: string
    type: ActionType
    platform: Platform

    // Metadata
    timestamp: number
    description: string
    metadata: Record<string, any>

    // Control fields
    enabled: boolean
    retryCount: number
    waitBefore: number  // seconds
    waitAfter: number   // seconds

    // Mobile-specific fields
    coordinates?: {
        x: number
        y: number
    }
    element?: MobileElement

    // Swipe-specific
    swipe?: {
        start_x: number
        start_y: number
        end_x: number
        end_y: number
        duration: number
    }

    // Web-specific fields
    webElement?: WebElement
    selector?: string
    selectorType?: 'css' | 'xpath' | 'id'

    // Type/input fields
    text?: string

    // Wait fields
    waitType?: WaitType
    waitDuration?: number
    waitElement?: string

    // API-specific fields
    apiRequest?: {
        endpoint: string
        method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH'
        headers?: Record<string, string>
        body?: any
        expectedStatus?: number
        expectedSchema?: any
    }

    // Assertion fields
    assertion?: {
        type: 'element_exists' | 'element_visible' | 'text_equals' | 'status_code'
        expected: any
        actual?: any
    }

    // Execution result (populated after execution)
    result?: {
        status: ResultType
        error?: string
        retriesUsed: number
        duration: number
        screenshot?: string
    }
}

// ============================================
// FACTORY FUNCTIONS
// ============================================

/**
 * Create a mobile tap action
 */
export function createMobileTapAction(
    x: number,
    y: number,
    description?: string
): UnifiedAction {
    return {
        id: generateId(),
        type: 'tap',
        platform: 'mobile',
        timestamp: Date.now(),
        description: description || `Tap at (${x}, ${y})`,
        metadata: {},
        enabled: true,
        retryCount: 0,
        waitBefore: 0,
        waitAfter: 0,
        coordinates: { x, y }
    }
}

/**
 * Create a mobile element tap action
 */
export function createMobileElementTapAction(
    element: MobileElement,
    description?: string
): UnifiedAction {
    return {
        id: generateId(),
        type: 'tap_element',
        platform: 'mobile',
        timestamp: Date.now(),
        description: description || `Tap ${element.class || 'element'}`,
        metadata: {},
        enabled: true,
        retryCount: 0,
        waitBefore: 0,
        waitAfter: 0,
        element
    }
}

/**
 * Create a swipe action
 */
export function createSwipeAction(
    start_x: number,
    start_y: number,
    end_x: number,
    end_y: number,
    duration: number = 800
): UnifiedAction {
    return {
        id: generateId(),
        type: 'swipe',
        platform: 'mobile',
        timestamp: Date.now(),
        description: `Swipe from (${start_x},${start_y}) to (${end_x},${end_y})`,
        metadata: {},
        enabled: true,
        retryCount: 0,
        waitBefore: 0,
        waitAfter: 0,
        swipe: { start_x, start_y, end_x, end_y, duration }
    }
}

/**
 * Create a type text action
 */
export function createTypeAction(
    text: string,
    platform: Platform = 'mobile'
): UnifiedAction {
    return {
        id: generateId(),
        type: 'type',
        platform,
        timestamp: Date.now(),
        description: `Type "${text}"`,
        metadata: {},
        enabled: true,
        retryCount: 0,
        waitBefore: 0,
        waitAfter: 0,
        text
    }
}

/**
 * Create a wait action
 */
export function createWaitAction(
    waitType: WaitType,
    duration: number,
    element?: string
): UnifiedAction {
    return {
        id: generateId(),
        type: 'wait',
        platform: 'mobile',  // Platform-agnostic
        timestamp: Date.now(),
        description: waitType === 'fixed'
            ? `Wait ${duration}s`
            : `Wait for ${element} (${waitType})`,
        metadata: {},
        enabled: true,
        retryCount: 0,
        waitBefore: 0,
        waitAfter: 0,
        waitType,
        waitDuration: duration,
        waitElement: element
    }
}

/**
 * Create a web click action
 */
export function createWebClickAction(
    webElement: WebElement,
    description?: string
): UnifiedAction {
    return {
        id: generateId(),
        type: 'click',
        platform: 'web',
        timestamp: Date.now(),
        description: description || `Click ${webElement.tagName}`,
        metadata: {},
        enabled: true,
        retryCount: 0,
        waitBefore: 0,
        waitAfter: 0,
        webElement,
        selector: webElement.selector,
        selectorType: webElement.selectorType
    }
}

/**
 * Create an API request action
 */
export function createApiRequestAction(
    method: 'GET' | 'POST' | 'PUT' | 'DELETE',
    endpoint: string,
    options?: {
        headers?: Record<string, string>
        body?: any
        expectedStatus?: number
    }
): UnifiedAction {
    return {
        id: generateId(),
        type: 'api_request',
        platform: 'api',
        timestamp: Date.now(),
        description: `${method} ${endpoint}`,
        metadata: {},
        enabled: true,
        retryCount: 0,
        waitBefore: 0,
        waitAfter: 0,
        apiRequest: {
            endpoint,
            method,
            headers: options?.headers,
            body: options?.body,
            expectedStatus: options?.expectedStatus
        }
    }
}

// ============================================
// MIGRATION HELPERS
// ============================================

/**
 * Migrate old mobile action to unified action
 */
export function migrateOldMobileAction(oldAction: any): UnifiedAction {
    const baseAction: Partial<UnifiedAction> = {
        id: oldAction.id || generateId(),
        platform: 'mobile',
        timestamp: oldAction.timestamp || Date.now(),
        description: oldAction.description || '',
        metadata: oldAction.metadata || {},
        enabled: oldAction.enabled !== false,
        retryCount: oldAction.retryCount || 0,
        waitBefore: oldAction.waitBefore || 0,
        waitAfter: oldAction.waitAfter || 0
    }

    // Determine action type
    if (oldAction.action === 'tap') {
        return {
            ...baseAction,
            type: oldAction.element ? 'tap_element' : 'tap',
            coordinates: oldAction.x !== undefined ? { x: oldAction.x, y: oldAction.y } : undefined,
            element: oldAction.element
        } as UnifiedAction
    } else if (oldAction.action === 'swipe') {
        return {
            ...baseAction,
            type: 'swipe',
            swipe: {
                start_x: oldAction.start_x,
                start_y: oldAction.start_y,
                end_x: oldAction.end_x,
                end_y: oldAction.end_y,
                duration: oldAction.duration || 800
            }
        } as UnifiedAction
    } else if (oldAction.action === 'type') {
        return {
            ...baseAction,
            type: 'type',
            text: oldAction.text
        } as UnifiedAction
    } else if (oldAction.action === 'wait') {
        return {
            ...baseAction,
            type: 'wait',
            waitType: oldAction.waitType || 'fixed',
            waitDuration: oldAction.duration,
            waitElement: oldAction.element
        } as UnifiedAction
    }

    // Default fallback
    return {
        ...baseAction,
        type: 'tap'
    } as UnifiedAction
}

/**
 * Migrate array of old actions
 */
export function migrateOldActions(oldActions: any[]): UnifiedAction[] {
    return oldActions.map(migrateOldMobileAction)
}

// ============================================
// VALIDATION
// ============================================

/**
 * Validate unified action
 */
export function validateAction(action: UnifiedAction): { valid: boolean, errors: string[] } {
    const errors: string[] = []

    // Required fields
    if (!action.id) errors.push('Missing id')
    if (!action.type) errors.push('Missing type')
    if (!action.platform) errors.push('Missing platform')
    if (!action.description) errors.push('Missing description')

    // Platform-specific validation
    if (action.platform === 'mobile') {
        if (action.type === 'tap' && !action.coordinates) {
            errors.push('Mobile tap requires coordinates')
        }
        if (action.type === 'swipe' && !action.swipe) {
            errors.push('Mobile swipe requires swipe data')
        }
    }

    if (action.platform === 'web') {
        if ((action.type === 'click' || action.type === 'type') && !action.selector) {
            errors.push('Web action requires selector')
        }
    }

    if (action.platform === 'api') {
        if (action.type === 'api_request' && !action.apiRequest) {
            errors.push('API action requires request data')
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

function generateId(): string {
    return `action_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
}

/**
 * Clone action with modifications
 */
export function cloneAction(action: UnifiedAction, modifications?: Partial<UnifiedAction>): UnifiedAction {
    return {
        ...action,
        ...modifications,
        id: generateId(), // Always generate new ID for clone
        timestamp: Date.now()
    }
}

/**
 * Check if action is executable
 */
export function isActionExecutable(action: UnifiedAction): boolean {
    return action.enabled && validateAction(action).valid
}

/**
 * Get action display name
 */
export function getActionDisplayName(action: UnifiedAction): string {
    const icons = {
        mobile: '📱',
        web: '🌐',
        api: '⚡'
    }
    return `${icons[action.platform]} ${action.description}`
}

// ============================================
// EXPORTS
// ============================================

export default UnifiedAction
