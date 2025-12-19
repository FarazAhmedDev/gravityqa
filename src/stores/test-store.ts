import { create } from 'zustand'
import type { TestRun, TestStep } from '@/types'
import api from '@/services/api-client'
import wsClient from '@/services/websocket-client'

interface TestState {
    currentTestRun: TestRun | null
    testSteps: TestStep[]
    isRunning: boolean
    error: string | null

    // Actions
    startAIExploration: (config: {
        project_id: number
        device_id: string
        app_id?: number
        max_steps?: number
    }) => Promise<void>
    stopTest: () => Promise<void>
    subscribeToTestRun: (testRunId: number) => void
    unsubscribeFromTestRun: () => void
    addTestStep: (step: TestStep) => void
    updateTestRun: (testRun: TestRun) => void
}

export const useTestStore = create<TestState>((set, get) => ({
    currentTestRun: null,
    testSteps: [],
    isRunning: false,
    error: null,

    startAIExploration: async (config) => {
        set({ isRunning: true, error: null, testSteps: [] })
        try {
            const response = await api.tests.startAIExploration(config)
            const { test_run_id } = response.data

            // Subscribe to WebSocket updates
            get().subscribeToTestRun(test_run_id)

            // Fetch initial test run data
            const runResponse = await api.tests.getRun(test_run_id)
            set({
                currentTestRun: runResponse.data,
                testSteps: runResponse.data.steps || []
            })
        } catch (error: any) {
            set({ error: error.message, isRunning: false })
            throw error
        }
    },

    stopTest: async () => {
        const testRun = get().currentTestRun
        if (!testRun) return

        try {
            await api.tests.stopRun(testRun.id)
            set({ isRunning: false })
            get().unsubscribeFromTestRun()
        } catch (error: any) {
            set({ error: error.message })
            throw error
        }
    },

    subscribeToTestRun: (testRunId) => {
        wsClient.connect()
        wsClient.subscribe(`test-run-${testRunId}`)

        wsClient.on('test_step', (data) => {
            get().addTestStep(data)
        })

        wsClient.on('test_completed', (data) => {
            set({ isRunning: false })
            if (data.test_code) {
                console.log('Generated test code:', data.test_code)
            }
        })
    },

    unsubscribeFromTestRun: () => {
        const testRun = get().currentTestRun
        if (testRun) {
            wsClient.unsubscribe(`test-run-${testRun.id}`)
        }
    },

    addTestStep: (step) => {
        set(state => ({
            testSteps: [...state.testSteps, step]
        }))
    },

    updateTestRun: (testRun) => {
        set({ currentTestRun: testRun })
    },
}))
