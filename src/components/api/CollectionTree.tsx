import { useState } from 'react'
import { swaggerTheme } from './swagger/swaggerTheme'
import MethodBadge from './swagger/MethodBadge'

interface ApiTest {
    id: string
    name: string
    method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH'
    url: string
    headers: Record<string, string>
    queryParams: Record<string, string>
    body: string
    validations: any[]
}

interface Collection {
    id: string
    name: string
    description: string
    tests: ApiTest[]
    expanded?: boolean
}

interface Props {
    collections: Collection[]
    onAddCollection: () => void
    onDeleteCollection: (id: string) => void
    onRunCollection: (collection: Collection) => void
    onLoadTest: (test: ApiTest) => void
    onAddTestToCollection: (collectionId: string, test: ApiTest) => void
}

export default function CollectionTree({
    collections,
    onAddCollection,
    onDeleteCollection,
    onRunCollection,
    onLoadTest,
    onAddTestToCollection
}: Props) {
    const [expandedCollections, setExpandedCollections] = useState<Set<string>>(new Set())

    const toggleCollection = (id: string) => {
        const newExpanded = new Set(expandedCollections)
        if (newExpanded.has(id)) {
            newExpanded.delete(id)
        } else {
            newExpanded.add(id)
        }
        setExpandedCollections(newExpanded)
    }

    return (
        <div style={{
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            background: swaggerTheme.bgSecondary
        }}>
            {/* Header */}
            <div style={{
                padding: '20px',
                borderBottom: `1px solid ${swaggerTheme.border}`
            }}>
                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    marginBottom: '12px'
                }}>
                    <div style={{
                        fontSize: '16px',
                        fontWeight: '700',
                        color: swaggerTheme.text
                    }}>
                        📚 Collections
                    </div>
                    <button
                        onClick={onAddCollection}
                        style={{
                            padding: '6px 12px',
                            background: swaggerTheme.primary,
                            border: 'none',
                            borderRadius: '4px',
                            color: '#fff',
                            fontSize: '20px',
                            cursor: 'pointer',
                            lineHeight: '1'
                        }}
                        title="New Collection"
                    >
                        +
                    </button>
                </div>
                <div style={{
                    fontSize: '13px',
                    color: swaggerTheme.textSecondary
                }}>
                    {collections.length} collection{collections.length !== 1 ? 's' : ''}
                </div>
            </div>

            {/* Collections List */}
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
                            📁
                        </div>
                        <div style={{ fontSize: '14px' }}>
                            No collections yet
                        </div>
                        <div style={{ fontSize: '12px', marginTop: '8px', opacity: 0.7 }}>
                            Create a collection to organize your APIs
                        </div>
                    </div>
                ) : (
                    collections.map((collection) => {
                        const isExpanded = expandedCollections.has(collection.id)

                        return (
                            <div
                                key={collection.id}
                                style={{
                                    marginBottom: '12px',
                                    background: swaggerTheme.bgCard,
                                    border: `1px solid ${swaggerTheme.border}`,
                                    borderRadius: '6px',
                                    overflow: 'hidden'
                                }}
                            >
                                {/* Collection Header */}
                                <div
                                    style={{
                                        padding: '14px',
                                        cursor: 'pointer',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '10px',
                                        borderBottom: isExpanded ? `1px solid ${swaggerTheme.border}` : 'none'
                                    }}
                                    onClick={() => toggleCollection(collection.id)}
                                >
                                    <span style={{
                                        fontSize: '16px',
                                        transition: 'transform 0.2s',
                                        transform: isExpanded ? 'rotate(90deg)' : 'rotate(0deg)'
                                    }}>
                                        ▶
                                    </span>
                                    <span style={{ fontSize: '20px' }}>📁</span>
                                    <div style={{ flex: 1 }}>
                                        <div style={{
                                            fontSize: '14px',
                                            fontWeight: '600',
                                            color: swaggerTheme.text
                                        }}>
                                            {collection.name}
                                        </div>
                                        {collection.description && (
                                            <div style={{
                                                fontSize: '12px',
                                                color: swaggerTheme.textSecondary,
                                                marginTop: '4px'
                                            }}>
                                                {collection.description}
                                            </div>
                                        )}
                                    </div>
                                    <div style={{
                                        fontSize: '12px',
                                        color: swaggerTheme.textSecondary,
                                        background: swaggerTheme.bgTertiary,
                                        padding: '4px 8px',
                                        borderRadius: '10px'
                                    }}>
                                        {collection.tests.length}
                                    </div>
                                </div>

                                {/* Collection Content */}
                                {isExpanded && (
                                    <div style={{ padding: '8px' }}>
                                        {/* Run Collection Button */}
                                        {collection.tests.length > 0 && (
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation()
                                                    onRunCollection(collection)
                                                }}
                                                style={{
                                                    width: '100%',
                                                    padding: '10px',
                                                    marginBottom: '12px',
                                                    background: `linear-gradient(135deg, ${swaggerTheme.methods.post}, ${swaggerTheme.methods.post}dd)`,
                                                    border: 'none',
                                                    borderRadius: '4px',
                                                    color: '#fff',
                                                    fontSize: '13px',
                                                    fontWeight: '600',
                                                    cursor: 'pointer',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    gap: '8px'
                                                }}
                                            >
                                                <span>▶️</span>
                                                Run Collection ({collection.tests.length} requests)
                                            </button>
                                        )}

                                        {/* Tests List */}
                                        {collection.tests.map((test, index) => (
                                            <div
                                                key={test.id}
                                                onClick={() => onLoadTest(test)}
                                                style={{
                                                    padding: '10px',
                                                    marginBottom: '6px',
                                                    background: swaggerTheme.bgTertiary,
                                                    border: `1px solid ${swaggerTheme.border}`,
                                                    borderRadius: '4px',
                                                    cursor: 'pointer',
                                                    transition: 'all 0.2s'
                                                }}
                                                onMouseEnter={(e) => {
                                                    e.currentTarget.style.borderColor = swaggerTheme.primary
                                                }}
                                                onMouseLeave={(e) => {
                                                    e.currentTarget.style.borderColor = swaggerTheme.border
                                                }}
                                            >
                                                <div style={{
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    gap: '10px'
                                                }}>
                                                    <MethodBadge method={test.method} size="small" />
                                                    <div style={{ flex: 1 }}>
                                                        <div style={{
                                                            fontSize: '13px',
                                                            fontWeight: '600',
                                                            color: swaggerTheme.text,
                                                            marginBottom: '4px'
                                                        }}>
                                                            {test.name}
                                                        </div>
                                                        <div style={{
                                                            fontSize: '11px',
                                                            color: swaggerTheme.textMuted,
                                                            fontFamily: 'monospace',
                                                            overflow: 'hidden',
                                                            textOverflow: 'ellipsis',
                                                            whiteSpace: 'nowrap'
                                                        }}>
                                                            {test.url}
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}

                                        {collection.tests.length === 0 && (
                                            <div style={{
                                                padding: '20px',
                                                textAlign: 'center',
                                                color: swaggerTheme.textSecondary,
                                                fontSize: '12px'
                                            }}>
                                                No tests in this collection
                                            </div>
                                        )}

                                        {/* Delete Collection */}
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation()
                                                if (confirm('Delete this collection?')) {
                                                    onDeleteCollection(collection.id)
                                                }
                                            }}
                                            style={{
                                                width: '100%',
                                                padding: '8px',
                                                marginTop: '8px',
                                                background: 'transparent',
                                                border: `1px solid ${swaggerTheme.border}`,
                                                borderRadius: '4px',
                                                color: swaggerTheme.methods.delete,
                                                fontSize: '12px',
                                                cursor: 'pointer'
                                            }}
                                        >
                                            🗑️ Delete Collection
                                        </button>
                                    </div>
                                )}
                            </div>
                        )
                    })
                )}
            </div>
        </div>
    )
}
