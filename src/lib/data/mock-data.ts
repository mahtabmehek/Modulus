import { AppData, User, Course, LearningPath, Module, Lab, Badge, Announcement } from '@/types'

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
    isApproved: true,
    approvalStatus: 'approved',
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
    isApproved: true,
    approvalStatus: 'approved',
    approvedBy: 'user-3',
    approvedAt: new Date('2023-08-02'),
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
    isApproved: true,
    approvalStatus: 'approved',
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
  // Pending instructor accounts for approval demonstration
  {
    id: 'user-4',
    email: 'pending.instructor1@university.edu',
    name: 'Dr. John Smith',
    role: 'instructor',
    level: 1,
    levelName: 'Pending Approval',
    badges: [],
    streakDays: 0,
    totalPoints: 0,
    joinedAt: new Date('2024-12-01'),
    lastActive: new Date('2024-12-01'),
    isApproved: false,
    approvalStatus: 'pending',
    preferences: {
      theme: 'light',
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
    id: 'user-5',
    email: 'pending.instructor2@college.edu',
    name: 'Prof. Maria Garcia',
    role: 'instructor',
    level: 1,
    levelName: 'Pending Approval',
    badges: [],
    streakDays: 0,
    totalPoints: 0,
    joinedAt: new Date('2024-12-02'),
    lastActive: new Date('2024-12-02'),
    isApproved: false,
    approvalStatus: 'pending',
    preferences: {
      theme: 'dark',
      language: 'en',
      notifications: {
        email: true,
        push: false,
        announcements: true,
        labUpdates: true,
      },
    },
  },
  // Staff user for managing courses and user data
  {
    id: 'user-6',
    email: 'staff@modulus.edu',
    name: 'Jennifer Williams',
    role: 'staff',
    level: 5,
    levelName: 'Academic Staff',
    badges: ['staff-member', 'course-creator', 'user-manager'],
    streakDays: 12,
    totalPoints: 2500,
    joinedAt: new Date('2023-09-01'),
    lastActive: new Date(),
    isApproved: true,
    approvalStatus: 'approved',
    preferences: {
      theme: 'light',
      language: 'en',
      notifications: {
        email: true,
        push: true,
        announcements: true,
        labUpdates: false,
      },
    },
  },
]

export const mockCourses: Course[] = [
  {
    id: 'course-1',
    title: 'Bachelor of Science in Computer Science',
    description: 'A comprehensive undergraduate program covering fundamental and advanced topics in computer science, including cybersecurity, software development, and systems administration.',
    code: 'BSC-CS',
    level: 'Bachelor',
    duration: 3,
    totalCredits: 360,
    department: 'School of Computing',
    isActive: true,
    createdBy: 'user-6',
    createdAt: new Date('2023-01-15'),
    updatedAt: new Date('2024-08-01'),
  },
  {
    id: 'course-2',
    title: 'Master of Science in Cybersecurity',
    description: 'An advanced graduate program focusing on cybersecurity, threat analysis, digital forensics, and advanced network security.',
    code: 'MSC-CS',
    level: 'Master',
    duration: 1,
    totalCredits: 180,
    department: 'School of Computing',
    isActive: true,
    createdBy: 'user-6',
    createdAt: new Date('2023-02-01'),
    updatedAt: new Date('2024-08-01'),
  },
  {
    id: 'course-3',
    title: 'Bachelor of Science in Information Technology',
    description: 'A practical undergraduate program focusing on information systems, network administration, and business technology solutions.',
    code: 'BSC-IT',
    level: 'Bachelor',
    duration: 3,
    totalCredits: 360,
    department: 'School of Information Technology',
    isActive: true,
    createdBy: 'user-6',
    createdAt: new Date('2023-03-01'),
    updatedAt: new Date('2024-08-01'),
  },
]

