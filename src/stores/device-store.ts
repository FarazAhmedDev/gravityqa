import { create } from 'zustand'
import type { Device } from '@/types'
import api from '@/services/api-client'

interface DeviceState {
    devices: Device[]
    selectedDevice: Device | null
    isLoading: boolean
    error: string | null

    // Actions
    fetchDevices: () => Promise<void>
    selectDevice: (device: Device | null) => void
    installApp: (deviceId: string, appPath: string) => Promise<void>
    launchApp: (deviceId: string, packageName: string) => Promise<void>
    stopApp: (deviceId: string, packageName: string) => Promise<void>
}

export const useDeviceStore = create<DeviceState>((set, get) => ({
    devices: [],
    selectedDevice: null,
    isLoading: false,
    error: null,

    fetchDevices: async () => {
        set({ isLoading: true, error: null })
        try {
            const response = await api.devices.getAll()
            set({ devices: response.data, isLoading: false })
        } catch (error: any) {
            set({ error: error.message, isLoading: false })
        }
    },

    selectDevice: (device) => {
        set({ selectedDevice: device })
    },

    installApp: async (deviceId, appPath) => {
        try {
            await api.devices.install(deviceId, appPath)
            // Refresh devices
            await get().fetchDevices()
        } catch (error: any) {
            set({ error: error.message })
            throw error
        }
    },

    launchApp: async (deviceId, packageName) => {
        try {
            await api.devices.launchApp(deviceId, packageName)
        } catch (error: any) {
            set({ error: error.message })
            throw error
        }
    },

    stopApp: async (deviceId, packageName) => {
        try {
            await api.devices.stopApp(deviceId, packageName)
        } catch (error: any) {
            set({ error: error.message })
            throw error
        }
    },
}))
