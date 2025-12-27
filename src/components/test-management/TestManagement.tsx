import { useState, useEffect } from 'react'
import axios from 'axios'
import { useLocalStorage } from '../../hooks/useLocalStorage'

// Types
export interface TestCase {
    id: string
    name: string
    description: string
    type: 'mobile' | 'web' | 'api'
    status: 'draft' | 'ready' | 'archived'
    steps: any[]
    createdAt: number
    updatedAt: number
    tags: string[]
    flowId?: string  // Reference to saved flow
    deviceInfo?: {
        name: string
        id: string
    }
    appInfo?: {
        name: string
        package: string
        version: string
    }
}

export interface TestSuite {
    id: string
    name: string
    description: string
    testCases: string[] // IDs of test cases
    createdAt: number
    updatedAt: number
    tags: string[]
}

export interface TestRun {
    id: string
    suiteId?: string
    testCaseId?: string
    status: 'running' | 'passed' | 'failed' | 'pending'
    startTime: number
    endTime?: number
    duration?: number
    results: {
        total: number
        passed: number
        failed: number
        skipped: number
    }
    errorLog?: string[]
}

type ViewMode = 'dashboard' | 'cases' | 'suites' | 'history'

const theme = {
    primary: '#8b5cf6',
    secondary: '#06b6d4',
    success: '#10b981',
    error: '#ef4444',
    warning: '#f59e0b',
    bg: '#0d1117',
    bgSecondary: '#161b22',
    bgTertiary: '#21262d',
    text: '#e6edf3',
    textSecondary: '#8b949e',
    border: '#30363d'
}

export default function TestManagement() {
    const [viewMode, setViewMode] = useState<ViewMode>('dashboard')
    const [testCases, setTestCases] = useLocalStorage<TestCase[]>('test_cases', [])
    const [testSuites, setTestSuites] = useLocalStorage<TestSuite[]>('test_suites', [])
    const [testRuns, setTestRuns] = useLocalStorage<TestRun[]>('test_runs', [])
    const [selectedSuite, setSelectedSuite] = useState<string | null>(null)
    const [selectedCase, setSelectedCase] = useState<string | null>(null)
    const [showCreateModal, setShowCreateModal] = useState(false)
    const [createType, setCreateType] = useState<'case' | 'suite'>('case')

    // Stats calculations
    const totalTests = testCases.length
    const totalSuites = testSuites.length
    const recentRuns = testRuns.slice(-10)
    const passRate = testRuns.length > 0
        ? Math.round((testRuns.filter(r => r.status === 'passed').length / testRuns.length) * 100)
        : 0

    const typeColors = {
        mobile: '#8b5cf6',
        web: '#06b6d4',
        api: '#10b981'
    }

    const statusColors = {
        draft: '#6b7280',
        ready: '#10b981',
        archived: '#f59e0b',
        running: '#06b6d4',
        passed: '#10b981',
        failed: '#ef4444',
        pending: '#f59e0b'
    }

    // View navigation buttons
    const NavButton = ({ mode, icon, label, count }: {
        mode: ViewMode
        icon: string
        label: string
        count?: number
    }) => (
        <button
            onClick={() => setViewMode(mode)}
            style={{
                padding: '14px 24px',
                background: viewMode === mode
                    ? `linear-gradient(135deg, ${theme.primary}, ${theme.secondary})`
                    : theme.bgSecondary,
                border: viewMode === mode
                    ? `2px solid ${theme.primary}`
                    : `2px solid ${theme.border}`,
                borderRadius: '12px',
                color: viewMode === mode ? '#fff' : theme.text,
                fontSize: '14px',
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'all 0.3s',
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                position: 'relative'
            }}
            onMouseEnter={(e) => {
                if (viewMode !== mode) {
                    e.currentTarget.style.borderColor = theme.primary
                    e.currentTarget.style.transform = 'translateY(-2px)'
                }
            }}
            onMouseLeave={(e) => {
                if (viewMode !== mode) {
                    e.currentTarget.style.borderColor = theme.border
                    e.currentTarget.style.transform = 'translateY(0)'
                }
            }}
        >
            <span style={{ fontSize: '20px' }}>{icon}</span>
            <span>{label}</span>
            {count !== undefined && (
                <span style={{
                    background: viewMode === mode ? 'rgba(255,255,255,0.2)' : theme.bgTertiary,
                    padding: '2px 10px',
                    borderRadius: '10px',
                    fontSize: '12px',
                    fontWeight: '700'
                }}>
                    {count}
                </span>
            )}
        </button>
    )

    return (
        <div style={{
            width: '100%',
            height: '100vh',
            display: 'flex',
            flexDirection: 'column',
            background: theme.bg,
            overflow: 'hidden',
            position: 'relative'
        }}>
            {/* Animated Background */}
            <div style={{
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                background: `
                    radial-gradient(circle at 25% 35%, rgba(139, 92, 246, 0.1) 0%, transparent 50%),
                    radial-gradient(circle at 75% 65%, rgba(6, 182, 212, 0.08) 0%, transparent 50%),
                    linear-gradient(135deg, ${theme.bg} 0%, #0d1117 50%, ${theme.bg} 100%)
                `,
                pointerEvents: 'none',
                animation: 'gradientShift 20s ease infinite',
                zIndex: 0
            }}></div>

            {/* Header */}
            <div style={{
                padding: '24px 32px',
                borderBottom: `1px solid ${theme.border}`,
                background: theme.bgSecondary,
                position: 'relative',
                zIndex: 1
            }}>
                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between'
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                        <div style={{
                            fontSize: '42px',
                            filter: `drop-shadow(0 0 16px ${theme.primary})`
                        }}>📋</div>
                        <div>
                            <h1 style={{
                                margin: 0,
                                fontSize: '28px',
                                fontWeight: '700',
                                background: `linear-gradient(135deg, ${theme.primary}, ${theme.secondary})`,
                                WebkitBackgroundClip: 'text',
                                WebkitTextFillColor: 'transparent',
                                letterSpacing: '-0.5px'
                            }}>
                                Test Management
                            </h1>
                            <p style={{
                                margin: '4px 0 0',
                                fontSize: '14px',
                                color: theme.textSecondary
                            }}>
                                Organize, Execute & Track Your Tests • Mobile • Web • API
                            </p>
                        </div>
                    </div>

                    {/* Quick Stats */}
                    <div style={{ display: 'flex', gap: '20px' }}>
                        <div style={{
                            textAlign: 'center',
                            padding: '12px 24px',
                            background: `linear-gradient(135deg, ${theme.bgTertiary}, ${theme.bgSecondary})`,
                            border: `1px solid ${theme.border}`,
                            borderRadius: '12px'
                        }}>
                            <div style={{
                                fontSize: '24px',
                                fontWeight: '700',
                                color: theme.primary
                            }}>{totalTests}</div>
                            <div style={{
                                fontSize: '12px',
                                color: theme.textSecondary,
                                fontWeight: '600'
                            }}>Test Cases</div>
                        </div>
                        <div style={{
                            textAlign: 'center',
                            padding: '12px 24px',
                            background: `linear-gradient(135deg, ${theme.bgTertiary}, ${theme.bgSecondary})`,
                            border: `1px solid ${theme.border}`,
                            borderRadius: '12px'
                        }}>
                            <div style={{
                                fontSize: '24px',
                                fontWeight: '700',
                                color: theme.secondary
                            }}>{totalSuites}</div>
                            <div style={{
                                fontSize: '12px',
                                color: theme.textSecondary,
                                fontWeight: '600'
                            }}>Test Suites</div>
                        </div>
                        <div style={{
                            textAlign: 'center',
                            padding: '12px 24px',
                            background: `linear-gradient(135deg, ${theme.bgTertiary}, ${theme.bgSecondary})`,
                            border: `1px solid ${theme.border}`,
                            borderRadius: '12px'
                        }}>
                            <div style={{
                                fontSize: '24px',
                                fontWeight: '700',
                                color: passRate >= 80 ? theme.success : passRate >= 50 ? theme.warning : theme.error
                            }}>{passRate}%</div>
                            <div style={{
                                fontSize: '12px',
                                color: theme.textSecondary,
                                fontWeight: '600'
                            }}>Pass Rate</div>
                        </div>
                    </div>
                </div>

                {/* Navigation */}
                <div style={{
                    marginTop: '24px',
                    display: 'flex',
                    gap: '12px',
                    flexWrap: 'wrap'
                }}>
                    <NavButton mode="dashboard" icon="📊" label="Dashboard" />
                    <NavButton mode="cases" icon="✅" label="Test Cases" count={totalTests} />
                    <NavButton mode="suites" icon="📦" label="Test Suites" count={totalSuites} />
                    <NavButton mode="history" icon="⏱️" label="Run History" count={testRuns.length} />
                </div>
            </div>

            {/* Main Content */}
            <div style={{
                flex: 1,
                overflow: 'auto',
                padding: '32px',
                position: 'relative',
                zIndex: 1
            }}>
                {viewMode === 'dashboard' && (
                    <DashboardView
                        testCases={testCases}
                        testSuites={testSuites}
                        testRuns={testRuns}
                        theme={theme}
                    />
                )}
                {viewMode === 'cases' && (
                    <TestCasesView
                        testCases={testCases}
                        setTestCases={setTestCases}
                        theme={theme}
                    />
                )}
                {viewMode === 'suites' && (
                    <TestSuitesView
                        testSuites={testSuites}
                        setTestSuites={setTestSuites}
                        testCases={testCases}
                        theme={theme}
                    />
                )}
                {viewMode === 'history' && (
                    <TestHistoryView
                        testRuns={testRuns}
                        testCases={testCases}
                        testSuites={testSuites}
                        theme={theme}
                    />
                )}
            </div>
        </div>
    )
}

// Dashboard View Component
function DashboardView({ testCases, testSuites, testRuns, theme }: any) {
    const typeBreakdown = {
        mobile: testCases.filter((t: TestCase) => t.type === 'mobile').length,
        web: testCases.filter((t: TestCase) => t.type === 'web').length,
        api: testCases.filter((t: TestCase) => t.type === 'api').length
    }

    const recentRuns = testRuns.slice(-5).reverse()

    return (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '24px' }}>
            {/* Test Type Breakdown */}
            <div style={{
                background: theme.bgSecondary,
                border: `1px solid ${theme.border}`,
                borderRadius: '16px',
                padding: '24px'
            }}>
                <h3 style={{
                    margin: '0 0 20px',
                    fontSize: '18px',
                    color: theme.text,
                    fontWeight: '600'
                }}>📊 Test Distribution</h3>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {Object.entries(typeBreakdown).map(([type, count]) => (
                        <div key={type} style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            padding: '12px',
                            background: theme.bgTertiary,
                            borderRadius: '10px'
                        }}>
                            <span style={{
                                textTransform: 'capitalize',
                                color: theme.text,
                                fontWeight: '600'
                            }}>
                                {type === 'mobile' && '📱'}
                                {type === 'web' && '🌐'}
                                {type === 'api' && '⚡'} {type}
                            </span>
                            <span style={{
                                fontSize: '20px',
                                fontWeight: '700',
                                color: type === 'mobile' ? '#8b5cf6' : type === 'web' ? '#06b6d4' : '#10b981'
                            }}>{count as number}</span>
                        </div>
                    ))}
                </div>
            </div>

            {/* Recent Test Runs */}
            <div style={{
                background: theme.bgSecondary,
                border: `1px solid ${theme.border}`,
                borderRadius: '16px',
                padding: '24px'
            }}>
                <h3 style={{
                    margin: '0 0 20px',
                    fontSize: '18px',
                    color: theme.text,
                    fontWeight: '600'
                }}>⏱️ Recent Runs</h3>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {recentRuns.length === 0 ? (
                        <div style={{
                            textAlign: 'center',
                            padding: '40px',
                            color: theme.textSecondary
                        }}>No test runs yet</div>
                    ) : (
                        recentRuns.map((run: TestRun) => (
                            <div key={run.id} style={{
                                padding: '12px',
                                background: theme.bgTertiary,
                                borderRadius: '10px',
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center'
                            }}>
                                <span style={{ color: theme.text, fontSize: '14px' }}>
                                    {new Date(run.startTime).toLocaleString()}
                                </span>
                                <span style={{
                                    padding: '4px 12px',
                                    borderRadius: '6px',
                                    fontSize: '12px',
                                    fontWeight: '700',
                                    background: run.status === 'passed' ? theme.success :
                                        run.status === 'failed' ? theme.error : theme.warning,
                                    color: '#fff'
                                }}>
                                    {run.status.toUpperCase()}
                                </span>
                            </div>
                        ))
                    )}
                </div>
            </div>

            {/* Quick Actions */}
            <div style={{
                gridColumn: '1 / -1',
                background: theme.bgSecondary,
                border: `1px solid ${theme.border}`,
                borderRadius: '16px',
                padding: '24px'
            }}>
                <h3 style={{
                    margin: '0 0 20px',
                    fontSize: '18px',
                    color: theme.text,
                    fontWeight: '600'
                }}>🚀 Quick Actions</h3>

                <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
                    <ActionButton icon="➕" label="New Test Case" theme={theme} />
                    <ActionButton icon="📦" label="New Suite" theme={theme} />
                    <ActionButton icon="▶️" label="Run Tests" theme={theme} variant="primary" />
                    <ActionButton icon="📥" label="Import Tests" theme={theme} />
                    <ActionButton icon="📤" label="Export Results" theme={theme} />
                </div>
            </div>
        </div>
    )
}

