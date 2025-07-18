-- Sample courses data to populate the courses table
-- These match the courses shown in the staff dashboard

INSERT INTO courses (title, code, description, department, academic_level, duration, total_credits, created_by, is_published) VALUES
('Digital Forensics Investigation', 'CS-402', 'Advanced course in digital forensics covering modern investigation techniques and tools', 'Computer Science', 'bachelor', 1, 4, 1, true),
('Network Security and Defense', 'CS-301', 'Foundation course in network security covering firewalls, intrusion detection, and defense strategies', 'Computer Science', 'bachelor', 1, 3, 1, true),
('AWS Cloud Architecture', 'CC-501', 'Enterprise-level course covering AWS cloud services and architecture design patterns', 'Cloud Computing', 'master', 1, 5, 1, true),
('DevOps and CI/CD Pipeline Management', 'CC-401', 'Practical course in DevOps methodologies covering continuous integration and deployment', 'Cloud Computing', 'bachelor', 1, 4, 1, true),
('Advanced Python for Data Science', 'CS-501', 'Advanced Python programming course focusing on data science applications and machine learning', 'Computer Science', 'master', 1, 4, 1, true),
('Web Application Security', 'CS-403', 'Specialized course covering web application vulnerabilities and security testing methodologies', 'Computer Science', 'bachelor', 1, 3, 1, true),
('Linux System Administration', 'SYS-301', 'Comprehensive Linux administration course covering system management and security', 'Systems', 'bachelor', 1, 3, 1, true),
('Ethical Hacking and Penetration Testing', 'CS-401', 'Comprehensive course covering ethical hacking techniques and penetration testing methodologies', 'Computer Science', 'bachelor', 1, 4, 1, true)
ON CONFLICT (code) DO NOTHING;
