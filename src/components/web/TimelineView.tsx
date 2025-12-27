import { useState, useEffect } from 'react'
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors } from '@dnd-kit/core'
import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'

interface WebAction {
    id: number
    type: 'click' | 'type' | 'scroll' | 'wait' | 'assert' | 'inspect'
    selector?: string
    data?: any
    timestamp: string
    enabled?: boolean
    status?: 'success' | 'error' | 'warning' | 'pending'
}

interface TimelineViewProps {
    actions: WebAction[]
    isRecording: boolean
    onReorder: (newActions: WebAction[]) => void
    onEdit: (actionId: number) => void
    onToggle: (actionId: number) => void
    onDelete: (actionId: number) => void
}

function SortableStep({ action, index, onEdit, onToggle, onDelete }: any) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging
    } = useSortable({ id: action.id })

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1
    }

    const colors = {
        bg: '#0d1117',
        bgSecondary: '#161b22',
        bgTertiary: '#21262d',
        border: '#30363d',
        text: '#e6edf3',
        textSecondary: '#7d8590',
        primary: '#f97316',
        blue: '#58a6ff',
        purple: '#a78bfa',
        success: '#3fb950',
        error: '#f85149',
        warning: '#d29922',
        cyan: '#56d4dd'
    }

    const getStatusIcon = () => {
        switch (action.status) {
            case 'success': return '✓'
            case 'error': return '✗'
            case 'warning': return '⚠'
            default: return '▶'
        }
    }

    const getStatusColor = () => {
        switch (action.status) {
            case 'success': return colors.success
            case 'error': return colors.error
            case 'warning': return colors.warning
            default: return colors.blue
        }
    }

    const getActionIcon = (type: string) => {
        switch (type) {
            case 'click': return '👆'
            case 'type': return '⌨️'
            case 'scroll': return '📜'
            case 'wait': return '⏱️'
            case 'assert': return '✓'
            case 'inspect': return '🔍'
            default: return '●'
        }
    }


    const getActionDescription = () => {
        switch (action.type) {
            case 'click':
                if (action.selector && !action.selector.startsWith('coordinate:')) {
                    return `Click "${action.selector.split('>').pop()?.trim()}"`
                }
                return `Tap at (${action.data?.x || 0}, ${action.data?.y || 0})`
            case 'type':
                return `Type "${action.data?.text}" into ${action.selector?.split('>').pop()?.trim() || 'element'}`
            case 'scroll':
                return `Scroll ${action.data?.direction} ${action.data?.amount}px`
            case 'wait':
                return `Wait ${action.data?.seconds || 0}s`
            case 'assert':
                const assertType = action.data?.type || 'visible'
                const value = action.data?.expectedValue
                if (assertType === 'visible') return `Assert element is visible`
                if (assertType === 'text') return `Assert text equals "${value}"`
                if (assertType === 'enabled') return `Assert element is enabled`
                if (assertType === 'value') return `Assert value equals "${value}"`
                return `Assert ${assertType}`
            case 'inspect':
                const tag = action.data?.tag || 'element'
                const id = action.data?.id
                const className = action.data?.className
                let desc = `Inspect <${tag}>`
                if (id) desc += ` #${id}`
                if (className) desc += ` .${className.split(' ')[0]}`
                return desc
            default:
                return action.type
        }
    }

    return (
        <div
            ref={setNodeRef}
            style={style}
            {...attributes}
        >
            <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '12px 16px',
                background: action.enabled === false
                    ? `${colors.bgTertiary}80`
                    : `linear-gradient(135deg, ${colors.bgTertiary}, ${colors.bgSecondary})`,
                border: `1px solid ${colors.border}`,
                borderLeft: `4px solid ${getStatusColor()}`,
                borderRadius: '10px',
                marginBottom: '8px',
                cursor: isDragging ? 'grabbing' : 'grab',
                opacity: action.enabled === false ? 0.5 : 1,
                transition: 'all 0.3s ease',
                position: 'relative',
                overflow: 'hidden'
            }}
                onMouseEnter={(e) => {
                    if (!isDragging) {
                        e.currentTarget.style.background = `linear-gradient(135deg, ${colors.bgTertiary}, ${colors.bgSecondary}dd)`
                        e.currentTarget.style.transform = 'translateX(4px)'
                        e.currentTarget.style.boxShadow = `0 4px 12px ${getStatusColor()}20`
                    }
                }}
                onMouseLeave={(e) => {
                    if (!isDragging) {
                        e.currentTarget.style.background = action.enabled === false
                            ? `${colors.bgTertiary}80`
                            : `linear-gradient(135deg, ${colors.bgTertiary}, ${colors.bgSecondary})`
                        e.currentTarget.style.transform = 'translateX(0)'
                        e.currentTarget.style.boxShadow = 'none'
                    }
                }}
            >
                {/* Drag Handle */}
                <div
                    {...listeners}
                    style={{
                        cursor: 'grab',
                        padding: '4px',
                        color: colors.textSecondary,
                        fontSize: '16px',
                        display: 'flex',
                        alignItems: 'center'
                    }}
                >
                    ⋮⋮
                </div>

                {/* Status Icon */}
                <div style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '8px',
                    background: `${getStatusColor()}20`,
                    border: `2px solid ${getStatusColor()}40`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '14px',
                    fontWeight: 700,
                    color: getStatusColor(),
                    flexShrink: 0
                }}>
                    {getStatusIcon()}
                </div>

                {/* Step Number */}
                <div style={{
                    minWidth: '28px',
                    padding: '4px 8px',
                    background: `${colors.primary}20`,
                    border: `1px solid ${colors.primary}40`,
                    borderRadius: '6px',
                    fontSize: '11px',
                    fontWeight: 800,
                    color: colors.primary,
                    textAlign: 'center',
                    flexShrink: 0
                }}>
                    {index + 1}
                </div>

                {/* Action Icon */}
                <div style={{ fontSize: '20px', flexShrink: 0 }}>
                    {getActionIcon(action.type)}
                </div>

                {/* Description */}
                <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{
                        fontSize: '13px',
                        fontWeight: 600,
                        color: colors.text,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                        marginBottom: '2px'
                    }}>
                        {getActionDescription()}
                    </div>
                    <div style={{
                        fontSize: '11px',
                        color: colors.textSecondary
                    }}>
                        {new Date(action.timestamp).toLocaleTimeString()}
                    </div>
                </div>

                {/* Actions */}
                <div style={{
                    display: 'flex',
                    gap: '6px',
                    flexShrink: 0
                }}>
                    {/* Edit */}
                    <button
                        onClick={(e) => {
                            e.stopPropagation()
                            onEdit(action.id)
                        }}
                        style={{
                            background: 'transparent',
                            border: `1px solid ${colors.border}`,
                            borderRadius: '6px',
                            color: colors.text,
                            width: '28px',
                            height: '28px',
                            cursor: 'pointer',
                            fontSize: '14px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            transition: 'all 0.2s'
                        }}
                        onMouseEnter={(e) => {
                            e.currentTarget.style.background = colors.blue
                            e.currentTarget.style.borderColor = colors.blue
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.background = 'transparent'
                            e.currentTarget.style.borderColor = colors.border
                        }}
                        title="Edit step"
                    >
                        ✏️
                    </button>

                    {/* Toggle Enable/Disable */}
                    <button
                        onClick={(e) => {
                            e.stopPropagation()
                            onToggle(action.id)
                        }}
                        style={{
                            background: 'transparent',
                            border: `1px solid ${colors.border}`,
                            borderRadius: '6px',
                            color: action.enabled === false ? colors.textSecondary : colors.success,
                            width: '28px',
                            height: '28px',
                            cursor: 'pointer',
                            fontSize: '14px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            transition: 'all 0.2s'
                        }}
                        onMouseEnter={(e) => {
                            e.currentTarget.style.background = action.enabled === false ? colors.success : colors.textSecondary
                            e.currentTarget.style.borderColor = action.enabled === false ? colors.success : colors.textSecondary
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.background = 'transparent'
                            e.currentTarget.style.borderColor = colors.border
                        }}
                        title={action.enabled === false ? "Enable step" : "Disable step"}
                    >
                        {action.enabled === false ? '○' : '●'}
                    </button>

                    {/* Delete */}
                    <button
                        onClick={(e) => {
                            e.stopPropagation()
                            if (confirm('Delete this step?')) {
                                onDelete(action.id)
                            }
                        }}
                        style={{
                            background: 'transparent',
                            border: `1px solid ${colors.border}`,
                            borderRadius: '6px',
                            color: colors.error,
                            width: '28px',
                            height: '28px',
                            cursor: 'pointer',
                            fontSize: '14px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            transition: 'all 0.2s'
                        }}
                        onMouseEnter={(e) => {
                            e.currentTarget.style.background = colors.error
                            e.currentTarget.style.borderColor = colors.error
                            e.currentTarget.style.color = 'white'
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.background = 'transparent'
                            e.currentTarget.style.borderColor = colors.border
                            e.currentTarget.style.color = colors.error
                        }}
                        title="Delete step"
                    >
                        🗑️
                    </button>
                </div>
            </div>
        </div>
    )
}