function ActionButton({ icon, label, theme, variant = 'default' }: any) {
    return (
        <button style={{
            padding: '14px 24px',
            background: variant === 'primary'
                ? `linear-gradient(135deg, ${theme.primary}, ${theme.secondary})`
                : theme.bgTertiary,
            border: variant === 'primary'
                ? 'none'
                : `1px solid ${theme.border}`,
            borderRadius: '12px',
            color: variant === 'primary' ? '#fff' : theme.text,
            fontSize: '14px',
            fontWeight: '600',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            transition: 'all 0.3s'
        }}
            onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-2px)'
                e.currentTarget.style.boxShadow = '0 8px 20px rgba(0,0,0,0.3)'
            }}
            onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)'
                e.currentTarget.style.boxShadow = 'none'
            }}>
            <span style={{ fontSize: '18px' }}>{icon}</span>
            <span>{label}</span>
        </button>
    )
}

// Test Cases View Component
function TestCasesView({ testCases, setTestCases, theme }: any) {
    const [searchQuery, setSearchQuery] = useState('')
    const [filterType, setFilterType] = useState<'all' | 'mobile' | 'web' | 'api'>('all')
    const [filterStatus, setFilterStatus] = useState<'all' | 'draft' | 'ready' | 'archived'>('all')
    const [showCreateModal, setShowCreateModal] = useState(false)
    const [editingCase, setEditingCase] = useState<TestCase | null>(null)

    // Phase 4.4: Enhanced Filters
    const [filterPriority, setFilterPriority] = useState<'all' | 'low' | 'medium' | 'high'>('all')
    const [filterRiskArea, setFilterRiskArea] = useState<string>('all')
    const [sortBy, setSortBy] = useState<'name' | 'createdAt' | 'updatedAt'>('updatedAt')
    const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')

    // Phase 4.1: Run Test States
    const [showRunDialog, setShowRunDialog] = useState(false)
    const [testToRun, setTestToRun] = useState<TestCase | null>(null)
    const [selectedDevice, setSelectedDevice] = useState<string>('')
    const [showDeviceDetail, setShowDeviceDetail] = useState(false)
    const [deviceDetailData, setDeviceDetailData] = useState<any>(null)
    const [availableDevices, setAvailableDevices] = useState<any[]>([])
    const [playbackSettings, setPlaybackSettings] = useState({
        restartApp: true,
        clearData: false,
        retryPerStep: 1,
        failureBehaviour: 'stop' as 'stop' | 'skip' | 'continue',
        captureScreenshots: true
    })
    const [runningFlowId, setRunningFlowId] = useState<string | null>(null)
    const [executionResults, setExecutionResults] = useState<any>(null)
    const [showResultsModal, setShowResultsModal] = useState(false)

    // Phase 4.2: Batch Execution States
    const [selectedTests, setSelectedTests] = useState<Set<string>>(new Set())
    const [selectAll, setSelectAll] = useState(false)
    const [batchRunning, setBatchRunning] = useState(false)
    const [batchProgress, setBatchProgress] = useState({
        current: 0,
        total: 0,
        currentTest: '',
        results: [] as any[]
    })
    const [showBatchResults, setShowBatchResults] = useState(false)

    // Phase 4.4: Enhanced Filter & Sort Logic
    const filteredCases = testCases
        .filter((tc: TestCase) => {
            // Search filter (name, description, tags)
            const matchesSearch = tc.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                tc.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
                (tc.tags && tc.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase())))

            // Type filter
            const matchesType = filterType === 'all' || tc.type === filterType

            // Status filter
            const matchesStatus = filterStatus === 'all' || tc.status === filterStatus

            // Priority filter (from Phase 2 metadata)
            const matchesPriority = filterPriority === 'all' ||
                (tc as any).priority === filterPriority

            // Risk area filter (from Phase 2 metadata)
            const matchesRiskArea = filterRiskArea === 'all' ||
                (tc as any).riskArea === filterRiskArea

            return matchesSearch && matchesType && matchesStatus && matchesPriority && matchesRiskArea
        })
        .sort((a, b) => {
            let comparison = 0

            if (sortBy === 'name') {
                comparison = a.name.localeCompare(b.name)
            } else if (sortBy === 'createdAt') {
                comparison = a.createdAt - b.createdAt
            } else if (sortBy === 'updatedAt') {
                comparison = a.updatedAt - b.updatedAt
            }

            return sortOrder === 'asc' ? comparison : -comparison
        })

    // Get unique risk areas for filter dropdown
    const uniqueRiskAreas = ['all', ...new Set(
        testCases
            .map((tc: any) => tc.riskArea)
            .filter((area: any) => area)
    )]

    const handleCreate = (newCase: Partial<TestCase>) => {
        const testCase: TestCase = {
            id: Date.now().toString(),
            name: newCase.name || '',
            description: newCase.description || '',
            type: newCase.type || 'mobile',
            status: 'draft',
            steps: [],
            createdAt: Date.now(),
            updatedAt: Date.now(),
            tags: newCase.tags || []
        }
        setTestCases([...testCases, testCase])
        setShowCreateModal(false)
    }

    // Phase 4.1: Fetch available devices on mount
    useEffect(() => {
        const fetchDevices = async () => {
            try {
                const res = await axios.get('http://localhost:8000/api/devices')
                // Backend returns array directly, not wrapped in {devices: [...]}
                const deviceList = Array.isArray(res.data) ? res.data : (res.data.devices || [])
                setAvailableDevices(deviceList)

                // Auto-select first CONNECTED device if available
                const connectedDevices = deviceList.filter((d: any) => d.is_connected)
                if (connectedDevices && connectedDevices.length > 0) {
                    setSelectedDevice(connectedDevices[0].device_id)
                    console.log('[Devices] ✅ Auto-selected:', connectedDevices[0].name)
                }

                console.log('[Devices] ✅ Fetched devices:', deviceList)
                console.log('[Devices] 🟢 Connected:', connectedDevices.length, '/ Total:', deviceList.length)
            } catch (error) {
                console.error('[Devices] Failed to fetch:', error)
            }
        }
        fetchDevices()
    }, [])

    const handleEdit = (updatedCase: TestCase) => {
        setTestCases(testCases.map((tc: TestCase) =>
            tc.id === updatedCase.id ? { ...updatedCase, updatedAt: Date.now() } : tc
        ))
        setEditingCase(null)
    }

    const handleDelete = (id: string) => {
        if (confirm('Are you sure you want to delete this test case?')) {
            setTestCases(testCases.filter((tc: TestCase) => tc.id !== id))
        }
    }

    // Import Flows from Mobile Testing
    const [isImporting, setIsImporting] = useState(false)
    const [importStatus, setImportStatus] = useState('')

    const handleImportFlows = async () => {
        console.log('[Import] 🚀 Starting flow import...')
        setIsImporting(true)
        setImportStatus('Fetching saved flows from Mobile Testing...')

        try {
            console.log('[Import] 📡 Fetching from: http://localhost:8000/api/flows/')
            const res = await axios.get('http://localhost:8000/api/flows/')
            const flows = res.data

            console.log('[Import] ✅ Response received:', flows)
            console.log('[Import] 📊 Total flows found:', flows.length)

            if (flows.length === 0) {
                console.log('[Import] ⚠️ No flows in database')
                setImportStatus('No flows found in Mobile Testing')
                setTimeout(() => {
                    setIsImporting(false)
                    setImportStatus('')
                }, 2000)
                return
            }

            // Convert flows to test cases
            console.log('[Import] 🔄 Converting flows to test cases...')
            const newTestCases: TestCase[] = flows.map((flow: any) => {
                console.log(`[Import] Processing flow: ${flow.name}`)
                return {
                    id: flow.id.toString(),
                    name: flow.name,
                    description: flow.description || `Automated test - ${flow.steps?.length || 0} steps`,
                    type: 'mobile' as const,
                    status: 'ready' as const,
                    steps: flow.steps || [],
                    createdAt: flow.created_at ? new Date(flow.created_at).getTime() : Date.now(),
                    updatedAt: Date.now(),
                    tags: ['synced', 'flow', flow.app_info?.name || flow.app_name || 'mobile'].filter(Boolean),
                    flowId: flow.id.toString(),
                    deviceInfo: {
                        name: flow.device_info?.name || flow.device_name || 'Unknown Device',
                        id: flow.device_info?.device_id || flow.device_id || ''
                    },
                    appInfo: {
                        name: flow.app_info?.name || flow.app_name || 'Unknown App',
                        package: flow.app_info?.package || flow.app_package || '',
                        version: flow.app_info?.version || flow.app_version || ''
                    }
                }
            })

            console.log('[Import] 📦 Converted test cases:', newTestCases)

            // Merge with existing test cases (avoid duplicates)
            const existingFlowIds = testCases.filter((tc: TestCase) => tc.flowId).map((tc: TestCase) => tc.flowId)
            const uniqueNewCases = newTestCases.filter(nc => !existingFlowIds.includes(nc.flowId))

            console.log('[Import] 🔍 Existing flow IDs:', existingFlowIds)
            console.log('[Import] ✨ Unique new cases:', uniqueNewCases.length)

            if (uniqueNewCases.length === 0) {
                console.log('[Import] ℹ️ All flows already imported')
                setImportStatus('All flows already imported!')
                setTimeout(() => {
                    setIsImporting(false)
                    setImportStatus('')
                }, 2000)
                return
            }

            console.log('[Import] 💾 Saving to state...')
            setTestCases([...testCases, ...uniqueNewCases])
            setImportStatus(`✅ Imported ${uniqueNewCases.length} flow(s) successfully!`)
            console.log('[Import] 🎉 Import complete!')

            setTimeout(() => {
                setIsImporting(false)
                setImportStatus('')
            }, 3000)

        } catch (error: any) {
            console.error('[Import] ❌ Error:', error)
            console.error('[Import] Error details:', error.response?.data)
            setImportStatus('❌ Import failed: ' + (error.response?.data?.detail || error.message))
            setTimeout(() => {
                setIsImporting(false)
                setImportStatus('')
            }, 3000)
        }
    }

    // Phase 4.1: RUN FLOW HANDLER (Updated - opens dialog)
    const handleRunFlow = (testCase: TestCase) => {
        if (!testCase.flowId) {
            alert('❌ Missing flow ID! This test cannot be run.')
            return
        }

        // Open run dialog with test details
        setTestToRun(testCase)
        setShowRunDialog(true)
    }

    // Phase 4.1: EXECUTE TEST WITH SETTINGS
    const handleExecuteTest = async () => {
        if (!testToRun || !selectedDevice) {
            alert('❌ Please select a device!')
            return
        }

        setRunningFlowId(testToRun.id)
        setShowRunDialog(false)

        try {
            console.log(`[Run] 🚀 Executing: ${testToRun.name}`)

            const res = await axios.post('http://localhost:8000/api/playback/start', {
                flow_id: parseInt(testToRun.flowId!),
                device_id: selectedDevice,
                settings: playbackSettings  // Phase 3 settings
            })

            console.log('[Run] ✅ Complete!', res.data)

            // Store results and show modal
            setExecutionResults(res.data)
            setShowResultsModal(true)

        } catch (error: any) {
            console.error('[Run] ❌ Error:', error)
            alert('❌ Execution failed: ' + (error.response?.data?.detail || error.message))
        } finally {
            setRunningFlowId(null)
        }
    }

    // Phase 4.2: BATCH EXECUTION HANDLERS
    const handleToggleTest = (testId: string) => {
        const newSelected = new Set(selectedTests)
        if (newSelected.has(testId)) {
            newSelected.delete(testId)
        } else {
            newSelected.add(testId)
        }
        setSelectedTests(newSelected)
    }

    const handleSelectAll = () => {
        if (selectAll) {
            setSelectedTests(new Set())
            setSelectAll(false)
        } else {
            setSelectedTests(new Set(filteredCases.map((tc: TestCase) => tc.id)))
            setSelectAll(true)
        }
    }

    const handleBatchRun = async () => {
        if (selectedTests.size === 0) {
            alert('❌ No tests selected!')
            return
        }

        if (!selectedDevice || availableDevices.length === 0) {
            alert('❌ Please select a device first!')
            return
        }

        setBatchRunning(true)
        const results: any[] = []
        let current = 0

        for (const testId of selectedTests) {
            const test = testCases.find((tc: TestCase) => tc.id === testId)
            if (!test || !test.flowId) {
                results.push({
                    testId,
                    testName: test?.name || 'Unknown',
                    status: 'skipped',
                    error: 'No flow ID'
                })
                continue
            }

            current++
            setBatchProgress({
                current,
                total: selectedTests.size,
                currentTest: test.name,
                results: [...results]
            })

            try {
                console.log(`[Batch ${current}/${selectedTests.size}] Running: ${test.name}`)

                const res = await axios.post('http://localhost:8000/api/playback/start', {
                    flow_id: parseInt(test.flowId),
                    device_id: selectedDevice,
                    settings: playbackSettings
                })

                results.push({
                    testId: test.id,
                    testName: test.name,
                    status: 'success',
                    ...res.data
                })
            } catch (error: any) {
                results.push({
                    testId: test.id,
                    testName: test.name,
                    status: 'error',
                    error: error.response?.data?.detail || error.message
                })
            }

            // Small delay between tests
            if (current < selectedTests.size) {
                await new Promise(resolve => setTimeout(resolve, 1000))
            }
        }

        setBatchProgress({
            current,
            total: selectedTests.size,
            currentTest: '',
            results
        })
        setBatchRunning(false)
        setShowBatchResults(true)
        setSelectedTests(new Set())
        setSelectAll(false)
    }

    // 💻 CONVERT TO CODE HANDLER
    const handleConvertToCode = async (testCase: TestCase, language: string = 'python') => {
        if (!testCase.steps || testCase.steps.length === 0) {
            alert('❌ No steps to convert!')
            return
        }

        try {
            console.log(`[CodeGen] 💻 Generating ${language} code...`)
            const res = await axios.post('http://localhost:8000/api/codegen/generate', {
                actions: testCase.steps,
                language: language
            })

            console.log('[CodeGen] ✅ Generated!')

            localStorage.setItem('generatedCode', res.data.code)
            localStorage.setItem('generatedLanguage', language)

            window.dispatchEvent(new CustomEvent('openCodeEditor', {
                detail: {
                    code: res.data.code,
                    language: language
                }
            }))

            alert(`✅ Code generated!\n\nOpening in Code Editor...`)
        } catch (error: any) {
            console.error('[CodeGen] ❌ Error:', error)
            alert('❌ Code generation failed: ' + (error.response?.data?.detail || error.message))
        }
    }

    // 📦 APK UPLOAD MODAL STATE
    const [showApkUpload, setShowApkUpload] = useState(false)
    const [selectedTestCase, setSelectedTestCase] = useState<TestCase | null>(null)

    const handleOpenApkUpload = (testCase: TestCase) => {
        setSelectedTestCase(testCase)
        setShowApkUpload(true)
    }

    return (
        <div>
            {/* Header & Filters */}
            <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '24px',
                gap: '20px'
            }}>
                {/* Search */}
                <input
                    type="text"
                    placeholder="🔍 Search test cases..."
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

                {/* Type Filter */}
                <select
                    value={filterType}
                    onChange={(e) => setFilterType(e.target.value as any)}
                    style={{
                        padding: '14px 18px',
                        background: theme.bgSecondary,
                        border: `1px solid ${theme.border}`,
                        borderRadius: '12px',
                        color: theme.text,
                        fontSize: '14px',
                        cursor: 'pointer'
                    }}
                >
                    <option value="all">All Types</option>
                    <option value="mobile">📱 Mobile</option>
                    <option value="web">🌐 Web</option>
                    <option value="api">⚡ API</option>
                </select>

                {/* Status Filter */}
                <select
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value as any)}
                    style={{
                        padding: '14px 18px',
                        background: theme.bgSecondary,
                        border: `1px solid ${theme.border}`,
                        borderRadius: '12px',
                        color: theme.text,
                        fontSize: '14px',
                        cursor: 'pointer'
                    }}
                >
                    <option value="all">All Status</option>
                    <option value="draft">Draft</option>
                    <option value="ready">Ready</option>
                    <option value="archived">Archived</option>
                </select>

                {/* Phase 4.4: Priority Filter */}
                <select
                    value={filterPriority}
                    onChange={(e) => setFilterPriority(e.target.value as any)}
                    style={{
                        padding: '14px 18px',
                        background: theme.bgSecondary,
                        border: `1px solid ${theme.border}`,
                        borderRadius: '12px',
                        color: theme.text,
                        fontSize: '14px',
                        cursor: 'pointer'
                    }}
                >
                    <option value="all">All Priorities</option>
                    <option value="high">🔴 High</option>
                    <option value="medium">🟡 Medium</option>
                    <option value="low">🟢 Low</option>
                </select>

                {/* Phase 4.4: Risk Area Filter */}
                <select
                    value={filterRiskArea}
                    onChange={(e) => setFilterRiskArea(e.target.value)}
                    style={{
                        padding: '14px 18px',
                        background: theme.bgSecondary,
                        border: `1px solid ${theme.border}`,
                        borderRadius: '12px',
                        color: theme.text,
                        fontSize: '14px',
                        cursor: 'pointer'
                    }}
                >
                    <option value="all">All Risk Areas</option>
                    {uniqueRiskAreas.slice(1).map((area: string) => (
                        <option key={area} value={area}>{area}</option>
                    ))}
                </select>

                {/* Phase 4.4: Sort Controls */}
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    <select
                        value={sortBy}
                        onChange={(e) => setSortBy(e.target.value as any)}
                        style={{
                            padding: '14px 18px',
                            background: theme.bgSecondary,
                            border: `1px solid ${theme.border}`,
                            borderRadius: '12px',
                            color: theme.text,
                            fontSize: '14px',
                            cursor: 'pointer'
                        }}
                    >
                        <option value="updatedAt">📅 Last Modified</option>
                        <option value="createdAt">📅 Date Created</option>
                        <option value="name">🔤 Name</option>
                    </select>

                    <button
                        onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                        style={{
                            padding: '14px',
                            background: theme.bgSecondary,
                            border: `1px solid ${theme.border}`,
                            borderRadius: '12px',
                            color: theme.text,
                            fontSize: '16px',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            minWidth: '48px'
                        }}
                        title={sortOrder === 'asc' ? 'Ascending' : 'Descending'}
                    >
                        {sortOrder === 'asc' ? '⬆️' : '⬇️'}
                    </button>
                </div>

                {/* Create Button */}
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
                        gap: '8px',
                        transition: 'all 0.3s'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
                    onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
                >
                    <span>➕</span> New Test Case
                </button>

                {/* Import Flows Button */}
                <button
                    onClick={handleImportFlows}
                    disabled={isImporting}
                    style={{
                        padding: '14px 28px',
                        background: isImporting
                            ? theme.bgTertiary
                            : `linear-gradient(135deg, ${theme.secondary}, #0891b2)`,
                        border: 'none',
                        borderRadius: '12px',
                        color: '#fff',
                        fontSize: '14px',
                        fontWeight: '600',
                        cursor: isImporting ? 'not-allowed' : 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        transition: 'all 0.3s',
                        opacity: isImporting ? 0.6 : 1
                    }}
                    onMouseEnter={(e) => !isImporting && (e.currentTarget.style.transform = 'translateY(-2px)')}
                    onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
                >
                    <span>{isImporting ? '⏳' : '📥'}</span>
                    {isImporting ? 'Importing...' : 'Import Flows'}
                </button>
            </div>

            {/* Import Status Message */}
            {importStatus && (
                <div style={{
                    padding: '12px 20px',
                    background: importStatus.includes('❌') ? `${theme.error}20` : `${theme.success}20`,
                    border: `1px solid ${importStatus.includes('❌') ? theme.error : theme.success}40`,
                    borderRadius: '10px',
                    color: importStatus.includes('❌') ? theme.error : theme.success,
                    marginBottom: '16px',
                    fontSize: '14px',
                    fontWeight: '600',
                    animation: 'slideDown 0.3s ease-out'
                }}>
                    {importStatus}
                </div>
            )}

            {/* Test Cases Grid */}
            {filteredCases.length === 0 ? (
                <div style={{
                    textAlign: 'center',
                    padding: '80px 20px',
                    background: theme.bgSecondary,
                    borderRadius: '16px',
                    border: `1px solid ${theme.border}`
                }}>
                    <div style={{ fontSize: '64px', marginBottom: '16px', opacity: 0.3 }}>📝</div>
                    <h3 style={{ color: theme.text, marginBottom: '8px' }}>No Test Cases Found</h3>
                    <p style={{ color: theme.textSecondary, marginBottom: '24px' }}>
                        {searchQuery || filterType !== 'all' || filterStatus !== 'all'
                            ? 'Try adjusting your filters'
                            : 'Create your first test case to get started'}
                    </p>
                    {!searchQuery && filterType === 'all' && filterStatus === 'all' && (
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
                            ➕ Create First Test
                        </button>
                    )}
                </div>
            ) : (
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))',
                    gap: '20px'
                }}>
                    {filteredCases.map((testCase: TestCase) => (
                        <TestCaseCard
                            key={testCase.id}
                            testCase={testCase}
                            onEdit={() => setEditingCase(testCase)}
                            onDelete={() => handleDelete(testCase.id)}
                            onRun={testCase.flowId ? () => handleRunFlow(testCase) : undefined}
                            onConvertCode={testCase.flowId ? () => handleConvertToCode(testCase) : undefined}
                            onApkUpload={testCase.flowId ? () => handleOpenApkUpload(testCase) : undefined}
                            isRunning={runningFlowId === testCase.id}
                            theme={theme}
                        />
                    ))}
                </div>
            )}

            {/* Create/Edit Modal */}
            {(showCreateModal || editingCase) && (
                <TestCaseModal
                    testCase={editingCase}
                    onSave={editingCase ? handleEdit : handleCreate}
                    onClose={() => {
                        setShowCreateModal(false)
                        setEditingCase(null)
                    }}
                    theme={theme}
                />
            )}

            {/* APK Upload Modal */}
            {showApkUpload && selectedTestCase && (
                <ApkUploadModal
                    testCase={selectedTestCase}
                    onClose={() => {
                        setShowApkUpload(false)
                        setSelectedTestCase(null)
                    }}
                    theme={theme}
                />
            )}

            {/* Phase 4.1: Run Test Dialog - ULTRA PREMIUM */}
            {showRunDialog && testToRun && (
                <div style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    backgroundColor: 'rgba(0, 0, 0, 0.85)',
                    backdropFilter: 'blur(12px)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 2000,
                    padding: '80px 20px 20px 20px'
                }}>
                    <div style={{
                        background: 'linear-gradient(145deg, rgba(22, 27, 34, 0.95) 0%, rgba(13, 17, 23, 0.98) 100%)',
                        borderRadius: '20px',
                        padding: '0',
                        width: '100%',
                        maxWidth: '750px',
                        border: '1px solid rgba(88, 166, 255, 0.2)',
                        boxShadow: '0 25px 80px rgba(0,0,0,0.6), 0 0 0 1px rgba(88, 166, 255, 0.1)',
                        overflow: 'hidden'
                    }}>
                        {/* Premium Header with Gradient - CENTERED */}
                        <div style={{
                            background: 'linear-gradient(135deg, rgba(88, 166, 255, 0.12) 0%, rgba(47, 129, 247, 0.08) 100%)',
                            borderBottom: '1px solid rgba(48, 54, 61, 0.6)',
                            padding: '24px 28px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '14px'
                        }}>
                            <div style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '14px'
                            }}>
                                <div style={{
                                    width: '48px',
                                    height: '48px',
                                    borderRadius: '12px',
                                    background: 'linear-gradient(135deg, #58a6ff, #2f81f7)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    fontSize: '24px',
                                    boxShadow: '0 4px 12px rgba(88, 166, 255, 0.3)'
                                }}>
                                    ▶️
                                </div>
                                <div>
                                    <div style={{
                                        fontSize: '11px',
                                        fontWeight: 600,
                                        color: '#8b949e',
                                        textTransform: 'uppercase',
                                        letterSpacing: '0.5px',
                                        marginBottom: '4px'
                                    }}>
                                        Execute Test
                                    </div>
                                    <div style={{
                                        fontSize: '20px',
                                        fontWeight: 700,
                                        color: '#e6edf3',
                                        lineHeight: '1.2'
                                    }}>
                                        {testToRun.name}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Content Area - HIDDEN SCROLLBAR */}
                        <div
                            className="hide-scrollbar"
                            style={{
                                padding: '20px 24px',
                                maxHeight: 'calc(100vh - 250px)',
                                overflowY: 'auto'
                            }}>

                            {/* Device Selection - NO EMOJI */}
                            <div style={{ marginBottom: '20px' }}>
                                <label style={{
                                    display: 'block',
                                    marginBottom: '10px',
                                    color: '#58a6ff',
                                    fontSize: '11px',
                                    fontWeight: 700,
                                    textTransform: 'uppercase',
                                    letterSpacing: '1px'
                                }}>
                                    Connected Devices
                                </label>

                                {availableDevices.filter((d: any) => d.is_connected).length === 0 ? (
                                    <div style={{
                                        padding: '20px',
                                        background: 'linear-gradient(135deg, rgba(248, 81, 73, 0.12), rgba(218, 54, 51, 0.06))',
                                        border: '1px solid rgba(248, 81, 73, 0.4)',
                                        borderRadius: '14px',
                                        color: '#f85149',
                                        fontSize: '14px',
                                        textAlign: 'center',
                                        fontWeight: 600
                                    }}>
                                        ⚠️ No online devices - Connect a device first
                                    </div>
                                ) : (
                                    <div style={{
                                        display: 'flex',
                                        flexDirection: 'column',
                                        gap: '8px',
                                        padding: '4px'
                                    }}>
                                        {availableDevices
                                            .filter((device: any) => device.is_connected)
                                            .map((device: any) => {
                                                const isSelected = selectedDevice === device.device_id

                                                return (
                                                    <div
                                                        key={device.device_id}
                                                        onClick={() => setSelectedDevice(device.device_id)}
                                                        style={{
                                                            padding: '16px 18px',
                                                            background: isSelected
                                                                ? 'linear-gradient(135deg, rgba(88, 166, 255, 0.18), rgba(47, 129, 247, 0.12))'
                                                                : 'linear-gradient(135deg, rgba(22, 27, 34, 0.8), rgba(13, 17, 23, 0.6))',
                                                            border: isSelected
                                                                ? '2px solid rgba(88, 166, 255, 0.6)'
                                                                : '1px solid rgba(48, 54, 61, 0.6)',
                                                            borderRadius: '12px',
                                                            cursor: 'pointer',
                                                            transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            gap: '14px',
                                                            transform: isSelected ? 'scale(1.03)' : 'scale(1)',
                                                            boxShadow: isSelected
                                                                ? '0 8px 24px rgba(88, 166, 255, 0.25)'
                                                                : '0 2px 8px rgba(0, 0, 0, 0.2)'
                                                        }}
                                                        onMouseEnter={(e) => {
                                                            if (!isSelected) {
                                                                e.currentTarget.style.background = 'linear-gradient(135deg, rgba(88, 166, 255, 0.1), rgba(47, 129, 247, 0.06))'
                                                                e.currentTarget.style.borderColor = 'rgba(88, 166, 255, 0.4)'
                                                                e.currentTarget.style.transform = 'scale(1.02)'
                                                            }
                                                        }}
                                                        onMouseLeave={(e) => {
                                                            if (!isSelected) {
                                                                e.currentTarget.style.background = 'linear-gradient(135deg, rgba(22, 27, 34, 0.8), rgba(13, 17, 23, 0.6))'
                                                                e.currentTarget.style.borderColor = 'rgba(48, 54, 61, 0.6)'
                                                                e.currentTarget.style.transform = 'scale(1)'
                                                            }
                                                        }}
                                                    >
                                                        {/* Pulsing Indicator */}
                                                        <div style={{
                                                            position: 'relative',
                                                            width: '14px',
                                                            height: '14px'
                                                        }}>
                                                            <div style={{
                                                                width: '14px',
                                                                height: '14px',
                                                                borderRadius: '50%',
                                                                background: 'linear-gradient(135deg, #3fb950, #2ea043)',
                                                                boxShadow: '0 0 12px rgba(63, 185, 80, 0.8)',
                                                                animation: 'pulse 2s infinite'
                                                            }} />
                                                        </div>

                                                        {/* Device Info */}
                                                        <div style={{ flex: 1 }}>
                                                            <div style={{
                                                                fontSize: '15px',
                                                                fontWeight: 700,
                                                                color: isSelected ? '#58a6ff' : '#e6edf3',
                                                                marginBottom: '3px'
                                                            }}>
                                                                {device.name}
                                                            </div>
                                                            <div style={{
                                                                fontSize: '11px',
                                                                color: isSelected ? '#79c0ff' : '#8b949e',
                                                                fontFamily: 'monospace',
                                                                fontWeight: 500
                                                            }}>
                                                                {device.platform} {device.platform_version} {device.model && `• ${device.model}`}
                                                            </div>
                                                        </div>

                                                        {/* Info Icon - Click for Details */}
                                                        <div
                                                            onClick={(e) => {
                                                                e.stopPropagation()
                                                                setDeviceDetailData(device)
                                                                setShowDeviceDetail(true)
                                                            }}
                                                            style={{
                                                                marginLeft: 'auto',
                                                                width: '28px',
                                                                height: '28px',
                                                                borderRadius: '50%',
                                                                background: 'rgba(88, 166, 255, 0.15)',
                                                                border: '1px solid rgba(88, 166, 255, 0.3)',
                                                                display: 'flex',
                                                                alignItems: 'center',
                                                                justifyContent: 'center',
                                                                cursor: 'pointer',
                                                                fontSize: '14px',
                                                                transition: 'all 0.2s ease'
                                                            }}
                                                            onMouseEnter={(e) => {
                                                                e.currentTarget.style.background = 'rgba(88, 166, 255, 0.25)'
                                                                e.currentTarget.style.transform = 'scale(1.1)'
                                                            }}
                                                            onMouseLeave={(e) => {
                                                                e.currentTarget.style.background = 'rgba(88, 166, 255, 0.15)'
                                                                e.currentTarget.style.transform = 'scale(1)'
                                                            }}
                                                        >
                                                            ℹ️
                                                        </div>

                                                        {/* Selection Indicator */}
                                                        {isSelected && (
                                                            <div style={{
                                                                width: '32px',
                                                                height: '32px',
                                                                borderRadius: '50%',
                                                                background: 'linear-gradient(135deg, #58a6ff, #2f81f7)',
                                                                display: 'flex',
                                                                alignItems: 'center',
                                                                justifyContent: 'center',
                                                                fontSize: '16px',
                                                                boxShadow: '0 4px 12px rgba(88, 166, 255, 0.4)'
                                                            }}>
                                                                ✓
                                                            </div>
                                                        )}
                                                    </div>
                                                )
                                            })}
                                    </div>
                                )}
                            </div>

                            {/* EXTREME PREMIUM Execution Settings */}
                            <div style={{
                                background: 'linear-gradient(135deg, rgba(22, 27, 34, 0.6), rgba(13, 17, 23, 0.4))',
                                borderRadius: '16px',
                                padding: '16px',
                                border: '1px solid rgba(48, 54, 61, 0.5)',
                                marginBottom: '8px'
                            }}>
                                <div style={{
                                    fontSize: '12px',
                                    fontWeight: 700,
                                    color: '#58a6ff',
                                    textTransform: 'uppercase',
                                    letterSpacing: '1px',
                                    marginBottom: '20px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '8px'
                                }}>
                                    Execution Settings
                                </div>

                                {/* Premium Toggle Switches */}
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '20px' }}>
                                    {/* Restart App - Premium Toggle */}
                                    <div style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'space-between',
                                        padding: '12px 16px',
                                        background: playbackSettings.restartApp
                                            ? 'linear-gradient(135deg, rgba(88, 166, 255, 0.08), rgba(47, 129, 247, 0.04))'
                                            : 'rgba(13, 17, 23, 0.4)',
                                        borderRadius: '10px',
                                        border: playbackSettings.restartApp
                                            ? '1px solid rgba(88, 166, 255, 0.3)'
                                            : '1px solid rgba(48, 54, 61, 0.4)',
                                        cursor: 'pointer',
                                        transition: 'all 0.2s ease'
                                    }}
                                        onClick={() => setPlaybackSettings({ ...playbackSettings, restartApp: !playbackSettings.restartApp })}
                                        onMouseEnter={(e) => {
                                            e.currentTarget.style.borderColor = 'rgba(88, 166, 255, 0.5)'
                                        }}
                                        onMouseLeave={(e) => {
                                            e.currentTarget.style.borderColor = playbackSettings.restartApp
                                                ? 'rgba(88, 166, 255, 0.3)'
                                                : 'rgba(48, 54, 61, 0.4)'
                                        }}
                                    >
                                        <div style={{
                                            fontSize: '13px',
                                            fontWeight: 600,
                                            color: '#e6edf3'
                                        }}>
                                            Restart app before test
                                        </div>
                                        <div style={{
                                            width: '48px',
                                            height: '26px',
                                            borderRadius: '13px',
                                            background: playbackSettings.restartApp
                                                ? 'linear-gradient(135deg, #58a6ff, #2f81f7)'
                                                : 'rgba(48, 54, 61, 0.8)',
                                            position: 'relative',
                                            transition: 'all 0.3s ease',
                                            boxShadow: playbackSettings.restartApp
                                                ? '0 0 12px rgba(88, 166, 255, 0.4)'
                                                : 'none'
                                        }}>
                                            <div style={{
                                                width: '20px',
                                                height: '20px',
                                                borderRadius: '50%',
                                                background: 'white',
                                                position: 'absolute',
                                                top: '3px',
                                                left: playbackSettings.restartApp ? '25px' : '3px',
                                                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                                                boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
                                            }} />
                                        </div>
                                    </div>

                                    {/* Clear Data - Premium Toggle */}
                                    <div style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'space-between',
                                        padding: '12px 16px',
                                        background: playbackSettings.clearData
                                            ? 'linear-gradient(135deg, rgba(88, 166, 255, 0.08), rgba(47, 129, 247, 0.04))'
                                            : 'rgba(13, 17, 23, 0.4)',
                                        borderRadius: '10px',
                                        border: playbackSettings.clearData
                                            ? '1px solid rgba(88, 166, 255, 0.3)'
                                            : '1px solid rgba(48, 54, 61, 0.4)',
                                        cursor: 'pointer',
                                        transition: 'all 0.2s ease'
                                    }}
                                        onClick={() => setPlaybackSettings({ ...playbackSettings, clearData: !playbackSettings.clearData })}
                                        onMouseEnter={(e) => {
                                            e.currentTarget.style.borderColor = 'rgba(88, 166, 255, 0.5)'
                                        }}
                                        onMouseLeave={(e) => {
                                            e.currentTarget.style.borderColor = playbackSettings.clearData
                                                ? 'rgba(88, 166, 255, 0.3)'
                                                : 'rgba(48, 54, 61, 0.4)'
                                        }}
                                    >
                                        <div style={{
                                            fontSize: '13px',
                                            fontWeight: 600,
                                            color: '#e6edf3'
                                        }}>
                                            Clear app data
                                        </div>
                                        <div style={{
                                            width: '48px',
                                            height: '26px',
                                            borderRadius: '13px',
                                            background: playbackSettings.clearData
                                                ? 'linear-gradient(135deg, #58a6ff, #2f81f7)'
                                                : 'rgba(48, 54, 61, 0.8)',
                                            position: 'relative',
                                            transition: 'all 0.3s ease',
                                            boxShadow: playbackSettings.clearData
                                                ? '0 0 12px rgba(88, 166, 255, 0.4)'
                                                : 'none'
                                        }}>
                                            <div style={{
                                                width: '20px',
                                                height: '20px',
                                                borderRadius: '50%',
                                                background: 'white',
                                                position: 'absolute',
                                                top: '3px',
                                                left: playbackSettings.clearData ? '25px' : '3px',
                                                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                                                boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
                                            }} />
                                        </div>
                                    </div>
                                </div>

                                {/* Premium Number Input - Retry Count */}
                                <div style={{ marginBottom: '20px' }}>
                                    <label style={{
                                        display: 'block',
                                        marginBottom: '10px',
                                        color: '#8b949e',
                                        fontSize: '12px',
                                        fontWeight: 600,
                                        textTransform: 'uppercase',
                                        letterSpacing: '0.5px'
                                    }}>
                                        Retry per step:
                                    </label>
                                    <div style={{
                                        display: 'flex',
                                        gap: '8px'
                                    }}>
                                        {[0, 1, 2, 3].map(value => (
                                            <div
                                                key={value}
                                                onClick={() => setPlaybackSettings({ ...playbackSettings, retryPerStep: value })}
                                                style={{
                                                    flex: 1,
                                                    padding: '12px',
                                                    background: playbackSettings.retryPerStep === value
                                                        ? 'linear-gradient(135deg, #58a6ff, #2f81f7)'
                                                        : 'rgba(22, 27, 34, 0.6)',
                                                    border: playbackSettings.retryPerStep === value
                                                        ? '2px solid rgba(88, 166, 255, 0.8)'
                                                        : '1px solid rgba(48, 54, 61, 0.6)',
                                                    borderRadius: '10px',
                                                    color: playbackSettings.retryPerStep === value ? 'white' : '#8b949e',
                                                    fontSize: '16px',
                                                    fontWeight: 700,
                                                    textAlign: 'center',
                                                    cursor: 'pointer',
                                                    transition: 'all 0.2s ease',
                                                    boxShadow: playbackSettings.retryPerStep === value
                                                        ? '0 4px 16px rgba(88, 166, 255, 0.3)'
                                                        : 'none'
                                                }}
                                                onMouseEnter={(e) => {
                                                    if (playbackSettings.retryPerStep !== value) {
                                                        e.currentTarget.style.background = 'rgba(88, 166, 255, 0.1)'
                                                        e.currentTarget.style.borderColor = 'rgba(88, 166, 255, 0.4)'
                                                    }
                                                }}
                                                onMouseLeave={(e) => {
                                                    if (playbackSettings.retryPerStep !== value) {
                                                        e.currentTarget.style.background = 'rgba(22, 27, 34, 0.6)'
                                                        e.currentTarget.style.borderColor = 'rgba(48, 54, 61, 0.6)'
                                                    }
                                                }}
                                            >
                                                {value}
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* Ultra Premium Dropdown - On Failure */}
                                <div style={{ marginBottom: '20px' }}>
                                    <label style={{
                                        display: 'block',
                                        marginBottom: '10px',
                                        color: '#8b949e',
                                        fontSize: '12px',
                                        fontWeight: 600,
                                        textTransform: 'uppercase',
                                        letterSpacing: '0.5px'
                                    }}>
                                        On failure:
                                    </label>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                        {[
                                            { value: 'stop', icon: '🛑', label: 'Stop immediately', color: '#f85149' },
                                            { value: 'skip', icon: '⏭️', label: 'Skip and continue', color: '#d29922' },
                                            { value: 'continue', icon: '➡️', label: 'Continue anyway', color: '#3fb950' }
                                        ].map(option => (
                                            <div
                                                key={option.value}
                                                onClick={() => setPlaybackSettings({ ...playbackSettings, failureBehaviour: option.value as any })}
                                                style={{
                                                    padding: '14px 16px',
                                                    background: playbackSettings.failureBehaviour === option.value
                                                        ? `linear-gradient(135deg, ${option.color}22, ${option.color}11)`
                                                        : 'rgba(22, 27, 34, 0.6)',
                                                    border: playbackSettings.failureBehaviour === option.value
                                                        ? `2px solid ${option.color}88`
                                                        : '1px solid rgba(48, 54, 61, 0.6)',
                                                    borderRadius: '10px',
                                                    cursor: 'pointer',
                                                    transition: 'all 0.2s ease',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    gap: '12px',
                                                    boxShadow: playbackSettings.failureBehaviour === option.value
                                                        ? `0 4px 16px ${option.color}33`
                                                        : 'none'
                                                }}
                                                onMouseEnter={(e) => {
                                                    if (playbackSettings.failureBehaviour !== option.value) {
                                                        e.currentTarget.style.background = `${option.color}11`
                                                        e.currentTarget.style.borderColor = `${option.color}44`
                                                    }
                                                }}
                                                onMouseLeave={(e) => {
                                                    if (playbackSettings.failureBehaviour !== option.value) {
                                                        e.currentTarget.style.background = 'rgba(22, 27, 34, 0.6)'
                                                        e.currentTarget.style.borderColor = 'rgba(48, 54, 61, 0.6)'
                                                    }
                                                }}
                                            >
                                                <span style={{ fontSize: '20px' }}>{option.icon}</span>
                                                <span style={{
                                                    flex: 1,
                                                    fontSize: '13px',
                                                    fontWeight: 600,
                                                    color: playbackSettings.failureBehaviour === option.value ? option.color : '#e6edf3'
                                                }}>
                                                    {option.label}
                                                </span>
                                                {playbackSettings.failureBehaviour === option.value && (
                                                    <div style={{
                                                        width: '24px',
                                                        height: '24px',
                                                        borderRadius: '50%',
                                                        background: option.color,
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        justifyContent: 'center',
                                                        color: 'white',
                                                        fontSize: '12px',
                                                        fontWeight: 700
                                                    }}>
                                                        ✓
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* Premium Checkbox - Screenshots */}
                                <div
                                    onClick={() => setPlaybackSettings({ ...playbackSettings, captureScreenshots: !playbackSettings.captureScreenshots })}
                                    style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '14px',
                                        padding: '14px 16px',
                                        background: playbackSettings.captureScreenshots
                                            ? 'linear-gradient(135deg, rgba(88, 166, 255, 0.08), rgba(47, 129, 247, 0.04))'
                                            : 'rgba(13, 17, 23, 0.4)',
                                        borderRadius: '10px',
                                        border: playbackSettings.captureScreenshots
                                            ? '1px solid rgba(88, 166, 255, 0.3)'
                                            : '1px solid rgba(48, 54, 61, 0.4)',
                                        cursor: 'pointer',
                                        transition: 'all 0.2s ease'
                                    }}
                                    onMouseEnter={(e) => {
                                        e.currentTarget.style.borderColor = 'rgba(88, 166, 255, 0.5)'
                                    }}
                                    onMouseLeave={(e) => {
                                        e.currentTarget.style.borderColor = playbackSettings.captureScreenshots
                                            ? 'rgba(88, 166, 255, 0.3)'
                                            : 'rgba(48, 54, 61, 0.4)'
                                    }}
                                >
                                    {/* Custom Checkbox */}
                                    <div style={{
                                        width: '24px',
                                        height: '24px',
                                        borderRadius: '6px',
                                        background: playbackSettings.captureScreenshots
                                            ? 'linear-gradient(135deg, #58a6ff, #2f81f7)'
                                            : 'rgba(48, 54, 61, 0.8)',
                                        border: playbackSettings.captureScreenshots
                                            ? 'none'
                                            : '2px solid rgba(88, 166, 255, 0.3)',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        fontSize: '14px',
                                        color: 'white',
                                        fontWeight: 700,
                                        transition: 'all 0.2s ease',
                                        boxShadow: playbackSettings.captureScreenshots
                                            ? '0 0 12px rgba(88, 166, 255, 0.4)'
                                            : 'none'
                                    }}>
                                        {playbackSettings.captureScreenshots && '✓'}
                                    </div>
                                    <span style={{
                                        fontSize: '13px',
                                        fontWeight: 600,
                                        color: '#e6edf3'
                                    }}>
                                        Capture screenshots
                                    </span>
                                </div>
                            </div>

                            {/* Device Count Info - Only Online */}
                            {availableDevices.filter((d: any) => d.is_connected).length > 0 && (
                                <div style={{
                                    marginTop: '8px',
                                    fontSize: '11px',
                                    color: '#6e7681',
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center'
                                }}>
                                    <div style={{
                                        fontSize: '11px',
                                        color: '#79c0ff',
                                        fontWeight: 600
                                    }}>
                                        {availableDevices.filter((d: any) => d.is_connected).length} online
                                    </div>
                                </div>
                            )}

                            {/* Premium Action Buttons */}
                            <div style={{
                                display: 'flex',
                                gap: '12px',
                                marginTop: '28px',
                                paddingTop: '20px',
                                borderTop: '1px solid rgba(48, 54, 61, 0.5)'
                            }}>
                                <button
                                    onClick={() => {
                                        setShowRunDialog(false)
                                        setTestToRun(null)
                                    }}
                                    style={{
                                        flex: 1,
                                        padding: '14px 24px',
                                        background: 'rgba(22, 27, 34, 0.8)',
                                        color: '#8b949e',
                                        border: '1px solid rgba(48, 54, 61, 0.8)',
                                        borderRadius: '10px',
                                        cursor: 'pointer',
                                        fontWeight: 600,
                                        fontSize: '14px',
                                        transition: 'all 0.2s ease'
                                    }}
                                    onMouseEnter={(e) => {
                                        e.currentTarget.style.background = 'rgba(48, 54, 61, 0.4)'
                                        e.currentTarget.style.borderColor = 'rgba(88, 166, 255, 0.3)'
                                    }}
                                    onMouseLeave={(e) => {
                                        e.currentTarget.style.background = 'rgba(22, 27, 34, 0.8)'
                                        e.currentTarget.style.borderColor = 'rgba(48, 54, 61, 0.8)'
                                    }}
                                >
                                    ✕ Cancel
                                </button>
                                <button
                                    onClick={handleExecuteTest}
                                    disabled={!selectedDevice || availableDevices.filter((d: any) => d.is_connected).length === 0}
                                    style={{
                                        flex: 2,
                                        padding: '14px 28px',
                                        background: selectedDevice && availableDevices.filter((d: any) => d.is_connected).length > 0
                                            ? 'linear-gradient(135deg, #238636, #2ea043)'
                                            : 'rgba(22, 27, 34, 0.6)',
                                        color: selectedDevice && availableDevices.filter((d: any) => d.is_connected).length > 0
                                            ? 'white'
                                            : '#6e7681',
                                        border: selectedDevice && availableDevices.filter((d: any) => d.is_connected).length > 0
                                            ? '1px solid rgba(46, 160, 67, 0.4)'
                                            : '1px solid rgba(48, 54, 61, 0.5)',
                                        borderRadius: '10px',
                                        cursor: selectedDevice && availableDevices.filter((d: any) => d.is_connected).length > 0
                                            ? 'pointer'
                                            : 'not-allowed',
                                        fontWeight: 700,
                                        fontSize: '15px',
                                        boxShadow: selectedDevice && availableDevices.filter((d: any) => d.is_connected).length > 0
                                            ? '0 4px 20px rgba(46, 160, 67, 0.3)'
                                            : 'none',
                                        transition: 'all 0.2s ease',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        gap: '8px'
                                    }}
                                    onMouseEnter={(e) => {
                                        if (selectedDevice && availableDevices.filter((d: any) => d.is_connected).length > 0) {
                                            e.currentTarget.style.transform = 'translateY(-2px)'
                                            e.currentTarget.style.boxShadow = '0 6px 25px rgba(46, 160, 67, 0.4)'
                                        }
                                    }}
                                    onMouseLeave={(e) => {
                                        e.currentTarget.style.transform = 'translateY(0)'
                                        if (selectedDevice && availableDevices.filter((d: any) => d.is_connected).length > 0) {
                                            e.currentTarget.style.boxShadow = '0 4px 20px rgba(46, 160, 67, 0.3)'
                                        }
                                    }}
                                >
                                    <span style={{ fontSize: '18px' }}>▶️</span>
                                    <span>Run Test</span>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* PREMIUM Device Detail Modal */}
            {showDeviceDetail && deviceDetailData && (
                <div style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    backgroundColor: 'rgba(0, 0, 0, 0.85)',
                    backdropFilter: 'blur(12px)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 3000,
                    padding: '20px'
                }}>
                    <div style={{
                        background: 'linear-gradient(145deg, rgba(22, 27, 34, 0.95) 0%, rgba(13, 17, 23, 0.98) 100%)',
                        borderRadius: '20px',
                        padding: '0',
                        width: '100%',
                        maxWidth: '600px',
                        border: '1px solid rgba(88, 166, 255, 0.2)',
                        boxShadow: '0 25px 80px rgba(0,0,0,0.6), 0 0 0 1px rgba(88, 166, 255, 0.1)',
                        overflow: 'hidden'
                    }}>
                        {/* Header */}
                        <div style={{
                            background: 'linear-gradient(135deg, rgba(88, 166, 255, 0.12) 0%, rgba(47, 129, 247, 0.08) 100%)',
                            borderBottom: '1px solid rgba(48, 54, 61, 0.6)',
                            padding: '24px 28px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between'
                        }}>
                            <div style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '14px'
                            }}>
                                <div style={{
                                    width: '48px',
                                    height: '48px',
                                    borderRadius: '12px',
                                    background: 'linear-gradient(135deg, #58a6ff, #2f81f7)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    fontSize: '24px'
                                }}>
                                    📱
                                </div>
                                <div>
                                    <div style={{
                                        fontSize: '11px',
                                        fontWeight: 600,
                                        color: '#8b949e',
                                        textTransform: 'uppercase',
                                        letterSpacing: '0.5px',
                                        marginBottom: '4px'
                                    }}>
                                        Device Details
                                    </div>
                                    <div style={{
                                        fontSize: '20px',
                                        fontWeight: 700,
                                        color: '#e6edf3',
                                        lineHeight: '1.2'
                                    }}>
                                        {deviceDetailData.name}
                                    </div>
                                </div>
                            </div>
                            <button
                                onClick={() => {
                                    setShowDeviceDetail(false)
                                    setDeviceDetailData(null)
                                }}
                                style={{
                                    background: 'rgba(248, 81, 73, 0.1)',
                                    border: '1px solid rgba(248, 81, 73, 0.3)',
                                    borderRadius: '8px',
                                    width: '32px',
                                    height: '32px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    cursor: 'pointer',
                                    fontSize: '16px',
                                    color: '#f85149',
                                    transition: 'all 0.2s ease'
                                }}
                                onMouseEnter={(e) => {
                                    e.currentTarget.style.background = 'rgba(248, 81, 73, 0.2)'
                                    e.currentTarget.style.transform = 'scale(1.1)'
                                }}
                                onMouseLeave={(e) => {
                                    e.currentTarget.style.background = 'rgba(248, 81, 73, 0.1)'
                                    e.currentTarget.style.transform = 'scale(1)'
                                }}
                            >
                                ✕
                            </button>
                        </div>

                        {/* Content */}
                        <div style={{ padding: '24px 28px' }}>
                            {/* Status Badge */}
                            <div style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '8px',
                                padding: '8px 14px',
                                background: deviceDetailData.is_connected
                                    ? 'linear-gradient(135deg, rgba(46, 160, 67, 0.15), rgba(46, 160, 67, 0.08))'
                                    : 'rgba(110, 118, 129, 0.1)',
                                border: deviceDetailData.is_connected
                                    ? '1px solid rgba(46, 160, 67, 0.4)'
                                    : '1px solid rgba(110, 118, 129, 0.3)',
                                borderRadius: '10px',
                                marginBottom: '24px'
                            }}>
                                <div style={{
                                    width: '8px',
                                    height: '8px',
                                    borderRadius: '50%',
                                    background: deviceDetailData.is_connected ? '#3fb950' : '#6e7681',
                                    boxShadow: deviceDetailData.is_connected ? '0 0 8px #3fb950' : 'none',
                                    animation: deviceDetailData.is_connected ? 'pulse 2s infinite' : 'none'
                                }} />
                                <span style={{
                                    fontSize: '13px',
                                    fontWeight: 600,
                                    color: deviceDetailData.is_connected ? '#3fb950' : '#6e7681'
                                }}>
                                    {deviceDetailData.is_connected ? 'Online' : 'Offline'}
                                </span>
                            </div>

                            {/* Device Info Grid */}
                            <div style={{
                                display: 'grid',
                                gridTemplateColumns: '1fr 1fr',
                                gap: '16px',
                                marginBottom: '24px'
                            }}>
                                <div style={{
                                    padding: '16px',
                                    background: 'rgba(22, 27, 34, 0.6)',
                                    borderRadius: '12px',
                                    border: '1px solid rgba(48, 54, 61, 0.5)'
                                }}>
                                    <div style={{
                                        fontSize: '11px',
                                        color: '#8b949e',
                                        marginBottom: '6px',
                                        textTransform: 'uppercase',
                                        letterSpacing: '0.5px'
                                    }}>
                                        Platform
                                    </div>
                                    <div style={{
                                        fontSize: '16px',
                                        fontWeight: 700,
                                        color: '#58a6ff'
                                    }}>
                                        {deviceDetailData.platform}
                                    </div>
                                </div>

                                <div style={{
                                    padding: '16px',
                                    background: 'rgba(22, 27, 34, 0.6)',
                                    borderRadius: '12px',
                                    border: '1px solid rgba(48, 54, 61, 0.5)'
                                }}>
                                    <div style={{
                                        fontSize: '11px',
                                        color: '#8b949e',
                                        marginBottom: '6px',
                                        textTransform: 'uppercase',
                                        letterSpacing: '0.5px'
                                    }}>
                                        Version
                                    </div>
                                    <div style={{
                                        fontSize: '16px',
                                        fontWeight: 700,
                                        color: '#79c0ff'
                                    }}>
                                        {deviceDetailData.platform_version}
                                    </div>
                                </div>

                                <div style={{
                                    padding: '16px',
                                    background: 'rgba(22, 27, 34, 0.6)',
                                    borderRadius: '12px',
                                    border: '1px solid rgba(48, 54, 61, 0.5)'
                                }}>
                                    <div style={{
                                        fontSize: '11px',
                                        color: '#8b949e',
                                        marginBottom: '6px',
                                        textTransform: 'uppercase',
                                        letterSpacing: '0.5px'
                                    }}>
                                        Model
                                    </div>
                                    <div style={{
                                        fontSize: '14px',
                                        fontWeight: 600,
                                        color: '#e6edf3',
                                        fontFamily: 'monospace'
                                    }}>
                                        {deviceDetailData.model || 'N/A'}
                                    </div>
                                </div>

                                <div style={{
                                    padding: '16px',
                                    background: 'rgba(22, 27, 34, 0.6)',
                                    borderRadius: '12px',
                                    border: '1px solid rgba(48, 54, 61, 0.5)'
                                }}>
                                    <div style={{
                                        fontSize: '11px',
                                        color: '#8b949e',
                                        marginBottom: '6px',
                                        textTransform: 'uppercase',
                                        letterSpacing: '0.5px'
                                    }}>
                                        Device ID
                                    </div>
                                    <div style={{
                                        fontSize: '11px',
                                        fontWeight: 600,
                                        color: '#8b949e',
                                        fontFamily: 'monospace',
                                        wordBreak: 'break-all'
                                    }}>
                                        {deviceDetailData.device_id}
                                    </div>
                                </div>
                            </div>

                            {/* Actions */}
                            <div style={{
                                display: 'flex',
                                gap: '12px',
                                paddingTop: '16px',
                                borderTop: '1px solid rgba(48, 54, 61, 0.5)'
                            }}>
                                <button
                                    onClick={() => {
                                        setShowDeviceDetail(false)
                                        // TODO: Implement APK install
                                        alert('APK Install feature coming soon!')
                                    }}
                                    disabled={!deviceDetailData.is_connected}
                                    style={{
                                        flex: 1,
                                        padding: '12px 20px',
                                        background: deviceDetailData.is_connected
                                            ? 'linear-gradient(135deg, #8b5cf6, #7c3aed)'
                                            : 'rgba(22, 27, 34, 0.6)',
                                        color: deviceDetailData.is_connected ? 'white' : '#6e7681',
                                        border: deviceDetailData.is_connected
                                            ? '1px solid rgba(139, 92, 246, 0.4)'
                                            : '1px solid rgba(48, 54, 61, 0.5)',
                                        borderRadius: '10px',
                                        cursor: deviceDetailData.is_connected ? 'pointer' : 'not-allowed',
                                        fontWeight: 600,
                                        fontSize: '14px',
                                        transition: 'all 0.2s ease',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        gap: '8px'
                                    }}
                                    onMouseEnter={(e) => {
                                        if (deviceDetailData.is_connected) {
                                            e.currentTarget.style.transform = 'translateY(-2px)'
                                            e.currentTarget.style.boxShadow = '0 6px 20px rgba(139, 92, 246, 0.4)'
                                        }
                                    }}
                                    onMouseLeave={(e) => {
                                        e.currentTarget.style.transform = 'translateY(0)'
                                        e.currentTarget.style.boxShadow = 'none'
                                    }}
                                >
                                    📦 Install APK
                                </button>

                                <button
                                    onClick={() => {
                                        setShowDeviceDetail(false)
                                        // TODO: Implement screenshot
                                        alert('Screenshot feature coming soon!')
                                    }}
                                    disabled={!deviceDetailData.is_connected}
                                    style={{
                                        flex: 1,
                                        padding: '12px 20px',
                                        background: deviceDetailData.is_connected
                                            ? 'linear-gradient(135deg, #58a6ff, #2f81f7)'
                                            : 'rgba(22, 27, 34, 0.6)',
                                        color: deviceDetailData.is_connected ? 'white' : '#6e7681',
                                        border: deviceDetailData.is_connected
                                            ? '1px solid rgba(88, 166, 255, 0.4)'
                                            : '1px solid rgba(48, 54, 61, 0.5)',
                                        borderRadius: '10px',
                                        cursor: deviceDetailData.is_connected ? 'pointer' : 'not-allowed',
                                        fontWeight: 600,
                                        fontSize: '14px',
                                        transition: 'all 0.2s ease',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        gap: '8px'
                                    }}
                                    onMouseEnter={(e) => {
                                        if (deviceDetailData.is_connected) {
                                            e.currentTarget.style.transform = 'translateY(-2px)'
                                            e.currentTarget.style.boxShadow = '0 6px 20px rgba(88, 166, 255, 0.4)'
                                        }
                                    }}
                                    onMouseLeave={(e) => {
                                        e.currentTarget.style.transform = 'translateY(0)'
                                        e.currentTarget.style.boxShadow = 'none'
                                    }}
                                >
                                    📸 Screenshot
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Phase 4.1: Results Modal */}
            {
                showResultsModal && executionResults && (
                    <div style={{
                        position: 'fixed',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        backgroundColor: 'rgba(0, 0, 0, 0.8)',
                        backdropFilter: 'blur(8px)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        zIndex: 2000
                    }}>
                        <div style={{
                            background: 'linear-gradient(135deg, #161b22 0%, #0d1117 100%)',
                            borderRadius: '16px',
                            padding: '28px',
                            width: '90%',
                            maxWidth: '600px',
                            maxHeight: '80vh',
                            overflow: 'auto',
                            border: '1px solid rgba(48, 54, 61, 0.8)',
                            boxShadow: '0 20px 60px rgba(0,0,0,0.5)'
                        }}>
                            {/* Header */}
                            <div style={{
                                fontSize: '20px',
                                fontWeight: 700,
                                marginBottom: '20px',
                                color: '#e6edf3',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '12px'
                            }}>
                                <span style={{ fontSize: '24px' }}>📊</span>
                                Test Results: {testToRun?.name}
                            </div>

                            {/* Summary Stats */}
                            <div style={{
                                display: 'grid',
                                gridTemplateColumns: '1fr 1fr',
                                gap: '12px',
                                marginBottom: '20px'
                            }}>
                                <div style={{
                                    padding: '16px',
                                    background: 'rgba(88, 166, 255, 0.1)',
                                    borderRadius: '10px',
                                    border: '1px solid rgba(88, 166, 255, 0.3)',
                                    textAlign: 'center'
                                }}>
                                    <div style={{ fontSize: '11px', color: '#58a6ff', marginBottom: '4px', fontWeight: 600 }}>
                                        TOTAL STEPS
                                    </div>
                                    <div style={{ fontSize: '28px', fontWeight: 700, color: '#58a6ff' }}>
                                        {executionResults.total_steps}
                                    </div>
                                </div>

                                <div style={{
                                    padding: '16px',
                                    background: executionResults.failed_steps > 0
                                        ? 'rgba(248, 81, 73, 0.1)'
                                        : 'rgba(46, 160, 67, 0.1)',
                                    borderRadius: '10px',
                                    border: executionResults.failed_steps > 0
                                        ? '1px solid rgba(248, 81, 73, 0.3)'
                                        : '1px solid rgba(46, 160, 67, 0.3)',
                                    textAlign: 'center'
                                }}>
                                    <div style={{
                                        fontSize: '11px',
                                        color: executionResults.failed_steps > 0 ? '#f85149' : '#3fb950',
                                        marginBottom: '4px',
                                        fontWeight: 600
                                    }}>
                                        STATUS
                                    </div>
                                    <div style={{
                                        fontSize: '16px',
                                        fontWeight: 700,
                                        color: executionResults.failed_steps > 0 ? '#f85149' : '#3fb950'
                                    }}>
                                        {executionResults.failed_steps > 0 ? '❌ FAILED' : '✅ PASSED'}
                                    </div>
                                </div>
                            </div>

                            {/* Pass/Fail Counts */}
                            <div style={{
                                display: 'flex',
                                gap: '12px',
                                marginBottom: '20px'
                            }}>
                                <div style={{
                                    flex: 1,
                                    padding: '12px',
                                    background: 'rgba(46, 160, 67, 0.1)',
                                    borderRadius: '8px',
                                    border: '1px solid rgba(46, 160, 67, 0.3)'
                                }}>
                                    <div style={{ fontSize: '12px', color: '#3fb950' }}>
                                        ✅ Passed: <strong>{executionResults.successful_steps || 0}</strong>
                                    </div>
                                </div>
                                <div style={{
                                    flex: 1,
                                    padding: '12px',
                                    background: 'rgba(248, 81, 73, 0.1)',
                                    borderRadius: '8px',
                                    border: '1px solid rgba(248, 81, 73, 0.3)'
                                }}>
                                    <div style={{ fontSize: '12px', color: '#f85149' }}>
                                        ❌ Failed: <strong>{executionResults.failed_steps || 0}</strong>
                                    </div>
                                </div>
                            </div>

                            {/* Step Details (Phase 3 Enhanced) */}
                            {executionResults.steps && executionResults.steps.length > 0 && (
                                <div style={{ marginBottom: '20px' }}>
                                    <div style={{
                                        fontSize: '14px',
                                        fontWeight: 600,
                                        color: '#e6edf3',
                                        marginBottom: '12px'
                                    }}>
                                        📝 Step Details:
                                    </div>
                                    <div style={{
                                        maxHeight: '300px',
                                        overflowY: 'auto',
                                        display: 'flex',
                                        flexDirection: 'column',
                                        gap: '8px'
                                    }}>
                                        {executionResults.steps.map((step: any, idx: number) => {
                                            const statusConfig = {
                                                pass: { icon: '✅', color: '#3fb950', bg: 'rgba(46, 160, 67, 0.1)', border: 'rgba(46, 160, 67, 0.3)' },
                                                fail: { icon: '❌', color: '#f85149', bg: 'rgba(248, 81, 73, 0.1)', border: 'rgba(248, 81, 73, 0.3)' },
                                                flaky: { icon: '⚠️', color: '#ffbf00', bg: 'rgba(255, 191, 0, 0.1)', border: 'rgba(255, 191, 0, 0.3)' },
                                                skipped: { icon: '⏭️', color: '#8b949e', bg: 'rgba(110, 118, 129, 0.1)', border: 'rgba(110, 118, 129, 0.3)' },
                                                blocked: { icon: '🚫', color: '#6e7681', bg: 'rgba(110, 118, 129, 0.1)', border: 'rgba(110, 118, 129, 0.3)' }
                                            }
                                            const config = statusConfig[step.status as keyof typeof statusConfig] || statusConfig.pass

                                            return (
                                                <div
                                                    key={idx}
                                                    style={{
                                                        padding: '10px',
                                                        background: config.bg,
                                                        borderRadius: '8px',
                                                        border: `1px solid ${config.border}`,
                                                        fontSize: '12px'
                                                    }}
                                                >
                                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                                                        <span style={{ color: '#e6edf3', fontWeight: 600 }}>
                                                            Step {step.step}: {step.action}
                                                        </span>
                                                        <span style={{
                                                            padding: '2px 8px',
                                                            background: config.color,
                                                            color: '#000',
                                                            borderRadius: '4px',
                                                            fontSize: '10px',
                                                            fontWeight: 700
                                                        }}>
                                                            {config.icon}
                                                        </span>
                                                    </div>
                                                    {step.attempts > 0 && (
                                                        <div style={{ color: '#8b949e', fontSize: '11px' }}>
                                                            Attempts: {step.attempts} | Duration: {step.duration_ms}ms
                                                        </div>
                                                    )}
                                                    {step.error && (
                                                        <div style={{
                                                            marginTop: '6px',
                                                            padding: '6px',
                                                            background: 'rgba(0, 0, 0, 0.3)',
                                                            borderRadius: '4px',
                                                            color: config.color,
                                                            fontSize: '11px',
                                                            fontFamily: 'monospace'
                                                        }}>
                                                            {step.error}
                                                        </div>
                                                    )}
                                                </div>
                                            )
                                        })}
                                    </div>
                                </div>
                            )}

                            {/* Action Buttons */}
                            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                                <button
                                    onClick={() => {
                                        setShowResultsModal(false)
                                        setExecutionResults(null)
                                        setTestToRun(null)
                                    }}
                                    style={{
                                        padding: '12px 24px',
                                        background: 'rgba(48, 54, 61, 0.6)',
                                        color: '#e6edf3',
                                        border: '1px solid #30363d',
                                        borderRadius: '8px',
                                        cursor: 'pointer',
                                        fontWeight: 600,
                                        fontSize: '14px'
                                    }}
                                >
                                    Close
                                </button>
                                <button
                                    onClick={() => {
                                        setShowResultsModal(false)
                                        setShowRunDialog(true)
                                    }}
                                    style={{
                                        padding: '12px 24px',
                                        background: 'linear-gradient(135deg, #58a6ff, #1f6feb)',
                                        color: 'white',
                                        border: 'none',
                                        borderRadius: '8px',
                                        cursor: 'pointer',
                                        fontWeight: 600,
                                        fontSize: '14px',
                                        boxShadow: '0 0 15px rgba(88, 166, 255, 0.3)'
                                    }}
                                >
                                    🔄 Run Again
                                </button>
                            </div>
                        </div>
                    </div>
                )
            }
        </div >
    )
}