export const mockPaths: LearningPath[] = [
  {
    id: 'path-1',
    courseId: 'course-1',
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
You will be working with a Ubuntu 22.04 virtual machine with iptables pre-installed.`,
            type: 'Mandatory',
            difficulty: 'Medium',
            estimatedTime: 120,
            points: 100,
            icon: 'Shield',
            order: 1,
            isPublished: true,
            hasDesktop: true,
            tasks: [
              {
                id: 'task-1',
                title: 'Basic Setup',
                content: 'Set up the basic firewall configuration and understand the environment.',
                order: 1,
                hasFlags: true,
                totalFlags: 3,
                questions: [
                  {
                    id: 'q1-1',
                    text: 'What protocol does ping use?',
                    type: 'flag',
                    answer: 'ICMP',
                    flags: ['ICMP'],
                    flagCount: 1,
                    points: 10,
                    isRequired: true
                  },
                  {
                    id: 'q1-2',
                    text: 'What is the syntax to ping 10.10.10.10?',
                    type: 'flag',
                    answer: ['ping 10.10.10.10', 'ping -c 4 10.10.10.10'],
                    flags: ['ping 10.10.10.10', 'ping -c 4 10.10.10.10'],
                    flagCount: 2,
                    acceptsPartialFlags: true,
                    points: 20,
                    isRequired: true
                  },
                  {
                    id: 'q1-3',
                    text: 'What flag do you get when you ping 8.8.8.8?',
                    type: 'flag',
                    answer: 'THM{ping_successful}',
                    flags: ['THM{ping_successful}'],
                    flagCount: 1,
                    points: 20,
                    isRequired: true
                  }
                ],
                documents: []
              },
              {
                id: 'task-2',
                title: 'Advanced Configuration',
                content: 'Configure advanced firewall rules and test their effectiveness.',
                order: 2,
                hasFlags: false,
                questions: [
                  {
                    id: 'q2-1',
                    text: 'Upload your iptables configuration file',
                    type: 'file-upload',
                    answer: '',
                    points: 30,
                    isRequired: true
                  }
                ],
                documents: []
              },
              {
                id: 'task-3',
                title: 'Multi-Flag Challenge',
                content: 'Find all hidden flags in the system to complete this challenge.',
                order: 3,
                hasFlags: true,
                totalFlags: 4,
                questions: [
                  {
                    id: 'q3-1',
                    text: 'Find all 4 flags hidden in the system (/root/, /var/, /tmp/, /home/)',
                    type: 'flag',
                    answer: ['FLAG{root_access}', 'FLAG{var_secrets}', 'FLAG{tmp_hidden}', 'FLAG{home_treasure}'],
                    flags: ['FLAG{root_access}', 'FLAG{var_secrets}', 'FLAG{tmp_hidden}', 'FLAG{home_treasure}'],
                    flagCount: 4,
                    acceptsPartialFlags: true,
                    points: 100,
                    isRequired: true,
                    hint: 'Check common directories and look for hidden files'
                  }
                ],
                documents: []
              },
              {
                id: 'task-4',
                title: 'Conclusion',
                content: 'Complete the final review questions.',
                order: 4,
                hasFlags: false,
                questions: [
                  {
                    id: 'q4-1',
                    text: 'Are you ready for the next filesystem?',
                    type: 'text',
                    answer: 'No answer needed',
                    points: 0,
                    isRequired: false
                  }
                ],
                documents: []
              }
            ],
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
            deadline: new Date('2025-07-25T17:00:00'), // July 25, 2025 at 5:00 PM
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
            questions: [            ],
            createdBy: 'user-2',
            createdAt: new Date('2024-01-20'),
            updatedAt: new Date('2024-06-01'),
            deadline: new Date('2025-07-18T16:00:00'), // July 18, 2025 at 4:00 PM
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
            questions: [            ],
            createdBy: 'user-2',
            createdAt: new Date('2024-02-01'),
            updatedAt: new Date('2024-06-01'),
            deadline: new Date('2025-07-21T23:00:00'), // July 21, 2025 at 11:00 PM
          },
        ],
      },
    ],
  },
  {
    id: 'path-2',
    courseId: 'course-2',
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
  courses: mockCourses,
  learningPaths: mockPaths,
  modules: mockModules,
  labs: mockLabs,
  badges: mockBadges,
  announcements: mockAnnouncements,
}

// Export individual arrays for easy access
export { mockUsers as users }
