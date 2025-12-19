import axios from 'axios'
import type { Project, App, Device, TestRun, TestStep } from '@/types'

const API_BASE_URL = 'http://localhost:8000/api'

const client = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
})

export const api = {
    // Projects
    projects: {
        getAll: () => client.get<Project[]>('/projects'),
        getById: (id: number) => client.get<Project>(`/projects/${id}`),
        create: (data: { name: string; description?: string }) =>
            client.post<Project>('/projects', data),
        delete: (id: number) => client.delete(`/projects/${id}`),
    },

    // Apps
    apps: {
        create: (projectId: number, data: FormData) =>
            client.post<App>(`/projects/${projectId}/apps`, data),
    },

    // Devices
    devices: {
        getAll: () => client.get<Device[]>('/devices'),
        install: (deviceId: string, appPath: string) =>
            client.post(`/devices/${deviceId}/install`, { app_path: appPath }),
        launchApp: (deviceId: string, packageName: string) =>
            client.post(`/devices/${deviceId}/launch-app`, { package_name: packageName }),
        stopApp: (deviceId: string, packageName: string) =>
            client.post(`/devices/${deviceId}/stop-app`, { package_name: packageName }),
    },

    // Tests
    tests: {
        startAIExploration: (config: {
            project_id: number
            device_id: string
            app_id?: number
            test_type?: string
            max_steps?: number
        }) => client.post('/tests/start-ai-exploration', config),

        getRun: (runId: number) =>
            client.get<TestRun & { steps: TestStep[] }>(`/tests/runs/${runId}`),

        stopRun: (runId: number) =>
            client.post(`/tests/runs/${runId}/stop`),
    },

    // AI
    ai: {
        analyzeScreen: (data: {
            screenshot: string
            page_source: string
            platform: string
        }) => client.post('/ai/analyze-screen', data),

        generateCode: (data: {
            test_steps: any[]
            language: string
            framework: string
        }) => client.post('/ai/generate-test-code', data),

        getSettings: () => client.get('/ai/settings'),

        updateSettings: (settings: any) => client.post('/ai/settings', settings),
    },
}

export default api
