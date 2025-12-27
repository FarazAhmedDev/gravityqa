// This file contains ONLY the remaining 2 view components to append to TestManagement.tsx
// Copy these components and replace the placeholders in the main file

// Test Suites View Component  
function TestSuitesView({ testSuites, setTestSuites, testCases, theme }: any) {
    const [searchQuery, setSearchQuery] = useState('')
    const [showCreateModal, setShowCreateModal] = useState(false)
    const [editingSuite, setEditingSuite] = useState<TestSuite | null>(null)
    const [runningSuiteId, setRunningSuiteId] = useState<string | null>(null)
    const [suiteProgress, setSuiteProgress] = useState({ current: 0, total: 0 })

    const filteredSuites = testSuites.filter((suite: TestSuite) =>
        suite.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        suite.description.toLowerCase().includes(searchQuery.toLowerCase())
    )

    const handleCreate = (newSuite: Partial<TestSuite>) => {
        const suite: TestSuite = {
            id: Date.now().toString(),
            name: newSuite.name || '',
            description: newSuite.description || '',
            testCases: newSuite.testCases || [],
            createdAt: Date.now(),
            updatedAt: Date.now(),
            tags: newSuite.tags || []
        }
        setTestSuites([...testSuites, suite])
        setShowCreateModal(false)
    }

    const handleEdit = (updatedSuite: TestSuite) => {
        setTestSuites(testSuites.map((s: TestSuite) =>
            s.id === updatedSuite.id ? { ...updatedSuite, updatedAt: Date.now() } : s
        ))
        setEditingSuite(null)
    }

    const handleDelete = (id: string) => {
        if (confirm('Are you sure you want to delete this test suite?')) {
            setTestSuites(testSuites.filter((s: TestSuite) => s.id !== id))
        }
    }

    const handleRunSuite = async (suite: TestSuite) => {
        setRunningSuiteId(suite.id)
        setSuiteProgress({ current: 0, total: suite.testCases.length })

        // Simulate test execution
        for (let i = 0; i < suite.testCases.length; i++) {
            await new Promise(resolve => setTimeout(resolve, 1500))
            setSuiteProgress({ current: i + 1, total: suite.testCases.length })
        }

        setRunningSuiteId(null)
        alert(`✅ Suite "${suite.name}" completed!`)
    }

    return (
        <div>
            {/* Header */}
            <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '24px',
                gap: '20px'
            }}>
                <input
                    type="text"
                    placeholder="🔍 Search test suites..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    style={{
                        flex: 1,
                        padding: '14px 18px',
                        background: theme.bgSecondary,
                        border: `1px solid ${theme.border}`,
                        borderRadius: '12px',
                        color: theme.text,
                        fontSize: '14px',
                        outline: 'none'
                    }}
                />

                <button
                    onClick={() => setShowCreateModal(true)}
                    style={{
                        padding: '14px 28px',
                        background: `linear-gradient(135deg, ${theme.primary}, ${theme.secondary})`,
                        border: 'none',
                        borderRadius: '12px',
                        color: '#fff',
                        fontSize: '14px',
                        fontWeight: '600',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px'
                    }}
                >
                    <span>📦</span> New Suite
                </button>
            </div>

            {/* Suites Grid */}
            {filteredSuites.length === 0 ? (
                <div style={{
                    textAlign: 'center',
                    padding: '80px 20px',
                    background: theme.bgSecondary,
                    borderRadius: '16px',
                    border: `1px solid ${theme.border}`
                }}>
                    <div style={{ fontSize: '64px', marginBottom: '16px', opacity: 0.3 }}>📦</div>
                    <h3 style={{ color: theme.text, marginBottom: '8px' }}>No Test Suites Found</h3>
                    <p style={{ color: theme.textSecondary, marginBottom: '24px' }}>
                        {searchQuery ? 'Try adjusting your search' : 'Create your first test suite to get started'}
                    </p>
                    {!searchQuery && (
                        <button
                            onClick={() => setShowCreateModal(true)}
                            style={{
                                padding: '12px 24px',
                                background: `linear-gradient(135deg, ${theme.primary}, ${theme.secondary})`,
                                border: 'none',
                                borderRadius: '10px',
                                color: '#fff',
                                cursor: 'pointer',
                                fontWeight: '600'
                            }}
                        >
                            📦 Create First Suite
                        </button>
                    )}
                </div>
            ) : (
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(400px, 1fr))',
                    gap: '20px'
                }}>
                    {filteredSuites.map((suite: TestSuite) => (
                        <TestSuiteCard
                            key={suite.id}
                            suite={suite}
                            testCases={testCases}
                            onEdit={() => setEditingSuite(suite)}
                            onDelete={() => handleDelete(suite.id)}
                            onRun={() => handleRunSuite(suite)}
                            isRunning={runningSuiteId === suite.id}
                            progress={runningSuiteId === suite.id ? suiteProgress : null}
                            theme={theme}
                        />
                    ))}
                </div>
            )}

            {/* Create/Edit Modal */}
            {(showCreateModal || editingSuite) && (
                <TestSuiteModal
                    suite={editingSuite}
                    testCases={testCases}
                    onSave={editingSuite ? handleEdit : handleCreate}
                    onClose={() => {
                        setShowCreateModal(false)
                        setEditingSuite(null)
                    }}
                    theme={theme}
                />
            )}
        </div>
    )
}

