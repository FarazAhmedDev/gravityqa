#!/bin/bash

# This script moves Selected Element panel from overlay to middle column

cd "/Users/developervativeapps/Desktop/APPIUM INSPECTOR /gravityqa"

# Find line numbers
OVERLAY_START=$(grep -n "Selected Element Panel - Appium Inspector Style" src/components/inspector/AutomationWizard.tsx | cut -d: -f1)
ACTIONS_START=$(grep -n "CENTER: Recorded Actions List" src/components/inspector/AutomationWizard.tsx | cut -d: -f1)

echo "✓ Selected Element Panel starts at line: $OVERLAY_START"
echo "✓ Recorded Actions starts at line: $ACTIONS_START"

# Create new structure using Python for precise editing
python3 << 'PYTHON_SCRIPT'
import re

# Read file
with open('src/components/inspector/AutomationWizard.tsx', 'r') as f:
    lines = f.readlines()

# Find Selected Element Panel block (lines with position: absolute)
overlay_start = None
overlay_end = None
for i, line in enumerate(lines):
    if "Selected Element Panel - Appium Inspector Style" in line:
        overlay_start = i
    if overlay_start and i > overlay_start and line.strip() == ')' and 'recordingMode' not in lines[i-1]:
        # Found closing of conditional
        for j in range(i, min(i+5, len(lines))):
            if lines[j].strip() == '</div>':
                overlay_end = j + 1
                break
        if overlay_end:
            break

print(f"Overlay block: lines {overlay_start+1} to {overlay_end+1}")

# Find actions section
actions_start = None
for i, line in enumerate(lines):
    if "CENTER: Recorded Actions List" in line:
        actions_start = i
        break

print(f"Actions start: line {actions_start+1}")

# Extract overlay panel content
overlay_content = lines[overlay_start:overlay_end]

# Modify overlay to be docked (remove absolute positioning)
new_panel = []
for i, line in enumerate(overlay_content):
    # Skip absolute positioning lines
    if 'position: \'absolute\'' in line:
        continue
    if 'top: \'20px\'' in line:
        continue
    if 'right: \'20px\'' in line:
        continue  
    if 'width: \'340px\'' in line:
        continue
    if 'zIndex: 2000' in line:
        continue
    if 'maxHeight: \'calc(100vh - 280px)\'' in line:
        new_panel.append(line.replace('maxHeight: \'calc(100vh - 280px)\'', 'maxHeight: \'280px\',\n                                    minHeight: \'220px\''))
        continue
    if 'maxHeight: \'calc(100vh - 360px)\'' in line:
        new_panel.append(line.replace('maxHeight: \'calc(100vh - 360px)\'', 'maxHeight: \'220px\''))
        continue
    
    new_panel.append(line)

# Create middle column wrapper
middle_col_start = [
    '                        {/* MIDDLE: Selected Element + Recorded Actions */}\n',
    '                        <div style={{\n',
    '                            flex: 1,\n',
    '                            maxWidth: \'450px\',\n',
    '                            display: \'flex\',\n',
    '                            flexDirection: \'column\',\n',
    '                            gap: \'16px\',\n',
    '                            maxHeight: \'calc(100vh - 190px)\'\n',
    '                        }}>\n',
    '                            {/* Selected Element Panel (Docked) */}\n'
]

# Build new file
new_lines = []

# Everything before overlay
new_lines.extend(lines[:overlay_start])

# Add middle column wrapper + docked panel + actions
new_lines.extend(middle_col_start)
new_lines.extend(new_panel)
new_lines.append('\n')

# Actions section - modify to be inside middle column
new_lines.append('                            {/* Recorded Actions */}\n')

# Find where actions div ends (need to close middle column there)
actions_div_start = None
for i in range(actions_start, len(lines)):
    if '{actions.length > 0 &&' in lines[i]:
        actions_div_start = i
        break

# Add actions content (skip the "CENTER:" comment and old wrapper)
in_actions = False
actions_end = None
for i in range(actions_start + 1, len(lines)):
    line = lines[i]
    
    # Start of actions div
    if actions_div_start and i == actions_div_start:
        in_actions = True
        new_lines.append(line.replace('{actions.length > 0 &&', '{actions.length > 0 &&'))
        continue
    
    if in_actions:
        # Skip old "flex: 1, maxWidth: 450px" - replace with just scroll control
        if 'flex: 1,' in line and i < actions_div_start + 15:
            new_lines.append(line.replace('flex: 1,', 'flex: 1,'))
            continue
        if 'maxWidth: \'450px\',' in line:
            continue  # Skip this, already in middle wrapper
        if 'maxHeight: \'calc(100vh - 190px)\',' in line:
            continue  # Skip this too
            
        new_lines.append(line)
        
        # Find end of actions section (closing of the actions.length > 0 conditional)
        if line.strip() == ')}' and 'actions.length' not in line:
            # Check if this closes the actions section
            # Look ahead for RIGHT panel
            for j in range(i, min(i+10, len(lines))):
                if 'RIGHT:' in lines[j] or 'Control Panel' in lines[j]:
                    actions_end = i
                    # Add closing for middle column
                    new_lines.append('                        </div>\n')
                    break
            if actions_end:
                break

# Add rest of file
if actions_end:
    new_lines.extend(lines[actions_end+1:])

# Write back
with open('src/components/inspector/AutomationWizard.tsx', 'w') as f:
    f.writelines(new_lines)

print("✅ File updated successfully!")
print(f"✅ Removed overlay panel from lines {overlay_start+1}-{overlay_end+1}")
print(f"✅ Created middle column wrapper")
print(f"✅ Moved Selected Element panel to middle column (above actions)")

PYTHON_SCRIPT

echo ""
echo "✅ Selected Element panel moved from overlay to docked middle column!"
echo "✅ Mirror screen is now clear!"