// Test Case Card Component
function TestCaseCard({ testCase, onEdit, onDelete, onRun, onConvertCode, onApkUpload, isRunning, theme }: any) {
    const typeIcons = { mobile: '📱', web: '🌐', api: '⚡' }
    const typeColors = { mobile: '#8b5cf6', web: '#06b6d4', api: '#10b981' }
    const statusColors = { draft: '#6b7280', ready: '#10b981', archived: '#f59e0b' }

    return (
        <div style={{
            background: theme.bgSecondary,
            border: `1px solid ${theme.border}`,
            borderRadius: '16px',
            padding: '20px',
            transition: 'all 0.3s',
            cursor: 'pointer'
        }}
            onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = typeColors[testCase.type]
                e.currentTarget.style.transform = 'translateY(-4px)'
                e.currentTarget.style.boxShadow = `0 8px 24px rgba(0,0,0,0.3)`
            }}
            onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = theme.border
                e.currentTarget.style.transform = 'translateY(0)'
                e.currentTarget.style.boxShadow = 'none'
            }}>
            {/* Header */}
            <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'start',
                marginBottom: '12px'
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span style={{ fontSize: '24px' }}>{typeIcons[testCase.type]}</span>
                    <span style={{
                        padding: '4px 12px',
                        background: `${typeColors[testCase.type]}20`,
                        color: typeColors[testCase.type],
                        borderRadius: '8px',
                        fontSize: '11px',
                        fontWeight: '700',
                        textTransform: 'uppercase'
                    }}>
                        {testCase.type}
                    </span>
                </div>
                <span style={{
                    padding: '4px 12px',
                    background: `${statusColors[testCase.status]}20`,
                    color: statusColors[testCase.status],
                    borderRadius: '8px',
                    fontSize: '11px',
                    fontWeight: '700',
                    textTransform: 'uppercase'
                }}>
                    {testCase.status}
                </span>
            </div>

            {/* Title */}
            <h3 style={{
                color: theme.text,
                fontSize: '18px',
                fontWeight: '600',
                marginBottom: '8px',
                lineHeight: '1.4'
            }}>
                {testCase.name}
            </h3>

            {/* Description */}
            <p style={{
                color: theme.textSecondary,
                fontSize: '13px',
                marginBottom: '16px',
                lineHeight: '1.6',
                display: '-webkit-box',
                WebkitLineClamp: 2,
                WebkitBoxOrient: 'vertical',
                overflow: 'hidden'
            }}>
                {testCase.description || 'No description'}
            </p>

            {/* Tags */}
            {testCase.tags && testCase.tags.length > 0 && (
                <div style={{
                    display: 'flex',
                    gap: '6px',
                    flexWrap: 'wrap',
                    marginBottom: '16px'
                }}>
                    {testCase.tags.map((tag: string, idx: number) => (
                        <span key={idx} style={{
                            padding: '3px 10px',
                            background: theme.bgTertiary,
                            border: `1px solid ${theme.border}`,
                            borderRadius: '6px',
                            fontSize: '11px',
                            color: theme.textSecondary,
                            fontWeight: '500'
                        }}>
                            #{tag}
                        </span>
                    ))}
                </div>
            )}

            {/* Footer */}
            <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                paddingTop: '16px',
                borderTop: `1px solid ${theme.border}`
            }}>
                <span style={{
                    fontSize: '12px',
                    color: theme.textSecondary
                }}>
                    Created {new Date(testCase.createdAt).toLocaleDateString()}
                </span>
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                    {/* Advanced Feature Buttons for Imported Flows */}
                    {onRun && (
                        <button
                            onClick={(e) => {
                                e.stopPropagation()
                                onRun()
                            }}
                            disabled={isRunning}
                            style={{
                                padding: '6px 14px',
                                background: isRunning
                                    ? theme.bgTertiary
                                    : 'linear-gradient(135deg, #10b981, #059669)',
                                border: 'none',
                                borderRadius: '8px',
                                color: '#fff',
                                fontSize: '12px',
                                cursor: isRunning ? 'not-allowed' : 'pointer',
                                fontWeight: '600',
                                opacity: isRunning ? 0.6 : 1
                            }}
                            title="Execute this flow on device"
                        >
                            {isRunning ? '⏳ Running...' : '▶️ Run'}
                        </button>
                    )}

                    {onConvertCode && (
                        <button
                            onClick={(e) => {
                                e.stopPropagation()
                                onConvertCode()
                            }}
                            style={{
                                padding: '6px 14px',
                                background: 'linear-gradient(135deg, #8b5cf6, #7c3aed)',
                                border: 'none',
                                borderRadius: '8px',
                                color: '#fff',
                                fontSize: '12px',
                                cursor: 'pointer',
                                fontWeight: '600'
                            }}
                            title="Generate code from this flow"
                        >
                            💻 Code
                        </button>
                    )}

                    {onApkUpload && (
                        <button
                            onClick={(e) => {
                                e.stopPropagation()
                                onApkUpload()
                            }}
                            style={{
                                padding: '6px 14px',
                                background: 'linear-gradient(135deg, #06b6d4, #0891b2)',
                                border: 'none',
                                borderRadius: '8px',
                                color: '#fff',
                                fontSize: '12px',
                                cursor: 'pointer',
                                fontWeight: '600'
                            }}
                            title="Test with new APK version"
                        >
                            📦 APK
                        </button>
                    )}

                    {/* Standard Buttons */}
                    <button
                        onClick={(e) => {
                            e.stopPropagation()
                            onEdit()
                        }}
                        style={{
                            padding: '6px 14px',
                            background: theme.bgTertiary,
                            border: `1px solid ${theme.border}`,
                            borderRadius: '8px',
                            color: theme.text,
                            fontSize: '12px',
                            cursor: 'pointer',
                            fontWeight: '600'
                        }}
                    >
                        ✏️ Edit
                    </button>
                    <button
                        onClick={(e) => {
                            e.stopPropagation()
                            onDelete()
                        }}
                        style={{
                            padding: '6px 14px',
                            background: `${theme.error}20`,
                            border: `1px solid ${theme.error}40`,
                            borderRadius: '8px',
                            color: theme.error,
                            fontSize: '12px',
                            cursor: 'pointer',
                            fontWeight: '600'
                        }}
                    >
                        🗑️ Delete
                    </button>
                </div>
            </div>
        </div>
    )
}

