// Premium Swagger-inspired theme
export const swaggerTheme = {
    // Backgrounds with gradients
    bg: '#0a0a0f',
    bgSecondary: '#13131a',
    bgTertiary: '#1a1a24',
    bgCard: '#1e1e2e',
    hover: 'linear-gradient(135deg, #252532, #2a2a3a)',

    // Borders with subtle glow
    border: '#2a2a3a',
    borderSecondary: '#35354a',
    borderActive: '#8b5cf6',

    // Text colors
    text: '#f5f5f7',
    textSecondary: '#9ca3af',
    textTertiary: '#6b7280',

    // Primary brand color with gradient
    primary: '#8b5cf6',
    primaryDark: '#7c3aed',
    primaryLight: '#a78bfa',
    primaryGradient: 'linear-gradient(135deg, #8b5cf6, #7c3aed)',

    // HTTP Method colors (Swagger standard)
    methods: {
        GET: '#61affe',
        POST: '#49cc90',
        PUT: '#fca130',
        DELETE: '#f93e3e',
        PATCH: '#50e3c2',
        HEAD: '#9012fe',
        OPTIONS: '#0d5aa7'
    },

    // Status code colors with glow
    status: {
        success: '#10b981',      // 2xx
        redirect: '#fbbf24',     // 3xx
        clientError: '#f97316',  // 4xx
        serverError: '#ef4444',  // 5xx
        info: '#06b6d4'          // 1xx
    },

    // Shadows with depth
    shadow: {
        sm: '0 1px 3px rgba(0, 0, 0, 0.3)',
        md: '0 4px 12px rgba(0, 0, 0, 0.4)',
        lg: '0 10px 30px rgba(0, 0, 0, 0.5)',
        xl: '0 20px 50px rgba(0, 0, 0, 0.6)',
        glow: '0 0 20px rgba(139, 92, 246, 0.4)',
        glowStrong: '0 0 30px rgba(139, 92, 246, 0.6)'
    },

    // Transitions
    transition: {
        fast: '150ms ease-in-out',
        base: '250ms cubic-bezier(0.4, 0, 0.2, 1)',
        slow: '400ms cubic-bezier(0.4, 0, 0.2, 1)'
    }
}

// Get method color with fallback
export function getMethodColor(method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH' | 'HEAD' | 'OPTIONS'): string {
    return swaggerTheme.methods[method] || swaggerTheme.primary
}

// Get status color based on status code with glow option
export function getStatusColor(status: number, glow: boolean = false): string {
    let color: string

    if (status >= 200 && status < 300) {
        color = swaggerTheme.status.success
    } else if (status >= 300 && status < 400) {
        color = swaggerTheme.status.redirect
    } else if (status >= 400 && status < 500) {
        color = swaggerTheme.status.clientError
    } else if (status >= 500) {
        color = swaggerTheme.status.serverError
    } else {
        color = swaggerTheme.status.info
    }

    return glow ? `${color} 0 0 10px ${color}` : color
}

// Generate gradient for method badges
export function getMethodGradient(method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH'): string {
    const color = getMethodColor(method)
    return `linear-gradient(135deg, ${color}, ${adjustColor(color, -20)})`
}

// Helper to adjust color brightness
function adjustColor(color: string, amount: number): string {
    const hex = color.replace('#', '')
    const rgb = parseInt(hex, 16)
    const r = Math.max(0, Math.min(255, ((rgb >> 16) & 0xff) + amount))
    const g = Math.max(0, Math.min(255, ((rgb >> 8) & 0xff) + amount))
    const b = Math.max(0, Math.min(255, (rgb & 0xff) + amount))
    return '#' + ((r << 16) | (g << 8) | b).toString(16).padStart(6, '0')
}

// Create glassmorphism effect
export function glassEffect(opacity: number = 0.7): React.CSSProperties {
    return {
        background: `rgba(30, 30, 46, ${opacity})`,
        backdropFilter: 'blur(20px) saturate(180%)',
        WebkitBackdropFilter: 'blur(20px) saturate(180%)',
        border: `1px solid rgba(139, 92, 246, 0.2)`,
        boxShadow: swaggerTheme.shadow.lg
    }
}

// Create shimmer animation effect
export function shimmerEffect(): React.CSSProperties {
    return {
        background: `linear-gradient(
            90deg,
            transparent 0%,
            rgba(139, 92, 246, 0.1) 50%,
            transparent 100%
        )`,
        backgroundSize: '200% 100%',
        animation: 'shimmer 2s linear infinite'
    }
}

// Export types
export type SwaggerTheme = typeof swaggerTheme
export type MethodColor = keyof typeof swaggerTheme.methods
export type StatusType = keyof typeof swaggerTheme.status
