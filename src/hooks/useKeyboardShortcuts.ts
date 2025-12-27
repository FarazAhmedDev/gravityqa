import { useEffect } from 'react'

interface ShortcutConfig {
    key: string
    ctrl?: boolean
    shift?: boolean
    alt?: boolean
    action: () => void
    description: string
}

/**
 * Custom hook for keyboard shortcuts
 */
export function useKeyboardShortcuts(shortcuts: ShortcutConfig[]) {
    useEffect(() => {
        const handleKeyDown = (event: KeyboardEvent) => {
            for (const shortcut of shortcuts) {
                const ctrlMatch = shortcut.ctrl ? event.ctrlKey || event.metaKey : !event.ctrlKey && !event.metaKey
                const shiftMatch = shortcut.shift ? event.shiftKey : !event.shiftKey
                const altMatch = shortcut.alt ? event.altKey : !event.altKey
                const keyMatch = event.key.toLowerCase() === shortcut.key.toLowerCase()

                if (ctrlMatch && shiftMatch && altMatch && keyMatch) {
                    event.preventDefault()
                    shortcut.action()
                    break
                }
            }
        }

        window.addEventListener('keydown', handleKeyDown)
        return () => window.removeEventListener('keydown', handleKeyDown)
    }, [shortcuts])
}

/**
 * Predefined API Testing shortcuts
 */
export function useApiTestingShortcuts(actions: {
    onExecute: () => void
    onSave: () => void
    onNew: () => void
    onImport: () => void
    onExport: () => void
    onClear: () => void
    onToggleTheme: () => void
}) {
    const shortcuts: ShortcutConfig[] = [
        {
            key: 'Enter',
            ctrl: true,
            action: actions.onExecute,
            description: 'Execute Request'
        },
        {
            key: 's',
            ctrl: true,
            action: actions.onSave,
            description: 'Save Request'
        },
        {
            key: 'n',
            ctrl: true,
            action: actions.onNew,
            description: 'New Request'
        },
        {
            key: 'i',
            ctrl: true,
            shift: true,
            action: actions.onImport,
            description: 'Import Data'
        },
        {
            key: 'e',
            ctrl: true,
            shift: true,
            action: actions.onExport,
            description: 'Export Data'
        },
        {
            key: 'k',
            ctrl: true,
            action: actions.onClear,
            description: 'Clear All Fields'
        },
        {
            key: 't',
            ctrl: true,
            shift: true,
            action: actions.onToggleTheme,
            description: 'Toggle Theme'
        }
    ]

    useKeyboardShortcuts(shortcuts)

    return shortcuts
}

/**
 * Component to display keyboard shortcuts
 */
export function getShortcutDisplay(shortcut: ShortcutConfig): string {
    const parts: string[] = []
    if (shortcut.ctrl) parts.push('Ctrl')
    if (shortcut.shift) parts.push('Shift')
    if (shortcut.alt) parts.push('Alt')
    parts.push(shortcut.key.toUpperCase())
    return parts.join('+')
}