// Test Case Modal Component
function TestCaseModal({ testCase, onSave, onClose, theme }: any) {
    const [formData, setFormData] = useState({
        name: testCase?.name || '',
        description: testCase?.description || '',
        type: testCase?.type || 'mobile',
        tags: testCase?.tags?.join(', ') || ''
    })

    const handleSubmit = () => {
        if (!formData.name.trim()) {
            alert('Please enter a test name')
            return
        }

        onSave({
            ...testCase,
            ...formData,
            tags: formData.tags.split(',').map(t => t.trim()).filter(Boolean)
        })
    }

    return (
        <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0,0,0,0.8)',
            backdropFilter: 'blur(8px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            animation: 'fadeIn 0.3s'
        }}
            onClick={onClose}>
            <div
                onClick={(e) => e.stopPropagation()}
                style={{
                    background: theme.bgSecondary,
                    border: `2px solid ${theme.primary}40`,
                    borderRadius: '20px',
                    maxWidth: '600px',
                    width: '90%',
                    maxHeight: '90vh',
                    overflow: 'auto',
                    boxShadow: `0 20px 60px rgba(0,0,0,0.5)`,
                    animation: 'slideUp 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)'
                }}
            >
                {/* Header */}
                <div style={{
                    padding: '24px',
                    borderBottom: `1px solid ${theme.border}`,
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                }}>
                    <h2 style={{
                        margin: 0,
                        fontSize: '22px',
                        fontWeight: '700',
                        color: theme.text
                    }}>
                        {testCase ? '✏️ Edit Test Case' : '➕ Create Test Case'}
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
                            Test Name *
                        </label>
                        <input
                            type="text"
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            placeholder="e.g., User Login Test"
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
                            placeholder="Describe what this test does..."
                            rows={4}
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

                    {/* Type */}
                    <div style={{ marginBottom: '20px' }}>
                        <label style={{
                            display: 'block',
                            marginBottom: '8px',
                            fontSize: '14px',
                            fontWeight: '600',
                            color: theme.text
                        }}>
                            Test Type *
                        </label>
                        <select
                            value={formData.type}
                            onChange={(e) => setFormData({ ...formData, type: e.target.value as any })}
                            style={{
                                width: '100%',
                                padding: '12px 16px',
                                background: theme.bgTertiary,
                                border: `1px solid ${theme.border}`,
                                borderRadius: '10px',
                                color: theme.text,
                                fontSize: '14px',
                                cursor: 'pointer',
                                outline: 'none'
                            }}
                        >
                            <option value="mobile">📱 Mobile</option>
                            <option value="web">🌐 Web</option>
                            <option value="api">⚡ API</option>
                        </select>
                    </div>

                    {/* Tags */}
                    <div style={{ marginBottom: '20px' }}>
                        <label style={{
                            display: 'block',
                            marginBottom: '8px',
                            fontSize: '14px',
                            fontWeight: '600',
                            color: theme.text
                        }}>
                            Tags (comma separated)
                        </label>
                        <input
                            type="text"
                            value={formData.tags}
                            onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                            placeholder="e.g., smoke, regression, critical"
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
                        {testCase ? 'Update' : 'Create'} Test Case
                    </button>
                </div>
            </div>
        </div>
    )
}

