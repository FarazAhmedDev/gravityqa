import { create } from 'zustand'
import type { Project } from '@/types'
import api from '@/services/api-client'

interface ProjectState {
    projects: Project[]
    currentProject: Project | null
    isLoading: boolean
    error: string | null

    // Actions
    fetchProjects: () => Promise<void>
    createProject: (data: { name: string; description?: string }) => Promise<void>
    setCurrentProject: (project: Project | null) => void
    deleteProject: (id: number) => Promise<void>
}

export const useProjectStore = create<ProjectState>((set, get) => ({
    projects: [],
    currentProject: null,
    isLoading: false,
    error: null,

    fetchProjects: async () => {
        set({ isLoading: true, error: null })
        try {
            const response = await api.projects.getAll()
            set({ projects: response.data, isLoading: false })
        } catch (error: any) {
            set({ error: error.message, isLoading: false })
        }
    },

    createProject: async (data) => {
        try {
            const response = await api.projects.create(data)
            set(state => ({
                projects: [...state.projects, response.data],
                currentProject: response.data
            }))
        } catch (error: any) {
            set({ error: error.message })
            throw error
        }
    },

    setCurrentProject: (project) => {
        set({ currentProject: project })
    },

    deleteProject: async (id) => {
        try {
            await api.projects.delete(id)
            set(state => ({
                projects: state.projects.filter(p => p.id !== id),
                currentProject: state.currentProject?.id === id ? null : state.currentProject
            }))
        } catch (error: any) {
            set({ error: error.message })
            throw error
        }
    },
}))
