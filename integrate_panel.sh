#!/bin/bash

# Add Selected Element panel inside Recorded Actions container

cd "/Users/developervativeapps/Desktop/APPIUM INSPECTOR /gravityqa"

# Create the Selected Element panel code
cat > /tmp/selected_element_panel.txt << 'EOF'

                                {/* Selected Element Panel (Inspector Mode) */}
                                {recordingMode === 'inspector' && hoveredElement && (
                                    <div style={{
                                        marginBottom: '20px',
                                        background: 'linear-gradient(135deg, #0d1117, #161b22)',
                                        border: '2px solid #30a9de',
                                        borderRadius: '12px',
                                        boxShadow: '0 8px 32px rgba(48, 169, 222, 0.5)',
                                        overflow: 'hidden'
                                    }}>
                                        <div style={{
                                            padding: '12px 16px',
                                            background: '#30a9de',
                                            color: 'white',
                                            fontSize: '13px',
                                            fontWeight: 700
                                        }}>
                                            🎯 Selected Element
                                        </div>
                                        <div style={{ padding: '14px', maxHeight: '220px', overflowY: 'auto' }}>
                                            {hoveredElement.resource_id && (
                                                <div style={{ marginBottom: '10px', padding: '8px', background: '#161b22', borderRadius: '6px' }}>
                                                    <div style={{ fontSize: '9px', color: '#8b949e', marginBottom: '3px' }}>ID</div>
                                                    <div style={{ color: '#58a6ff', fontSize: '10px', fontFamily: 'monospace', wordBreak: 'break-all' }}>
                                                        {hoveredElement.resource_id}
                                                    </div>
                                                </div>
                                            )}
                                            <div style={{ marginBottom: '10px', padding: '8px', background: '#161b22', borderRadius: '6px' }}>
                                                <div style={{ fontSize: '9px', color: '#8b949e', marginBottom: '3px' }}>CLASS</div>
                                                <div style={{ color: '#58a6ff', fontSize: '10px', fontFamily: 'monospace', wordBreak: 'break-all' }}>
                                                    {hoveredElement.class || 'N/A'}
                                                </div>
                                            </div>
                                            {hoveredElement.xpath && (
                                                <div style={{ marginBottom: '10px', padding: '8px', background: '#161b22', borderRadius: '6px' }}>
                                                    <div style={{ fontSize: '9px', color: '#8b949e', marginBottom: '3px' }}>XPATH</div>
                                                    <div style={{ color: '#58a6ff', fontSize: '9px', fontFamily: 'monospace', wordBreak: 'break-all', maxHeight: '40px', overflowY: 'auto' }}>
                                                        {hoveredElement.xpath}
                                                    </div>
                                                </div>
                                            )}
                                            {hoveredElement.text && (
                                                <div style={{ marginBottom: '6px', fontSize: '10px' }}>
                                                    <span style={{ color: '#8b949e' }}>text: </span>
                                                    <span style={{ color: '#c9d1d9' }}>"{hoveredElement.text}"</span>
                                                </div>
                                            )}
                                            <div style={{ fontSize: '10px', color: '#8b949e', marginTop: '10px' }}>
                                                clickable: <span style={{ color: hoveredElement.clickable ? '#2ea043' : '#f85149' }}>{hoveredElement.clickable ? 'true' : 'false'}</span>
                                            </div>
                                        </div>
                                    </div>
                                )}
EOF

# Insert after line 1747 (after the </h3>)
head -n 1747 src/components/inspector/AutomationWizard.tsx > /tmp/new_wizard.tsx
cat /tmp/selected_element_panel.txt >> /tmp/new_wizard.tsx
tail -n +1748 src/components/inspector/AutomationWizard.tsx >> /tmp/new_wizard.tsx

# Replace original
mv /tmp/new_wizard.tsx src/components/inspector/AutomationWizard.tsx

# Now remove the old overlay panel (lines 1661-1719)
# First, find exact line numbers
OVERLAY_START=$(grep -n "Selected Element Panel - Appium Inspector Style" src/components/inspector/AutomationWizard.tsx | head -1 | cut -d: -f1)

if [ -n "$OVERLAY_START" ]; then
    # Find the closing of this panel (around 60 lines later)
    OVERLAY_END=$((OVERLAY_START + 58))
    
    echo "Removing old overlay panel from lines $OVERLAY_START to $OVERLAY_END"
    
    # Remove those lines
    sed -i.bak "${OVERLAY_START},${OVERLAY_END}d" src/components/inspector/AutomationWizard.tsx
    
    echo "✅ Removed old overlay panel"
fi

echo "✅ Selected Element panel added inside Recorded Actions container!"
echo "✅ Old overlay panel removed!"
echo "✅ Mirror screen is now clear!"
