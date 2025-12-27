# 🎨 GravityQA Ultra-Premium Design System

## Applied Animations & Effects

### ✅ COMPLETED:
- **DeviceManager** - Full ultra-premium treatment with 20+ animations

### 🚀 TO APPLY:
- **FlowManager** (Saved Flows screen)
- **AutomationWizard** (Inspector/Recording screen)
- **Main Layout/Navigation**

---

## 🌟 Standard Animation Library

### Background Effects:
```typescript
// Animated mesh gradient with mouse parallax
background: `radial-gradient(circle at ${20 + mousePos.x * 0.02}% ...)`

// Floating particles (15 particles with 3 different patterns)
{[...Array(15)].map((_, i) => <FloatingParticle key={i} />)}

// Gradient shift animation
animation: 'gradientShift 15s ease infinite'
```

### Text Effects:
```typescript
// Gradient flow text
background: 'linear-gradient(135deg, #58a6ff, #a78bfa, #58a6ff)'
backgroundSize: '200% 100%'
animation: 'gradientFlow 5s ease infinite'

// Text float
animation: 'textFloat 4s ease-in-out infinite'
```

### Button Effects:
```typescript
// 3D button with pulse
boxShadow: '0 0 40px rgba(88, 166, 255, 0.6), 0 10px 30px rgba(0, 0, 0, 0.5), inset 0 1px 0 rgba(255, 255, 255, 0.2)'
animation: 'buttonPulse 2s ease-in-out infinite'

// Hover effect
transform: 'translateY(-4px) scale(1.05)'
```

### Card Effects:
```typescript
// Staggered entrance
animation: `cardEntrance 0.8s cubic-bezier(0.34, 1.56, 0.64, 1) ${index * 0.12}s backwards`

// Shimmer overlay (on selected)
<div style={{
    background: 'linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.1), transparent)',
    animation: 'shimmer 4s infinite'
}} />

// Conic gradient rotation
<div style={{
    background: 'conic-gradient(from 0deg, transparent, rgba(88, 166, 255, 0.1), transparent)',
    animation: 'rotate 8s linear infinite'
}} />

// 3D transform on hover
transform: 'translateY(-8px) scale(1.03) rotateX(2deg)'
```

### Icon Effects:
```typescript
// Float + Glow
animation: 'iconFloat 4s ease-in-out infinite, iconGlow 3s ease-in-out infinite'
filter: 'drop-shadow(0 6px 20px rgba(0, 0, 0, 0.5))'
```

### Status Indicators:
```typescript
// Pulsing dot with multi-layer glow
boxShadow: '0 0 20px rgba(63, 185, 80, 1), 0 0 40px rgba(63, 185, 80, 0.5)'
animation: 'statusPulse 2.5s ease-in-out infinite'

// Badge pulse
animation: 'badgePulse 3s ease-in-out infinite'
```

### Gradient Borders:
```typescript
// Animated gradient border wrapper
<div style={{
    padding: '2px',
    background: 'linear-gradient(135deg, rgba(88, 166, 255, 0.4), rgba(139, 92, 246, 0.4))',
    borderRadius: '18px'
}}>
    <div style={{ background: 'rgba(13, 17, 23, 0.9)', borderRadius: '16px' }}>
        {/* Content */}
    </div>
</div>
```

---

## 📋 Required Keyframe Animations

Include in every component's `<style>` block:

```css
@keyframes fadeIn { /* 0% opacity to 100% */ }
@keyframes slideDown { /* slide from top */ }
@keyframes slideUp { /* slide from bottom */ }
@keyframes slideInRight { /* slide from right */ }
@keyframes slideInLeft { /* slide from left */ }
@keyframes cardEntrance { /* fade + slide + scale */ }
@keyframes iconFloat { /* gentle bounce */ }
@keyframes textFloat { /* text bounce */ }
@keyframes iconGlow { /* shadow glow pulse */ }
@keyframes iconRotate { /* 360 rotation */ }
@keyframes statusPulse { /* opacity + scale + glow */ }
@keyframes badgePulse { /* shadow pulse */ }
@keyframes shimmer { /* light sweep */ }
@keyframes rotate { /* 360 rotation */ }
@keyframes spin { /* rotation for loading */ }
@keyframes glow { /* shadow glow */ }
@keyframes gradientFlow { /* gradient position */ }
@keyframes gradientShift { /* opacity shift */ }
@keyframes buttonPulse { /* shadow pulse */ }
@keyframes float0/1/2 { /* particle movements */ }
```

---

## 🎨 Color Palette

### Gradients:
- **Primary:** `linear-gradient(135deg, #58a6ff, #1f6feb)`
- **Secondary:** `linear-gradient(135deg, #a78bfa, #8b5cf6)`
- **Mixed:** `linear-gradient(135deg, #58a6ff, #a78bfa)`
- **Success:** `linear-gradient(135deg, #3fb950, #238636)`
- **Danger:** `linear-gradient(135deg, #f85149, #da3633)`

### Text Gradients:
- **Title:** `linear-gradient(135deg, #ffffff 0%, #58a6ff 50%, #a78bfa 100%)`
- **Subtitle:** `linear-gradient(135deg, #e6edf3, #8b949e)`
- **Badge:** `linear-gradient(135deg, #58a6ff, #a78bfa, #58a6ff)` with 200% size

### Shadows:
- **Card:** `0 10px 40px rgba(0, 0, 0, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.05)`
- **Selected:** `0 0 60px rgba(88, 166, 255, 0.4), 0 20px 60px rgba(0, 0, 0, 0.5)`
- **Button:** `0 0 40px rgba(88, 166, 255, 0.6), 0 10px 30px rgba(0, 0, 0, 0.5)`
- **Status Glow:** `0 0 20px rgba(63, 185, 80, 1), 0 0 40px rgba(63, 185, 80, 0.5)`

---

## 🚀 Implementation Priority

1. **FlowManager** - Saved flows list needs full treatment
2. **AutomationWizard** - Recording/playback screen
3. **Main Layout** - Navigation and header

---

## 💡 Performance Notes

- All animations use CSS transforms and opacity (hardware accelerated)
- Backdrop blur limited to essential elements
- Particle count capped at 15
- Animation delays staggered to avoid simultaneous triggers
- `will-change` property used sparingly

---

**Status:** DeviceManager ✅ Complete | FlowManager 🔄 Next | AutomationWizard ⏳ Pending
