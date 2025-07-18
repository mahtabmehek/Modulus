-- Modulus LMS Database Population Script
-- This script populates the database with comprehensive lab content and course data
-- Generated on July 18, 2025

-- =============================================================================
-- COURSES DATA
-- =============================================================================

INSERT INTO courses (title, code, description, department, academic_level, duration, total_credits, instructor_id, is_published, difficulty_level, estimated_hours, tags, auto_enroll) VALUES

-- Cybersecurity Courses
('Ethical Hacking and Penetration Testing', 'CS-401', 'Comprehensive course covering ethical hacking methodologies, penetration testing frameworks, and vulnerability assessment techniques. Students will learn industry-standard tools and methodologies for securing networks and systems.', 'Computer Science', 'bachelor', 1, 4, 501, true, 'intermediate', 120, ARRAY['cybersecurity', 'hacking', 'penetration-testing', 'security'], true),

('Digital Forensics Investigation', 'CS-402', 'Advanced course in digital forensics covering incident response, evidence collection, malware analysis, and court testimony procedures. Includes hands-on analysis of real-world forensic cases.', 'Computer Science', 'bachelor', 1, 4, 502, true, 'advanced', 100, ARRAY['forensics', 'investigation', 'malware', 'incident-response'], true),

('Network Security and Defense', 'CS-301', 'Foundation course in network security covering firewalls, intrusion detection systems, VPNs, and network monitoring. Students will design and implement secure network architectures.', 'Computer Science', 'bachelor', 1, 3, 501, true, 'intermediate', 90, ARRAY['networking', 'security', 'firewalls', 'monitoring'], true),

-- Cloud Computing Courses  
('AWS Cloud Architecture', 'CC-501', 'Enterprise-level course covering AWS cloud services, infrastructure as code, serverless computing, and cloud security best practices. Prepares students for AWS Solutions Architect certification.', 'Cloud Computing', 'master', 1, 5, 502, true, 'advanced', 150, ARRAY['aws', 'cloud', 'architecture', 'serverless'], true),

('DevOps and CI/CD Pipeline Management', 'CC-401', 'Practical course in DevOps methodologies covering containerization, orchestration, continuous integration, and deployment automation using industry-standard tools.', 'Cloud Computing', 'bachelor', 1, 4, 501, true, 'intermediate', 110, ARRAY['devops', 'docker', 'kubernetes', 'cicd'], true),

-- Programming and Development
('Advanced Python for Data Science', 'CS-501', 'Advanced Python programming course focusing on data analysis, machine learning libraries, and scientific computing. Includes real-world data science projects.', 'Computer Science', 'master', 1, 4, 502, true, 'advanced', 130, ARRAY['python', 'data-science', 'machine-learning', 'analytics'], true),

('Web Application Security', 'CS-403', 'Specialized course covering web application vulnerabilities, secure coding practices, and application security testing. Students will analyze and secure modern web applications.', 'Computer Science', 'bachelor', 1, 3, 501, true, 'intermediate', 80, ARRAY['web-security', 'owasp', 'secure-coding', 'testing'], true),

-- Linux and System Administration
('Linux System Administration', 'SYS-301', 'Comprehensive Linux administration course covering system configuration, user management, security hardening, and automated deployment using shell scripting and Ansible.', 'Systems', 'bachelor', 1, 3, 502, true, 'intermediate', 95, ARRAY['linux', 'administration', 'automation', 'ansible'], true);

-- =============================================================================
-- MODULES DATA
-- =============================================================================

-- Ethical Hacking and Penetration Testing Modules
INSERT INTO modules (course_id, title, description, order_index, is_published, content_type, estimated_minutes) VALUES