// Test Suite Card
function TestSuiteCard({ suite, testCases, onEdit, onDelete, onRun, isRunning, progress, theme }: any) {
    const suiteTestCases = testCases.filter((tc: TestCase) => suite.testCases.includes(tc.id))

    return (
        <div style={{
            background: theme.bgSecondary,
            border: `1px solid ${theme.border}`,
            borderRadius: '16px',
            padding: '24px',
            transition: 'all 0.3s'
        }}
            onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = theme.primary
                e.currentTarget.style.transform = 'translateY(-4px)'
            }}
            onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = theme.border
                e.currentTarget.style.transform = 'translateY(0)'
            }}>
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <span style={{ fontSize: '28px' }}>📦</span>
                    <div>
                        <h3 style={{
                            margin: 0,
                            fontSize: '18px',
                            fontWeight: '600',
                            color: theme.text
                        }}>
                            {suite.name}
                        </h3>
                        <span style={{
                            fontSize: '12px',
                            color: theme.textSecondary
                        }}>
                            {suite.testCases.length} test{suite.testCases.length !== 1 ? 's' : ''}
                        </span>
                    </div>
                </div>
            </div>

            {/* Description */}
            <p style={{
                color: theme.textSecondary,
                fontSize: '13px',
                marginBottom: '16px',
                lineHeight: '1.6'
            }}>
                {suite.description || 'No description'}
            </p>

            {/* Test Cases List */}
            <div style={{
                marginBottom: '16px',
                maxHeight: '120px',
                overflow: 'auto'
            }}>
                {suiteTestCases.map((tc: TestCase) => (
                    <div key={tc.id} style={{
                        padding: '8px 12px',
                        background: theme.bgTertiary,
                        borderRadius: '8px',
                        marginBottom: '6px',
                        fontSize: '12px',
                        color: theme.text,
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px'
                    }}>
                        <span>{tc.type === 'mobile' ? '📱' : tc.type === 'web' ? '🌐' : '⚡'}</span>
                        <span>{tc.name}</span>
                    </div>
                ))}
            </div>

            {/* Progress Bar (when running) */}
            {isRunning && progress && (
                <div style={{ marginBottom: '16px' }}>
                    <div style={{
                        height: '8px',
                        background: theme.bgTertiary,
                        borderRadius: '4px',
                        overflow: 'hidden'
                    }}>
                        <div style={{
                            height: '100%',
                            background: `linear-gradient(90deg, ${theme.primary}, ${theme.secondary})`,
                            width: `${(progress.current / progress.total) * 100}%`,
                            transition: 'width 0.3s'
                        }} />
                    </div>
                    <p style={{
                        margin: '8px 0 0',
                        fontSize: '12px',
                        color: theme.textSecondary,
                        textAlign: 'center'
                    }}>
                        Running {progress.current} / {progress.total} tests...
                    </p>
                </div>
            )}

            {/* Actions */}
            <div style={{
                display: 'flex',
                gap: '8px',
                paddingTop: '16px',
                borderTop: `1px solid ${theme.border}`
            }}>
                <button
                    onClick={onRun}
                    disabled={isRunning}
                    style={{
                        flex: 1,
                        padding: '10px',
                        background: isRunning
                            ? theme.bgTertiary
                            : `linear-gradient(135deg, ${theme.success}, #059669)`,
                        border: 'none',
                        borderRadius: '8px',
                        color: isRunning ? theme.textSecondary : '#fff',
                        fontSize: '13px',
                        fontWeight: '600',
                        cursor: isRunning ? 'not-allowed' : 'pointer'
                    }}
                >
                    {isRunning ? '⏳ Running...' : '▶️ Run Suite'}
                </button>
                <button
                    onClick={onEdit}
                    style={{
                        padding: '10px 16px',
                        background: theme.bgTertiary,
                        border: `1px solid ${theme.border}`,
                        borderRadius: '8px',
                        color: theme.text,
                        fontSize: '13px',
                        cursor: 'pointer',
                        fontWeight: '600'
                    }}
                >
                    ✏️
                </button>
                <button
                    onClick={onDelete}
                    style={{
                        padding: '10px 16px',
                        background: `${theme.error}20`,
                        border: `1px solid ${theme.error}40`,
                        borderRadius: '8px',
                        color: theme.error,
                        fontSize: '13px',
                        cursor: 'pointer',
                        fontWeight: '600'
                    }}
                >
                    🗑️
                </button>
            </div>
        </div>
    )
}

