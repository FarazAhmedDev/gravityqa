import { useState } from 'react'
import { swaggerTheme } from './swaggerTheme'

export interface Scripts {
    preRequest: string
    postResponse: string
}

interface Props {
    scripts: Scripts
    onChange: (scripts: Scripts) => void
}

export default function ScriptEditor({ scripts, onChange }: Props) {
    const [activeTab, setActiveTab] = useState<'pre' | 'post'>('pre')

    const examples = {
        pre: `// Pre-request Script
// Set variables before request
pm.environment.set("timestamp", Date.now());

// Modify request headers
pm.request.headers.add({
  key: "X-Request-ID",
  value: pm.variables.replaceIn("{{$guid}}")
});

// Log information
console.log("Executing request:", pm.request.url);`,

        post: `// Post-response Script  
// Extract data from response
const json = pm.response.json();
pm.environment.set("token", json.token);
pm.environment.set("userId", json.user.id);

// Run tests
pm.test("Status is 200", () => {
  pm.response.to.have.status(200);
});

pm.test("Response time < 500ms", () => {
  pm.expect(pm.response.responseTime).to.be.below(500);
});

pm.test("Has user data", () => {
  pm.expect(json.user).to.exist;
});

// Log results
console.log("Response time:", pm.response.responseTime + "ms");`
    }

    return (
        <div>
            {/* Tabs */}
            <div style={{
                display: 'flex',
                gap: '8px',
                marginBottom: '20px',
                borderBottom: `2px solid ${swaggerTheme.border}`,
                paddingBottom: '4px'
            }}>
                <button
                    onClick={() => setActiveTab('pre')}
                    style={{
                        padding: '12px 20px',
                        background: activeTab === 'pre' ? swaggerTheme.primary : swaggerTheme.bgTertiary,
                        border: 'none',
                        borderRadius: '6px 6px 0 0',
                        color: activeTab === 'pre' ? '#fff' : swaggerTheme.textSecondary,
                        fontSize: '14px',
                        fontWeight: '600',
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px'
                    }}
                >
                    <span style={{ fontSize: '16px' }}>⚡</span>
                    Pre-Request
                </button>
                <button
                    onClick={() => setActiveTab('post')}
                    style={{
                        padding: '12px 20px',
                        background: activeTab === 'post' ? swaggerTheme.primary : swaggerTheme.bgTertiary,
                        border: 'none',
                        borderRadius: '6px 6px 0 0',
                        color: activeTab === 'post' ? '#fff' : swaggerTheme.textSecondary,
                        fontSize: '14px',
                        fontWeight: '600',
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px'
                    }}
                >
                    <span style={{ fontSize: '16px' }}>✅</span>
                    Tests (Post-Response)
                </button>
            </div>

            {/* Editor Section */}
            <div style={{
                background: swaggerTheme.bgSecondary,
                borderRadius: '8px',
                border: `1px solid ${swaggerTheme.border}`,
                padding: '20px'
            }}>
                <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: '16px'
                }}>
                    <div>
                        <div style={{
                            fontSize: '16px',
                            fontWeight: '700',
                            color: swaggerTheme.text,
                            marginBottom: '4px'
                        }}>
                            {activeTab === 'pre' ? 'Pre-Request Script' : 'Test Script'}
                        </div>
                        <div style={{
                            fontSize: '13px',
                            color: swaggerTheme.textSecondary
                        }}>
                            {activeTab === 'pre'
                                ? 'JavaScript code to run before sending the request'
                                : 'JavaScript code to run after receiving the response'
                            }
                        </div>
                    </div>
                    <button
                        onClick={() => {
                            const script = activeTab === 'pre' ? examples.pre : examples.post
                            onChange(activeTab === 'pre'
                                ? { ...scripts, preRequest: script }
                                : { ...scripts, postResponse: script }
                            )
                        }}
                        style={{
                            padding: '8px 16px',
                            background: swaggerTheme.bgTertiary,
                            border: `1px solid ${swaggerTheme.border}`,
                            borderRadius: '6px',
                            color: swaggerTheme.text,
                            fontSize: '13px',
                            fontWeight: '600',
                            cursor: 'pointer',
                            transition: 'all 0.2s'
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.background = swaggerTheme.primary}
                        onMouseLeave={(e) => e.currentTarget.style.background = swaggerTheme.bgTertiary}
                    >
                        📋 Load Example
                    </button>
                </div>

                {/* Code Editor */}
                <textarea
                    value={activeTab === 'pre' ? scripts.preRequest : scripts.postResponse}
                    onChange={(e) => onChange(
                        activeTab === 'pre'
                            ? { ...scripts, preRequest: e.target.value }
                            : { ...scripts, postResponse: e.target.value }
                    )}
                    placeholder={
                        activeTab === 'pre'
                            ? '// JavaScript code to run before request\n// Example:\npm.environment.set("timestamp", Date.now());'
                            : '// JavaScript code to run after response\n// Example:\nconst json = pm.response.json();\npm.test("Status is 200", () => {\n  pm.response.to.have.status(200);\n});'
                    }
                    style={{
                        width: '100%',
                        minHeight: '400px',
                        padding: '16px',
                        background: swaggerTheme.bg,
                        border: `1px solid ${swaggerTheme.border}`,
                        borderRadius: '6px',
                        color: swaggerTheme.text,
                        fontSize: '14px',
                        fontFamily: 'Consolas, Monaco, "Courier New", monospace',
                        lineHeight: '1.8',
                        resize: 'vertical',
                        outline: 'none',
                        boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.1)'
                    }}
                />

                {/* Helper Documentation */}
                <div style={{
                    marginTop: '20px',
                    padding: '16px',
                    background: swaggerTheme.bg,
                    borderRadius: '6px',
                    border: `1px solid ${swaggerTheme.border}`
                }}>
                    <div style={{
                        fontSize: '14px',
                        fontWeight: '700',
                        color: swaggerTheme.text,
                        marginBottom: '12px'
                    }}>
                        📚 Available APIs
                    </div>
                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
                        gap: '12px',
                        fontSize: '13px',
                        fontFamily: 'monospace',
                        color: swaggerTheme.textSecondary
                    }}>
                        <div>
                            <strong style={{ color: swaggerTheme.primary }}>Environment Variables:</strong>
                            <div style={{ marginTop: '6px', lineHeight: '1.8' }}>
                                • <code style={{ color: swaggerTheme.text }}>pm.environment.set(key, value)</code>
                                <br />
                                • <code style={{ color: swaggerTheme.text }}>pm.environment.get(key)</code>
                            </div>
                        </div>
                        <div>
                            <strong style={{ color: swaggerTheme.primary }}>Response Data:</strong>
                            <div style={{ marginTop: '6px', lineHeight: '1.8' }}>
                                • <code style={{ color: swaggerTheme.text }}>pm.response.json()</code>
                                <br />
                                • <code style={{ color: swaggerTheme.text }}>pm.response.status</code>
                                <br />
                                • <code style={{ color: swaggerTheme.text }}>pm.response.responseTime</code>
                            </div>
                        </div>
                        <div>
                            <strong style={{ color: swaggerTheme.primary }}>Testing:</strong>
                            <div style={{ marginTop: '6px', lineHeight: '1.8' }}>
                                • <code style={{ color: swaggerTheme.text }}>pm.test(name, function)</code>
                                <br />
                                • <code style={{ color: swaggerTheme.text }}>pm.expect(value).to.equal()</code>
                                <br />
                                • <code style={{ color: swaggerTheme.text }}>pm.expect(value).to.be.below()</code>
                            </div>
                        </div>
                        <div>
                            <strong style={{ color: swaggerTheme.primary }}>Utilities:</strong>
                            <div style={{ marginTop: '6px', lineHeight: '1.8' }}>
                                • <code style={{ color: swaggerTheme.text }}>console.log(message)</code>
                                <br />
                                • <code style={{ color: swaggerTheme.text }}>Date.now()</code>
                                <br />
                                • <code style={{ color: swaggerTheme.text }}>JSON.parse(str)</code>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Tips */}
                <div style={{
                    marginTop: '16px',
                    padding: '12px 16px',
                    background: swaggerTheme.primary + '10',
                    borderRadius: '6px',
                    borderLeft: `3px solid ${swaggerTheme.primary}`,
                    fontSize: '13px',
                    color: swaggerTheme.textSecondary,
                    lineHeight: '1.6'
                }}>
                    <strong style={{ color: swaggerTheme.text }}>💡 Tips:</strong>
                    <ul style={{ margin: '8px 0 0 20px', padding: 0 }}>
                        <li>Use pre-request scripts to set dynamic values or modify headers</li>
                        <li>Use test scripts to validate responses and extract data for later use</li>
                        <li>Check the browser console for <code>console.log()</code> output</li>
                        <li>Scripts run in a sandboxed environment with the Postman-like <code>pm</code> API</li>
                    </ul>
                </div>
            </div>
        </div>
    )
}