export default function TimelineView({
    actions,
    isRecording,
    onReorder,
    onEdit,
    onToggle,
    onDelete
}: TimelineViewProps) {
    const [items, setItems] = useState(actions)

    // Sync items with actions prop when it updates
    useEffect(() => {
        setItems(actions)
    }, [actions])

    const sensors = useSensors(
        useSensor(PointerSensor),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates
        })
    )

    const handleDragEnd = (event: any) => {
        const { active, over } = event

        if (active.id !== over.id) {
            const oldIndex = items.findIndex(item => item.id === active.id)
            const newIndex = items.findIndex(item => item.id === over.id)

            const newItems = arrayMove(items, oldIndex, newIndex)
            setItems(newItems)
            onReorder(newItems)
        }
    }

    const colors = {
        bgSecondary: '#161b22',
        bgTertiary: '#21262d',
        border: '#30363d',
        text: '#e6edf3',
        textSecondary: '#7d8590',
        primary: '#f97316'
    }

    return (
        <div style={{
            background: `linear-gradient(135deg, ${colors.bgSecondary}dd, ${colors.bgTertiary}dd)`,
            backdropFilter: 'blur(20px)',
            border: `1px solid ${colors.border}`,
            borderRadius: '16px',
            padding: '20px',
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            boxShadow: `0 12px 40px rgba(0, 0, 0, 0.5)`,
            minHeight: 0
        }}>
            {/* Header */}
            <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: '20px',
                paddingBottom: '16px',
                borderBottom: `1px solid ${colors.border}`
            }}>
                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px'
                }}>
                    <div style={{
                        width: '40px',
                        height: '40px',
                        borderRadius: '10px',
                        background: `linear-gradient(135deg, ${colors.primary}, #e65b00)`,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '20px',
                        boxShadow: `0 0 20px ${colors.primary}40`
                    }}>
                        🎬
                    </div>
                    <div>
                        <h3 style={{
                            margin: 0,
                            fontSize: '18px',
                            fontWeight: 700,
                            color: colors.text
                        }}>
                            Test Timeline
                        </h3>
                        <p style={{
                            margin: 0,
                            fontSize: '12px',
                            color: colors.textSecondary
                        }}>
                            Drag to reorder • Click to edit
                        </p>
                    </div>
                </div>
                <div style={{
                    padding: '6px 14px',
                    background: `${colors.primary}20`,
                    border: `2px solid ${colors.primary}40`,
                    borderRadius: '10px',
                    fontSize: '12px',
                    fontWeight: 700,
                    color: colors.primary
                }}>
                    {actions.length} steps
                </div>
            </div>

            {/* Timeline List */}
            <div style={{
                flex: 1,
                overflow: 'auto',
                paddingRight: '4px'
            }}>
                {actions.length === 0 ? (
                    <div style={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        padding: '60px 20px',
                        color: colors.textSecondary
                    }}>
                        <div style={{ fontSize: '48px', marginBottom: '16px', opacity: 0.5 }}>
                            📋
                        </div>
                        <div style={{ fontSize: '16px', fontWeight: 600, color: colors.text, marginBottom: '8px' }}>
                            No Steps Yet
                        </div>
                        <div style={{ fontSize: '13px' }}>
                            {isRecording ? 'Interact with browser to add steps' : 'Start recording to capture actions'}
                        </div>
                    </div>
                ) : (
                    <DndContext
                        sensors={sensors}
                        collisionDetection={closestCenter}
                        onDragEnd={handleDragEnd}
                    >
                        <SortableContext
                            items={items.map(item => item.id)}
                            strategy={verticalListSortingStrategy}
                        >
                            {items.map((action, index) => (
                                <SortableStep
                                    key={action.id}
                                    action={action}
                                    index={index}
                                    onEdit={onEdit}
                                    onToggle={onToggle}
                                    onDelete={onDelete}
                                />
                            ))}
                        </SortableContext>
                    </DndContext>
                )}
            </div>
        </div>
    )
}