// Test Suite Modal
function TestSuiteModal({ suite, testCases, onSave, onClose, theme }: any) {
    const [formData, setFormData] = useState({
        name: suite?.name || '',
        description: suite?.description || '',
        selectedTests: suite?.testCases || [],
        tags: suite?.tags?.join(', ') || ''
    })

    const toggleTest = (testId: string) => {
        if (formData.selectedTests.includes(testId)) {
            setFormData({
                ...formData,
                selectedTests: formData.selectedTests.filter((id: string) => id !== testId)
            })
        } else {
            setFormData({
                ...formData,
                selectedTests: [...formData.selectedTests, testId]
            })
        }
    }

    const handleSubmit = () => {
        if (!formData.name.trim()) {
            alert('Please enter a suite name')
            return
        }

        onSave({
            ...suite,
            name: formData.name,
            description: formData.description,
            testCases: formData.selectedTests,
            tags: formData.tags.split(',').map((t: string) => t.trim()).filter(Boolean)
        })
    }

    return (
        <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0,0,0,0.85)',
            backdropFilter: 'blur(8px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000
        }}
            onClick={onClose}>
            <div
                onClick={(e) => e.stopPropagation()}
                style={{
                    background: theme.bgSecondary,
                    border: `2px solid ${theme.primary}40`,
                    borderRadius: '20px',
                    maxWidth: '700px',
                    width: '90%',
                    maxHeight: '90vh',
                    overflow: 'auto'
                }}
            >
                {/* Header */}
                <div style={{
                    padding: '24px',
                    borderBottom: `1px solid ${theme.border}`,
                    display: 'flex',
                    justifyContent: 'space-between'
                }}>
                    <h2 style={{ margin: 0, color: theme.text }}>
                        {suite ? '✏️ Edit Suite' : '📦 Create Suite'}
                    </h2>
                    <button
                        onClick={onClose}
                        style={{
                            background: 'none',
                            border: 'none',
                            fontSize: '24px',
                            cursor: 'pointer',
                            color: theme.textSecondary
                        }}
                    >
                        ✕
                    </button>
                </div>

                {/* Body */}
                <div style={{ padding: '24px' }}>
                    {/* Name */}
                    <div style={{ marginBottom: '20px' }}>
                        <label style={{
                            display: 'block',
                            marginBottom: '8px',
                            fontSize: '14px',
                            fontWeight: '600',
                            color: theme.text
                        }}>
                            Suite Name *
                        </label>
                        <input
                            type="text"
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            placeholder="e.g., Smoke Tests"
                            style={{
                                width: '100%',
                                padding: '12px 16px',
                                background: theme.bgTertiary,
                                border: `1px solid ${theme.border}`,
                                borderRadius: '10px',
                                color: theme.text,
                                fontSize: '14px',
                                outline: 'none'
                            }}
                        />
                    </div>

                    {/* Description */}
                    <div style={{ marginBottom: '20px' }}>
                        <label style={{
                            display: 'block',
                            marginBottom: '8px',
                            fontSize: '14px',
                            fontWeight: '600',
                            color: theme.text
                        }}>
                            Description
                        </label>
                        <textarea
                            value={formData.description}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            placeholder="Describe this test suite..."
                            rows={3}
                            style={{
                                width: '100%',
                                padding: '12px 16px',
                                background: theme.bgTertiary,
                                border: `1px solid ${theme.border}`,
                                borderRadius: '10px',
                                color: theme.text,
                                fontSize: '14px',
                                outline: 'none',
                                resize: 'vertical',
                                fontFamily: 'inherit'
                            }}
                        />
                    </div>

                    {/* Select Tests */}
                    <div style={{ marginBottom: '20px' }}>
                        <label style={{
                            display: 'block',
                            marginBottom: '12px',
                            fontSize: '14px',
                            fontWeight: '600',
                            color: theme.text
                        }}>
                            Select Tests ({formData.selectedTests.length} selected)
                        </label>
                        <div style={{
                            maxHeight: '300px',
                            overflow: 'auto',
                            border: `1px solid ${theme.border}`,
                            borderRadius: '10px',
                            padding: '12px'
                        }}>
                            {testCases.length === 0 ? (
                                <div style={{
                                    textAlign: 'center',
                                    padding: '40px',
                                    color: theme.textSecondary
                                }}>
                                    No test cases available
                                </div>
                            ) : (
                                testCases.map((tc: TestCase) => (
                                    <label
                                        key={tc.id}
                                        style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            padding: '12px',
                                            background: formData.selectedTests.includes(tc.id)
                                                ? `${theme.primary}15`
                                                : theme.bgTertiary,
                                            borderRadius: '8px',
                                            marginBottom: '8px',
                                            cursor: 'pointer',
                                            border: formData.selectedTests.includes(tc.id)
                                                ? `1px solid ${theme.primary}40`
                                                : '1px solid transparent'
                                        }}
                                    >
                                        <input
                                            type="checkbox"
                                            checked={formData.selectedTests.includes(tc.id)}
                                            onChange={() => toggleTest(tc.id)}
                                            style={{ marginRight: '12px' }}
                                        />
                                        <span style={{ fontSize: '18px', marginRight: '10px' }}>
                                            {tc.type === 'mobile' ? '📱' : tc.type === 'web' ? '🌐' : '⚡'}
                                        </span>
                                        <span style={{ color: theme.text, fontSize: '14px' }}>
                                            {tc.name}
                                        </span>
                                    </label>
                                ))
                            )}
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div style={{
                    padding: '20px 24px',
                    borderTop: `1px solid ${theme.border}`,
                    display: 'flex',
                    justifyContent: 'flex-end',
                    gap: '12px'
                }}>
                    <button
                        onClick={onClose}
                        style={{
                            padding: '12px 24px',
                            background: theme.bgTertiary,
                            border: `1px solid ${theme.border}`,
                            borderRadius: '10px',
                            color: theme.text,
                            fontSize: '14px',
                            fontWeight: '600',
                            cursor: 'pointer'
                        }}
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSubmit}
                        style={{
                            padding: '12px 24px',
                            background: `linear-gradient(135deg, ${theme.primary}, ${theme.secondary})`,
                            border: 'none',
                            borderRadius: '10px',
                            color: '#fff',
                            fontSize: '14px',
                            fontWeight: '600',
                            cursor: 'pointer'
                        }}
                    >
                        {suite ? 'Update' : 'Create'} Suite
                    </button>
                </div>
            </div>
        </div>
    )
}

