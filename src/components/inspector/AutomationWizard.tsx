import { useState, useEffect, useRef } from 'react'
import axios from 'axios'

interface Device {
    id: number
    device_id: string
    name: string
    platform: string
    is_connected: boolean
}

interface APKInfo {
    package_name: string
    app_name: string
    version: string
    activity: string
    already_installed: boolean
}

interface RecordedAction {
    step: number
    action: string
    x?: number
    y?: number
    text?: string
    duration?: number  // For wait actions
    element?: any  // For inspector mode - element properties
    description: string
    timestamp: number
}

type WizardStep = 'device' | 'apk' | 'install' | 'launch' | 'record' | 'save' | 'playback'

export default function AutomationWizard() {
    // Wizard state
    const [currentStep, setCurrentStep] = useState<WizardStep>('device')

    // Step 1: Device
    const [devices, setDevices] = useState<Device[]>([])
    const [selectedDevice, setSelectedDevice] = useState<string>('')

    // Step 2: APK
    const [apkFile, setApkFile] = useState<File | null>(null)
    const [apkInfo, setApkInfo] = useState<APKInfo | null>(null)
    const fileInputRef = useRef<HTMLInputElement>(null)

    // Step 3: Installation
    const [isInstalling, setIsInstalling] = useState(false)
    const [installProgress, setInstallProgress] = useState(0)
    const [installStatus, setInstallStatus] = useState('')

    // Step 4: Launch
    const [sessionActive, setSessionActive] = useState(false)
    const [isLaunching, setIsLaunching] = useState(false)
    const [screenshot, setScreenshot] = useState<string>('')

    // Step 5: Recording
    const [isRecording, setIsRecording] = useState(false)
    const [actions, setActions] = useState<RecordedAction[]>([])

    // Step 6: Save
    const [savedFlowId, setSavedFlowId] = useState<number | null>(null)
    const [flowName, setFlowName] = useState('')

    // Step 7: Playback
    const [isPlaying, setIsPlaying] = useState(false)
    const [showCodeModal, setShowCodeModal] = useState(false)
    const [generatedCode, setGeneratedCode] = useState("")
    const [codeLanguage, setCodeLanguage] = useState<"javascript" | "python">("javascript")
    const [playbackProgress, setPlaybackProgress] = useState(0)
    const [playbackResults, setPlaybackResults] = useState<any>(null)

    // Status
    const [status, setStatus] = useState('Welcome! Let\'s automate your app testing.')

    // Upload progress
    const [isUploading, setIsUploading] = useState(false)
    const [uploadProgress, setUploadProgress] = useState(0)

    // Swipe recording state
    const [isDragging, setIsDragging] = useState(false)
    const [recordingMode, setRecordingMode] = useState<'tap' | 'swipe' | 'inspector'>('tap')
    const [dragStart, setDragStart] = useState<{ x: number, y: number } | null>(null)

    // Inspector mode state
    const [inspectorMode, setInspectorMode] = useState(false)
    const [hoveredElement, setHoveredElement] = useState<any>(null)
    const [showElementPanel, setShowElementPanel] = useState(false)

    // Mouse position for parallax
    const [mousePos, setMousePos] = useState({ x: 0, y: 0 })

    // Modal state for errors
    const [modalState, setModalState] = useState<{
        show: boolean
        type: 'error' | 'success'
        title: string
        message: string
    }>({ show: false, type: 'error', title: '', message: '' })

    const showModal = (type: 'error' | 'success', title: string, message: string) => {
        setModalState({ show: true, type, title, message })
    }

    const closeModal = () => {
        setModalState({ ...modalState, show: false })
    }

    // Mouse tracking for parallax
    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => setMousePos({ x: e.clientX, y: e.clientY })
        window.addEventListener('mousemove', handleMouseMove)
        return () => window.removeEventListener('mousemove', handleMouseMove)
    }, [])

    // Fetch devices
    useEffect(() => {
        const fetchDevices = async () => {
            try {
                const res = await axios.get('http://localhost:8000/api/devices/')
                const connected = res.data.filter((d: Device) => d.is_connected)
                setDevices(connected)

                if (connected.length > 0 && !selectedDevice) {
                    setSelectedDevice(connected[0].device_id)
                }
            } catch (error) {
                console.error('Device fetch failed:', error)
            }
        }

        fetchDevices()
        const interval = setInterval(fetchDevices, 5000)
        return () => clearInterval(interval)
    }, [])

    // WebSocket for installation progress
    useEffect(() => {
        if (!isInstalling || !selectedDevice) return

        const ws = new WebSocket('ws://localhost:8000/ws/realtime')

        ws.onmessage = (event) => {
            const data = JSON.parse(event.data)
            if (data.type === 'installation_progress' && data.device_id === selectedDevice) {
                setInstallProgress(data.progress)
                setInstallStatus(data.message)
            }
        }

        return () => ws.close()
    }, [isInstalling, selectedDevice])

    // Auto-refresh screenshot
    useEffect(() => {
        if (!sessionActive) return

        const refreshScreenshot = async () => {
            try {
                const res = await axios.get('http://localhost:8000/api/inspector/screenshot')
                if (res.data.screenshot) {
                    setScreenshot(`data:image/png;base64,${res.data.screenshot}`)
                }
            } catch (error) {
                console.error('Screenshot refresh failed')
            }
        }

        refreshScreenshot()
        const interval = setInterval(refreshScreenshot, 500) // Fast refresh for real-time recording experience
        return () => clearInterval(interval)
    }, [sessionActive])

    // STEP 1: Select Device
    const handleDeviceNext = () => {
        if (!selectedDevice) {
            alert('Please connect and select a device!')
            return
        }
        setCurrentStep('apk')
        setStatus('Step 2: Upload your APK file')
    }

    // STEP 2: Upload APK
    const handleAPKUpload = async (file: File) => {
        setApkFile(file)
        setIsUploading(true)
        setUploadProgress(0)
        setStatus('📦 Uploading APK...')

        const formData = new FormData()
        formData.append('apk', file)

        try {
            const res = await axios.post(
                `http://localhost:8000/api/check-apk/${selectedDevice}`,
                formData,
                {
                    onUploadProgress: (progressEvent) => {
                        const progress = progressEvent.total
                            ? Math.round((progressEvent.loaded * 100) / progressEvent.total)
                            : 0
                        setUploadProgress(progress)
                        setStatus(`📤 Uploading: ${progress}%`)
                    }
                }
            )

            setStatus('🔍 Analyzing APK with androguard...')
            setUploadProgress(100)

            console.log('✅ APK Analysis Result:', res.data)
            setApkInfo(res.data)

            if (res.data.already_installed) {
                setStatus(`✅ "${res.data.app_name}" (${res.data.package_name}) already installed!`)
            } else {
                setStatus(`📦 Ready to install: ${res.data.app_name} (${res.data.package_name})`)
            }

            setCurrentStep('install')

        } catch (error: any) {
            console.error('APK analysis error:', error)
            console.error('Error response:', error.response?.data)
            console.error('Error message:', error.message)
            const errorMsg = error.response?.data?.detail || error.message || 'Unknown error'
            setStatus('❌ APK analysis failed: ' + errorMsg)
            showModal('error', 'APK Upload Failed', `There was an error parsing the APK file.\n\n${errorMsg}\n\nCheck console for details.`)
        } finally {
            setIsUploading(false)
            setUploadProgress(0)
        }
    }

    // STEP 3: Install APK
    const handleInstall = async () => {

        setIsInstalling(true)
        setInstallProgress(0)
        setStatus('Installing on device...')

        const formData = new FormData()
        formData.append('apk', apkFile)

        try {
            await axios.post(
                `http://localhost:8000/api/devices/${selectedDevice}/install-apk`,
                formData,
                {
                    headers: { 'Content-Type': 'multipart/form-data' },
                    onUploadProgress: (progressEvent) => {
                        const percentCompleted = Math.round(
                            (progressEvent.loaded * 100) / (progressEvent.total || 1)
                        )
                        setInstallProgress(Math.min(percentCompleted, 90))
                    }
                }
            )

            setInstallProgress(100)
            setStatus('✅ Installation complete! Ready to launch.')
            setTimeout(() => {
                setIsInstalling(false)
                setCurrentStep('launch')
            }, 1500)

        } catch (error: any) {
            setStatus('❌ Installation failed: ' + (error.response?.data?.detail || error.message))
            setIsInstalling(false)
        }
    }

    // STEP 4: Launch App
    const handleLaunch = async () => {
        if (!apkInfo) return

        setIsLaunching(true)
        setStatus('🚀 Launching app on your phone...')

        try {
            const res = await axios.post('http://localhost:8000/api/inspector/start-session', {
                device_id: selectedDevice,
                platform: 'android',
                app_package: apkInfo.package_name,
                app_activity: apkInfo.activity
            })

            if (res.data.session_id) {
                setSessionActive(true)
                setStatus('✅ App launched! Capturing screen...')

                setTimeout(async () => {
                    try {
                        const shot = await axios.get('http://localhost:8000/api/inspector/screenshot')
                        setScreenshot(`data:image/png;base64,${shot.data.screenshot}`)
                        setStatus('✅ Ready to record! Start recording your actions.')
                        setIsLaunching(false)
                        setCurrentStep('record')
                    } catch (err) {
                        setStatus('⚠️ App launched but screenshot failed')
                        setIsLaunching(false)
                    }
                }, 3000)
            }
        } catch (error: any) {
            setStatus('❌ Launch failed: ' + (error.response?.data?.detail || error.message))
            setIsLaunching(false)
        }
    }

    // STEP 5: Record Actions (HYBRID - Desktop + Mobile)
    const handleScreenTap = async (e: React.MouseEvent<HTMLImageElement>) => {
        if (!isRecording) return

        const rect = e.currentTarget.getBoundingClientRect()
        const img = e.currentTarget as HTMLImageElement

        const scaleX = img.naturalWidth / img.width
        const scaleY = img.naturalHeight / img.height
        const x = Math.round((e.clientX - rect.left) * scaleX)
        const y = Math.round((e.clientY - rect.top) * scaleY)

        const action: RecordedAction = {
            step: actions.length + 1,
            action: 'tap',
            x,
            y,
            description: `Tap at (${x}, ${y}) [Desktop]`,
            timestamp: Date.now()
        }

        setActions([...actions, action])
        setStatus(`🔴 Recording - ${actions.length + 1} actions captured`)

        try {
            await axios.post('http://localhost:8000/api/inspector/tap-coordinate', { x, y })
        } catch (error) {
            console.error('Tap execution failed:', error)
        }
    }

    // INSPECTOR MODE HANDLERS
    const handleInspectorHover = async (e: React.MouseEvent<HTMLImageElement>) => {
        console.log("[Inspector] 🎯 HOVER EVENT! recordingMode:", recordingMode);

        if (recordingMode !== 'inspector') {
            console.log("[Inspector] ❌ Not inspector mode, returning");
            return;
        }

        // Throttle API calls - only call every 100ms for better responsiveness
        const now = Date.now()
        if (now - (window as any)._lastInspectorHoverTime < 100) return
        (window as any)._lastInspectorHoverTime = now

        const rect = e.currentTarget.getBoundingClientRect()
        const img = e.currentTarget as HTMLImageElement

        const scaleX = img.naturalWidth / img.width
        const scaleY = img.naturalHeight / img.height
        const x = Math.round((e.clientX - rect.left) * scaleX)
        const y = Math.round((e.clientY - rect.top) * scaleY)

        console.log('[Inspector] Hover at:', x, y)

        try {
            const res = await axios.get(`http://localhost:8000/api/inspector/element-at-position?x=${x}&y=${y}`)

            console.log('[Inspector] API response:', res.data)

            if (res.data.found) {
                setHoveredElement(res.data.element)
                setShowElementPanel(true)
                console.log('[Inspector] Element found:', res.data.element.class)
            } else {
                setHoveredElement(null)
                setShowElementPanel(false)
                console.log('[Inspector] No element at position')
            }
        } catch (error) {
            console.error('[Inspector] Element detection failed:', error)
        }
    }

    const handleInspectorClick = async (e: React.MouseEvent<HTMLImageElement>) => {
        if (recordingMode !== 'inspector' || !hoveredElement) return

        const rect = e.currentTarget.getBoundingClientRect()
        const img = e.currentTarget as HTMLImageElement

        const scaleX = img.naturalWidth / img.width
        const scaleY = img.naturalHeight / img.height
        const x = Math.round((e.clientX - rect.left) * scaleX)
        const y = Math.round((e.clientY - rect.top) * scaleY)

        const action: RecordedAction = {
            step: actions.length + 1,
            action: 'tap',
            x,
            y,
            element: hoveredElement,
            description: `🔍 Tap ${hoveredElement.class?.split('.').pop()} "${hoveredElement.text || hoveredElement.resource_id || 'element'}"`,
            timestamp: Date.now()
        }

        setActions([...actions, action])
        setStatus(`🔍 Inspector - ${actions.length + 1} actions captured`)

        try {
            await axios.post('http://localhost:8000/api/inspector/tap-coordinate', { x, y })
        } catch (error) {
            console.error('Tap execution failed:', error)
        }
    }

    // SWIPE RECORDING HANDLERS
    const handleMouseDown = (e: React.MouseEvent<HTMLImageElement>) => {
        if (!isRecording) return

        const rect = e.currentTarget.getBoundingClientRect()
        const img = e.currentTarget as HTMLImageElement
        const scaleX = img.naturalWidth / img.width
        const scaleY = img.naturalHeight / img.height
        const x = Math.round((e.clientX - rect.left) * scaleX)
        const y = Math.round((e.clientY - rect.top) * scaleY)

        setIsDragging(true)
        setDragStart({ x, y })
    }

    const handleMouseMove = (e: React.MouseEvent<HTMLImageElement>) => {
        if (!isDragging || !dragStart) return
        // Visual feedback could be added here
    }

    const handleMouseUp = async (e: React.MouseEvent<HTMLImageElement>) => {
        if (!isRecording || !dragStart) {
            setIsDragging(false)
            setDragStart(null)
            return
        }

        const rect = e.currentTarget.getBoundingClientRect()
        const img = e.currentTarget as HTMLImageElement
        const scaleX = img.naturalWidth / img.width
        const scaleY = img.naturalHeight / img.height
        const endX = Math.round((e.clientX - rect.left) * scaleX)
        const endY = Math.round((e.clientY - rect.top) * scaleY)

        const distance = Math.sqrt(
            Math.pow(endX - dragStart.x, 2) + Math.pow(endY - dragStart.y, 2)
        )

        // TAP if in tap mode OR small movement
        if (recordingMode === 'tap' || distance < 20) {
            const action: RecordedAction = {
                step: actions.length + 1,
                action: 'tap',
                x: dragStart.x,
                y: dragStart.y,
                description: `Tap at (${dragStart.x}, ${dragStart.y})`,
                timestamp: Date.now()
            }

            setActions([...actions, action])
            setStatus(`🔴 Recording - ${actions.length + 1} actions (Tap)`)

            try {
                await axios.post('http://localhost:8000/api/inspector/tap-coordinate', {
                    x: dragStart.x, y: dragStart.y
                })
            } catch (error) {
                console.error('Tap failed:', error)
            }
        }
        // SWIPE if in swipe mode OR larger movement
        else {
            const action: any = {
                step: actions.length + 1,
                action: 'swipe',
                start_x: dragStart.x,
                start_y: dragStart.y,
                end_x: endX,
                end_y: endY,
                duration: 800,
                description: `Swipe from (${dragStart.x},${dragStart.y}) to (${endX},${endY})`,
                timestamp: Date.now()
            }

            setActions([...actions, action])
            setStatus(`🔴 Recording - ${actions.length + 1} actions (Swipe ${distance.toFixed(0)}px)`)

            try {
                await axios.post('http://localhost:8000/api/inspector/swipe', {
                    start_x: dragStart.x,
                    start_y: dragStart.y,
                    end_x: endX,
                    end_y: endY,
                    duration: 500
                })
            } catch (error) {
                console.error('Swipe failed:', error)
            }
        }

        setIsDragging(false)
        setDragStart(null)
    }

    const handleStartRecording = async () => {
        setIsRecording(true)
        setStatus('🔴 Recording... Tap on screen OR phone to record')

        // Start mobile touch monitoring
        try {
            await axios.post('http://localhost:8000/api/inspector/start-mobile-monitoring', {
                device_id: selectedDevice
            })
            console.log('✅ Mobile touch monitoring started')
        } catch (error) {
            console.error('Failed to start mobile monitoring:', error)
        }
    }

    const handleStopRecording = async () => {
        setIsRecording(false)
        setStatus(`⏸️ Recording stopped. ${actions.length} actions captured. Ready to save!`)

        // Stop mobile touch monitoring
        try {
            await axios.post('http://localhost:8000/api/inspector/stop-mobile-monitoring', {
                device_id: selectedDevice
            })
            console.log('✅ Mobile touch monitoring stopped')
        } catch (error) {
            console.error('Failed to stop mobile monitoring:', error)
        }

        if (actions.length > 0) {
            setCurrentStep('save')
        }
    }

    // WebSocket listener for mobile touch events
    useEffect(() => {
        if (!isRecording) return

        const ws = new WebSocket('ws://localhost:8000/ws/realtime')

        ws.onmessage = (event) => {
            const data = JSON.parse(event.data)

            if (data.type === 'mobile_action' && data.device_id === selectedDevice) {
                const mobileAction = data.action
                console.log('📱 Mobile action detected:', mobileAction)

                // Create action based on mobile touch type
                let description = ''
                let actionType = mobileAction.type || 'tap'

                if (mobileAction.type === 'tap') {
                    description = `Tap at (${mobileAction.x}, ${mobileAction.y}) [Mobile 📱]`
                } else if (mobileAction.type === 'swipe') {
                    description = `Swipe from (${mobileAction.start_x},${mobileAction.start_y}) to (${mobileAction.end_x},${mobileAction.end_y}) [Mobile 📱]`
                    actionType = 'swipe'
                } else if (mobileAction.type === 'long_press') {
                    description = `Long press at (${mobileAction.x}, ${mobileAction.y}) ${mobileAction.duration?.toFixed(1)}s [Mobile 📱]`
                    actionType = 'long_press'
                }

                const newAction: RecordedAction = {
                    step: actions.length + 1,
                    action: actionType,
                    x: mobileAction.x || mobileAction.end_x,
                    y: mobileAction.y || mobileAction.end_y,
                    description,
                    timestamp: Date.now()
                }

                setActions(prev => [...prev, newAction])
                setStatus(`🔴 Recording - ${actions.length + 1} actions captured (Mobile 📱)`)
            }
        }

        return () => ws.close()
    }, [isRecording, selectedDevice, actions.length])

    // STEP 6: Save Test
    const handleSaveFlow = async () => {
        if (actions.length === 0) {
            alert('No actions to save!')
            return
        }

        if (!flowName.trim()) {
            alert('Please enter a test name!')
            return
        }

        setStatus('Saving test flow...')

        try {
            const res = await axios.post('http://localhost:8000/api/flows/', {
                name: flowName,
                description: `Automated test - ${actions.length} steps`,
                device_id: selectedDevice,
                device_name: devices.find(d => d.device_id === selectedDevice)?.name || 'Unknown',
                device_platform: 'Android',
                device_os_version: '',
                app_package: apkInfo?.package_name || '',
                app_name: apkInfo?.app_name || '',
                app_version: apkInfo?.version || '',
                app_activity: apkInfo?.activity || '.MainActivity',  // SAVE ACTIVITY!
                steps: actions,
                flow_metadata: {
                    recorded_at: new Date().toISOString(),
                    total_steps: actions.length
                }
            })

            setSavedFlowId(res.data.id)
            setStatus(`✅ Test "${flowName}" saved successfully!`)
            setCurrentStep('playback')

        } catch (error: any) {
            setStatus('❌ Save failed: ' + (error.response?.data?.detail || error.message))
        }
    }

    // STEP 7: Playback - Auto-launches app!
    const handlePlayback = async () => {
        if (!savedFlowId) {
            alert('No saved flow to play!')
            return
        }

        setIsPlaying(true)
        setPlaybackProgress(0)
        setPlaybackResults(null)
        setStatus('🎬 Starting playback... (Auto-launching app if needed)')

        try {
            const res = await axios.post('http://localhost:8000/api/playback/start', {
                flow_id: savedFlowId,
                device_id: selectedDevice
            })

            setPlaybackResults(res.data)
            setStatus(`✅ Playback completed! ${res.data.successful_steps}/${res.data.total_steps} steps successful`)
            setIsPlaying(false)

        } catch (error: any) {
            setStatus('❌ Playback failed: ' + (error.response?.data?.detail || error.message))
            setIsPlaying(false)
        }
    }

    const handleResetWizard = () => {
        setCurrentStep('device')
        setActions([])
        setSavedFlowId(null)
        setFlowName('')
        setPlaybackResults(null)
        setStatus('Ready to start a new test!')
    }

    const handleGenerateCode = async () => {
        if (actions.length === 0) {
            alert('No actions recorded yet! Record some taps or swipes first.')
            return
        }

        try {
            console.log('[CodeGen] Generating', codeLanguage, 'code for', actions.length, 'actions')

            const res = await axios.post('http://localhost:8000/api/codegen/generate', {
                actions: actions,
                language: codeLanguage
            })

            console.log('[CodeGen] ✅ Code generated successfully!')

            // Save to localStorage for CodeEditor to pick up
            localStorage.setItem('generatedCode', res.data.code)
            localStorage.setItem('generatedLanguage', codeLanguage)

            // Trigger event to switch to editor tab
            window.dispatchEvent(new CustomEvent('openCodeEditor', {
                detail: { code: res.data.code, language: codeLanguage }
            }))

            alert('✅ Code generated! Opening code editor...')

        } catch (error: any) {
            console.error('[CodeGen] ❌ Failed:', error)
            alert('Code generation failed: ' + (error.response?.data?.detail || error.message))
        }
    }



    // Render current step
    const renderStep = () => {
        switch (currentStep) {
            case 'device':
                return (
                    <div style={{ textAlign: 'center', padding: '60px 40px', maxWidth: '700px', margin: '0 auto' }}>
                        {/* Floating Phone Icon */}
                        <div style={{
                            fontSize: '96px',
                            marginBottom: '32px',
                            animation: 'iconFloat 5s ease-in-out infinite, iconRotate 20s linear infinite',
                            filter: 'drop-shadow(0 10px 30px rgba(88, 166, 255, 0.3))'
                        }}>
                            📱
                        </div>

                        {/* Premium Title */}
                        <h2 style={{
                            fontSize: '42px',
                            fontWeight: 900,
                            background: 'linear-gradient(135deg, #ffffff 0%, #58a6ff 50%, #a78bfa 100%)',
                            backgroundSize: '200% 100%',
                            WebkitBackgroundClip: 'text',
                            WebkitTextFillColor: 'transparent',
                            marginBottom: '16px',
                            letterSpacing: '-2px',
                            animation: 'gradientFlow 5s ease infinite, textFloat 4s ease-in-out infinite',
                            textShadow: '0 0 40px rgba(88, 166, 255, 0.3)'
                        }}>
                            Select Your Device
                        </h2>

                        {/* Subtitle */}
                        <p style={{
                            color: '#8b949e',
                            marginBottom: '40px',
                            fontSize: '16px',
                            lineHeight: '1.6',
                            fontWeight: 500
                        }}>
                            Connect your Android device via USB and select it below
                        </p>

                        {devices.length > 0 ? (
                            <div style={{
                                maxWidth: '500px',
                                margin: '0 auto'
                            }}>
                                {/* Premium Dropdown */}
                                <select
                                    value={selectedDevice}
                                    onChange={(e) => setSelectedDevice(e.target.value)}
                                    style={{
                                        width: '100%',
                                        padding: '16px 20px',
                                        fontSize: '16px',
                                        background: 'rgba(13, 17, 23, 0.7)',
                                        color: '#e6edf3',
                                        border: '1.5px solid rgba(48, 54, 61, 0.6)',
                                        borderRadius: '12px',
                                        marginBottom: '32px',
                                        fontWeight: 600,
                                        outline: 'none',
                                        cursor: 'pointer',
                                        transition: 'all 0.3s'
                                    }}
                                    onFocus={(e) => {
                                        e.currentTarget.style.borderColor = '#58a6ff'
                                        e.currentTarget.style.boxShadow = '0 0 0 3px rgba(88, 166, 255, 0.15), 0 0 20px rgba(88, 166, 255, 0.2)'
                                    }}
                                    onBlur={(e) => {
                                        e.currentTarget.style.borderColor = 'rgba(48, 54, 61, 0.6)'
                                        e.currentTarget.style.boxShadow = 'none'
                                    }}
                                >
                                    {devices.map(d => (
                                        <option key={d.device_id} value={d.device_id}>
                                            {d.name} ({d.device_id})
                                        </option>
                                    ))}
                                </select>

                                {/* Premium Next Button */}
                                <button
                                    onClick={handleDeviceNext}
                                    style={{
                                        width: '100%',
                                        padding: '18px 36px',
                                        fontSize: '18px',
                                        fontWeight: 900,
                                        background: 'linear-gradient(135deg, #58a6ff 0%, #1f6feb 50%, #58a6ff 100%)',
                                        backgroundSize: '200% 100%',
                                        color: 'white',
                                        border: 'none',
                                        borderRadius: '14px',
                                        cursor: 'pointer',
                                        transition: 'all 0.4s',
                                        boxShadow: '0 0 40px rgba(88, 166, 255, 0.6), 0 10px 30px rgba(0, 0, 0, 0.5), inset 0 1px 0 rgba(255, 255, 255, 0.2)',
                                        animation: 'buttonPulse 2.5s ease-in-out infinite'
                                    }}
                                    onMouseEnter={(e) => {
                                        e.currentTarget.style.transform = 'translateY(-3px) scale(1.02)'
                                        e.currentTarget.style.boxShadow = '0 0 60px rgba(88, 166, 255, 0.8), 0 15px 40px rgba(0, 0, 0, 0.6), inset 0 1px 0 rgba(255, 255, 255, 0.3)'
                                        e.currentTarget.style.backgroundPosition = '100% 0'
                                    }}
                                    onMouseLeave={(e) => {
                                        e.currentTarget.style.transform = 'translateY(0) scale(1)'
                                        e.currentTarget.style.boxShadow = '0 0 40px rgba(88, 166, 255, 0.6), 0 10px 30px rgba(0, 0, 0, 0.5), inset 0 1px 0 rgba(255, 255, 255, 0.2)'
                                        e.currentTarget.style.backgroundPosition = '0% 0'
                                    }}
                                >
                                    Next: Upload APK →
                                </button>
                            </div>
                        ) : (
                            /* Premium Error Card */
                            <div style={{
                                maxWidth: '600px',
                                margin: '0 auto',
                                padding: '24px 32px',
                                background: 'linear-gradient(135deg, rgba(248, 81, 73, 0.15), rgba(218, 54, 51, 0.12))',
                                backdropFilter: 'blur(10px)',
                                borderRadius: '16px',
                                border: '1.5px solid rgba(248, 81, 73, 0.3)',
                                boxShadow: '0 10px 30px rgba(248, 81, 73, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.05)',
                                animation: 'glow 3s ease-in-out infinite'
                            }}>
                                <div style={{
                                    fontSize: '48px',
                                    marginBottom: '16px',
                                    animation: 'pulse 2s infinite'
                                }}>
                                    ⚠️
                                </div>
                                <div style={{
                                    fontSize: '18px',
                                    color: '#f85149',
                                    fontWeight: 700,
                                    marginBottom: '8px'
                                }}>
                                    No Devices Connected
                                </div>
                                <div style={{
                                    fontSize: '14px',
                                    color: '#8b949e',
                                    lineHeight: '1.6',
                                    fontWeight: 500
                                }}>
                                    Please connect your Android device via USB and enable USB debugging
                                </div>
                            </div>
                        )}
                    </div>
                )


            case 'apk':
                return (
                    <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        minHeight: 'calc(100vh - 150px)',
                        maxHeight: 'calc(100vh - 150px)',
                        padding: '40px',
                        overflowY: 'auto'
                    }}>
                        <div style={{
                            textAlign: 'center',
                            background: 'linear-gradient(135deg, #161b22 0%, #0d1117 100%)',
                            borderRadius: '24px',
                            padding: '40px 60px',
                            border: '1px solid #30363d',
                            boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
                            maxWidth: '600px',
                            width: '100%',
                            margin: 'auto'
                        }}>
                            <div style={{
                                fontSize: '96px',
                                marginBottom: '32px',
                                animation: 'float 3s ease-in-out infinite'
                            }}>
                                📦
                            </div>
                            <h2 style={{
                                fontSize: '36px',
                                marginBottom: '20px',
                                background: 'linear-gradient(90deg, #58a6ff, #2ea043)',
                                WebkitBackgroundClip: 'text',
                                WebkitTextFillColor: 'transparent',
                                fontWeight: 700
                            }}>
                                Step 2: Upload APK
                            </h2>
                            <p style={{
                                color: '#7d8590',
                                marginBottom: '40px',
                                fontSize: '18px',
                                lineHeight: '1.6'
                            }}>
                                Select the APK file you want to test
                            </p>

                            <input
                                ref={fileInputRef}
                                type="file"
                                accept=".apk"
                                onChange={(e) => {
                                    const file = e.target.files?.[0]
                                    if (file) handleAPKUpload(file)
                                }}
                                style={{ display: 'none' }}
                            />

                            {!isUploading && (
                                <button
                                    onClick={() => fileInputRef.current?.click()}
                                    onMouseEnter={(e) => {
                                        e.currentTarget.style.transform = 'translateY(-2px) scale(1.02)'
                                        e.currentTarget.style.boxShadow = '0 0 30px rgba(31, 111, 235, 0.6), 0 12px 32px rgba(0,0,0,0.4)'
                                    }}
                                    onMouseLeave={(e) => {
                                        e.currentTarget.style.transform = 'translateY(0) scale(1)'
                                        e.currentTarget.style.boxShadow = '0 0 20px rgba(31, 111, 235, 0.4), 0 4px 12px rgba(0, 0, 0, 0.3)'
                                    }}
                                    style={{
                                        padding: '18px 48px',
                                        fontSize: '20px',
                                        background: 'linear-gradient(135deg, #1f6feb 0%, #388bfd 100%)',
                                        color: 'white',
                                        border: 'none',
                                        borderRadius: '14px',
                                        cursor: 'pointer',
                                        fontWeight: 700,
                                        boxShadow: '0 0 20px rgba(31, 111, 235, 0.4), 0 4px 12px rgba(0, 0, 0, 0.3)',
                                        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                                        animation: 'slideUp 0.5s ease-out'
                                    }}
                                >
                                    <span style={{
                                        display: 'inline-block',
                                        marginRight: '12px',
                                        fontSize: '24px'
                                    }}>📁</span>
                                    Choose APK File
                                </button>
                            )}

                            {apkFile && !isUploading && (
                                <div style={{
                                    marginTop: '32px',
                                    padding: '16px 24px',
                                    background: '#0d1117',
                                    borderRadius: '12px',
                                    border: '1px solid #21262d',
                                    color: '#58a 6ff',
                                    fontSize: '15px',
                                    fontWeight: 600
                                }}>
                                    ✓ Selected: {apkFile.name}
                                </div>
                            )}

                            {/* Premium Upload Progress */}
                            {isUploading && (
                                <div style={{
                                    marginTop: '32px',
                                    padding: '32px',
                                    background: 'linear-gradient(135deg, #0d1117 0%, #161b22 100%)',
                                    borderRadius: '16px',
                                    border: '1px solid #30363d',
                                    boxShadow: '0 4px 16px rgba(0,0,0,0.3)'
                                }}>
                                    {/* Animated Loader */}
                                    <div style={{
                                        fontSize: '64px',
                                        marginBottom: '24px',
                                        animation: 'spin 1s linear infinite'
                                    }}>
                                        ⏳
                                    </div>

                                    {/* Progress Text */}
                                    <div style={{
                                        fontSize: '20px',
                                        color: '#58a6ff',
                                        fontWeight: 700,
                                        marginBottom: '20px'
                                    }}>
                                        {uploadProgress < 100 ? `Uploading: ${uploadProgress}%` : '🔍 Analyzing APK...'}
                                    </div>

                                    {/* Premium Progress Bar */}
                                    <div style={{
                                        width: '100%',
                                        height: '12px',
                                        background: '#21262d',
                                        borderRadius: '6px',
                                        overflow: 'hidden',
                                        position: 'relative',
                                        boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.3)'
                                    }}>
                                        <div style={{
                                            width: `${uploadProgress}%`,
                                            height: '100%',
                                            background: 'linear-gradient(90deg, #2ea043, #58a6ff, #2ea043)',
                                            backgroundSize: '200% 100%',
                                            borderRadius: '6px',
                                            transition: 'width 0.3s ease',
                                            boxShadow: '0 0 15px rgba(46, 160, 67, 0.6)',
                                            animation: 'gradientShift 2s ease infinite'
                                        }} />
                                    </div>

                                    {apkFile && (
                                        <div style={{
                                            marginTop: '20px',
                                            fontSize: '14px',
                                            color: '#7d8590'
                                        }}>
                                            {apkFile.name}
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                )

            case 'install':
                return (
                    <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        height: 'calc(100vh - 150px)',
                        padding: '40px'
                    }}>
                        <div style={{
                            textAlign: 'center',
                            background: 'rgba(22, 27, 34, 0.8)',
                            backdropFilter: 'blur(20px)',
                            borderRadius: '20px',
                            padding: '50px 70px',
                            border: '1px solid rgba(48, 54, 61, 0.5)',
                            boxShadow: '0 20px 60px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.05) inset',
                            maxWidth: '650px',
                            width: '100%'
                        }}>
                            {/* Icon */}
                            <div style={{
                                fontSize: '72px',
                                marginBottom: '24px',
                                filter: 'drop-shadow(0 4px 12px rgba(88, 166, 255, 0.3))',
                                animation: isInstalling
                                    ? 'spin 1s linear infinite'
                                    : apkInfo?.already_installed
                                        ? 'bounce 0.6s ease-out'
                                        : 'float 3s ease-in-out infinite'
                            }}>
                                {isInstalling ? '⏳' : apkInfo?.already_installed ? '✅' : '⬇️'}
                            </div>

                            {/* Title */}
                            <h2 style={{
                                fontSize: '28px',
                                marginBottom: '30px',
                                color: '#ffffff',
                                fontWeight: 600,
                                letterSpacing: '-0.5px'
                            }}>
                                {apkInfo?.already_installed ? 'App Already Installed' : 'Install Application'}
                            </h2>

                            {/* App Info Card */}
                            {apkInfo && (
                                <div style={{
                                    background: 'rgba(13, 17, 23, 0.6)',
                                    padding: '24px',
                                    borderRadius: '12px',
                                    marginBottom: '28px',
                                    border: '1px solid rgba(48, 54, 61, 0.4)',
                                    backdropFilter: 'blur(10px)'
                                }}>
                                    <div style={{
                                        fontSize: '16px',
                                        marginBottom: '16px',
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        alignItems: 'center'
                                    }}>
                                        <span style={{ color: '#7d8590', fontWeight: 600 }}>App:</span>
                                        <span style={{ color: '#e6edf3', fontWeight: 700, fontSize: '18px' }}>{apkInfo.app_name}</span>
                                    </div>
                                    <div style={{
                                        fontSize: '14px',
                                        marginBottom: '16px',
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        alignItems: 'center'
                                    }}>
                                        <span style={{ color: '#7d8590', fontWeight: 600 }}>Package:</span>
                                        <span style={{ color: '#58a6ff', fontWeight: 600, fontSize: '13px' }}>{apkInfo.package_name}</span>
                                    </div>
                                    <div style={{
                                        fontSize: '16px',
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        alignItems: 'center'
                                    }}>
                                        <span style={{ color: '#7d8590', fontWeight: 600 }}>Version:</span>
                                        <span style={{ color: '#e6edf3', fontWeight: 700, fontSize: '18px' }}>{apkInfo.version}</span>
                                    </div>
                                </div>
                            )}

                            {/* Installing Progress */}
                            {isInstalling && (
                                <div style={{ marginBottom: '32px' }}>
                                    <div style={{
                                        fontSize: '18px',
                                        color: '#58a6ff',
                                        fontWeight: 700,
                                        marginBottom: '16px'
                                    }}>
                                        {installProgress}% - {installStatus}
                                    </div>
                                    <div style={{
                                        background: '#0d1117',
                                        height: '6px',
                                        borderRadius: '3px',
                                        overflow: 'hidden',
                                        border: '1px solid #21262d'
                                    }}>
                                        <div style={{
                                            width: `${installProgress}%`,
                                            height: '100%',
                                            background: '#58a6ff',
                                            transition: 'width 0.3s ease',
                                            boxShadow: '0 0 10px rgba(88, 166, 255, 0.5)'
                                        }} />
                                    </div>
                                </div>
                            )}

                            {/* Action Buttons */}
                            {!isInstalling && (
                                <>
                                    {apkInfo?.already_installed && (
                                        <div style={{
                                            marginBottom: '28px',
                                            padding: '14px 20px',
                                            background: 'rgba(46, 160, 67, 0.15)',
                                            borderRadius: '10px',
                                            border: '1px solid rgba(46, 160, 67, 0.3)',
                                            color: '#3fb950',
                                            fontSize: '15px',
                                            fontWeight: 600
                                        }}>
                                            ✅ App is already on your device
                                        </div>
                                    )}

                                    <div style={{ display: 'flex', gap: '16px', justifyContent: 'center' }}>
                                        {!apkInfo?.already_installed && (
                                            <button
                                                onClick={handleInstall}
                                                onMouseEnter={(e) => {
                                                    e.currentTarget.style.transform = 'translateY(-2px)'
                                                    e.currentTarget.style.boxShadow = '0 0 30px rgba(46, 160, 67, 0.6), 0 12px 32px rgba(0,0,0,0.4)'
                                                }}
                                                onMouseLeave={(e) => {
                                                    e.currentTarget.style.transform = 'translateY(0)'
                                                    e.currentTarget.style.boxShadow = '0 0 20px rgba(46, 160, 67, 0.4), 0 4px 12px rgba(0,0,0,0.3)'
                                                }}
                                                style={{
                                                    padding: '16px 40px',
                                                    fontSize: '18px',
                                                    background: 'linear-gradient(135deg, #2ea043, #238636)',
                                                    color: 'white',
                                                    border: 'none',
                                                    borderRadius: '14px',
                                                    cursor: 'pointer',
                                                    fontWeight: 700,
                                                    boxShadow: '0 0 20px rgba(46, 160, 67, 0.4), 0 4px 12px rgba(0,0,0,0.3)',
                                                    transition: 'all 0.3s'
                                                }}
                                            >
                                                ⬇️ Install on Device
                                            </button>
                                        )}

                                        <button
                                            onClick={() => setCurrentStep('launch')}
                                            onMouseEnter={(e) => {
                                                e.currentTarget.style.transform = 'translateY(-2px)'
                                                e.currentTarget.style.boxShadow = '0 0 30px rgba(31, 111, 235, 0.6), 0 12px 32px rgba(0,0,0,0.4)'
                                            }}
                                            onMouseLeave={(e) => {
                                                e.currentTarget.style.transform = 'translateY(0)'
                                                e.currentTarget.style.boxShadow = '0 0 20px rgba(31, 111, 235, 0.4), 0 4px 12px rgba(0,0,0,0.3)'
                                            }}
                                            style={{
                                                padding: '16px 40px',
                                                fontSize: '18px',
                                                background: 'linear-gradient(135deg, #1f6feb, #388bfd)',
                                                color: 'white',
                                                border: 'none',
                                                borderRadius: '14px',
                                                cursor: 'pointer',
                                                fontWeight: 700,
                                                boxShadow: '0 0 20px rgba(31, 111, 235, 0.4), 0 4px 12px rgba(0,0,0,0.3)',
                                                transition: 'all 0.3s'
                                            }}
                                        >
                                            {apkInfo?.already_installed ? 'Next: Launch App →' : 'Skip to Launch →'}
                                        </button>
                                    </div>
                                </>
                            )}
                        </div>
                    </div>
                )

            case 'launch':
                return sessionActive && screenshot ? (
                    // RUNNING STATE: Split layout with device on left
                    <div style={{
                        display: 'flex',
                        minHeight: 'calc(100vh - 150px)',
                        gap: '20px',
                        padding: '20px',
                        overflowY: 'auto'
                    }}>
                        {/* LEFT: Full Device Screenshot */}
                        <div style={{
                            flex: '0 0 auto',
                            display: 'flex',
                            alignItems: 'flex-start',
                            justifyContent: 'center',
                            background: 'linear-gradient(135deg, #161b22 0%, #0d1117 100%)',
                            borderRadius: '20px',
                            padding: '20px',
                            border: '2px solid #2ea043',
                            boxShadow: '0 0 30px rgba(46, 160, 67, 0.3), 0 8px 32px rgba(0,0,0,0.4)'
                        }}>
                            <img
                                src={screenshot}
                                alt="Device screen"
                                style={{
                                    maxHeight: 'calc(100vh - 230px)',
                                    maxWidth: '100%',
                                    width: 'auto',
                                    height: 'auto',
                                    borderRadius: '16px',
                                    boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
                                    objectFit: 'contain'
                                }}
                            />
                        </div>

                        {/* RIGHT: App Info Panel */}
                        <div style={{
                            flex: 1,
                            display: 'flex',
                            flexDirection: 'column',
                            justifyContent: 'center',
                            alignItems: 'center',
                            background: 'linear-gradient(135deg, #161b22 0%, #0d1117 100%)',
                            borderRadius: '20px',
                            padding: '40px',
                            border: '1px solid #30363d',
                            boxShadow: '0 8px 32px rgba(0,0,0,0.4)'
                        }}>
                            <div style={{
                                fontSize: '80px',
                                marginBottom: '24px',
                                animation: 'bounce 0.6s ease-out'
                            }}>
                                ✅
                            </div>
                            <h2 style={{
                                fontSize: '32px',
                                marginBottom: '16px',
                                background: 'linear-gradient(90deg, #2ea043, #58a6ff)',
                                WebkitBackgroundClip: 'text',
                                WebkitTextFillColor: 'transparent',
                                fontWeight: 700
                            }}>
                                App is Running!
                            </h2>
                            <p style={{
                                color: '#7d8590',
                                fontSize: '18px',
                                marginBottom: '32px',
                                textAlign: 'center',
                                lineHeight: '1.6'
                            }}>
                                {apkInfo?.app_name || 'Your app'} is now running on your device. Ready to record actions!
                            </p>

                            {/* App Info Card */}
                            {apkInfo && (
                                <div style={{
                                    background: '#0d1117',
                                    borderRadius: '16px',
                                    padding: '24px',
                                    border: '1px solid #21262d',
                                    width: '100%',
                                    maxWidth: '400px'
                                }}>
                                    <div style={{
                                        fontSize: '14px',
                                        marginBottom: '12px',
                                        display: 'flex',
                                        justifyContent: 'space-between'
                                    }}>
                                        <span style={{ color: '#7d8590' }}>App:</span>
                                        <span style={{ color: '#e6edf3', fontWeight: 600 }}>{apkInfo.app_name}</span>
                                    </div>
                                    <div style={{
                                        fontSize: '14px',
                                        marginBottom: '12px',
                                        display: 'flex',
                                        justifyContent: 'space-between'
                                    }}>
                                        <span style={{ color: '#7d8590' }}>Package:</span>
                                        <span style={{ color: '#58a6ff', fontWeight: 500, fontSize: '12px' }}>{apkInfo.package_name}</span>
                                    </div>
                                    <div style={{
                                        fontSize: '14px',
                                        display: 'flex',
                                        justifyContent: 'space-between'
                                    }}>
                                        <span style={{ color: '#7d8590' }}>Version:</span>
                                        <span style={{ color: '#e6edf3', fontWeight: 600 }}>{apkInfo.version}</span>
                                    </div>
                                </div>
                            )}

                            <button
                                onClick={() => setCurrentStep('record')}
                                style={{
                                    marginTop: '32px',
                                    padding: '16px 40px',
                                    fontSize: '18px',
                                    background: 'linear-gradient(135deg, #58a6ff, #1f6feb)',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '14px',
                                    cursor: 'pointer',
                                    fontWeight: 700,
                                    boxShadow: '0 0 20px rgba(88, 166, 255, 0.4), 0 4px 12px rgba(0,0,0,0.3)',
                                    transition: 'all 0.3s'
                                }}
                                onMouseEnter={(e) => {
                                    e.currentTarget.style.transform = 'translateY(-2px)'
                                    e.currentTarget.style.boxShadow = '0 0 30px rgba(88, 166, 255, 0.6), 0 8px 24px rgba(0,0,0,0.4)'
                                }}
                                onMouseLeave={(e) => {
                                    e.currentTarget.style.transform = 'translateY(0)'
                                    e.currentTarget.style.boxShadow = '0 0 20px rgba(88, 166, 255, 0.4), 0 4px 12px rgba(0,0,0,0.3)'
                                }}
                            >
                                Continue to Recording →
                            </button>
                        </div>
                    </div>
                ) : (
                    // IDLE/LAUNCHING STATE: Centered layout
                    <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        height: 'calc(100vh - 150px)',
                        padding: '40px'
                    }}>
                        <div style={{
                            textAlign: 'center',
                            background: 'linear-gradient(135deg, #161b22 0%, #0d1117 100%)',
                            borderRadius: '24px',
                            padding: '60px 80px',
                            border: '1px solid #30363d',
                            boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
                            maxWidth: '600px'
                        }}>
                            <div style={{
                                fontSize: '96px',
                                marginBottom: '32px',
                                animation: isLaunching ? 'spin 1s linear infinite' : 'float 3s ease-in-out infinite'
                            }}>
                                {isLaunching ? '⏳' : '🚀'}
                            </div>
                            <h2 style={{
                                fontSize: '36px',
                                marginBottom: '20px',
                                background: 'linear-gradient(90deg, #58a6ff, #2ea043)',
                                WebkitBackgroundClip: 'text',
                                WebkitTextFillColor: 'transparent',
                                fontWeight: 700
                            }}>
                                {isLaunching ? 'Launching App...' : 'Step 4: Launch App'}
                            </h2>
                            <p style={{
                                color: '#7d8590',
                                marginBottom: '40px',
                                fontSize: '18px',
                                lineHeight: '1.6'
                            }}>
                                {isLaunching
                                    ? 'Starting app on your phone...'
                                    : 'Click to launch the app on your device'}
                            </p>

                            {!isLaunching && (
                                <button
                                    onClick={handleLaunch}
                                    onMouseEnter={(e) => {
                                        e.currentTarget.style.transform = 'translateY(-2px) scale(1.02)'
                                        e.currentTarget.style.boxShadow = '0 0 40px rgba(46, 160, 67, 0.6), 0 12px 32px rgba(0,0,0,0.4)'
                                    }}
                                    onMouseLeave={(e) => {
                                        e.currentTarget.style.transform = 'translateY(0) scale(1)'
                                        e.currentTarget.style.boxShadow = '0 0 20px rgba(46, 160, 67, 0.4), 0 4px 12px rgba(0, 0, 0, 0.3)'
                                    }}
                                    style={{
                                        padding: '18px 48px',
                                        fontSize: '20px',
                                        background: 'linear-gradient(135deg, #2ea043 0%, #238636 100%)',
                                        color: 'white',
                                        border: 'none',
                                        borderRadius: '14px',
                                        cursor: 'pointer',
                                        fontWeight: 700,
                                        boxShadow: '0 0 20px rgba(46, 160, 67, 0.4), 0 4px 12px rgba(0, 0, 0, 0.3)',
                                        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                                        animation: 'slideUp 0.5s ease-out'
                                    }}
                                >
                                    <span style={{
                                        display: 'inline-block',
                                        animation: 'float 3s ease-in-out infinite',
                                        marginRight: '12px',
                                        fontSize: '24px'
                                    }}>🚀</span>
                                    Launch {apkInfo?.app_name || 'App'}
                                </button>
                            )}

                            {isLaunching && (
                                <div style={{
                                    marginTop: '20px',
                                    fontSize: '16px',
                                    color: '#58a6ff',
                                    fontWeight: 600,
                                    animation: 'pulse 2s infinite'
                                }}>
                                    Please wait...
                                </div>
                            )}
                        </div>
                    </div>
                )

            case 'record':
                return (
                    <div style={{
                        display: 'flex',
                        minHeight: 'calc(100vh - 150px)',
                        gap: '20px',
                        padding: '20px',
                        overflowY: 'auto',
                        justifyContent: 'center'
                    }}>
                        {/* LEFT: Device Screenshot */}
                        <div style={{
                            flex: '0 0 auto',
                            display: 'flex',
                            alignItems: 'flex-start',
                            justifyContent: 'center',
                            background: 'linear-gradient(135deg, #161b22 0%, #0d1117 100%)',
                            borderRadius: '20px',
                            padding: '20px',
                            border: isRecording ? '3px solid #dc2626' : '2px solid #30363d',
                            boxShadow: isRecording
                                ? '0 0 40px rgba(220, 38, 38, 0.5), 0 8px 32px rgba(0,0,0,0.4)'
                                : '0 8px 32px rgba(0,0,0,0.4)',
                            transition: 'all 0.3s',
                            position: 'relative'  // For overlay positioning
                        }}>
                            {screenshot && (
                                <img
                                    src={screenshot}
                                    alt="Device Screen"
                                    onMouseDown={recordingMode === 'inspector' ? undefined : handleMouseDown}
                                    onMouseMove={recordingMode === 'inspector' ? handleInspectorHover : handleMouseMove}
                                    onMouseUp={recordingMode === 'inspector' ? undefined : handleMouseUp}
                                    onClick={recordingMode === 'inspector' ? handleInspectorClick : undefined}
                                    style={{
                                        maxHeight: 'calc(100vh - 230px)',
                                        maxWidth: '100%',
                                        width: 'auto',
                                        height: 'auto',
                                        borderRadius: '16px',
                                        cursor: recordingMode === 'inspector' ? 'pointer' : (isRecording ? 'crosshair' : 'default'),
                                        boxShadow: isRecording
                                            ? '0 0 30px rgba(220, 38, 38, 0.6)'
                                            : recordingMode === 'inspector'
                                                ? '0 0 30px rgba(139, 92, 246, 0.6)'
                                                : '0 4px 12px rgba(0,0,0,0.3)',
                                        transition: 'all 0.3s',
                                        border: isRecording ? '2px solid #dc2626' : (recordingMode === 'inspector' ? '2px solid #8b5cf6' : 'none'),
                                        objectFit: 'contain'
                                    }}
                                />
                            )}


                            {/* Visual Highlight Box - Real-time element bounds */}
                            {recordingMode === 'inspector' && hoveredElement && hoveredElement.bounds && screenshot && (
                                (() => {
                                    const imgElement = document.querySelector('img[alt="Device Screen"]') as HTMLImageElement;
                                    if (!imgElement) return null;

                                    const scaleX = imgElement.naturalWidth / imgElement.width;
                                    const scaleY = imgElement.naturalHeight / imgElement.height;

                                    const bounds = hoveredElement.bounds;
                                    const left = bounds.x1 / scaleX;
                                    const top = bounds.y1 / scaleY;
                                    const width = (bounds.x2 - bounds.x1) / scaleX;
                                    const height = (bounds.y2 - bounds.y1) / scaleY;

                                    return (
                                        <div style={{
                                            position: 'absolute',
                                            left: `${left}px`,
                                            top: `${top}px`,
                                            width: `${width}px`,
                                            height: `${height}px`,
                                            border: '2px solid #30a9de',
                                            borderRadius: '4px',
                                            pointerEvents: 'none',
                                            zIndex: 999,
                                            boxShadow: '0 0 10px rgba(48, 169, 222, 0.6), inset 0 0 10px rgba(48, 169, 222, 0.1)',
                                            background: 'rgba(48, 169, 222, 0.05)',
                                            transition: 'all 0.15s ease-out'
                                        }} />
                                    );
                                })()
                            )}
                            {/* Selected Element Panel - Appium Inspector Style */}
                            {recordingMode === 'inspector' && hoveredElement && (
                                <div style={{
                                    position: 'absolute',
                                    top: '20px',
                                    right: '20px',
                                    width: '340px',
                                    maxHeight: 'calc(100vh - 280px)',
                                    background: 'linear-gradient(135deg, #0d1117, #161b22)',
                                    border: '2px solid #30a9de',
                                    borderRadius: '12px',
                                    boxShadow: '0 8px 32px rgba(48, 169, 222, 0.5)',
                                    zIndex: 2000,
                                    overflow: 'hidden'
                                }}>
                                    <div style={{
                                        padding: '14px 16px',
                                        background: '#30a9de',
                                        color: 'white',
                                        fontSize: '14px',
                                        fontWeight: 700
                                    }}>
                                        🎯 Selected Element
                                    </div>
                                    <div style={{ padding: '16px', maxHeight: 'calc(100vh - 360px)', overflowY: 'auto' }}>
                                        {hoveredElement.resource_id && (
                                            <div style={{ marginBottom: '12px', padding: '10px', background: '#161b22', borderRadius: '6px' }}>
                                                <div style={{ fontSize: '10px', color: '#8b949e', marginBottom: '4px' }}>ID</div>
                                                <div style={{ color: '#58a6ff', fontSize: '11px', fontFamily: 'monospace', wordBreak: 'break-all' }}>
                                                    {hoveredElement.resource_id}
                                                </div>
                                            </div>
                                        )}
                                        <div style={{ marginBottom: '12px', padding: '10px', background: '#161b22', borderRadius: '6px' }}>
                                            <div style={{ fontSize: '10px', color: '#8b949e', marginBottom: '4px' }}>CLASS</div>
                                            <div style={{ color: '#58a6ff', fontSize: '11px', fontFamily: 'monospace', wordBreak: 'break-all' }}>
                                                {hoveredElement.class || 'N/A'}
                                            </div>
                                        </div>
                                        {hoveredElement.xpath && (
                                            <div style={{ marginBottom: '12px', padding: '10px', background: '#161b22', borderRadius: '6px' }}>
                                                <div style={{ fontSize: '10px', color: '#8b949e', marginBottom: '4px' }}>XPATH</div>
                                                <div style={{ color: '#58a6ff', fontSize: '10px', fontFamily: 'monospace', wordBreak: 'break-all', maxHeight: '50px', overflowY: 'auto' }}>
                                                    {hoveredElement.xpath}
                                                </div>
                                            </div>
                                        )}
                                        {hoveredElement.text && (
                                            <div style={{ marginBottom: '8px', fontSize: '11px' }}>
                                                <span style={{ color: '#8b949e' }}>text: </span>
                                                <span style={{ color: '#c9d1d9' }}>"{hoveredElement.text}"</span>
                                            </div>
                                        )}
                                        <div style={{ fontSize: '11px', color: '#8b949e', marginTop: '12px' }}>
                                            clickable: <span style={{ color: hoveredElement.clickable ? '#2ea043' : '#f85149' }}>{hoveredElement.clickable ? 'true' : 'false'}</span>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* CENTER: Recorded Actions List */}
                        {actions.length > 0 && (
                            <div style={{
                                flex: 1,
                                maxWidth: '450px',
                                background: 'linear-gradient(135deg, #161b22 0%, #0d1117 100%)',
                                borderRadius: '20px',
                                padding: '24px',
                                border: '1px solid #30363d',
                                boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
                                maxHeight: 'calc(100vh - 190px)',
                                overflowY: 'auto'
                            }}>
                                <h3 style={{
                                    fontSize: '20px',
                                    marginBottom: '20px',
                                    fontWeight: 700,
                                    background: 'linear-gradient(90deg, #58a6ff, #2ea043)',
                                    WebkitBackgroundClip: 'text',
                                    WebkitTextFillColor: 'transparent',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '8px'
                                }}>
                                    📋 Recorded Actions ({actions.length})
                                </h3>

                                {/* Open in Code Editor Button */}
                                <button
                                    onClick={handleGenerateCode}
                                    disabled={actions.length === 0}
                                    style={{
                                        width: '100%',
                                        padding: '16px 24px',
                                        marginBottom: '20px',
                                        background: actions.length === 0
                                            ? 'rgba(48, 54, 61, 0.5)'
                                            : 'linear-gradient(135deg, #1f6feb 0%, #1158c7 100%)',
                                        color: actions.length === 0 ? '#6e7681' : 'white',
                                        border: 'none',
                                        borderRadius: '12px',
                                        cursor: actions.length === 0 ? 'not-allowed' : 'pointer',
                                        fontWeight: 700,
                                        fontSize: '15px',
                                        boxShadow: actions.length === 0
                                            ? 'none'
                                            : '0 0 20px rgba(31, 111, 235, 0.4), 0 4px 12px rgba(0,0,0,0.3)',
                                        transition: 'all 0.3s',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        gap: '10px'
                                    }}
                                    onMouseEnter={(e) => {
                                        if (actions.length > 0) {
                                            e.currentTarget.style.transform = 'translateY(-3px) scale(1.02)'
                                            e.currentTarget.style.boxShadow = '0 0 30px rgba(31, 111, 235, 0.6), 0 8px 20px rgba(0,0,0,0.4)'
                                        }
                                    }}
                                    onMouseLeave={(e) => {
                                        e.currentTarget.style.transform = 'translateY(0) scale(1)'
                                        e.currentTarget.style.boxShadow = actions.length === 0
                                            ? 'none'
                                            : '0 0 20px rgba(31, 111, 235, 0.4), 0 4px 12px rgba(0,0,0,0.3)'
                                    }}
                                >
                                    <span style={{ fontSize: '20px' }}>&lt;/&gt;</span>
                                    <span>Open in Code Editor</span>
                                    <span style={{ fontSize: '16px' }}>→</span>
                                </button>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                    {actions.map(action => (
                                        <div
                                            key={action.step}
                                            style={{
                                                padding: '16px',
                                                background: 'linear-gradient(135deg, #0d1117 0%, #161b22 100%)',
                                                borderRadius: '12px',
                                                border: '1px solid #21262d',
                                                boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
                                                transition: 'all 0.2s',
                                                cursor: 'default'
                                            }}
                                            onMouseEnter={(e) => {
                                                e.currentTarget.style.transform = 'translateX(-4px)'
                                                e.currentTarget.style.background = 'linear-gradient(135deg, rgba(88, 166, 255, 0.1) 0%, rgba(46, 160, 67, 0.05) 100%)'
                                                e.currentTarget.style.borderColor = '#30363d'
                                            }}
                                            onMouseLeave={(e) => {
                                                e.currentTarget.style.transform = 'translateX(0)'
                                                e.currentTarget.style.background = 'linear-gradient(135deg, #0d1117 0%, #161b22 100%)'
                                                e.currentTarget.style.borderColor = '#21262d'
                                            }}
                                        >
                                            <div style={{
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '8px',
                                                marginBottom: '8px'
                                            }}>
                                                <div style={{
                                                    fontSize: '11px',
                                                    padding: '4px 8px',
                                                    background: action.action === 'tap'
                                                        ? 'rgba(46, 160, 67, 0.2)'
                                                        : 'rgba(88, 166, 255, 0.2)',
                                                    color: action.action === 'tap' ? '#3fb950' : '#58a6ff',
                                                    borderRadius: '6px',
                                                    fontWeight: 700,
                                                    textTransform: 'uppercase',
                                                    letterSpacing: '0.5px'
                                                }}>
                                                    Step {action.step}
                                                </div>
                                                <div style={{
                                                    fontSize: '14px',
                                                    fontWeight: 600,
                                                    color: '#e6edf3'
                                                }}>
                                                    {action.action === 'tap' ? '👆' : '👉'} {action.action.toUpperCase()}
                                                </div>
                                            </div>
                                            <div style={{
                                                fontSize: '12px',
                                                color: '#8b949e',
                                                fontFamily: 'monospace'
                                            }}>
                                                {action.description}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* RIGHT: Control Panel */}
                        <div style={{
                            width: '380px',
                            background: 'linear-gradient(135deg, #161b22 0%, #0d1117 100%)',
                            borderRadius: '20px',
                            padding: '28px',
                            border: '1px solid #30363d',
                            boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
                            height: 'fit-content'
                        }}>
                            <h2 style={{
                                fontSize: '24px',
                                marginBottom: '24px',
                                background: 'linear-gradient(90deg, #58a6ff, #2ea043)',
                                WebkitBackgroundClip: 'text',
                                WebkitTextFillColor: 'transparent',
                                fontWeight: 700,
                                textAlign: 'center'
                            }}>
                                🎬 Record Your Actions
                            </h2>

                            {/* Mode Selector */}
                            <div style={{
                                display: 'flex',
                                gap: '12px',
                                marginBottom: '20px'
                            }}>
                                <button
                                    onClick={() => setRecordingMode('tap')}
                                    style={{
                                        flex: 1,
                                        padding: '14px 20px',
                                        background: recordingMode === 'tap'
                                            ? 'linear-gradient(135deg, #2ea043, #238636)'
                                            : 'linear-gradient(135deg, #21262d, #161b22)',
                                        color: 'white',
                                        border: recordingMode === 'tap' ? '2px solid #2ea043' : '2px solid #30363d',
                                        borderRadius: '12px',
                                        cursor: 'pointer',
                                        fontWeight: 600,
                                        fontSize: '15px',
                                        boxShadow: recordingMode === 'tap'
                                            ? '0 0 20px rgba(46, 160, 67, 0.4)'
                                            : 'none',
                                        transition: 'all 0.3s'
                                    }}
                                >
                                    👆 Tap Mode
                                </button>
                                <button
                                    onClick={() => setRecordingMode('swipe')}
                                    style={{
                                        flex: 1,
                                        padding: '14px 20px',
                                        background: recordingMode === 'swipe'
                                            ? 'linear-gradient(135deg, #2ea043, #238636)'
                                            : 'linear-gradient(135deg, #21262d, #161b22)',
                                        color: 'white',
                                        border: recordingMode === 'swipe' ? '2px solid #2ea043' : '2px solid #30363d',
                                        borderRadius: '12px',
                                        cursor: 'pointer',
                                        fontWeight: 600,
                                        fontSize: '15px',
                                        boxShadow: recordingMode === 'swipe'
                                            ? '0 0 20px rgba(46, 160, 67, 0.4)'
                                            : 'none',
                                        transition: 'all 0.3s'
                                    }}
                                >
                                    👉 Swipe Mode
                                </button>
                                <button
                                    onClick={() => {
                                        setRecordingMode('inspector')
                                        setInspectorMode(!inspectorMode)
                                    }}
                                    style={{
                                        flex: 1,
                                        padding: '14px 20px',
                                        background: recordingMode === 'inspector'
                                            ? 'linear-gradient(135deg, #8b5cf6, #7c3aed)'
                                            : 'linear-gradient(135deg, #21262d, #161b22)',
                                        color: 'white',
                                        border: recordingMode === 'inspector' ? '2px solid #8b5cf6' : '2px solid #30363d',
                                        borderRadius: '12px',
                                        cursor: 'pointer',
                                        fontWeight: 600,
                                        fontSize: '15px',
                                        boxShadow: recordingMode === 'inspector'
                                            ? '0 0 20px rgba(139, 92, 246, 0.4)'
                                            : 'none',
                                        transition: 'all 0.3s'
                                    }}
                                >
                                    🔍 Inspector
                                </button>
                            </div>

                            {/* Wait Button - Insert Delay */}
                            <div style={{
                                marginBottom: '20px',
                                padding: '16px',
                                background: '#0d1117',
                                borderRadius: '12px',
                                border: '1px solid #30363d'
                            }}>
                                <div style={{
                                    fontSize: '13px',
                                    color: '#7d8590',
                                    marginBottom: '10px',
                                    fontWeight: 600
                                }}>
                                    ⏱️ Insert Wait
                                </div>
                                <div style={{
                                    display: 'flex',
                                    gap: '8px'
                                }}>
                                    {[1, 2, 3, 5].map(seconds => (
                                        <button
                                            key={seconds}
                                            onClick={() => {
                                                const waitAction: RecordedAction = {
                                                    step: actions.length + 1,
                                                    action: 'wait',
                                                    duration: seconds * 1000,  // Convert to ms
                                                    description: `⏱️ Wait ${seconds}s`,
                                                    timestamp: Date.now()
                                                }
                                                setActions([...actions, waitAction])
                                            }}
                                            style={{
                                                flex: 1,
                                                padding: '10px',
                                                background: 'linear-gradient(135deg, #1f6feb, #1158c7)',
                                                color: 'white',
                                                border: 'none',
                                                borderRadius: '8px',
                                                cursor: 'pointer',
                                                fontWeight: 600,
                                                fontSize: '13px',
                                                boxShadow: '0 2px 8px rgba(31, 111, 235, 0.3)',
                                                transition: 'all 0.2s'
                                            }}
                                            onMouseEnter={(e) => {
                                                e.currentTarget.style.transform = 'translateY(-2px)'
                                                e.currentTarget.style.boxShadow = '0 4px 12px rgba(31, 111, 235, 0.5)'
                                            }}
                                            onMouseLeave={(e) => {
                                                e.currentTarget.style.transform = 'translateY(0)'
                                                e.currentTarget.style.boxShadow = '0 2px 8px rgba(31, 111, 235, 0.3)'
                                            }}
                                        >
                                            {seconds}s
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Hint Text */}
                            <div style={{
                                fontSize: '14px',
                                color: '#7d8590',
                                marginBottom: '20px',
                                textAlign: 'center',
                                padding: '14px',
                                background: '#0d1117',
                                borderRadius: '10px',
                            }}>
                                {recordingMode === 'tap'
                                    ? '👆 Click on device to record taps'
                                    : recordingMode === 'swipe'
                                        ? '👉 Click & drag on device to record swipes'
                                        : '🔍 Hover to detect elements, click to record with element info'}
                            </div>

                            {/* Recording Button */}
                            <button
                                onClick={isRecording ? handleStopRecording : handleStartRecording}
                                style={{
                                    width: '100%',
                                    padding: '18px',
                                    fontSize: '18px',
                                    background: isRecording
                                        ? 'linear-gradient(135deg, #dc2626, #b91c1c)'
                                        : 'linear-gradient(135deg, #2ea043, #238636)',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '14px',
                                    cursor: 'pointer',
                                    fontWeight: 700,
                                    boxShadow: isRecording
                                        ? '0 0 30px rgba(220, 38, 38, 0.5), 0 4px 12px rgba(0,0,0,0.3)'
                                        : '0 0 20px rgba(46, 160, 67, 0.4), 0 4px 12px rgba(0,0,0,0.3)',
                                    animation: isRecording ? 'glow 2s infinite' : 'none',
                                    transition: 'all 0.3s',
                                    marginBottom: '16px'
                                }}
                            >
                                {isRecording ? '⏹️ Stop Recording' : '🔴 Start Recording'}
                            </button>

                            {/* Action Count */}
                            {actions.length > 0 && (
                                <div style={{
                                    textAlign: 'center',
                                    color: '#58a6ff',
                                    fontSize: '15px',
                                    fontWeight: 600
                                }}>
                                    ✅ {actions.length} actions recorded
                                </div>
                            )}
                        </div>
                    </div>
                )

            case 'save':
                return (
                    <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        height: 'calc(100vh - 150px)',
                        padding: '40px'
                    }}>
                        <div style={{
                            textAlign: 'center',
                            background: 'rgba(22, 27, 34, 0.8)',
                            backdropFilter: 'blur(20px)',
                            borderRadius: '20px',
                            padding: '50px 70px',
                            border: '1px solid rgba(48, 54, 61, 0.5)',
                            boxShadow: '0 20px 60px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.05) inset',
                            maxWidth: '550px',
                            width: '100%'
                        }}>
                            {/* Icon */}
                            <div style={{
                                fontSize: '64px',
                                marginBottom: '20px',
                                filter: 'drop-shadow(0 4px 12px rgba(88, 166, 255, 0.3))',
                                animation: 'float 3s ease-in-out infinite'
                            }}>
                                💾
                            </div>

                            {/* Title */}
                            <h2 style={{
                                fontSize: '26px',
                                marginBottom: '12px',
                                color: '#ffffff',
                                fontWeight: 600,
                                letterSpacing: '-0.5px'
                            }}>
                                Save Your Test
                            </h2>

                            <p style={{
                                color: '#8b949e',
                                marginBottom: '28px',
                                fontSize: '15px',
                                lineHeight: '1.5'
                            }}>
                                Give your test a name and save it for later playback
                            </p>

                            {/* Actions Count Badge */}
                            <div style={{
                                marginBottom: '24px',
                                padding: '10px 20px',
                                background: 'rgba(88, 166, 255, 0.15)',
                                borderRadius: '8px',
                                border: '1px solid rgba(88, 166, 255, 0.25)',
                                display: 'inline-block'
                            }}>
                                <div style={{
                                    fontSize: '14px',
                                    color: '#58a6ff',
                                    fontWeight: 600
                                }}>
                                    📊 {actions.length} actions recorded
                                </div>
                            </div>

                            {/* Input Field */}
                            <input
                                type="text"
                                placeholder="Enter test name (e.g., login_flow)"
                                value={flowName}
                                onChange={(e) => setFlowName(e.target.value)}
                                style={{
                                    width: '100%',
                                    padding: '14px 18px',
                                    fontSize: '15px',
                                    background: 'rgba(13, 17, 23, 0.6)',
                                    color: '#e6edf3',
                                    border: '1px solid rgba(48, 54, 61, 0.6)',
                                    borderRadius: '10px',
                                    marginBottom: '28px',
                                    outline: 'none',
                                    transition: 'all 0.2s'
                                }}
                                onFocus={(e) => {
                                    e.currentTarget.style.borderColor = '#58a6ff'
                                    e.currentTarget.style.boxShadow = '0 0 0 3px rgba(88, 166, 255, 0.1)'
                                }}
                                onBlur={(e) => {
                                    e.currentTarget.style.borderColor = 'rgba(48, 54, 61, 0.6)'
                                    e.currentTarget.style.boxShadow = 'none'
                                }}
                            />

                            {/* Save Button */}
                            <button
                                onClick={handleSaveFlow}
                                disabled={!flowName.trim()}
                                onMouseEnter={(e) => {
                                    if (flowName.trim()) {
                                        e.currentTarget.style.transform = 'translateY(-2px)'
                                        e.currentTarget.style.boxShadow = '0 0 25px rgba(46, 160, 67, 0.5), 0 8px 20px rgba(0,0,0,0.3)'
                                    }
                                }}
                                onMouseLeave={(e) => {
                                    e.currentTarget.style.transform = 'translateY(0)'
                                    e.currentTarget.style.boxShadow = flowName.trim()
                                        ? '0 0 15px rgba(46, 160, 67, 0.3), 0 4px 12px rgba(0,0,0,0.2)'
                                        : 'none'
                                }}
                                style={{
                                    width: '100%',
                                    padding: '14px 32px',
                                    fontSize: '16px',
                                    background: flowName.trim()
                                        ? 'linear-gradient(135deg, #2ea043, #238636)'
                                        : 'rgba(48, 54, 61, 0.5)',
                                    color: flowName.trim() ? 'white' : '#6e7681',
                                    border: 'none',
                                    borderRadius: '10px',
                                    cursor: flowName.trim() ? 'pointer' : 'not-allowed',
                                    fontWeight: 600,
                                    boxShadow: flowName.trim()
                                        ? '0 0 15px rgba(46, 160, 67, 0.3), 0 4px 12px rgba(0,0,0,0.2)'
                                        : 'none',
                                    transition: 'all 0.3s'
                                }}
                            >
                                💾 Save Test Flow
                            </button>
                        </div>
                    </div>
                )

            case 'playback':
                return (
                    <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        height: 'calc(100vh - 150px)',
                        padding: '40px'
                    }}>
                        <div style={{
                            textAlign: 'center',
                            background: 'rgba(22, 27, 34, 0.8)',
                            backdropFilter: 'blur(20px)',
                            borderRadius: '20px',
                            padding: '50px 70px',
                            border: '1px solid rgba(48, 54, 61, 0.5)',
                            boxShadow: '0 20px 60px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.05) inset',
                            maxWidth: '600px',
                            width: '100%'
                        }}>
                            {/* Icon */}
                            <div style={{
                                fontSize: '72px',
                                marginBottom: '20px',
                                filter: playbackResults
                                    ? 'drop-shadow(0 4px 12px rgba(46, 160, 67, 0.4))'
                                    : 'drop-shadow(0 4px 12px rgba(88, 166, 255, 0.4))',
                                animation: playbackResults ? 'bounce 0.6s ease-out' : 'float 3s ease-in-out infinite'
                            }}>
                                {playbackResults ? '🎉' : '✅'}
                            </div>

                            {/* Title */}
                            <h2 style={{
                                fontSize: '28px',
                                marginBottom: '12px',
                                color: '#ffffff',
                                fontWeight: 600,
                                letterSpacing: '-0.5px'
                            }}>
                                {playbackResults ? 'Playback Complete!' : 'Test Saved Successfully!'}
                            </h2>

                            <p style={{
                                color: '#8b949e',
                                marginBottom: '28px',
                                fontSize: '15px',
                                lineHeight: '1.5'
                            }}>
                                {playbackResults
                                    ? `Your test "${flowName}" execution finished`
                                    : `Your test "${flowName}" is saved and ready to run`
                                }
                            </p>

                            {/* Test Info Card */}
                            <div style={{
                                background: 'rgba(13, 17, 23, 0.6)',
                                padding: '24px',
                                borderRadius: '12px',
                                marginBottom: '28px',
                                border: '1px solid rgba(48, 54, 61, 0.4)',
                                backdropFilter: 'blur(10px)',
                                textAlign: 'left'
                            }}>
                                {!playbackResults ? (
                                    // Before playback
                                    <>
                                        <div style={{
                                            fontSize: '14px',
                                            marginBottom: '12px',
                                            display: 'flex',
                                            justifyContent: 'space-between'
                                        }}>
                                            <span style={{ color: '#8b949e' }}>Test ID:</span>
                                            <span style={{ color: '#e6edf3', fontWeight: 600 }}>#{savedFlowId}</span>
                                        </div>
                                        <div style={{
                                            fontSize: '14px',
                                            marginBottom: '12px',
                                            display: 'flex',
                                            justifyContent: 'space-between'
                                        }}>
                                            <span style={{ color: '#8b949e' }}>Name:</span>
                                            <span style={{ color: '#58a6ff', fontWeight: 600 }}>{flowName}</span>
                                        </div>
                                        <div style={{
                                            fontSize: '14px',
                                            marginBottom: '12px',
                                            display: 'flex',
                                            justifyContent: 'space-between'
                                        }}>
                                            <span style={{ color: '#8b949e' }}>Steps:</span>
                                            <span style={{ color: '#e6edf3', fontWeight: 600 }}>{actions.length}</span>
                                        </div>
                                        <div style={{
                                            fontSize: '14px',
                                            display: 'flex',
                                            justifyContent: 'space-between'
                                        }}>
                                            <span style={{ color: '#8b949e' }}>Device:</span>
                                            <span style={{ color: '#e6edf3', fontWeight: 600 }}>
                                                {devices.find(d => d.device_id === selectedDevice)?.name}
                                            </span>
                                        </div>
                                    </>
                                ) : (
                                    // After playback - show results
                                    <>
                                        <div style={{
                                            fontSize: '16px',
                                            marginBottom: '16px',
                                            fontWeight: 700,
                                            color: '#ffffff'
                                        }}>
                                            📊 Execution Results
                                        </div>
                                        <div style={{
                                            fontSize: '14px',
                                            marginBottom: '10px',
                                            display: 'flex',
                                            justifyContent: 'space-between'
                                        }}>
                                            <span style={{ color: '#8b949e' }}>Total Steps:</span>
                                            <span style={{ color: '#e6edf3', fontWeight: 600 }}>{playbackResults.total_steps}</span>
                                        </div>
                                        <div style={{
                                            fontSize: '14px',
                                            marginBottom: '10px',
                                            display: 'flex',
                                            justifyContent: 'space-between'
                                        }}>
                                            <span style={{ color: '#3fb950' }}>✅ Successful:</span>
                                            <span style={{ color: '#3fb950', fontWeight: 600 }}>{playbackResults.successful_steps}</span>
                                        </div>
                                        <div style={{
                                            fontSize: '14px',
                                            marginBottom: '10px',
                                            display: 'flex',
                                            justifyContent: 'space-between'
                                        }}>
                                            <span style={{ color: playbackResults.failed_steps > 0 ? '#f85149' : '#8b949e' }}>
                                                ❌ Failed:
                                            </span>
                                            <span style={{
                                                color: playbackResults.failed_steps > 0 ? '#f85149' : '#8b949e',
                                                fontWeight: 600
                                            }}>
                                                {playbackResults.failed_steps}
                                            </span>
                                        </div>
                                        <div style={{
                                            fontSize: '14px',
                                            display: 'flex',
                                            justifyContent: 'space-between',
                                            paddingTop: '12px',
                                            borderTop: '1px solid rgba(48, 54, 61, 0.5)'
                                        }}>
                                            <span style={{ color: '#8b949e' }}>Status:</span>
                                            <span style={{
                                                color: playbackResults.status === 'success' ? '#3fb950' : '#f85149',
                                                fontWeight: 700,
                                                textTransform: 'uppercase',
                                                fontSize: '13px'
                                            }}>
                                                {playbackResults.status}
                                            </span>
                                        </div>

                                        {playbackResults.errors && playbackResults.errors.length > 0 && (
                                            <div style={{
                                                marginTop: '16px',
                                                padding: '12px',
                                                background: 'rgba(248, 81, 73, 0.1)',
                                                borderRadius: '8px',
                                                border: '1px solid rgba(248, 81, 73, 0.3)'
                                            }}>
                                                <div style={{
                                                    fontSize: '13px',
                                                    fontWeight: 600,
                                                    color: '#f85149',
                                                    marginBottom: '8px'
                                                }}>
                                                    ⚠️ {playbackResults.errors.length} Error{playbackResults.errors.length > 1 ? 's' : ''}:
                                                </div>
                                                <div style={{
                                                    maxHeight: '150px',
                                                    overflowY: 'auto',
                                                    paddingRight: '4px'
                                                }}>
                                                    {playbackResults.errors.map((err: any, i: number) => (
                                                        <div key={i} style={{
                                                            marginTop: i === 0 ? '0' : '6px',
                                                            padding: '8px',
                                                            background: 'rgba(0,0,0,0.3)',
                                                            borderRadius: '4px',
                                                            fontSize: '12px',
                                                            color: '#f85149'
                                                        }}>
                                                            Step {err.step}: {err.error}
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </>
                                )}
                            </div>

                            {/* Action Buttons */}
                            <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
                                <button
                                    onClick={handlePlayback}
                                    disabled={isPlaying}
                                    onMouseEnter={(e) => {
                                        if (!isPlaying) {
                                            e.currentTarget.style.transform = 'translateY(-2px)'
                                            e.currentTarget.style.boxShadow = '0 0 25px rgba(46, 160, 67, 0.5), 0 8px 20px rgba(0,0,0,0.3)'
                                        }
                                    }}
                                    onMouseLeave={(e) => {
                                        e.currentTarget.style.transform = 'translateY(0)'
                                        e.currentTarget.style.boxShadow = isPlaying
                                            ? 'none'
                                            : '0 0 15px rgba(46, 160, 67, 0.3), 0 4px 12px rgba(0,0,0,0.2)'
                                    }}
                                    style={{
                                        flex: 1,
                                        padding: '14px 32px',
                                        fontSize: '16px',
                                        background: isPlaying
                                            ? 'rgba(48, 54, 61, 0.5)'
                                            : 'linear-gradient(135deg, #2ea043, #238636)',
                                        color: isPlaying ? '#6e7681' : 'white',
                                        border: 'none',
                                        borderRadius: '10px',
                                        cursor: isPlaying ? 'not-allowed' : 'pointer',
                                        fontWeight: 600,
                                        boxShadow: isPlaying
                                            ? 'none'
                                            : '0 0 15px rgba(46, 160, 67, 0.3), 0 4px 12px rgba(0,0,0,0.2)',
                                        transition: 'all 0.3s'
                                    }}
                                >
                                    {isPlaying ? '⏳ Running...' : '▶️ Run Test'}
                                </button>

                                <button
                                    onClick={handleGenerateCode}
                                    disabled={actions.length === 0}
                                    onMouseEnter={(e) => {
                                        if (actions.length > 0) {
                                            e.currentTarget.style.transform = 'translateY(-2px)'
                                            e.currentTarget.style.boxShadow = '0 0 15px rgba(31, 111, 235, 0.4), 0 4px 12px rgba(0,0,0,0.2)'
                                        }
                                    }}
                                    onMouseLeave={(e) => {
                                        e.currentTarget.style.transform = 'translateY(0)'
                                        e.currentTarget.style.boxShadow = actions.length === 0 ? 'none' : '0 0 15px rgba(31, 111, 235, 0.3), 0 4px 12px rgba(0,0,0,0.2)'
                                    }}
                                    style={{
                                        flex: 1,
                                        padding: '14px 32px',
                                        fontSize: '16px',
                                        background: actions.length === 0
                                            ? 'rgba(48, 54, 61, 0.5)'
                                            : 'linear-gradient(135deg, #1f6feb, #1158c7)',
                                        color: actions.length === 0 ? '#6e7681' : 'white',
                                        border: 'none',
                                        borderRadius: '10px',
                                        cursor: actions.length === 0 ? 'not-allowed' : 'pointer',
                                        fontWeight: 600,
                                        boxShadow: actions.length === 0
                                            ? 'none'
                                            : '0 0 15px rgba(31, 111, 235, 0.3), 0 4px 12px rgba(0,0,0,0.2)',
                                        transition: 'all 0.3s'
                                    }}
                                >
                                    &lt;/&gt; Convert to Code
                                </button>

                                <button
                                    onClick={handleResetWizard}
                                    onMouseEnter={(e) => {
                                        e.currentTarget.style.transform = 'translateY(-2px)'
                                        e.currentTarget.style.borderColor = '#58a6ff'
                                        e.currentTarget.style.boxShadow = '0 0 15px rgba(88, 166, 255, 0.3), 0 4px 12px rgba(0,0,0,0.2)'
                                    }}
                                    onMouseLeave={(e) => {
                                        e.currentTarget.style.transform = 'translateY(0)'
                                        e.currentTarget.style.borderColor = 'rgba(48, 54, 61, 0.6)'
                                        e.currentTarget.style.boxShadow = 'none'
                                    }}
                                    style={{
                                        flex: 1,
                                        padding: '14px 32px',
                                        fontSize: '16px',
                                        background: 'rgba(33, 38, 45, 0.5)',
                                        color: '#e6edf3',
                                        border: '1px solid rgba(48, 54, 61, 0.6)',
                                        borderRadius: '10px',
                                        cursor: 'pointer',
                                        fontWeight: 600,
                                        transition: 'all 0.3s'
                                    }}
                                >
                                    🔄 Start New Test
                                </button>
                            </div>
                        </div>
                    </div>
                )

            default:
                return null
        }
    }

    return (
        <div style={{
            height: '100vh',
            background: '#0a0e14',
            color: '#e6edf3',
            fontFamily: '"SF Pro Display", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
            position: 'relative',
            overflow: 'hidden'
        }}>
            {/* Animated Background with Parallax */}
            <div style={{
                position: 'fixed',
                top: 0, left: 0, right: 0, bottom: 0,
                background: `
                    radial-gradient(circle at ${20 + mousePos.x * 0.02}% ${30 + mousePos.y * 0.02}%, rgba(88, 166, 255, 0.12) 0%, transparent 50%),
                    radial-gradient(circle at ${80 - mousePos.x * 0.01}% ${70 - mousePos.y * 0.01}%, rgba(139, 92, 246, 0.08) 0%, transparent 50%),
                    linear-gradient(135deg, #0a0e14 0%, #0d1117 50%, #0a0e14 100%)
                `,
                pointerEvents: 'none',
                transition: 'background 0.3s ease',
                animation: 'gradientShift 15s ease infinite',
                zIndex: 0
            }}></div>

            {/* Floating Particles */}
            {[...Array(15)].map((_, i) => (
                <div key={i} style={{
                    position: 'fixed',
                    width: `${4 + Math.random() * 5}px`,
                    height: `${4 + Math.random() * 5}px`,
                    background: `radial-gradient(circle, ${i % 2 === 0 ? 'rgba(88, 166, 255, 0.3)' : 'rgba(139, 92, 246, 0.3)'}, transparent)`,
                    borderRadius: '50%',
                    left: `${Math.random() * 100}%`,
                    top: `${Math.random() * 100}%`,
                    animation: `float${i % 3} ${12 + Math.random() * 8}s ease-in-out infinite`,
                    animationDelay: `${Math.random() * 4}s`,
                    pointerEvents: 'none',
                    filter: 'blur(1px)',
                    zIndex: 0
                }} />
            ))}

            <div style={{ position: 'relative', zIndex: 1, height: '100%', display: 'flex', flexDirection: 'column' }}>
                {/* Premium Step Indicator - Hidden on launch, record, save, and playback steps */}
                {!['launch', 'record', 'save', 'playback'].includes(currentStep) && (
                    <div style={{
                        padding: '32px 60px',
                        background: 'linear-gradient(135deg, rgba(22, 27, 34, 0.95), rgba(13, 17, 23, 0.95))',
                        backdropFilter: 'blur(20px)',
                        borderBottom: '1.5px solid rgba(88, 166, 255, 0.2)',
                        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.05)'
                    }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', maxWidth: '800px', margin: '0 auto' }}>
                            {['device', 'apk', 'install', 'launch', 'recording'].map((stepName, index) => {
                                const stepNum = index + 1
                                const isCurrent = currentStep === stepName
                                const isCompleted = ['device', 'apk', 'install', 'launch', 'recording'].indexOf(currentStep) > index

                                return (
                                    <div key={stepName} style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: index < 4 ? 1 : 0 }}>
                                        {/* Step Circle with Glow */}
                                        <div style={{
                                            width: '42px',
                                            height: '42px',
                                            borderRadius: '50%',
                                            background: isCompleted
                                                ? 'linear-gradient(135deg, #2ea043 0%, #238636 100%)'
                                                : isCurrent
                                                    ? 'linear-gradient(135deg, #58a6ff 0%, #1f6feb 100%)'
                                                    : 'linear-gradient(135deg, #21262d 0%, #161b22 100%)',
                                            border: `3px solid ${isCompleted ? '#2ea043' : isCurrent ? '#58a6ff' : '#30363d'}`,
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            fontWeight: 700,
                                            fontSize: '16px',
                                            color: isCompleted || isCurrent ? 'white' : '#484f58',
                                            boxShadow: isCompleted
                                                ? '0 0 20px rgba(46, 160, 67, 0.6), 0 4px 8px rgba(0, 0, 0, 0.3)'
                                                : isCurrent
                                                    ? '0 0 20px rgba(88, 166, 255, 0.6), 0 4px 8px rgba(0, 0, 0, 0.3)'
                                                    : '0 2px 4px rgba(0, 0, 0, 0.2)',
                                            transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                                            position: 'relative',
                                            transform: isCurrent ? 'scale(1.1)' : 'scale(1)'
                                        }}>
                                            {isCompleted ? '✓' : stepNum}

                                            {/* Pulse animation for current step */}
                                            {isCurrent && (
                                                <div style={{
                                                    position: 'absolute',
                                                    width: '100%',
                                                    height: '100%',
                                                    borderRadius: '50%',
                                                    background: '#58a6ff',
                                                    opacity: 0.3,
                                                    animation: 'pulse 2s infinite'
                                                }} />
                                            )}
                                        </div>

                                        {/* Premium Connecting Line */}
                                        {index < 4 && (
                                            <div style={{
                                                flex: 1,
                                                height: '4px',
                                                background: isCompleted
                                                    ? 'linear-gradient(90deg, #2ea043 0%, #238636 100%)'
                                                    : 'linear-gradient(90deg, #21262d 0%, #161b22 100%)',
                                                borderRadius: '2px',
                                                boxShadow: isCompleted ? '0 0 8px rgba(46, 160, 67, 0.4)' : 'none',
                                                transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                                                position: 'relative',
                                                overflow: 'hidden'
                                            }}>
                                                {isCompleted && (
                                                    <div style={{
                                                        position: 'absolute',
                                                        top: 0,
                                                        left: 0,
                                                        width: '100%',
                                                        height: '100%',
                                                        background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent)',
                                                        animation: 'shimmer 2s infinite'
                                                    }} />
                                                )}
                                            </div>
                                        )}
                                    </div>
                                )
                            })}
                        </div>

                        {/* Elegant Step Labels */}
                        <div style={{
                            display: 'flex',
                            justifyContent: 'center',
                            marginTop: '16px',
                            gap: '0',
                            fontSize: '13px',
                            fontWeight: 500,
                            maxWidth: '800px',
                            margin: '16px auto 0'
                        }}>
                            {['Device', 'APK', 'Install', 'Launch', 'Record'].map((label, index) => {
                                const stepName = ['device', 'apk', 'install', 'launch', 'recording'][index]
                                const isCurrent = currentStep === stepName
                                const isCompleted = ['device', 'apk', 'install', 'launch', 'recording'].indexOf(currentStep) > index

                                return (
                                    <div key={label} style={{
                                        flex: index < 4 ? 1 : 0,
                                        textAlign: 'center',
                                        color: isCompleted ? '#2ea043' : isCurrent ? '#58a6ff' : '#7d8590',
                                        fontWeight: isCurrent ? 600 : 500,
                                        transition: 'all 0.3s',
                                        textShadow: (isCompleted || isCurrent) ? '0 0 8px currentColor' : 'none'
                                    }}>
                                        {label}
                                    </div>
                                )
                            })}
                        </div>
                    </div>
                )}

                {/* Comprehensive CSS Animations */}
                <style>{`
                @keyframes pulse {
                    0%, 100% { transform: scale(1); opacity: 0.3; }
                    50% { transform: scale(1.5); opacity: 0; }
                }
                @keyframes shimmer {
                    0% { transform: translateX(-100%); }
                    100% { transform: translateX(100%); }
                }
                @keyframes fadeIn {
                    from { opacity: 0; transform: translateY(20px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                @keyframes slideUp {
                    from { opacity: 0; transform: translateY(40px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                @keyframes bounce {
                    0%, 100% { transform: translateY(0); }
                    50% { transform: translateY(-10px); }
                }
                @keyframes float {
                    0%, 100% { transform: translateY(0px) rotate(0deg); }
                    50% { transform: translateY(-20px) rotate(5deg); }
                }
                @keyframes glow {
                    0%, 100% { box-shadow: 0 0 20px currentColor, 0 4px 8px rgba(0,0,0,0.3); }
                    50% { box-shadow: 0 0 40px currentColor, 0 8px 16px rgba(0,0,0,0.4); }
                }
                @keyframes spin {
                    from { transform: rotate(0deg); }
                    to { transform: rotate(360deg); }
                }
                @keyframes gradientShift {
                    0% { background-position: 0% 50%; }
                    50% { background-position: 100% 50%; }
                    100% { background-position: 0% 50%; }
                }
                @keyframes float0 {
                    0%, 100% { transform: translate(0, 0); }
                    33% { transform: translate(25px, -25px); }
                    66% { transform: translate(-20px, 35px); }
                }
                @keyframes float1 {
                    0%, 100% { transform: translate(0, 0); }
                    33% { transform: translate(-35px, 25px); }
                    66% { transform: translate(25px, -35px); }
                }
                @keyframes float2 {
                    0%, 100% { transform: translate(0, 0); }
                    33% { transform: translate(20px, 30px); }
                    66% { transform: translate(-30px, -20px); }
                }
                @keyframes iconFloat {
                    0%, 100% { transform: translateY(0px); }
                    50% { transform: translateY(-12px); }
                }
                @keyframes iconRotate {
                    from { transform: rotate(0deg); }
                    to { transform: rotate(360deg); }
                }
                @keyframes textFloat {
                    0%, 100% { transform: translateY(0px); }
                    50% { transform: translateY(-4px); }
                }
                @keyframes gradientFlow {
                    0% { background-position: 0% 50%; }
                    50% { background-position: 100% 50%; }
                    100% { background-position: 0% 50%; }
                }
                @keyframes buttonPulse {
                    0%, 100% {
                        box-shadow: 0 0 40px rgba(88, 166, 255, 0.6), 0 10px 30px rgba(0, 0, 0, 0.5), inset 0 1px 0 rgba(255, 255, 255, 0.2);
                    }
                    50% {
                        box-shadow: 0 0 60px rgba(88, 166, 255, 0.8), 0 10px 30px rgba(0, 0, 0, 0.5), inset 0 1px 0 rgba(255, 255, 255, 0.25);
                    }
                }
            `}</style>

                <div style={{
                    animation: 'fadeIn 0.6s ease-out',
                    minHeight: 'calc(100vh - 150px)'
                }}>
                    {renderStep()}
                </div>
            </div>

            {/* Premium Modal Dialog */}
            {modalState.show && (
                <div style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    background: 'rgba(0, 0, 0, 0.75)',
                    backdropFilter: 'blur(8px)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 9999,
                    animation: 'fadeIn 0.2s ease-out'
                }}>
                    <div style={{
                        width: '90%',
                        maxWidth: '500px',
                        background: 'linear-gradient(135deg, rgba(22, 27, 34, 0.98), rgba(13, 17, 23, 0.98))',
                        backdropFilter: 'blur(30px)',
                        borderRadius: '24px',
                        border: modalState.type === 'error'
                            ? '2px solid rgba(248, 81, 73, 0.5)'
                            : '2px solid rgba(63, 185, 80, 0.5)',
                        boxShadow: modalState.type === 'error'
                            ? '0 0 60px rgba(248, 81, 73, 0.4), 0 20px 60px rgba(0, 0, 0, 0.6), inset 0 1px 0 rgba(255, 255, 255, 0.08)'
                            : '0 0 60px rgba(63, 185, 80, 0.4), 0 20px 60px rgba(0, 0, 0, 0.6), inset 0 1px 0 rgba(255, 255, 255, 0.08)',
                        padding: '40px',
                        textAlign: 'center',
                        animation: 'modalSlideIn 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)'
                    }}>
                        {/* Icon */}
                        <div style={{
                            width: '80px',
                            height: '80px',
                            margin: '0 auto 24px',
                            background: modalState.type === 'error'
                                ? 'linear-gradient(135deg, rgba(248, 81, 73, 0.2), rgba(218, 54, 51, 0.15))'
                                : 'linear-gradient(135deg, rgba(63, 185, 80, 0.2), rgba(46, 160, 67, 0.15))',
                            borderRadius: '50%',
                            border: modalState.type === 'error'
                                ? '2px solid rgba(248, 81, 73, 0.4)'
                                : '2px solid rgba(63, 185, 80, 0.4)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '40px',
                            boxShadow: modalState.type === 'error'
                                ? '0 0 40px rgba(248, 81, 73, 0.3)'
                                : '0 0 40px rgba(63, 185, 80, 0.3)',
                            animation: 'iconBounce 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) 0.1s'
                        }}>
                            {modalState.type === 'error' ? '❌' : '✅'}
                        </div>

                        {/* Title */}
                        <h2 style={{
                            fontSize: '24px',
                            fontWeight: 800,
                            marginBottom: '16px',
                            background: modalState.type === 'error'
                                ? 'linear-gradient(135deg, #f85149, #da3633)'
                                : 'linear-gradient(135deg, #3fb950, #238636)',
                            WebkitBackgroundClip: 'text',
                            WebkitTextFillColor: 'transparent',
                            letterSpacing: '-0.5px'
                        }}>
                            {modalState.title}
                        </h2>

                        {/* Message */}
                        <p style={{
                            fontSize: '15px',
                            color: '#c9d1d9',
                            lineHeight: '1.6',
                            marginBottom: '32px',
                            fontWeight: 500,
                            whiteSpace: 'pre-line'
                        }}>
                            {modalState.message}
                        </p>

                        {/* OK Button */}
                        <button
                            onClick={closeModal}
                            style={{
                                padding: '14px 40px',
                                fontSize: '16px',
                                fontWeight: 700,
                                background: modalState.type === 'error'
                                    ? 'linear-gradient(135deg, #f85149 0%, #da3633 50%, #f85149 100%)'
                                    : 'linear-gradient(135deg, #3fb950 0%, #238636 50%, #3fb950 100%)',
                                backgroundSize: '200% 100%',
                                color: 'white',
                                border: 'none',
                                borderRadius: '12px',
                                cursor: 'pointer',
                                transition: 'all 0.3s',
                                boxShadow: modalState.type === 'error'
                                    ? '0 0 30px rgba(248, 81, 73, 0.5), 0 4px 12px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.2)'
                                    : '0 0 30px rgba(63, 185, 80, 0.5), 0 4px 12px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.2)',
                                width: '100%'
                            }}
                            onMouseEnter={(e) => {
                                e.currentTarget.style.transform = 'translateY(-2px) scale(1.02)'
                                e.currentTarget.style.boxShadow = modalState.type === 'error'
                                    ? '0 0 40px rgba(248, 81, 73, 0.7), 0 8px 20px rgba(0, 0, 0, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.25)'
                                    : '0 0 40px rgba(63, 185, 80, 0.7), 0 8px 20px rgba(0, 0, 0, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.25)'
                                e.currentTarget.style.backgroundPosition = '100% 0'
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.transform = 'translateY(0) scale(1)'
                                e.currentTarget.style.boxShadow = modalState.type === 'error'
                                    ? '0 0 30px rgba(248, 81, 73, 0.5), 0 4px 12px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.2)'
                                    : '0 0 30px rgba(63, 185, 80, 0.5), 0 4px 12px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.2)'
                                e.currentTarget.style.backgroundPosition = '0% 0'
                            }}
                        >
                            OK
                        </button>
                    </div>

                    {/* Modal Animations */}
                    <style>{`
                        @keyframes modalSlideIn {
                            from { 
                                opacity: 0;
                                transform: translateY(-30px) scale(0.9);
                            }
                            to {
                                opacity: 1;
                                transform: translateY(0) scale(1);
                            }
                        }
                        @keyframes iconBounce {
                            0% { transform: scale(0); }
                            50% { transform: scale(1.1); }
                            100% { transform: scale(1); }
                        }
                    `}</style>

                    {/* Code Generation Modal */}
                    {showCodeModal && (
                        <div style={{
                            position: 'fixed',
                            top: 0,
                            left: 0,
                            right: 0,
                            bottom: 0,
                            background: 'rgba(0, 0, 0, 0.9)',
                            backdropFilter: 'blur(8px)',
                            zIndex: 10000,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            animation: 'fadeIn 0.3s ease-out'
                        }} onClick={() => setShowCodeModal(false)}>
                            <div style={{
                                width: '90%',
                                maxWidth: '1000px',
                                maxHeight: '90vh',
                                background: 'linear-gradient(135deg, #0d1117 0%, #161b22 100%)',
                                borderRadius: '16px',
                                padding: '32px',
                                boxShadow: '0 20px 60px rgba(0,0,0,0.5), 0 0 0 1px rgba(48,54,61,0.5)',
                                overflow: 'hidden',
                                display: 'flex',
                                flexDirection: 'column'
                            }} onClick={e => e.stopPropagation()}>

                                {/* Header */}
                                <div style={{
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center',
                                    marginBottom: '24px',
                                    borderBottom: '2px solid #30363d',
                                    paddingBottom: '16px'
                                }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                        <span style={{ fontSize: '32px' }}>&lt;/&gt;</span>
                                        <h2 style={{
                                            color: '#ffffff',
                                            margin: 0,
                                            fontSize: '28px',
                                            fontWeight: 700
                                        }}>
                                            Generated Test Code
                                        </h2>
                                    </div>

                                    <select
                                        value={codeLanguage}
                                        onChange={async (e) => {
                                            setCodeLanguage(e.target.value as 'javascript' | 'python')
                                            // Regenerate code with new language
                                            const res = await axios.post('http://localhost:8000/api/codegen/generate', {
                                                actions,
                                                language: e.target.value
                                            })
                                            setGeneratedCode(res.data.code)
                                        }}
                                        style={{
                                            padding: '10px 16px',
                                            background: '#21262d',
                                            color: '#c9d1d9',
                                            border: '2px solid #30363d',
                                            borderRadius: '8px',
                                            fontSize: '14px',
                                            fontWeight: 600,
                                            cursor: 'pointer'
                                        }}
                                    >
                                        <option value="javascript">JavaScript (WebdriverIO)</option>
                                        <option value="python">Python (Appium)</option>
                                    </select>
                                </div>

                                {/* Code Display */}
                                <div style={{
                                    flex: 1,
                                    overflow: 'auto',
                                    background: '#0d1117',
                                    borderRadius: '8px',
                                    padding: '20px',
                                    border: '1px solid #30363d',
                                    marginBottom: '24px'
                                }}>
                                    <pre style={{
                                        color: '#c9d1d9',
                                        fontFamily: 'Monaco, Consolas, monospace',
                                        fontSize: '13px',
                                        lineHeight: '1.6',
                                        margin: 0,
                                        whiteSpace: 'pre-wrap',
                                        wordBreak: 'break-word'
                                    }}>
                                        {generatedCode}
                                    </pre>
                                </div>

                                {/* Actions */}
                                <div style={{
                                    display: 'flex',
                                    gap: '12px',
                                    justifyContent: 'flex-end'
                                }}>
                                    <button
                                        onClick={() => {
                                            navigator.clipboard.writeText(generatedCode)
                                            alert('✅ Code copied to clipboard!')
                                        }}
                                        style={{
                                            padding: '12px 24px',
                                            background: 'linear-gradient(135deg, #238636, #2ea043)',
                                            color: 'white',
                                            border: 'none',
                                            borderRadius: '8px',
                                            fontSize: '14px',
                                            fontWeight: 600,
                                            cursor: 'pointer',
                                            boxShadow: '0 0 15px rgba(46, 160, 67, 0.3)'
                                        }}
                                    >
                                        📋 Copy Code
                                    </button>

                                    <button
                                        onClick={() => {
                                            const blob = new Blob([generatedCode], { type: 'text/plain' })
                                            const url = URL.createObjectURL(blob)
                                            const a = document.createElement('a')
                                            a.href = url
                                            a.download = `test.${codeLanguage === 'javascript' ? 'js' : 'py'}`
                                            a.click()
                                            URL.revokeObjectURL(url)
                                        }}
                                        style={{
                                            padding: '12px 24px',
                                            background: 'linear-gradient(135deg, #1f6feb, #1158c7)',
                                            color: 'white',
                                            border: 'none',
                                            borderRadius: '8px',
                                            fontSize: '14px',
                                            fontWeight: 600,
                                            cursor: 'pointer',
                                            boxShadow: '0 0 15px rgba(31, 111, 235, 0.3)'
                                        }}
                                    >
                                        💾 Download
                                    </button>

                                    <button
                                        onClick={() => setShowCodeModal(false)}
                                        style={{
                                            padding: '12px 24px',
                                            background: '#21262d',
                                            color: '#c9d1d9',
                                            border: '2px solid #30363d',
                                            borderRadius: '8px',
                                            fontSize: '14px',
                                            fontWeight: 600,
                                            cursor: 'pointer'
                                        }}
                                    >
                                        Close
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>

    )
}
