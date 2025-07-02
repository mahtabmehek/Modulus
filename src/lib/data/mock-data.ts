import { AppData, User, LearningPath, Module, Lab, Badge, Announcement } from '@/types'

export const mockUsers: User[] = [
  {
    id: 'user-1',
    email: 'student@modulus.edu',
    name: 'Alex Johnson',
    role: 'student',
    level: 3,
    levelName: 'Cybersecurity Apprentice',
    badges: ['first-lab', 'week-streak', 'ctf-solver'],
    streakDays: 7,
    totalPoints: 1250,
    joinedAt: new Date('2024-01-15'),
    lastActive: new Date(),
    preferences: {
      theme: 'dark',
      language: 'en',
      notifications: {
        email: true,
        push: true,
        announcements: true,
        labUpdates: true,
      },
    },
  },
  {
    id: 'user-2',
    email: 'instructor@modulus.edu',
    name: 'Dr. Sarah Chen',
    role: 'instructor',
    level: 8,
    levelName: 'Security Expert',
    badges: ['instructor', 'content-creator', 'mentor'],
    streakDays: 15,
    totalPoints: 5000,
    joinedAt: new Date('2023-08-01'),
    lastActive: new Date(),
    preferences: {
      theme: 'light',
      language: 'en',
      notifications: {
        email: true,
        push: false,
        announcements: true,
        labUpdates: true,
      },
    },
  },
  {
    id: 'user-3',
    email: 'admin@modulus.edu',
    name: 'Michael Rodriguez',
    role: 'admin',
    level: 10,
    levelName: 'System Administrator',
    badges: ['admin', 'platform-builder', 'community-leader'],
    streakDays: 30,
    totalPoints: 10000,
    joinedAt: new Date('2023-01-01'),
    lastActive: new Date(),
    preferences: {
      theme: 'system',
      language: 'en',
      notifications: {
        email: true,
        push: true,
        announcements: true,
        labUpdates: true,
      },
    },
  },
]

