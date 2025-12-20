# 🎨 Premium Green Button - Global Style Guide

## ✅ Created Component: `PremiumButton.tsx`

**Location:** `src/components/ui/PremiumButton.tsx`

## 🎯 Standard Premium Green Button Style

```tsx
background: 'linear-gradient(135deg, #3fb950 0%, #2ea043 50%, #238636 100%)'
```

### **Features:**
- ✅ 3-color gradient (light → medium → dark green)
- ✅ Glossy overlay effect
- ✅ Deep 3D shadows
- ✅ Smooth hover animations
- ✅ Disabled state support
- ✅ Icon support
- ✅ Size variants (small, medium, large)

---

## 📍 Buttons to Update (Found 21 locations):

### **1. Code Editor** (3 buttons)
- Save button
- Run Test button  
- New File button

### **2. Device Manager** (2 locations)
- Status indicators
- Device details modal

### **3. Inspector** (2 locations)
- Start session button
- Action buttons

### **4. Automation Wizard** (10 locations)
- Multiple CTAs
- Progress indicators
- Action buttons

### **5. Flow Manager** (3 locations)
- Flow controls
- Action buttons

### **6. Test Runner** (1 location)
- Status indicators

---

## 🔧 HOW TO USE:

### **Method 1: Component (Recommended)**
```tsx
import { PremiumGreenButton } from '../ui/PremiumButton'

<PremiumGreenButton 
    onClick={handleClick}
    icon={<>▶️</>}
    size="medium"
>
    Start Test
</PremiumGreenButton>
```

### **Method 2: Inline Style**
```tsx
import { premiumGreenButtonStyle } from '../ui/PremiumButton'

<button 
    style={premiumGreenButtonStyle(false)}
    onClick={handleClick}
>
    Start
</button>
```

### **Method 3: Copy Full Style**
```tsx
<button style={{
    position: 'relative',
    background: 'linear-gradient(135deg, #3fb950 0%, #2ea043 50%, #238636 100%)',
    color: 'white',
    border: 'none',
    padding: '12px 28px',
    height: '44px',
    borderRadius: '12px',
    cursor: 'pointer',
    fontWeight: 700,
    fontSize: '14px',
    letterSpacing: '0.5px',
    textTransform: 'uppercase',
    boxShadow: `
        0 1px 0 0 rgba(255,255,255,0.4) inset,
        0 -1px 0 0 rgba(0,0,0,0.2) inset,
        0 6px 20px -4px rgba(62,185,80,0.5),
        0 12px 40px -8px rgba(62,185,80,0.3)
    `,
    transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
    overflow: 'hidden'
}}>
    {/* Glossy overlay */}
    <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: '50%',
        background: 'linear-gradient(180deg, rgba(255,255,255,0.25) 0%, rgba(255,255,255,0.05) 100%)',
        borderRadius: '12px 12px 0 0',
        pointerEvents: 'none'
    }} />
    
    <span style={{
        position: 'relative',
        zIndex: 1,
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.3))'  
    }}>
        ▶️ Start
    </span>
</button>
```

---

## 🎨 Visual Specs:

### **Colors:**
```
Light Green:  #3fb950
Medium Green: #2ea043  
Dark Green:   #238636
```

### **Shadows:**
```
Inset Top:    0 1px 0 0 rgba(255,255,255,0.4) inset
Inset Bottom: 0 -1px 0 0 rgba(0,0,0,0.2) inset
Outer Glow:   0 6px 20px -4px rgba(62,185,80,0.5)
Outer Shadow: 0 12px 40px -8px rgba(62,185,80,0.3)
```

### **Hover Effect:**
```
Transform: translateY(-2px) scale(1.03)
Shadow:    Enhanced (brighter + larger)
```

### **Sizes:**
```
Small:  padding: 8px 16px,  height: 36px, fontSize: 13px
Medium: padding: 12px 28px, height: 44px, fontSize: 14px
Large:  padding: 14px 32px, height: 50px, fontSize: 16px
```

---

## ✅ IMPLEMENTATION STATUS:

- ✅ Component created
- ✅ Style guide documented
- ✅ 21 buttons identified
- ⏳ Updating all files (next step)

---

## 🚀 QUICK REPLACE GUIDE:

### **Find:**
```tsx
background: 'linear-gradient(135deg, #238636 0%, #2ea043 100%)'
```

### **Replace With:**
```tsx
background: 'linear-gradient(135deg, #3fb950 0%, #2ea043 50%, #238636 100%)'
```

**+ Add glossy overlay + hover effects!**

---

**All green buttons will look premium! 🎯✨**
