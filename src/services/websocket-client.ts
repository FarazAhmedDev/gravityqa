import { io, Socket } from 'socket.io-client'
import type { WebSocketMessage } from '@/types'

class WebSocketClient {
    private socket: Socket | null = null
    private listeners: Map<string, Set<(data: any) => void>> = new Map()

    connect(url: string = 'http://localhost:8000') {
        if (this.socket?.connected) {
            return
        }

        this.socket = io(url, {
            transports: ['websocket'],
            reconnection: true,
            reconnectionDelay: 1000,
            reconnectionAttempts: 5,
        })

        this.socket.on('connect', () => {
            console.log('WebSocket connected')
        })

        this.socket.on('disconnect', () => {
            console.log('WebSocket disconnected')
        })

        this.socket.on('error', (error) => {
            console.error('WebSocket error:', error)
        })

        // Listen to all events and route to listeners
        this.socket.onAny((event, data) => {
            const handlers = this.listeners.get(event)
            if (handlers) {
                handlers.forEach(handler => handler(data))
            }
        })
    }

    disconnect() {
        if (this.socket) {
            this.socket.disconnect()
            this.socket = null
        }
    }

    subscribe(channel: string) {
        if (this.socket) {
            this.socket.emit('subscribe', channel)
        }
    }

    unsubscribe(channel: string) {
        if (this.socket) {
            this.socket.emit('unsubscribe', channel)
        }
    }

    on(event: string, callback: (data: any) => void) {
        if (!this.listeners.has(event)) {
            this.listeners.set(event, new Set())
        }
        this.listeners.get(event)!.add(callback)
    }

    off(event: string, callback: (data: any) => void) {
        const handlers = this.listeners.get(event)
        if (handlers) {
            handlers.delete(callback)
        }
    }

    emit(event: string, data: any) {
        if (this.socket) {
            this.socket.emit(event, data)
        }
    }
}

export const wsClient = new WebSocketClient()
export default wsClient