export const mockPaths: LearningPath[] = [
  {
    id: 'path-1',
    title: 'BSc Computer Science - Cybersecurity',
    description: 'Comprehensive cybersecurity training with hands-on labs and real-world scenarios.',
    category: 'cybersecurity',
    difficulty: 'Intermediate',
    estimatedHours: 120,
    prerequisites: ['basic-networking', 'linux-fundamentals'],
    isPublished: true,
    createdBy: 'user-2',
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-06-01'),
    modules: [
      {
        id: 'module-1',
        pathId: 'path-1',
        title: 'Network Security Fundamentals',
        description: 'Learn the basics of network security, including firewalls, IDS/IPS, and VPNs.',
        order: 1,
        isLocked: false,
        prerequisites: [],
        estimatedHours: 40,
        labs: [
          {
            id: 'lab-1',
            moduleId: 'module-1',
            title: 'Firewall Configuration Lab',
            description: 'Configure and test firewall rules in a virtual environment.',
            content: `# Firewall Configuration Lab

## Objectives
In this lab, you will learn how to:
- Configure basic firewall rules
- Test firewall effectiveness
- Monitor network traffic
- Implement security policies

## Prerequisites
- Basic understanding of networking
- Familiarity with Linux command line

## Lab Environment
You will be working with a Ubuntu 22.04 virtual machine with iptables pre-installed.

## Tasks

### Task 1: Basic Firewall Setup
Configure basic INPUT, OUTPUT, and FORWARD policies.

### Task 2: Service-Specific Rules
Create rules for SSH, HTTP, and HTTPS services.

### Task 3: Traffic Monitoring
Use netstat and ss commands to monitor connections.

### Task 4: Advanced Rules
Implement rate limiting and connection tracking.`,
            type: 'Mandatory',
            difficulty: 'Medium',
            estimatedTime: 120,
            points: 100,
            icon: 'Shield',
            order: 1,
            isPublished: true,
            hasDesktop: true,
            desktopConfig: {
              id: 'desktop-1',
              name: 'Ubuntu Security Lab',
              image: 'ubuntu:22.04-security',
              cpu: 2,
              memory: 4096,
              storage: 20,
              os: 'ubuntu',
              hasGui: true,
              exposedPorts: [22, 80, 443],
              environment: {
                DISPLAY: ':1',
                VNC_PASSWORD: 'modulus123',
              },
              persistentVolumes: ['/home/student', '/var/log'],
            },
            tasks: [
              {
                id: 'task-1',
                title: 'Configure Default Policies',
                content: 'Set up default DROP policies for INPUT and FORWARD chains, and ACCEPT for OUTPUT.',
                order: 1,
                questions: [
                  {
                    id: 'q1',
                    text: 'What iptables command sets the default INPUT policy to DROP?',
                    type: 'text',
                    answer: 'iptables -P INPUT DROP',
                    hint: 'Use the -P flag to set policies',
                    points: 10,
                  },
                ],
                documents: [],
              },
              {
                id: 'task-2',
                title: 'Allow SSH Access',
                content: 'Configure the firewall to allow SSH connections on port 22.',
                order: 2,
                questions: [
                  {
                    id: 'q2',
                    text: 'What is the flag found in /root/flag.txt after successfully configuring SSH access?',
                    type: 'text',
                    answer: 'MODULUS{ssh_access_configured}',
                    points: 20,
                  },
                ],
                documents: [],
              },
            ],
            resources: [
              {
                id: 'resource-1',
                name: 'iptables Cheat Sheet',
                type: 'pdf',
                url: '/resources/iptables-cheat-sheet.pdf',
                description: 'Quick reference for iptables commands',
              },
              {
                id: 'resource-2',
                name: 'Network Security Best Practices',
                type: 'link',
                url: 'https://example.com/network-security',
                description: 'Industry best practices for network security',
              },
            ],
            questions: [
              {
                id: 'final-q1',
                text: 'Upload your final iptables configuration file',
                type: 'file-upload',
                answer: '',
                points: 50,
              },
            ],
            createdBy: 'user-2',
            createdAt: new Date('2024-01-15'),
            updatedAt: new Date('2024-06-01'),
          },
          {
            id: 'lab-2',
            moduleId: 'module-1',
            title: 'Intrusion Detection Systems',
            description: 'Deploy and configure Snort IDS to detect network intrusions.',
            content: `# Intrusion Detection Systems Lab

## Objectives
- Install and configure Snort IDS
- Create custom detection rules
- Analyze network traffic for threats
- Generate security alerts

## Environment
Kali Linux with Snort 3.1.x pre-installed.`,
            type: 'Challenge',
            difficulty: 'Hard',
            estimatedTime: 180,
            points: 150,
            icon: 'Eye',
            order: 2,
            isPublished: true,
            hasDesktop: true,
            desktopConfig: {
              id: 'desktop-2',
              name: 'Kali Security Lab',
              image: 'kali:latest',
              cpu: 4,
              memory: 8192,
              storage: 30,
              os: 'kali',
              hasGui: true,
              exposedPorts: [22, 80, 443, 8080],
              environment: {
                DISPLAY: ':1',
                VNC_PASSWORD: 'modulus123',
              },
              persistentVolumes: ['/home/kali', '/var/log', '/etc/snort'],
            },
            tasks: [
              {
                id: 'task-3',
                title: 'Install and Configure Snort',
                content: 'Set up Snort IDS with basic configuration.',
                order: 1,
                questions: [
                  {
                    id: 'q3',
                    text: 'What is the default configuration file location for Snort?',
                    type: 'text',
                    answer: '/etc/snort/snort.conf',
                    points: 10,
                  },
                ],
                documents: [],
              },
            ],
            resources: [],
            questions: [],
            createdBy: 'user-2',
            createdAt: new Date('2024-01-20'),
            updatedAt: new Date('2024-06-01'),
          },
        ],
      },
      {
        id: 'module-2',
        pathId: 'path-1',
        title: 'Web Application Security',
        description: 'Explore common web vulnerabilities and learn how to secure web applications.',
        order: 2,
        isLocked: true,
        prerequisites: ['module-1'],
        estimatedHours: 35,
        labs: [
          {
            id: 'lab-3',
            moduleId: 'module-2',
            title: 'SQL Injection Lab',
            description: 'Learn to identify and exploit SQL injection vulnerabilities.',
            content: `# SQL Injection Lab

## Objectives
- Understand SQL injection vulnerabilities
- Practice exploitation techniques
- Learn prevention methods

This lab uses a deliberately vulnerable web application.`,
            type: 'Mandatory',
            difficulty: 'Medium',
            estimatedTime: 90,
            points: 120,
            icon: 'Database',
            order: 1,
            isPublished: true,
            hasDesktop: true,
            tasks: [],
            resources: [],
            questions: [],
            createdBy: 'user-2',
            createdAt: new Date('2024-02-01'),
            updatedAt: new Date('2024-06-01'),
          },
        ],
      },
    ],
  },
  {
    id: 'path-2',
    title: 'MSc Cybersecurity - Advanced Threats',
    description: 'Advanced cybersecurity course focusing on emerging threats and defense strategies.',
    category: 'cybersecurity',
    difficulty: 'Advanced',
    estimatedHours: 200,
    prerequisites: ['path-1'],
    isPublished: true,
    createdBy: 'user-2',
    createdAt: new Date('2024-03-01'),
    updatedAt: new Date('2024-06-01'),
    modules: [
      {
        id: 'module-3',
        pathId: 'path-2',
        title: 'Advanced Persistent Threats',
        description: 'Study APT tactics, techniques, and procedures.',
        order: 1,
        isLocked: false,
        prerequisites: [],
        estimatedHours: 50,
        labs: [
          {
            id: 'lab-4',
            moduleId: 'module-3',
            title: 'APT Simulation Lab',
            description: 'Simulate an APT attack scenario in a controlled environment.',
            content: 'Advanced Persistent Threat simulation lab content...',
            type: 'Challenge',
            difficulty: 'Hard',
            estimatedTime: 240,
            points: 200,
            icon: 'Target',
            order: 1,
            isPublished: true,
            hasDesktop: true,
            tasks: [],
            resources: [],
            questions: [],
            createdBy: 'user-2',
            createdAt: new Date('2024-03-15'),
            updatedAt: new Date('2024-06-01'),
          },
        ],
      },
    ],
  },
]

