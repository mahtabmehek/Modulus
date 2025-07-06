# Lab Session Management Demo Guide

This guide demonstrates the new lab session management features in Modulus LMS.

## Features Implemented

### 1. One Lab at a Time Restriction
- Students can only deploy one lab at a time
- Attempting to deploy a second lab will show an error message
- Current active lab must be ended before starting a new one

### 2. 1-Hour Time Limit
- Each lab session is limited to 1 hour (60 minutes)
- Timer starts when lab is deployed
- Session automatically expires after 1 hour

### 3. Extend Access Feature
- Students can extend their lab session by 30 minutes
- Extension can only be used once per session
- "Extend Access" button appears in the lab view when available

### 4. Remaining Time Display
- Header shows remaining time for active lab session
- Time updates every 10 seconds
- Warning indicator (⚠️) appears when less than 15 minutes remain
- Time display turns red when less than 15 minutes remain

### 5. Auto-close on Inactivity
- Lab automatically closes if no interaction for 30 minutes
- Each page load/interaction resets the inactivity timer
- Timer runs in the background

### 6. Current Lab Name in Header
- Header shows the name of the currently deployed lab
- VM IP address is displayed next to lab name
- Only visible when a lab session is active

## Testing the Features

### Step 1: Start a Lab Session
1. Navigate to any lab page
2. Click "Deploy Lab Machine"
3. Observe:
   - Button changes to show "Lab Active - [IP]"
   - Lab name appears in header with remaining time
   - Lab session info panel appears

### Step 2: Test One Lab Restriction
1. Navigate to a different lab
2. Try to click "Deploy Lab Machine"
3. Observe:
   - Button is disabled
   - Shows "Lab Already Active" message

### Step 3: Test Extend Access
1. In the active lab, click "Extend Access (+30min)"
2. Observe:
   - Time remaining increases by 30 minutes
   - Button disappears (can only extend once)
   - Session info updates

### Step 4: Test Time Display
1. Watch the header time countdown
2. Wait for time to go below 15 minutes
3. Observe:
   - Time display turns red
   - Warning icon appears

### Step 5: Test Manual End Session
1. Click "End Lab" button in the lab view
2. Observe:
   - Lab session ends immediately
   - Header updates to remove lab info
   - Can deploy new lab

## Technical Implementation

### New Types Added
- `LabSession` interface for managing lab sessions
- Enhanced app store with lab session management

### New Store Actions
- `startLabSession(labId)` - Start new lab session
- `extendLabSession(sessionId)` - Extend session by 30 minutes
- `endLabSession(sessionId)` - End session manually
- `updateLabInteraction(sessionId)` - Update last interaction time
- `getCurrentLabSession()` - Get current active session

### Header Updates
- Real-time remaining time display
- Current lab name and VM IP
- Visual warnings for low time
- Auto-updates every 10 seconds

### Lab View Updates
- Session status panel
- Deploy/extend/end controls
- Error handling for session limits
- Real-time session information

## Session Persistence
Lab sessions are persisted in browser storage, so they survive page refreshes and browser restarts (until expiration).
