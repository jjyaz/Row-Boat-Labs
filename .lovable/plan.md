

## Add "CA" Button Next to GitHub Icon

A small button labeled "CA" will be added next to the existing GitHub icon in the top-right corner of the hero section. When clicked, it will copy the contract address to clipboard and show a toast notification.

### Changes

**File: `src/pages/Index.tsx`**
- Add a "CA" button next to the GitHub link in the hero section's absolute-positioned top-right area
- Wrap both the GitHub link and the new CA button in a flex container
- On click, copy `3eUvVEtPjNvMJsTCDtQi6D6EHTJJ1v4nSq6m4mp8pump` to the clipboard
- Show a toast notification confirming the address was copied
- Style the button to match the GitHub icon's appearance (muted foreground, hover effect)

