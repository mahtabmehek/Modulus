# Modulus LMS - Desktop Views Access Guide

## 🚀 Accessing Desktop Views

The desktop views in Modulus LMS simulate virtual cybersecurity lab environments. Here's how to access them:

### Navigation Path:
1. **Login/Dashboard** → Go to `http://localhost:3001` and login
2. **Learning Paths** → Click on any learning path (e.g., "BSc Cybersecurity", "MSc Cybersecurity")
3. **Modules** → Select a module within the learning path
4. **Labs** → Choose a lab from the module
5. **Start Desktop** → Click the red "Start Desktop" button in the lab view
6. **Desktop Environment** → You'll see the virtual Kali Linux desktop

### URL Navigation (Direct):
- Dashboard: `http://localhost:3001/?view=dashboard`
- Learning Path: `http://localhost:3001/?view=path&pathId=bsc-cyber`
- Module: `http://localhost:3001/?view=module&moduleId=network-fundamentals`
- Lab: `http://localhost:3001/?view=lab&labId=nmap-basics&moduleId=network-fundamentals`
- Desktop: `http://localhost:3001/?view=desktop&labId=nmap-basics`

## 🎯 New UI Features Added

### 1. **Top Status Bar** (Red gradient bar)
- **Left Side**: Lab VM IP and User Machine IP buttons (appears when in labs)
  - 🖥️ **Lab VM**: `10.0.1.15` (red button)
  - 📡 **User Machine**: `192.168.1.100` (red button)
- **Center**: User level and XP progress
  - 🏆 Level 8 Elite - 1250/1500 XP
- **Right Side**: Current streak and achievements
  - 🔥 12 day streak
  - 🏅 4/6 achievements unlocked

### 2. **Achievements System**
Click the achievements button (🏅 4/6) to see:
- ✅ **Earned**: Welcome to Modulus, Lab Explorer, Week Warrior, Speed Demon
- ⏳ **Locked**: Network Ninja, CTF Master
- Each achievement shows XP points and unlock date

### 3. **Enhanced Header**
- Maintains all original functionality
- Theme toggle, notifications, user menu
- Role switching (Student/Instructor/Admin)

## 🎮 Desktop Environment Features

The virtual desktop includes:
- **Mock Kali Linux Interface**: Purple-blue gradient desktop
- **Terminal Window**: Running commands like `nmap`, `whoami`
- **File Manager**: Showing directories (Desktop, Documents, Downloads, lab-files)
- **Desktop Icons**: Security tools (Burp Suite, Wireshark, Metasploit)
- **Taskbar**: Applications and system indicators
- **File Transfer**: Upload/download capabilities
- **Session Timer**: Active session tracking
- **Full-screen Mode**: Immersive experience

## 🔄 Switching Between Desktop Views

Two desktop view files exist:
- `src/components/views/desktop-view.tsx`
- `src/components/views/desktop-view-new.tsx`

Currently, only one is active at a time (controlled in `src/app/page.tsx`). They're nearly identical but can be used for A/B testing different interfaces.

## 🧪 Testing the Features

1. **Start the dev server**: `npm run dev`
2. **Login**: Use any credentials (mock authentication)
3. **Navigate**: Follow the path above to reach desktop views
4. **Test Top Bar**: 
   - View achievements dropdown
   - See streak counter
   - Notice IP buttons appear in lab/desktop views
5. **Test Desktop**: 
   - Try fullscreen mode
   - Use file transfer features
   - Observe session timer

## 🎨 UI Styling

- **TryHackMe-inspired**: Red primary color (#dc2626)
- **Dark/Light themes**: Supports system preference
- **Responsive design**: Works on mobile and desktop
- **Modern UI**: Tailwind CSS with gradients and animations
- **Accessibility**: Proper focus states and semantic HTML

## 🔧 Technical Notes

- **State Management**: Zustand store for app state
- **Routing**: URL parameters (e.g., `?view=desktop&labId=nmap-basics`)
- **Mock Data**: Achievement and user progress data in `/src/demo/achievements.ts`
- **Theme Support**: Next.js themes with system detection
- **Icons**: Lucide React for consistent iconography