// APK Upload Modal Component
function ApkUploadModal({ testCase, onClose, theme }: any) {
    const [apkFile, setApkFile] = useState<File | null>(null)
    const [isUploading, setIsUploading] = useState(false)
    const [status, setStatus] = useState('')

    const handleTest = async () => {
        if (!apkFile || !testCase.deviceInfo?.id || !testCase.flowId) return

        setIsUploading(true)
        setStatus('📦 Uploading APK...')

        try {
            // 1. Upload & Install APK
            const formData = new FormData()
            formData.append('apk', apkFile)

            await axios.post(
                `http://localhost:8000/api/devices/${testCase.deviceInfo.id}/install-apk`,
                formData,
                {
                    headers: { 'Content-Type': 'multipart/form-data' }
                }
            )

            setStatus('✅ APK installed! Running regression test...')

            // 2. Run Flow
            const res = await axios.post('http://localhost:8000/api/playback/start', {
                flow_id: parseInt(testCase.flowId),
                device_id: testCase.deviceInfo.id
            })

            setIsUploading(false)
            setStatus('')

            alert(`✅ Regression Test Complete!\n\n` +
                `Original: ${testCase.appInfo.name} v${testCase.appInfo.version}\n` +
                `New APK: ${apkFile.name}\n\n` +
                `📊 Test Results:\n` +
                `Total Steps: ${res.data.total_steps}\n` +
                `✅ Passed: ${res.data.successful_steps}\n` +
                `❌ Failed: ${res.data.failed_steps || 0}`)

            onClose()
        } catch (error: any) {
            setStatus('')
            setIsUploading(false)
            alert('❌ APK test failed: ' + (error.response?.data?.detail || error.message))
        }
    }

    return (
        <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0,0,0,0.8)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            animation: 'fadeIn 0.3s'
        }} onClick={onClose}>
            <div onClick={(e) => e.stopPropagation()} style={{
                background: theme.bgSecondary,
                borderRadius: '16px',
                padding: '32px',
                maxWidth: '550px',
                width: '90%',
                border: `1px solid ${theme.border}`,
                boxShadow: '0 20px 60px rgba(0,0,0,0.6)'
            }}>
                <h2 style={{
                    fontSize: '26px',
                    color: theme.text,
                    marginBottom: '8px',
                    fontWeight: '700'
                }}>
                    📦 Test with New APK
                </h2>

                <p style={{
                    color: theme.textSecondary,
                    marginBottom: '24px',
                    fontSize: '14px',
                    lineHeight: '1.6'
                }}>
                    Upload a new APK version and run automated regression testing
                </p>

                {/* Current Version */}
                <div style={{
                    background: theme.bgTertiary,
                    padding: '16px',
                    borderRadius: '12px',
                    marginBottom: '24px',
                    border: `1px solid ${theme.border}`
                }}>
                    <div style={{ color: theme.textSecondary, fontSize: '11px', marginBottom: '8px', fontWeight: '600', letterSpacing: '0.5px' }}>
                        CURRENT VERSION
                    </div>
                    <div style={{ color: theme.text, fontWeight: '600', fontSize: '16px' }}>
                        {testCase.appInfo.name} v{testCase.appInfo.version}
                    </div>
                    <div style={{ color: theme.textSecondary, fontSize: '13px', marginTop: '4px' }}>
                        {testCase.appInfo.package}
                    </div>
                </div>

                {/* File Input */}
                <div style={{ marginBottom: '20px' }}>
                    <label style={{
                        display: 'block',
                        color: theme.text,
                        marginBottom: '10px',
                        fontSize: '14px',
                        fontWeight: '600'
                    }}>
                        Select New APK:
                    </label>
                    <input
                        type="file"
                        accept=".apk"
                        onChange={(e) => setApkFile(e.target.files?.[0] || null)}
                        style={{
                            width: '100%',
                            padding: '12px',
                            background: theme.bg,
                            border: `1.5px solid ${theme.border}`,
                            borderRadius: '10px',
                            color: theme.text,
                            fontSize: '14px',
                            cursor: 'pointer'
                        }}
                    />
                    {apkFile && (
                        <div style={{
                            marginTop: '10px',
                            padding: '10px 14px',
                            background: `${theme.secondary}15`,
                            border: `1px solid ${theme.secondary}30`,
                            borderRadius: '8px',
                            color: theme.secondary,
                            fontSize: '13px',
                            fontWeight: '600'
                        }}>
                            ✓ {apkFile.name}
                        </div>
                    )}
                </div>

                {/* Status */}
                {status && (
                    <div style={{
                        padding: '14px',
                        background: `${theme.secondary}20`,
                        border: `1px solid ${theme.secondary}50`,
                        borderRadius: '10px',
                        color: theme.secondary,
                        marginBottom: '20px',
                        fontSize: '14px',
                        fontWeight: '600'
                    }}>
                        {status}
                    </div>
                )}

                {/* Buttons */}
                <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                    <button
                        onClick={onClose}
                        disabled={isUploading}
                        style={{
                            padding: '14px 28px',
                            background: theme.bgTertiary,
                            border: `1px solid ${theme.border}`,
                            borderRadius: '10px',
                            color: theme.text,
                            fontSize: '14px',
                            cursor: isUploading ? 'not-allowed' : 'pointer',
                            fontWeight: '600'
                        }}
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleTest}
                        disabled={!apkFile || isUploading}
                        style={{
                            padding: '14px 28px',
                            background: !apkFile || isUploading
                                ? theme.bgTertiary
                                : 'linear-gradient(135deg, #06b6d4, #0891b2)',
                            border: 'none',
                            borderRadius: '10px',
                            color: '#fff',
                            fontSize: '14px',
                            cursor: (!apkFile || isUploading) ? 'not-allowed' : 'pointer',
                            fontWeight: '700',
                            opacity: (!apkFile || isUploading) ? 0.5 : 1
                        }}
                    >
                        {isUploading ? '⏳ Testing...' : '🚀 Install & Run Test'}
                    </button>
                </div>
            </div>
        </div>
    )
}

// Test Suites View Component
function TestSuitesView({ testSuites, setTestSuites, testCases, theme }: any) {
    return (
        <div>
            <h2 style={{ color: theme.text }}>Test Suites View - Coming Soon</h2>
        </div>
    )
}

// Test History View Component
function TestHistoryView({ testRuns, testCases, testSuites, theme }: any) {
    return (
        <div>
            <h2 style={{ color: theme.text }}>Test History View - Coming Soon</h2>
        </div>
    )
}