-- Course 1: Ethical Hacking and Penetration Testing
(1, 'Introduction to Ethical Hacking', 'Foundation concepts, legal frameworks, and ethical considerations in penetration testing.', 1, true, 'mixed', 180),
(1, 'Reconnaissance and Information Gathering', 'Active and passive information gathering techniques, OSINT tools, and target enumeration.', 2, true, 'lab', 240),
(1, 'Vulnerability Assessment and Scanning', 'Automated vulnerability scanning, manual testing techniques, and vulnerability management.', 3, true, 'lab', 300),
(1, 'Network Penetration Testing', 'Network service exploitation, privilege escalation, and lateral movement techniques.', 4, true, 'lab', 360),
(1, 'Web Application Penetration Testing', 'OWASP Top 10 vulnerabilities, web application testing methodologies, and exploitation techniques.', 5, true, 'lab', 420),
(1, 'Post-Exploitation and Reporting', 'Maintaining access, evidence collection, and professional penetration testing report writing.', 6, true, 'mixed', 240),

-- Course 2: Digital Forensics Investigation  
(2, 'Digital Forensics Fundamentals', 'Introduction to digital evidence, chain of custody, and forensic investigation procedures.', 1, true, 'mixed', 150),
(2, 'Disk and File System Forensics', 'File system analysis, deleted file recovery, and disk imaging techniques.', 2, true, 'lab', 270),
(2, 'Memory Forensics and Live Analysis', 'RAM analysis, process investigation, and volatile data extraction techniques.', 3, true, 'lab', 240),
(2, 'Network Forensics', 'Network traffic analysis, protocol investigation, and network-based evidence collection.', 4, true, 'lab', 210),
(2, 'Malware Analysis and Reverse Engineering', 'Static and dynamic malware analysis, reverse engineering techniques, and threat intelligence.', 5, true, 'lab', 360),
(2, 'Mobile Device Forensics', 'iOS and Android forensics, mobile app analysis, and cloud data extraction.', 6, true, 'lab', 300),

-- Course 3: Network Security and Defense
(3, 'Network Security Fundamentals', 'Network protocols, security models, and threat landscape overview.', 1, true, 'mixed', 120),
(3, 'Firewall Configuration and Management', 'Enterprise firewall deployment, rule configuration, and traffic analysis.', 2, true, 'lab', 180),
(3, 'Intrusion Detection and Prevention', 'IDS/IPS deployment, signature creation, and anomaly detection techniques.', 3, true, 'lab', 240),
(3, 'VPN and Secure Communications', 'VPN technologies, encryption protocols, and secure communication channel establishment.', 4, true, 'lab', 200),
(3, 'Network Monitoring and Incident Response', 'Real-time network monitoring, log analysis, and incident response procedures.', 5, true, 'lab', 280),

-- Course 4: AWS Cloud Architecture
(4, 'AWS Core Services and Architecture', 'EC2, S3, VPC, and fundamental AWS architectural patterns.', 1, true, 'mixed', 200),
(4, 'Infrastructure as Code with CloudFormation', 'Automated infrastructure deployment using CloudFormation and CDK.', 2, true, 'lab', 300),
(4, 'Serverless Computing Architecture', 'Event-driven architecture patterns, microservices, and serverless design principles.', 3, true, 'lab', 270),
(4, 'Cloud Security and Compliance', 'IAM, encryption, compliance frameworks, and security best practices.', 4, true, 'lab', 240),
(4, 'High Availability and Disaster Recovery', 'Multi-region deployment, backup strategies, and disaster recovery planning.', 5, true, 'lab', 320),

-- Course 5: DevOps and CI/CD Pipeline Management
(5, 'DevOps Culture and Methodologies', 'DevOps principles, Agile development, and organizational transformation.', 1, true, 'mixed', 150),
(5, 'Containerization with Docker', 'Docker fundamentals, container orchestration, and microservices architecture.', 2, true, 'lab', 240),
(5, 'Kubernetes Orchestration', 'Kubernetes deployment, service mesh, and production-grade cluster management.', 3, true, 'lab', 360),
(5, 'CI/CD Pipeline Automation', 'Jenkins, GitLab CI, automated testing, and deployment strategies.', 4, true, 'lab', 300),
(5, 'Infrastructure Monitoring and Observability', 'Prometheus, Grafana, logging strategies, and performance monitoring.', 5, true, 'lab', 280),

