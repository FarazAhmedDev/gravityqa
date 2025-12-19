export interface Project {
    id: number
    name: string
    description?: string
    created_at: string
    updated_at: string
}

export interface App {
    id: number
    project_id: number
    name: string
    package_name: string
    platform: 'android' | 'ios'
    version?: string
    file_path: string
    created_at: string
}

export interface Device {
    id: number
    device_id: string
    name: string
    platform: 'android' | 'ios'
    platform_version?: string
    device_type: 'emulator' | 'simulator' | 'real'
    manufacturer?: string
    model?: string
    is_connected: boolean
}

export interface TestRun {
    id: number
    project_id: number
    test_suite_id?: number
    name: string
    status: 'pending' | 'running' | 'completed' | 'failed' | 'stopped'
    mode: 'autonomous' | 'manual' | 'assisted'
    test_type: 'mobile' | 'web' | 'api'
    total_steps: number
    passed_steps: number
    failed_steps: number
    device_id?: string
    app_id?: number
    started_at?: string
    ended_at?: string
    report_path?: string
}

export interface TestStep {
    id: number
    test_run_id: number
    step_number: number
    action_type: 'click' | 'input' | 'swipe' | 'back' | 'wait'
    description: string
    element_xpath?: string
    input_value?: string
    screenshot_path?: string
    status: 'pending' | 'success' | 'failed'
    error_message?: string
    duration_ms?: number
    timestamp: string
}

export interface AIScreenAnalysis {
    screen_type: string
    purpose: string
    elements: Array<{
        type: string
        label: string
        xpath: string
        action_result: string
    }>
    inputs: Array<{
        purpose: string
        xpath: string
    }>
    state: {
        logged_in: boolean
        errors: string[]
        loading: boolean
    }
    suggested_actions: Array<{
        action: string
        priority: 'high' | 'medium' | 'low'
        rationale: string
    }>
    assertions: string[]
}

export interface AIAction {
    action_type: 'click' | 'input' | 'swipe' | 'back' | 'wait'
    element: {
        xpath: string
        description: string
    }
    input_value?: string
    description: string
    rationale: string
}

export interface WebSocketMessage {
    event: 'test_step' | 'test_completed' | 'device_connected' | 'device_disconnected'
    data: any
}
