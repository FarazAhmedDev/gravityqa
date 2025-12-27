#!/bin/bash
# Fix AutomationWizard.tsx corruption

cd "/Users/developervativeapps/Desktop/APPIUM INSPECTOR /gravityqa"

# Remove the first line (```typescript fence)
tail -n +2 src/components/inspector/AutomationWizard.tsx > /tmp/fixed_wizard.tsx

# Replace original
mv /tmp/fixed_wizard.tsx src/components/inspector/AutomationWizard.tsx

echo "✅ File corruption fixed!"
echo "✅ Removed ```typescript fence from line 1"