-- Course 6: Advanced Python for Data Science
(6, 'Python Data Structures and Libraries', 'NumPy, Pandas, advanced data manipulation and analysis techniques.', 1, true, 'lab', 200),
(6, 'Data Visualization and Exploration', 'Matplotlib, Seaborn, interactive visualization, and exploratory data analysis.', 2, true, 'lab', 180),
(6, 'Machine Learning with Scikit-Learn', 'Classification, regression, clustering, and model evaluation techniques.', 3, true, 'lab', 300),
(6, 'Deep Learning with TensorFlow', 'Neural networks, deep learning architectures, and model deployment.', 4, true, 'lab', 360),
(6, 'Big Data Processing with PySpark', 'Distributed computing, big data analytics, and scalable data processing.', 5, true, 'lab', 320),

-- Course 7: Web Application Security
(7, 'Web Application Architecture Security', 'Secure design patterns, authentication mechanisms, and authorization frameworks.', 1, true, 'mixed', 120),
(7, 'OWASP Top 10 Vulnerabilities', 'Injection attacks, broken authentication, sensitive data exposure, and security misconfigurations.', 2, true, 'lab', 240),
(7, 'Secure Coding Practices', 'Input validation, output encoding, error handling, and security code review.', 3, true, 'lab', 200),
(7, 'Application Security Testing', 'SAST, DAST, penetration testing, and vulnerability assessment tools.', 4, true, 'lab', 280),

-- Course 8: Linux System Administration
(8, 'Linux Fundamentals and Command Line', 'Linux distributions, command line proficiency, and system navigation.', 1, true, 'mixed', 150),
(8, 'User and Permission Management', 'User accounts, group management, file permissions, and access control.', 2, true, 'lab', 180),
(8, 'System Configuration and Services', 'System services, configuration management, and process monitoring.', 3, true, 'lab', 220),
(8, 'Network Configuration and Security', 'Network interfaces, firewall configuration, and SSH hardening.', 4, true, 'lab', 200),
(8, 'Automation with Shell Scripting', 'Bash scripting, automated tasks, and system administration automation.', 5, true, 'lab', 240),
(8, 'Configuration Management with Ansible', 'Ansible playbooks, automated deployment, and infrastructure management.', 6, true, 'lab', 280);

-- =============================================================================
-- LABS DATA
-- =============================================================================

-- Labs for Course 1: Ethical Hacking and Penetration Testing
INSERT INTO labs (module_id, title, description, instructions, order_index, is_published, lab_type, estimated_minutes, vm_image, required_tools, points_possible) VALUES

