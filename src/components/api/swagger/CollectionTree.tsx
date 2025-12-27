import { useState } from 'react'
import { swaggerTheme, getMethodColor } from './swaggerTheme'
import MethodBadge from './MethodBadge'

export interface Collection {
    id: string
    name: string
    type: 'folder' | 'request'
    method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH'
    children?: Collection[]
}

interface Props {
    collections: Collection[]
    onChange: (collections: Collection[]) => void
    onSelectRequest: (request: Collection) => void
}

export default function CollectionTree({ collections, onChange, onSelectRequest }: Props) {
    const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set())

    const toggleExpand = (id: string) => {
        const newExpanded = new Set(expandedIds)
        if (newExpanded.has(id)) {
            newExpanded.delete(id)
        } else {
            newExpanded.add(id)
        }
        setExpandedIds(newExpanded)
    }

    const addFolder = (parentId?: string) => {
        const newFolder: Collection = {
            id: Date.now().toString(),
            name: 'New Folder',
            type: 'folder',
            children: []
        }

        if (!parentId) {
            onChange([...collections, newFolder])
        } else {
            const addToParent = (items: Collection[]): Collection[] => {
                return items.map(item => {
                    if (item.id === parentId && item.type === 'folder') {
                        return {
                            ...item,
                            children: [...(item.children || []), newFolder]
                        }
                    }
                    if (item.children) {
                        return { ...item, children: addToParent(item.children) }
                    }
                    return item
                })
            }
            onChange(addToParent(collections))
            setExpandedIds(new Set([...expandedIds, parentId]))
        }
    }

    const deleteItem = (id: string) => {
        const removeFromTree = (items: Collection[]): Collection[] => {
            return items.filter(item => item.id !== id).map(item => {
                if (item.children) {
                    return { ...item, children: removeFromTree(item.children) }
                }
                return item
            })
        }
        onChange(removeFromTree(collections))
    }

    const renameItem = (id: string, newName: string) => {
        const renameInTree = (items: Collection[]): Collection[] => {
            return items.map(item => {
                if (item.id === id) {
                    return { ...item, name: newName }
                }
                if (item.children) {
                    return { ...item, children: renameInTree(item.children) }
                }
                return item
            })
        }
        onChange(renameInTree(collections))
    }

    const renderItem = (item: Collection, depth: number = 0): JSX.Element => {
        const isExpanded = expandedIds.has(item.id)
        const hasChildren = item.children && item.children.length > 0

        return (
            <div key={item.id} style={{ marginBottom: '4px' }}>
                <div
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        padding: '8px 10px',
                        paddingLeft: `${10 + depth * 16}px`,
                        background: swaggerTheme.bgTertiary,
                        border: `1px solid ${swaggerTheme.border}`,
                        borderRadius: '6px',
                        cursor: 'pointer',
                        transition: 'all 0.2s'
                    }}
                    onMouseEnter={(e) => {
                        e.currentTarget.style.background = swaggerTheme.hover
                        e.currentTarget.style.borderColor = swaggerTheme.primary
                    }}
                    onMouseLeave={(e) => {
                        e.currentTarget.style.background = swaggerTheme.bgTertiary
                        e.currentTarget.style.borderColor = swaggerTheme.border
                    }}
                    onClick={() => {
                        if (item.type === 'folder') {
                            toggleExpand(item.id)
                        } else {
                            onSelectRequest(item)
                        }
                    }}
                >
                    {/* Icon/Expand */}
                    {item.type === 'folder' ? (
                        <span style={{
                            fontSize: '12px',
                            color: swaggerTheme.textSecondary,
                            transform: isExpanded ? 'rotate(90deg)' : 'rotate(0deg)',
                            transition: 'transform 0.2s',
                            width: '12px'
                        }}>
                            ▶
                        </span>
                    ) : (
                        <span style={{ width: '12px' }} />
                    )}

                    {/* Folder/Request Icon */}
                    <span style={{ fontSize: '14px' }}>
                        {item.type === 'folder' ? '📁' : '📄'}
                    </span>

                    {/* Method Badge (for requests) */}
                    {item.type === 'request' && item.method && (
                        <div style={{ fontSize: '10px' }}>
                            <MethodBadge method={item.method} />
                        </div>
                    )}

                    {/* Name */}
                    <span style={{
                        flex: 1,
                        fontSize: '13px',
                        fontWeight: item.type === 'folder' ? '600' : '400',
                        color: swaggerTheme.text,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap'
                    }}>
                        {item.name}
                    </span>

                    {/* Actions */}
                    <div style={{
                        display: 'flex',
                        gap: '4px',
                        opacity: 0.5
                    }}
                        onMouseEnter={(e) => e.currentTarget.style.opacity = '1'}
                        onMouseLeave={(e) => e.currentTarget.style.opacity = '0.5'}
                    >
                        {item.type === 'folder' && (
                            <button
                                onClick={(e) => {
                                    e.stopPropagation()
                                    addFolder(item.id)
                                }}
                                style={{
                                    padding: '4px 6px',
                                    background: 'transparent',
                                    border: 'none',
                                    borderRadius: '3px',
                                    color: swaggerTheme.textSecondary,
                                    fontSize: '11px',
                                    cursor: 'pointer'
                                }}
                                title="Add subfolder"
                            >
                                +📁
                            </button>
                        )}
                        <button
                            onClick={(e) => {
                                e.stopPropagation()
                                const newName = prompt('Rename:', item.name)
                                if (newName) renameItem(item.id, newName)
                            }}
                            style={{
                                padding: '4px 6px',
                                background: 'transparent',
                                border: 'none',
                                borderRadius: '3px',
                                color: swaggerTheme.textSecondary,
                                fontSize: '11px',
                                cursor: 'pointer'
                            }}
                            title="Rename"
                        >
                            ✏️
                        </button>
                        <button
                            onClick={(e) => {
                                e.stopPropagation()
                                if (confirm(`Delete "${item.name}"?`)) {
                                    deleteItem(item.id)
                                }
                            }}
                            style={{
                                padding: '4px 6px',
                                background: 'transparent',
                                border: 'none',
                                borderRadius: '3px',
                                color: swaggerTheme.status.error,
                                fontSize: '11px',
                                cursor: 'pointer'
                            }}
                            title="Delete"
                        >
                            🗑️
                        </button>
                    </div>
                </div>

                {/* Children */}
                {item.type === 'folder' && isExpanded && hasChildren && (
                    <div style={{ marginTop: '4px' }}>
                        {item.children!.map(child => renderItem(child, depth + 1))}
                    </div>
                )}
            </div>
        )
    }

    return (
        <div style={{
            display: 'flex',
            flexDirection: 'column',
            height: '100%',
            background: swaggerTheme.bgSecondary,
            borderRadius: '8px',
            overflow: 'hidden'
        }}>
            {/* Header */}
            <div style={{
                padding: '14px 16px',
                background: swaggerTheme.bgTertiary,
                borderBottom: `1px solid ${swaggerTheme.border}`,
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
            }}>
                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                }}>
                    <span style={{ fontSize: '16px' }}>📚</span>
                    <span style={{
                        fontSize: '14px',
                        fontWeight: '600',
                        color: swaggerTheme.text
                    }}>
                        Collections
                    </span>
                </div>
                <button
                    onClick={() => addFolder()}
                    style={{
                        padding: '6px 12px',
                        background: swaggerTheme.primary,
                        border: 'none',
                        borderRadius: '4px',
                        color: 'white',
                        fontSize: '12px',
                        fontWeight: '600',
                        cursor: 'pointer'
                    }}
                >
                    + Folder
                </button>
            </div>

            {/* Tree */}
            <div style={{
                flex: 1,
                overflow: 'auto',
                padding: '12px'
            }}>
                {collections.length === 0 ? (
                    <div style={{
                        padding: '40px 20px',
                        textAlign: 'center',
                        color: swaggerTheme.textSecondary
                    }}>
                        <div style={{ fontSize: '48px', marginBottom: '12px', opacity: 0.3 }}>
                            📚
                        </div>
                        <div style={{ fontSize: '14px', marginBottom: '8px' }}>
                            No collections yet
                        </div>
                        <div style={{ fontSize: '12px', opacity: 0.7 }}>
                            Click "+ Folder" to organize your tests
                        </div>
                    </div>
                ) : (
                    collections.map(item => renderItem(item))
                )}
            </div>
        </div>
    )
}