// Test History View Component
function TestHistoryView({ testRuns, testCases, testSuites, theme }: any) {
    const [filterStatus, setFilterStatus] = useState<'all' | 'passed' | 'failed' | 'running'>('all')

    const filteredRuns = testRuns.filter((run: TestRun) =>
        filterStatus === 'all' || run.status === filterStatus
    ).reverse()

    return (
        <div>
            {/* Header */}
            <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '24px'
            }}>
                <h2 style={{ margin: 0, fontSize: '20px', color: theme.text }}>
                    Test Execution History
                </h2>

                <select
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value as any)}
                    style={{
                        padding: '12px 18px',
                        background: theme.bgSecondary,
                        border: `1px solid ${theme.border}`,
                        borderRadius: '10px',
                        color: theme.text,
                        fontSize: '14px',
                        cursor: 'pointer'
                    }}
                >
                    <option value="all">All Status</option>
                    <option value="passed">✅ Passed</option>
                    <option value="failed">❌ Failed</option>
                    <option value="running">⏳ Running</option>
                </select>
            </div>

            {/* History List */}
            {filteredRuns.length === 0 ? (
                <div style={{
                    textAlign: 'center',
                    padding: '80px 20px',
                    background: theme.bgSecondary,
                    borderRadius: '16px',
                    border: `1px solid ${theme.border}`
                }}>
                    <div style={{ fontSize: '64px', marginBottom: '16px', opacity: 0.3 }}>📊</div>
                    <h3 style={{ color: theme.text, marginBottom: '8px' }}>No Test Runs Found</h3>
                    <p style={{ color: theme.textSecondary }}>
                        {filterStatus !== 'all' ? 'No runs with this status' : 'Execute tests to see results here'}
                    </p>
                </div>
            ) : (
                <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '16px'
                }}>
                    {filteredRuns.map((run: TestRun) => (
                        <TestRunCard key={run.id} run={run} theme={theme} />
                    ))}
                </div>
            )}
        </div>
    )
}