-- Module 1: Introduction to Ethical Hacking
(1, 'Setting Up Penetration Testing Environment', 'Configure a complete penetration testing lab environment using Kali Linux and target systems.', 
'1. Download and install Kali Linux in VirtualBox
2. Configure network settings for isolated lab environment
3. Install additional penetration testing tools
4. Set up target vulnerable systems (Metasploitable, DVWA)
5. Verify connectivity and tool functionality
6. Document your lab setup and configuration', 1, true, 'vm', 90, 'kali-linux-2024.1', ARRAY['virtualbox', 'kali-linux', 'metasploitable'], 100),

-- Module 2: Reconnaissance and Information Gathering  
(2, 'OSINT and Passive Reconnaissance', 'Perform comprehensive open-source intelligence gathering on a target organization.',
'1. Use theHarvester to gather email addresses and subdomains
2. Perform DNS enumeration using dnsrecon and fierce
3. Gather social media intelligence using Maltego
4. Search for leaked credentials in breach databases
5. Document findings in a professional reconnaissance report
6. Analyze the attack surface identified', 1, true, 'vm', 120, 'kali-linux-2024.1', ARRAY['theharvester', 'dnsrecon', 'maltego', 'recon-ng'], 150),

(2, 'Active Network Reconnaissance', 'Conduct active network scanning and service enumeration on target networks.',
'1. Perform network discovery using Nmap ping sweeps
2. Conduct comprehensive port scanning with service detection
3. Use Nmap scripts for service enumeration and vulnerability detection
4. Enumerate SMB shares and services
5. Perform SNMP enumeration where applicable
6. Create a detailed network map with identified services', 2, true, 'vm', 100, 'kali-linux-2024.1', ARRAY['nmap', 'enum4linux', 'snmpwalk'], 150),

-- Module 3: Vulnerability Assessment and Scanning
(3, 'Automated Vulnerability Scanning', 'Perform comprehensive vulnerability assessment using industry-standard tools.',
'1. Configure and run OpenVAS vulnerability scanner
2. Perform web application scanning using Nikto and dirb
3. Use Nessus for comprehensive network vulnerability assessment
4. Analyze scan results and prioritize vulnerabilities
5. Validate critical findings through manual testing
6. Generate executive summary and technical vulnerability report', 1, true, 'vm', 150, 'kali-linux-2024.1', ARRAY['openvas', 'nikto', 'dirb', 'nessus'], 200),

(3, 'Manual Vulnerability Assessment', 'Conduct manual vulnerability testing and validation of automated scan results.',
'1. Manually test for SQL injection vulnerabilities
2. Test for cross-site scripting (XSS) vulnerabilities
3. Perform manual directory traversal testing
4. Test authentication bypass techniques
5. Validate buffer overflow vulnerabilities
6. Document manual testing methodology and results', 2, true, 'vm', 130, 'kali-linux-2024.1', ARRAY['burpsuite', 'sqlmap', 'custom-scripts'], 180),

-- Module 4: Network Penetration Testing
(4, 'Network Service Exploitation', 'Exploit common network services to gain unauthorized access.',
'1. Exploit vulnerable SSH service using weak credentials
2. Perform SMB exploitation using EternalBlue (MS17-010)
3. Exploit FTP service vulnerabilities
4. Perform RDP brute force attacks
5. Exploit web services for initial access
6. Document exploitation techniques and payloads used', 1, true, 'vm', 120, 'kali-linux-2024.1', ARRAY['metasploit', 'hydra', 'john', 'exploitdb'], 200),

(4, 'Privilege Escalation Techniques', 'Escalate privileges on compromised Windows and Linux systems.',
'1. Perform Linux privilege escalation using kernel exploits
2. Exploit SUID binaries for privilege escalation
3. Use Windows privilege escalation via unquoted service paths
4. Exploit misconfigured services and permissions
5. Perform credential harvesting and password attacks
6. Maintain persistent access through backdoors', 2, true, 'vm', 140, 'kali-linux-2024.1', ARRAY['linpeas', 'winpeas', 'mimikatz', 'meterpreter'], 220),

-- Module 5: Web Application Penetration Testing
(5, 'OWASP Top 10 Exploitation Lab', 'Exploit the OWASP Top 10 vulnerabilities in a controlled environment.',
'1. Perform SQL injection attacks against database-driven applications
2. Exploit cross-site scripting (XSS) vulnerabilities
3. Test for insecure direct object references
4. Exploit XML external entity (XXE) vulnerabilities
5. Test authentication and session management flaws
6. Exploit security misconfigurations and vulnerable components', 1, true, 'vm', 180, 'kali-linux-2024.1', ARRAY['burpsuite', 'sqlmap', 'xsser', 'dvwa'], 250),

(5, 'Advanced Web Application Testing', 'Perform advanced web application security testing techniques.',
'1. Test for advanced SQL injection techniques (blind, time-based)
2. Perform Server-Side Request Forgery (SSRF) attacks
3. Test for insecure deserialization vulnerabilities
4. Exploit business logic flaws
5. Perform API security testing
6. Test for client-side security issues', 2, true, 'vm', 160, 'kali-linux-2024.1', ARRAY['burpsuite-pro', 'postman', 'jwt-tool'], 230),

-- Module 6: Post-Exploitation and Reporting
(6, 'Post-Exploitation and Persistence', 'Maintain access and perform post-exploitation activities.',
'1. Establish persistent backdoors on compromised systems
2. Perform lateral movement within the network
3. Escalate domain privileges in Active Directory
4. Harvest credentials and sensitive data
5. Cover tracks and maintain stealth
6. Document post-exploitation activities', 1, true, 'vm', 140, 'kali-linux-2024.1', ARRAY['metasploit', 'empire', 'cobalt-strike'], 200),

(6, 'Professional Penetration Testing Report', 'Create a comprehensive penetration testing report.',
'1. Structure report with executive summary and technical details
2. Prioritize vulnerabilities by risk and business impact
3. Provide detailed proof-of-concept for each finding
4. Include actionable remediation recommendations
5. Create risk assessment matrix and timeline
6. Present findings to technical and executive stakeholders', 2, true, 'web', 120, NULL, ARRAY['report-template', 'documentation-tools'], 150),

-- Labs for Course 2: Digital Forensics Investigation
-- Module 7: Digital Forensics Fundamentals
(7, 'Digital Evidence Handling and Chain of Custody', 'Learn proper procedures for digital evidence handling.',
'1. Create forensic images using dd and FTK Imager
2. Calculate and verify hash values for evidence integrity
3. Document chain of custody procedures
4. Practice evidence packaging and labeling
5. Understand legal requirements for digital evidence
6. Complete evidence handling documentation', 1, true, 'vm', 90, 'forensics-workstation', ARRAY['ftk-imager', 'dc3dd', 'hashcalc'], 100),

-- Module 8: Disk and File System Forensics
(8, 'File System Analysis and Recovery', 'Analyze file systems and recover deleted data.',
'1. Analyze NTFS and EXT4 file system structures
2. Recover deleted files using file carving techniques
3. Examine file system metadata and timestamps
4. Analyze Master File Table (MFT) records
5. Investigate file system journaling
6. Document findings in forensic timeline', 1, true, 'vm', 150, 'forensics-workstation', ARRAY['autopsy', 'sleuthkit', 'foremost'], 180),

(8, 'Advanced Disk Forensics', 'Perform advanced disk analysis and investigation techniques.',
'1. Analyze encrypted disk volumes and containers
2. Investigate RAID configurations and recovery
3. Perform slack space and unallocated space analysis
4. Analyze virtual machine disk files
5. Investigate cloud storage synchronization artifacts
6. Create detailed disk analysis report', 2, true, 'vm', 140, 'forensics-workstation', ARRAY['veracrypt', 'volatility', 'bulk-extractor'], 200),

-- Module 9: Memory Forensics and Live Analysis
(9, 'Memory Dump Analysis', 'Analyze system memory dumps for forensic evidence.',
'1. Acquire memory dumps from live systems
2. Analyze running processes and loaded modules
3. Extract network connections and open files
4. Recover encryption keys and passwords from memory
5. Investigate malware presence in memory
6. Create memory analysis timeline', 1, true, 'vm', 120, 'forensics-workstation', ARRAY['volatility', 'rekall', 'winpmem'], 170),

-- Labs for Course 3: Network Security and Defense
-- Module 12: Network Security Fundamentals
(12, 'Network Traffic Analysis', 'Analyze network traffic for security threats and anomalies.',
'1. Capture network traffic using Wireshark and tcpdump
2. Analyze common network protocols (TCP, UDP, HTTP, DNS)
3. Identify suspicious network traffic patterns
4. Detect network reconnaissance activities
5. Analyze encrypted traffic and metadata
6. Create network security baseline documentation', 1, true, 'vm', 100, 'security-analyst-vm', ARRAY['wireshark', 'tcpdump', 'suricata'], 150),

-- Module 13: Firewall Configuration and Management
(13, 'Enterprise Firewall Deployment', 'Configure and manage enterprise-grade firewall systems.',
'1. Install and configure pfSense firewall
2. Create firewall rules for network segmentation
3. Configure NAT and port forwarding rules
4. Implement traffic shaping and QoS policies
5. Set up VPN connectivity through firewall
6. Monitor and analyze firewall logs', 1, true, 'vm', 130, 'pfsense-vm', ARRAY['pfsense', 'firewall-analyzer'], 180),

-- Labs for Course 4: AWS Cloud Architecture
-- Module 17: AWS Core Services and Architecture
(17, 'AWS Infrastructure Setup', 'Deploy foundational AWS infrastructure using best practices.',
'1. Create VPC with public and private subnets
2. Configure security groups and NACLs
3. Deploy EC2 instances in multi-AZ setup
4. Configure S3 buckets with proper IAM policies
5. Set up CloudWatch monitoring and alerting
6. Implement cost optimization strategies', 1, true, 'web', 120, NULL, ARRAY['aws-cli', 'terraform'], 200),

-- Module 18: Infrastructure as Code with CloudFormation
(18, 'CloudFormation Template Development', 'Create and deploy infrastructure using CloudFormation.',
'1. Design CloudFormation templates for multi-tier architecture
2. Implement template parameters and conditions
3. Create custom resources and nested stacks
4. Deploy infrastructure using CloudFormation CLI
5. Implement rollback and update strategies
6. Monitor stack events and troubleshoot deployments', 1, true, 'web', 140, NULL, ARRAY['aws-cli', 'cloudformation'], 220),

-- Labs for Course 5: DevOps and CI/CD Pipeline Management
-- Module 22: DevOps Culture and Methodologies
(22, 'DevOps Transformation Planning', 'Plan and implement DevOps cultural transformation.',
'1. Assess current development and operations practices
2. Identify bottlenecks and improvement opportunities
3. Design DevOps workflow and collaboration processes
4. Implement metrics and KPIs for DevOps success
5. Create training and adoption roadmap
6. Present transformation plan to stakeholders', 1, true, 'web', 90, NULL, ARRAY['collaboration-tools', 'metrics-dashboard'], 120),

-- Module 23: Containerization with Docker
(23, 'Docker Containerization Lab', 'Containerize applications using Docker best practices.',
'1. Create Dockerfiles for multi-language applications
2. Implement multi-stage builds for optimization
3. Configure container networking and volumes
4. Use Docker Compose for multi-container applications
5. Implement container security scanning
6. Deploy containers to production environment', 1, true, 'container', 150, 'docker-host', ARRAY['docker', 'docker-compose', 'docker-security'], 200),

-- Labs for Course 6: Advanced Python for Data Science
-- Module 27: Python Data Structures and Libraries
(27, 'Data Manipulation with Pandas', 'Master data manipulation and analysis using Pandas.',
'1. Load and clean large datasets using Pandas
2. Perform data transformation and aggregation
3. Handle missing data and outliers
4. Merge and join multiple data sources
5. Optimize performance for large datasets
6. Export results to various formats', 1, true, 'container', 120, 'jupyter-datascience', ARRAY['pandas', 'numpy', 'jupyter'], 180),

-- Labs for Course 7: Web Application Security
-- Module 32: Web Application Architecture Security
(32, 'Secure Web Application Design', 'Design and implement secure web application architecture.',
'1. Implement secure authentication and authorization
2. Design secure API endpoints with proper validation
3. Implement secure session management
4. Configure HTTPS and security headers
5. Implement input validation and output encoding
6. Conduct security code review', 1, true, 'container', 140, 'secure-webapp-dev', ARRAY['owasp-zap', 'security-headers'], 200),

-- Labs for Course 8: Linux System Administration
-- Module 35: Linux Fundamentals and Command Line
(35, 'Linux Command Line Mastery', 'Master essential Linux command line operations.',
'1. Navigate file system using command line efficiently
2. Perform advanced file operations and permissions
3. Use text processing tools (grep, sed, awk)
4. Manage processes and system resources
5. Configure environment variables and aliases
6. Create and execute shell scripts', 1, true, 'vm', 110, 'ubuntu-server-2204', ARRAY['bash', 'text-editors', 'system-tools'], 150),

-- Module 39: Configuration Management with Ansible
(39, 'Ansible Automation Lab', 'Automate system configuration using Ansible.',
'1. Install and configure Ansible control node
2. Create inventory files for managed hosts
3. Write Ansible playbooks for system configuration
4. Use Ansible roles for modular automation
5. Implement Ansible Vault for secrets management
6. Deploy complete infrastructure using Ansible', 1, true, 'vm', 160, 'ansible-control', ARRAY['ansible', 'yaml', 'ssh'], 220);

-- =============================================================================
-- LEARNING PATHS DATA
-- =============================================================================

INSERT INTO learning_paths (title, description, created_by, is_published, difficulty_level, estimated_hours, tags) VALUES

('Cybersecurity Professional Track', 'Comprehensive learning path for aspiring cybersecurity professionals covering ethical hacking, digital forensics, and network security.', 501, true, 'intermediate', 350, ARRAY['cybersecurity', 'hacking', 'forensics', 'security']),

('Cloud DevOps Engineer', 'Complete learning path for cloud and DevOps engineering covering AWS, containerization, and automation.', 502, true, 'advanced', 400, ARRAY['cloud', 'devops', 'aws', 'automation']),

('Data Science Specialist', 'Data science learning path focusing on Python programming, machine learning, and big data analytics.', 501, true, 'intermediate', 300, ARRAY['python', 'data-science', 'machine-learning', 'analytics']),

('Linux System Administrator', 'Comprehensive Linux administration track covering system management, security, and automation.', 502, true, 'beginner', 200, ARRAY['linux', 'administration', 'automation', 'security']);

-- =============================================================================
-- ENROLLMENTS DATA
-- =============================================================================

-- Enroll test users in various courses
INSERT INTO enrollments (user_id, course_id, enrolled_by, status) VALUES

-- Students enrollments
(1001, 1, 1001, 'active'), -- Test Student in Ethical Hacking
(1001, 3, 1001, 'active'), -- Test Student in Network Security
(1002, 2, 1002, 'active'), -- Modulus Student in Digital Forensics
(1002, 7, 1002, 'active'), -- Modulus Student in Web App Security

-- Instructor course assignments
(501, 1, 2, 'active'), -- Test Instructor teaching Ethical Hacking
(501, 3, 2, 'active'), -- Test Instructor teaching Network Security
(501, 7, 2, 'active'), -- Test Instructor teaching Web App Security
(502, 2, 2, 'active'), -- Modulus Instructor teaching Digital Forensics
(502, 4, 2, 'active'), -- Modulus Instructor teaching AWS Cloud
(502, 5, 2, 'active'), -- Modulus Instructor teaching DevOps
(502, 6, 2, 'active'), -- Modulus Instructor teaching Python
(502, 8, 2, 'active'); -- Modulus Instructor teaching Linux

-- =============================================================================
-- USER PROGRESS DATA
-- =============================================================================

-- Add some realistic progress for students
INSERT INTO user_progress (user_id, course_id, module_id, lab_id, status, progress_percentage, started_at, score, max_score, attempts) VALUES

-- Test Student progress in Ethical Hacking course
(1001, 1, 1, 1, 'completed', 100, '2025-07-15 09:00:00', 95, 100, 1),
(1001, 1, 2, 2, 'completed', 100, '2025-07-16 10:00:00', 88, 150, 2),
(1001, 1, 2, 3, 'in_progress', 65, '2025-07-17 14:00:00', NULL, 150, 1),
(1001, 1, 3, 4, 'not_started', 0, NULL, NULL, 200, 0),

-- Modulus Student progress in Digital Forensics
(1002, 2, 7, 9, 'completed', 100, '2025-07-14 11:00:00', 92, 100, 1),
(1002, 2, 8, 10, 'completed', 100, '2025-07-15 13:00:00', 85, 180, 1),
(1002, 2, 8, 11, 'in_progress', 45, '2025-07-17 09:00:00', NULL, 200, 1);

-- =============================================================================
-- ANNOUNCEMENTS DATA
-- =============================================================================

INSERT INTO announcements (title, content, author_id, target_audience, priority, published_at, is_pinned, course_id, tags) VALUES

('Welcome to Modulus LMS', 'Welcome to the Modulus Learning Management System! We are excited to have you join our community of learners and cybersecurity professionals. Please take some time to explore the platform and familiarize yourself with the available courses and labs.', 2, 'all', 'high', '2025-07-18 08:00:00', true, NULL, ARRAY['welcome', 'introduction']),
