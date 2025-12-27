import { useState } from 'react'
import type { AuthConfig } from '../components/api/swagger/AuthPanel'
import type { Environment } from '../components/api/swagger/EnvironmentSelector'
import type { Collection } from '../components/api/swagger/CollectionTree'
import type { HistoryEntry } from '../components/api/swagger/ExecutionHistory'
import type { Scripts } from '../components/api/swagger/ScriptEditor'

// Define ApiTest type locally since it's in ApiTesting.tsx
export interface ApiTest {
    id: string
    name: string
    method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH'
    url: string
    headers: Record<string, string>
    queryParams: Record<string, string>
    body: string
    validations: any[]
}

/**
 * Custom hook for persisting state to localStorage
 * Automatically saves and loads data
 */
export function useLocalStorage<T>(key: string, initialValue: T): [T, (value: T | ((val: T) => T)) => void] {
    // Get from localStorage or use initial value
    const [storedValue, setStoredValue] = useState<T>(() => {
        try {
            const item = window.localStorage.getItem(key)
            return item ? JSON.parse(item) : initialValue
        } catch (error) {
            console.error(`Error loading ${key} from localStorage:`, error)
            return initialValue
        }
    })

    // Save to localStorage whenever value changes
    const setValue = (value: T | ((val: T) => T)) => {
        try {
            const valueToStore = value instanceof Function ? value(storedValue) : value
            setStoredValue(valueToStore)
            window.localStorage.setItem(key, JSON.stringify(valueToStore))
        } catch (error) {
            console.error(`Error saving ${key} to localStorage:`, error)
        }
    }

    return [storedValue, setValue]
}

/**
 * Hook specifically for API Testing data persistence
 */
export function useApiTestingPersistence() {
    const [savedTests, setSavedTests] = useLocalStorage<ApiTest[]>('api_saved_tests', [])
    const [environments, setEnvironments] = useLocalStorage<Environment[]>('api_environments', [])
    const [collections, setCollections] = useLocalStorage<Collection[]>('api_collections', [])
    const [history, setHistory] = useLocalStorage<HistoryEntry[]>('api_history', [])
    const [auth, setAuth] = useLocalStorage<AuthConfig>('api_auth', { type: 'none' } as AuthConfig)
    const [scripts, setScripts] = useLocalStorage<Scripts>('api_scripts', { preRequest: '', postResponse: '' })
    const [currentEnvId, setCurrentEnvId] = useLocalStorage<string | null>('api_current_env', null)

    // Clear all data
    const clearAll = () => {
        localStorage.removeItem('api_saved_tests')
        localStorage.removeItem('api_environments')
        localStorage.removeItem('api_collections')
        localStorage.removeItem('api_history')
        localStorage.removeItem('api_auth')
        localStorage.removeItem('api_scripts')
        localStorage.removeItem('api_current_env')
        window.location.reload()
    }

    // Export all data
    const exportAll = () => {
        return {
            savedTests,
            environments,
            collections,
            history,
            auth,
            scripts,
            currentEnvId,
            exportedAt: new Date().toISOString(),
            version: '1.0'
        }
    }

    // Import all data
    const importAll = (data: any) => {
        if (data.savedTests) setSavedTests(data.savedTests)
        if (data.environments) setEnvironments(data.environments)
        if (data.collections) setCollections(data.collections)
        if (data.history) setHistory(data.history)
        if (data.auth) setAuth(data.auth)
        if (data.scripts) setScripts(data.scripts)
        if (data.currentEnvId) setCurrentEnvId(data.currentEnvId)
    }

    return {
        savedTests,
        setSavedTests,
        environments,
        setEnvironments,
        collections,
        setCollections,
        history,
        setHistory,
        auth,
        setAuth,
        scripts,
        setScripts,
        currentEnvId,
        setCurrentEnvId,
        clearAll,
        exportAll,
        importAll
    }
}

/**
 * Hook for theme persistence
 */
export function useTheme() {
    const [theme, setTheme] = useLocalStorage<'dark' | 'light'>('app_theme', 'dark')

    const toggleTheme = () => {
        setTheme(prev => prev === 'dark' ? 'light' : 'dark')
    }

    return { theme, setTheme, toggleTheme }
}