// Script execution context  
export function executeScript(
    script: string,
    context: {
        request?: any
        response?: any
        environment: Record<string, string>
        setEnvironment: (key: string, value: string) => void
    }
): { success: boolean; error?: string; logs: string[] } {
    const logs: string[] = []
    const tests: { name: string; passed: boolean }[] = []

    try {
        // Create Postman-like API
        const pm = {
            environment: {
                get: (key: string) => context.environment[key],
                set: (key: string, value: string) => {
                    context.setEnvironment(key, value)
                    logs.push(`✓ Set ${key} = ${value}`)
                }
            },
            request: context.request || {},
            response: {
                json: () => context.response?.body ? JSON.parse(JSON.stringify(context.response.body)) : {},
                status: context.response?.status,
                statusText: context.response?.statusText,
                headers: context.response?.headers || {},
                responseTime: context.response?.time || 0,
                to: {
                    have: {
                        status: (expected: number) => {
                            if (context.response?.status !== expected) {
                                throw new Error(`Expected status ${expected}, got ${context.response?.status}`)
                            }
                        }
                    }
                }
            },
            test: (name: string, fn: () => void) => {
                try {
                    fn()
                    tests.push({ name, passed: true })
                    logs.push(`✓ PASS: ${name}`)
                } catch (error) {
                    tests.push({ name, passed: false })
                    logs.push(`✗ FAIL: ${name} - ${error}`)
                }
            },
            expect: (actual: any) => ({
                to: {
                    be: {
                        below: (expected: number) => {
                            if (actual >= expected) {
                                throw new Error(`Expected ${actual} to be below ${expected}`)
                            }
                        }
                    },
                    equal: (expected: any) => {
                        if (actual !== expected) {
                            throw new Error(`Expected ${actual} to equal ${expected}`)
                        }
                    },
                    exist: () => {
                        if (actual === undefined || actual === null) {
                            throw new Error('Expected value to exist')
                        }
                    }
                }
            })
        }

        // Override console.log
        const console = {
            log: (...args: any[]) => {
                logs.push('📝 ' + args.map(a => String(a)).join(' '))
            }
        }

        // Execute script
        const fn = new Function('pm', 'console', script)
        fn(pm, console)

        return { success: true, logs }
    } catch (error) {
        return {
            success: false,
            error: error instanceof Error ? error.message : String(error),
            logs
        }
    }
}
