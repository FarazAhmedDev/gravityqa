import { swaggerTheme, formatJSON } from './swaggerTheme'

interface CodeBlockProps {
    data: any
    language?: 'json' | 'text'
    maxHeight?: string
}

export default function CodeBlock({ data, language = 'json', maxHeight = '400px' }: CodeBlockProps) {
    const formattedCode = language === 'json' && typeof data === 'object'
        ? formatJSON(data)
        : String(data)

    // Simple syntax highlighting for JSON
    const highlightJSON = (code: string) => {
        return code
            .replace(/"([^"]+)":/g, `<span style="color: ${swaggerTheme.syntax.key}">"$1"</span>:`)
            .replace(/: "([^"]+)"/g, `: <span style="color: ${swaggerTheme.syntax.string}">"$1"</span>`)
            .replace(/: (\d+)/g, `: <span style="color: ${swaggerTheme.syntax.number}">$1</span>`)
            .replace(/: (true|false)/g, `: <span style="color: ${swaggerTheme.syntax.boolean}">$1</span>`)
            .replace(/: null/g, `: <span style="color: ${swaggerTheme.syntax.null}">null</span>`)
    }

    return (
        <div style={{
            background: '#1e1e1e',
            padding: '16px',
            borderRadius: '6px',
            border: `1px solid ${swaggerTheme.border}`,
            overflow: 'auto',
            maxHeight
        }}>
            <pre style={{
                margin: 0,
                fontFamily: 'Consolas, Monaco, "Courier New", monospace',
                fontSize: '13px',
                lineHeight: '1.6',
                color: swaggerTheme.text
            }}>
                {language === 'json' ? (
                    <code dangerouslySetInnerHTML={{ __html: highlightJSON(formattedCode) }} />
                ) : (
                    <code>{formattedCode}</code>
                )}
            </pre>
        </div>
    )
}
