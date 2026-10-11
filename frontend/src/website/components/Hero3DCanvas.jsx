import React, { useEffect, useRef } from 'react'

export default function Hero3DCanvas() {
  const canvasRef = useRef(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    let animationFrameId
    let width = (canvas.width = canvas.parentElement.offsetWidth)
    let height = (canvas.height = canvas.parentElement.offsetHeight)

    const handleResize = () => {
      if (!canvas || !canvas.parentElement) return
      width = canvas.width = canvas.parentElement.offsetWidth
      height = canvas.height = canvas.parentElement.offsetHeight
    }
    window.addEventListener('resize', handleResize)

    // 3D Particles & Nodes
    const particleCount = Math.min(Math.floor(width / 22), 65)
    const particles = []
    const goldColors = ['#C9A227', '#E0BD55', '#F5D061', '#8C6E14', '#D69E2E']

    for (let i = 0; i < particleCount; i++) {
      particles.push({
        x: Math.random() * width,
        y: Math.random() * height,
        z: Math.random() * 800 + 200, // 3D depth
        vx: (Math.random() - 0.5) * 0.4,
        vy: (Math.random() - 0.5) * 0.4,
        radius: Math.random() * 2.5 + 1,
        color: goldColors[Math.floor(Math.random() * goldColors.length)],
        baseAlpha: Math.random() * 0.5 + 0.3,
        pulseSpeed: Math.random() * 0.02 + 0.005,
        pulseOffset: Math.random() * Math.PI * 2,
      })
    }

    let mouseX = width / 2
    let mouseY = height / 2

    const handleMouseMove = (e) => {
      const rect = canvas.getBoundingClientRect()
      mouseX = e.clientX - rect.left
      mouseY = e.clientY - rect.top
    }
    window.addEventListener('mousemove', handleMouseMove)

    let time = 0

    const render = () => {
      time += 0.015
      ctx.clearRect(0, 0, width, height)

      // Draw subtle 3D grid lines in background
      ctx.strokeStyle = 'rgba(201, 162, 39, 0.03)'
      ctx.lineWidth = 1
      const gridSize = 60
      for (let x = 0; x < width; x += gridSize) {
        ctx.beginPath()
        ctx.moveTo(x, 0)
        ctx.lineTo(x + Math.sin(time + x * 0.01) * 10, height)
        ctx.stroke()
      }
      for (let y = 0; y < height; y += gridSize) {
        ctx.beginPath()
        ctx.moveTo(0, y)
        ctx.lineTo(width, y + Math.cos(time + y * 0.01) * 10)
        ctx.stroke()
      }

      // Update and draw 3D particles & connecting lines
      for (let i = 0; i < particles.length; i++) {
        const p = particles[i]
        p.x += p.vx
        p.y += p.vy

        // Wrap around boundaries
        if (p.x < 0) p.x = width
        if (p.x > width) p.x = 0
        if (p.y < 0) p.y = height
        if (p.y > height) p.y = 0

        // 3D perspective projection factor
        const perspective = 600 / (600 + p.z)
        const renderX = p.x + (mouseX - width / 2) * (1 - perspective) * 0.08
        const renderY = p.y + (mouseY - height / 2) * (1 - perspective) * 0.08
        const renderRadius = p.radius * perspective * 1.4

        const alpha = Math.sin(time * p.pulseSpeed * 60 + p.pulseOffset) * 0.25 + p.baseAlpha

        // Glowing particle
        ctx.beginPath()
        ctx.arc(renderX, renderY, Math.max(renderRadius, 0.8), 0, Math.PI * 2)
        ctx.fillStyle = p.color
        ctx.globalAlpha = Math.max(0.05, Math.min(alpha, 0.85))
        ctx.fill()

        // Draw node connections for nearby 3D points
        for (let j = i + 1; j < particles.length; j++) {
          const p2 = particles[j]
          const p2Perspective = 600 / (600 + p2.z)
          const p2X = p2.x + (mouseX - width / 2) * (1 - p2Perspective) * 0.08
          const p2Y = p2.y + (mouseY - height / 2) * (1 - p2Perspective) * 0.08

          const dx = renderX - p2X
          const dy = renderY - p2Y
          const dist = Math.sqrt(dx * dx + dy * dy)

          if (dist < 130) {
            ctx.beginPath()
            ctx.moveTo(renderX, renderY)
            ctx.lineTo(p2X, p2Y)
            ctx.strokeStyle = '#C9A227'
            ctx.globalAlpha = ((1 - dist / 130) * 0.18 * perspective).toFixed(3)
            ctx.lineWidth = 0.75
            ctx.stroke()
          }
        }
      }

      ctx.globalAlpha = 1
      animationFrameId = requestAnimationFrame(render)
    }

    render()

    return () => {
      window.removeEventListener('resize', handleResize)
      window.removeEventListener('mousemove', handleMouseMove)
      cancelAnimationFrame(animationFrameId)
    }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 pointer-events-none z-10 w-full h-full"
    />
  )
}