// Test Run Card
function TestRunCard({ run, theme }: any) {
    const [expanded, setExpanded] = useState(false)

    const statusConfig = {
        passed: { color: theme.success, icon: '✅', label: 'PASSED' },
        failed: { color: theme.error, icon: '❌', label: 'FAILED' },
        running: { color: theme.warning, icon: '⏳', label: 'RUNNING' },
        pending: { color: theme.textSecondary, icon: '⏸️', label: 'PENDING' }
    }

    const config = statusConfig[run.status as keyof typeof statusConfig]

    return (
        <div style={{
            background: theme.bgSecondary,
            border: `1px solid ${theme.border}`,
            borderRadius: '16px',
            overflow: 'hidden'
        }}>
            {/* Header */}
            <div
                onClick={() => setExpanded(!expanded)}
                style={{
                    padding: '20px 24px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    cursor: 'pointer',
                    transition: 'background 0.2s'
                }}
                onMouseEnter={(e) => e.currentTarget.style.background = theme.bgTertiary}
                onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
            >
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <span style={{ fontSize: '24px' }}>{config.icon}</span>
                    <div>
                        <div style={{
                            color: theme.text,
                            fontSize: '16px',
                            fontWeight: '600',
                            marginBottom: '4px'
                        }}>
                            {new Date(run.startTime).toLocaleString()}
                        </div>
                        <div style={{
                            color: theme.textSecondary,
                            fontSize: '13px'
                        }}>
                            Duration: {run.duration ? `${run.duration}ms` : 'N/A'}
                        </div>
                    </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <span style={{
                        padding: '6px 16px',
                        background: `${config.color}20`,
                        color: config.color,
                        borderRadius: '8px',
                        fontSize: '12px',
                        fontWeight: '700'
                    }}>
                        {config.label}
                    </span>
                    <span style={{ fontSize: '20px', color: theme.textSecondary }}>
                        {expanded ? '▼' : '▶'}
                    </span>
                </div>
            </div>

            {/* Details (expanded) */}
            {expanded && (
                <div style={{
                    padding: '20px 24px',
                    borderTop: `1px solid ${theme.border}`,
                    background: theme.bgTertiary
                }}>
                    {/* Results Summary */}
                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(4, 1fr)',
                        gap: '16px',
                        marginBottom: '20px'
                    }}>
                        <div style={{ textAlign: 'center' }}>
                            <div style={{
                                fontSize: '24px',
                                fontWeight: '700',
                                color: theme.text
                            }}>
                                {run.results.total}
                            </div>
                            <div style={{
                                fontSize: '12px',
                                color: theme.textSecondary
                            }}>
                                Total
                            </div>
                        </div>
                        <div style={{ textAlign: 'center' }}>
                            <div style={{
                                fontSize: '24px',
                                fontWeight: '700',
                                color: theme.success
                            }}>
                                {run.results.passed}
                            </div>
                            <div style={{
                                fontSize: '12px',
                                color: theme.textSecondary
                            }}>
                                Passed
                            </div>
                        </div>
                        <div style={{ textAlign: 'center' }}>
                            <div style={{
                                fontSize: '24px',
                                fontWeight: '700',
                                color: theme.error
                            }}>
                                {run.results.failed}
                            </div>
                            <div style={{
                                fontSize: '12px',
                                color: theme.textSecondary
                            }}>
                                Failed
                            </div>
                        </div>
                        <div style={{ textAlign: 'center' }}>
                            <div style={{
                                fontSize: '24px',
                                fontWeight: '700',
                                color: theme.warning
                            }}>
                                {run.results.skipped}
                            </div>
                            <div style={{
                                fontSize: '12px',
                                color: theme.textSecondary
                            }}>
                                Skipped
                            </div>
                        </div>
                    </div>

                    {/* Error Logs */}
                    {run.errorLog && run.errorLog.length > 0 && (
                        <div>
                            <h4 style={{
                                margin: '0 0 12px',
                                fontSize: '14px',
                                color: theme.text
                            }}>
                                ⚠️ Error Log:
                            </h4>
                            <div style={{
                                background: theme.bg,
                                border: `1px solid ${theme.border}`,
                                borderRadius: '8px',
                                padding: '12px',
                                maxHeight: '200px',
                                overflow: 'auto'
                            }}>
                                {run.errorLog.map((error: string, idx: number) => (
                                    <div
                                        key={idx}
                                        style={{
                                            color: theme.error,
                                            fontSize: '12px',
                                            fontFamily: 'monospace',
                                            marginBottom: '6px'
                                        }}
                                    >
                                        {error}
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    )
}