export const mockBadges: Badge[] = [
  {
    id: 'first-lab',
    name: 'First Steps',
    description: 'Complete your first lab',
    icon: 'Award',
    category: 'achievement',
    criteria: {
      type: 'labs_completed',
      value: 1,
    },
    points: 50,
    rarity: 'common',
  },
  {
    id: 'week-streak',
    name: 'Week Warrior',
    description: 'Maintain a 7-day learning streak',
    icon: 'Flame',
    category: 'engagement',
    criteria: {
      type: 'streak_days',
      value: 7,
    },
    points: 100,
    rarity: 'rare',
  },
  {
    id: 'ctf-solver',
    name: 'CTF Solver',
    description: 'Complete 5 challenge labs',
    icon: 'Flag',
    category: 'skill',
    criteria: {
      type: 'labs_completed',
      value: 5,
      difficulty: 'Challenge',
    },
    points: 200,
    rarity: 'epic',
  },
  {
    id: 'instructor',
    name: 'Knowledge Sharer',
    description: 'Instructor role badge',
    icon: 'GraduationCap',
    category: 'role',
    criteria: {
      type: 'labs_completed',
      value: 0,
    },
    points: 0,
    rarity: 'legendary',
  },
  {
    id: 'admin',
    name: 'System Master',
    description: 'Administrator role badge',
    icon: 'Settings',
    category: 'role',
    criteria: {
      type: 'labs_completed',
      value: 0,
    },
    points: 0,
    rarity: 'legendary',
  },
]

export const mockAnnouncements: Announcement[] = [
  {
    id: 'ann-1',
    title: 'Welcome to Modulus!',
    content: 'We\'re excited to have you join our interactive learning platform. Start with the Network Security Fundamentals module to begin your cybersecurity journey.',
    type: 'info',
    priority: 'high',
    targetAudience: ['student', 'instructor'],
    isPublished: true,
    publishedAt: new Date('2024-06-01'),
    createdBy: 'user-3',
    createdAt: new Date('2024-06-01'),
  },
  {
    id: 'ann-2',
    title: 'New Lab Available: APT Simulation',
    content: 'A new advanced lab focusing on Advanced Persistent Threats is now available in the MSc Cybersecurity path.',
    type: 'success',
    priority: 'medium',
    targetAudience: ['student'],
    isPublished: true,
    publishedAt: new Date('2024-06-15'),
    createdBy: 'user-2',
    createdAt: new Date('2024-06-15'),
  },
  {
    id: 'ann-3',
    title: 'Scheduled Maintenance',
    content: 'The platform will undergo maintenance on Sunday, June 30th from 2:00 AM to 6:00 AM UTC. Some lab environments may be temporarily unavailable.',
    type: 'warning',
    priority: 'high',
    targetAudience: ['student', 'instructor', 'admin'],
    isPublished: true,
    publishedAt: new Date('2024-06-25'),
    expiresAt: new Date('2024-06-30'),
    createdBy: 'user-3',
    createdAt: new Date('2024-06-25'),
  },
]

// Extract modules from all paths
export const mockModules: Module[] = mockPaths.flatMap(path => path.modules)

// Extract labs from all modules
export const mockLabs: Lab[] = mockModules.flatMap(module => module.labs)

export const mockData: AppData = {
  users: mockUsers,
  learningPaths: mockPaths,
  modules: mockModules,
  labs: mockLabs,
  badges: mockBadges,
  announcements: mockAnnouncements,
}

// Export individual arrays for easy access
export { mockUsers as users }
