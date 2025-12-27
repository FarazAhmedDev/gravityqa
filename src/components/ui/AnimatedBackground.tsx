import React, { useEffect, useRef } from 'react'

export default function AnimatedBackground() {
    const canvasRef = useRef<HTMLCanvasElement>(null)

    useEffect(() => {
        const canvas = canvasRef.current
        if (!canvas) return

        const ctx = canvas.getContext('2d')
        if (!ctx) return

        // Set canvas size
        const resizeCanvas = () => {
            canvas.width = window.innerWidth
            canvas.height = window.innerHeight
        }
        resizeCanvas()
        window.addEventListener('resize', resizeCanvas)

        // Particle system
        class Particle {
            x: number
            y: number
            size: number
            speedX: number
            speedY: number
            color: string
            opacity: number
            pulseSpeed: number
            pulsePhase: number

            constructor() {
                this.x = Math.random() * canvas.width
                this.y = Math.random() * canvas.height
                this.size = Math.random() * 3 + 1
                this.speedX = (Math.random() - 0.5) * 0.5
                this.speedY = (Math.random() - 0.5) * 0.5

                const colors = ['#8b5cf6', '#06b6d4', '#10b981', '#a78bfa', '#3b82f6']
                this.color = colors[Math.floor(Math.random() * colors.length)]
                this.opacity = Math.random() * 0.5 + 0.2
                this.pulseSpeed = Math.random() * 0.02 + 0.01
                this.pulsePhase = Math.random() * Math.PI * 2
            }

            update() {
                this.x += this.speedX
                this.y += this.speedY

                // Wrap around edges
                if (this.x > canvas.width) this.x = 0
                if (this.x < 0) this.x = canvas.width
                if (this.y > canvas.height) this.y = 0
                if (this.y < 0) this.y = canvas.height

                // Pulse effect
                this.pulsePhase += this.pulseSpeed
            }

            draw(ctx: CanvasRenderingContext2D) {
                const pulse = Math.sin(this.pulsePhase) * 0.5 + 0.5
                const currentOpacity = this.opacity * (0.5 + pulse * 0.5)

                ctx.beginPath()
                ctx.arc(this.x, this.y, this.size * (1 + pulse * 0.3), 0, Math.PI * 2)
                ctx.fillStyle = this.color + Math.floor(currentOpacity * 255).toString(16).padStart(2, '0')
                ctx.fill()

                // Glow effect
                ctx.shadowBlur = 15 + pulse * 10
                ctx.shadowColor = this.color
            }
        }

        // Create particles
        const particles: Particle[] = []
        const particleCount = 100

        for (let i = 0; i < particleCount; i++) {
            particles.push(new Particle())
        }

        // Animation loop
        let animationFrame: number

        const animate = () => {
            // Clear with fade effect
            ctx.fillStyle = 'rgba(10, 10, 15, 0.05)'
            ctx.fillRect(0, 0, canvas.width, canvas.height)

            // Update and draw particles
            particles.forEach(particle => {
                particle.update()
                particle.draw(ctx)
            })

            // Draw connections
            particles.forEach((p1, i) => {
                particles.slice(i + 1).forEach(p2 => {
                    const dx = p1.x - p2.x
                    const dy = p1.y - p2.y
                    const distance = Math.sqrt(dx * dx + dy * dy)

                    if (distance < 150) {
                        ctx.beginPath()
                        ctx.strokeStyle = `rgba(139, 92, 246, ${0.2 * (1 - distance / 150)})`
                        ctx.lineWidth = 1
                        ctx.moveTo(p1.x, p1.y)
                        ctx.lineTo(p2.x, p2.y)
                        ctx.stroke()
                    }
                })
            })

            animationFrame = requestAnimationFrame(animate)
        }

        animate()

        return () => {
            window.removeEventListener('resize', resizeCanvas)
            cancelAnimationFrame(animationFrame)
        }
    }, [])

    return (
        <>
            {/* Canvas background */}
            <canvas
                ref={canvasRef}
                style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: '100%',
                    pointerEvents: 'none',
                    zIndex: 0,
                    opacity: 0.6
                }}
            />

            {/* Gradient overlays */}
            <div
                style={{
                    position: 'fixed',
                    top: '-50%',
                    left: '-50%',
                    width: '200%',
                    height: '200%',
                    background: 'radial-gradient(circle at 30% 30%, rgba(139, 92, 246, 0.08) 0%, transparent 50%)',
                    animation: 'rotate-slow 40s linear infinite',
                    pointerEvents: 'none',
                    zIndex: 0
                }}
            />

            <div
                style={{
                    position: 'fixed',
                    top: '-50%',
                    right: '-50%',
                    width: '200%',
                    height: '200%',
                    background: 'radial-gradient(circle at 70% 70%, rgba(6, 182, 212, 0.06) 0%, transparent 50%)',
                    animation: 'rotate-slow-reverse 35s linear infinite',
                    pointerEvents: 'none',
                    zIndex: 0
                }}
            />

            {/* Floating orbs */}
            <div
                style={{
                    position: 'fixed',
                    top: '20%',
                    left: '10%',
                    width: '300px',
                    height: '300px',
                    borderRadius: '50%',
                    background: 'radial-gradient(circle, rgba(139, 92, 246, 0.15), transparent 70%)',
                    filter: 'blur(60px)',
                    animation: 'float-1 15s ease-in-out infinite',
                    pointerEvents: 'none',
                    zIndex: 0
                }}
            />

            <div
                style={{
                    position: 'fixed',
                    bottom: '20%',
                    right: '10%',
                    width: '400px',
                    height: '400px',
                    borderRadius: '50%',
                    background: 'radial-gradient(circle, rgba(6, 182, 212, 0.12), transparent 70%)',
                    filter: 'blur(70px)',
                    animation: 'float-2 20s ease-in-out infinite',
                    pointerEvents: 'none',
                    zIndex: 0
                }}
            />

            <div
                style={{
                    position: 'fixed',
                    top: '50%',
                    right: '30%',
                    width: '250px',
                    height: '250px',
                    borderRadius: '50%',
                    background: 'radial-gradient(circle, rgba(16, 185, 129, 0.1), transparent 70%)',
                    filter: 'blur(50px)',
                    animation: 'float-3 18s ease-in-out infinite',
                    pointerEvents: 'none',
                    zIndex: 0
                }}
            />

            {/* Grid overlay */}
            <div
                style={{
                    position: 'fixed',
                    inset: 0,
                    backgroundImage: `
                        linear-gradient(rgba(139, 92, 246, 0.03) 1px, transparent 1px),
                        linear-gradient(90deg, rgba(139, 92, 246, 0.03) 1px, transparent 1px)
                    `,
                    backgroundSize: '60px 60px',
                    pointerEvents: 'none',
                    zIndex: 0,
                    opacity: 0.5
                }}
            />

            {/* Animations */}
            <style>{`
                @keyframes rotate-slow {
                    from { transform: rotate(0deg); }
                    to { transform: rotate(360deg); }
                }
                
                @keyframes rotate-slow-reverse {
                    from { transform: rotate(360deg); }
                    to { transform: rotate(0deg); }
                }
                
                @keyframes float-1 {
                    0%, 100% {
                        transform: translate(0, 0) scale(1);
                    }
                    33% {
                        transform: translate(50px, -80px) scale(1.1);
                    }
                    66% {
                        transform: translate(-30px, 60px) scale(0.9);
                    }
                }
                
                @keyframes float-2 {
                    0%, 100% {
                        transform: translate(0, 0) scale(1);
                    }
                    33% {
                        transform: translate(-60px, 70px) scale(1.15);
                    }
                    66% {
                        transform: translate(40px, -50px) scale(0.85);
                    }
                }
                
                @keyframes float-3 {
                    0%, 100% {
                        transform: translate(0, 0) scale(1);
                    }
                    33% {
                        transform: translate(70px, 50px) scale(0.9);
                    }
                    66% {
                        transform: translate(-50px, -70px) scale(1.2);
                    }
                }
            `}</style>
        </>
    )
}
