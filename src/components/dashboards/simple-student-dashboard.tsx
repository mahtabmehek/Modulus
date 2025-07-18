'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/components/providers/local-auth-provider';
import { 
  BookOpen, 
  Play,
  Settings,
  LogOut,
  Loader2,
  Eye,
  Calendar,
  BarChart3,
  FileText,
  Clock,
  Award,
  TrendingUp
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface Course {
  id: string;
  title: string;
  description: string;
  created_at: string;
}

interface Lab {
  id: string;
  title: string;
  description: string;
  course_id: string;
  created_at: string;
}

interface Enrollment {
  id: string;
  course_id: string;
  progress: number;
  enrolled_at: string;
}

export function SimpleStudentDashboard() {
  const { user, signOut } = useAuth();
  const [courses, setCourses] = useState<Course[]>([]);
  const [labs, setLabs] = useState<Lab[]>([]);
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');

  const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('modulus_token');
      
      if (!token) {
        console.error('No token found');
        return;
      }

      const headers = { Authorization: `Bearer ${token}` };

      // Load available courses
      const coursesResponse = await fetch(`${API_BASE_URL}/courses`, { headers });
      if (coursesResponse.ok) {
        const coursesData = await coursesResponse.json();
        setCourses(coursesData.courses || []);
      }

      // Load available labs
      const labsResponse = await fetch(`${API_BASE_URL}/labs`, { headers });
      if (labsResponse.ok) {
        const labsData = await labsResponse.json();
        setLabs(labsData.labs || []);
      }

      // Load student enrollments
      const enrollmentsResponse = await fetch(`${API_BASE_URL}/student/enrollments`, { headers });
      if (enrollmentsResponse.ok) {
        const enrollmentsData = await enrollmentsResponse.json();
        setEnrollments(enrollmentsData.enrollments || []);
      }

    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const enrolledCourses = courses.filter(course => 
    enrollments.some(enrollment => enrollment.course_id === course.id)
  );

  const availableCourses = courses.filter(course => 
    !enrollments.some(enrollment => enrollment.course_id === course.id)
  );

  const stats = {
    enrolledCourses: enrolledCourses.length,
    availableLabs: labs.length,
    completedLabs: 0, // Could be calculated from progress
    averageProgress: enrollments.length > 0 
      ? Math.round(enrollments.reduce((sum, e) => sum + e.progress, 0) / enrollments.length)
      : 0
  };

  const handleEnrollInCourse = async (courseId: string) => {
    try {
      const token = localStorage.getItem('modulus_token');
      const response = await fetch(`${API_BASE_URL}/student/enroll`, {
        method: 'POST',
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ courseId })
      });

      if (response.ok) {
        // Reload enrollments
        loadDashboardData();
      }
    } catch (error) {
      console.error('Error enrolling in course:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Loader2 className="mx-auto h-8 w-8 animate-spin text-blue-600" />
          <p className="mt-2 text-sm text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Student Dashboard</h1>
              <p className="text-sm text-gray-600">Welcome back, {user?.firstName}</p>
            </div>
            <div className="flex items-center gap-3">
              <Button 
                onClick={() => window.open('/student', '_blank')}
                variant="default"
                className="flex items-center bg-blue-600 hover:bg-blue-700"
              >
                <TrendingUp className="h-4 w-4 mr-2" />
                Enhanced Student
              </Button>
              <Button 
                onClick={signOut}
                variant="outline"
                className="flex items-center"
              >
                <LogOut className="h-4 w-4 mr-2" />
                Sign Out
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Navigation Tabs */}
        <div className="flex space-x-4 mb-8">
          <Button
            variant={activeTab === 'overview' ? 'default' : 'outline'}
            onClick={() => setActiveTab('overview')}
            className="flex items-center"
          >
            <BarChart3 className="h-4 w-4 mr-2" />
            Overview
          </Button>
          <Button
            variant={activeTab === 'courses' ? 'default' : 'outline'}
            onClick={() => setActiveTab('courses')}
            className="flex items-center"
          >
            <BookOpen className="h-4 w-4 mr-2" />
            My Courses
          </Button>
          <Button
            variant={activeTab === 'labs' ? 'default' : 'outline'}
            onClick={() => setActiveTab('labs')}
            className="flex items-center"
          >
            <FileText className="h-4 w-4 mr-2" />
            Labs
          </Button>
          <Button
            variant={activeTab === 'browse' ? 'default' : 'outline'}
            onClick={() => setActiveTab('browse')}
            className="flex items-center"
          >
            <Eye className="h-4 w-4 mr-2" />
            Browse Courses
          </Button>
        </div>

        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Enrolled Courses</CardTitle>
                  <BookOpen className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.enrolledCourses}</div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Available Labs</CardTitle>
                  <FileText className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.availableLabs}</div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Completed Labs</CardTitle>
                  <Award className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.completedLabs}</div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Average Progress</CardTitle>
                  <TrendingUp className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.averageProgress}%</div>
                </CardContent>
              </Card>
            </div>

            {/* Recent Activity */}
            <Card>
              <CardHeader>
                <CardTitle>Recent Activity</CardTitle>
              </CardHeader>
              <CardContent>
                {enrollments.length === 0 ? (
                  <p className="text-gray-500">No recent activity. Start by enrolling in a course!</p>
                ) : (
                  <div className="space-y-4">
                    {enrollments.slice(0, 5).map((enrollment) => {
                      const course = courses.find(c => c.id === enrollment.course_id);
                      return (
                        <div key={enrollment.id} className="flex items-center justify-between">
                          <div>
                            <p className="font-medium">{course?.title}</p>
                            <p className="text-sm text-gray-500">
                              Enrolled {new Date(enrollment.enrolled_at).toLocaleDateString()}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="font-medium">{enrollment.progress}%</p>
                            <div className="w-24 bg-gray-200 rounded-full h-2">
                              <div 
                                className="bg-blue-600 h-2 rounded-full" 
                                style={{ width: `${enrollment.progress}%` }}
                              ></div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {/* My Courses Tab */}
        {activeTab === 'courses' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold">My Courses</h2>
            </div>
            
            {enrolledCourses.length === 0 ? (
              <Card>
                <CardContent className="p-8 text-center">
                  <BookOpen className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No courses enrolled</h3>
                  <p className="text-gray-600 mb-4">You haven't enrolled in any courses yet.</p>
                  <Button onClick={() => setActiveTab('browse')}>
                    Browse Available Courses
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {enrolledCourses.map((course) => {
                  const enrollment = enrollments.find(e => e.course_id === course.id);
                  return (
                    <Card key={course.id}>
                      <CardHeader>
                        <CardTitle className="text-lg">{course.title}</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm text-gray-600 mb-4">{course.description}</p>
                        <div className="space-y-2 mb-4">
                          <div className="flex justify-between text-sm">
                            <span>Progress</span>
                            <span>{enrollment?.progress || 0}%</span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div 
                              className="bg-blue-600 h-2 rounded-full" 
                              style={{ width: `${enrollment?.progress || 0}%` }}
                            ></div>
                          </div>
                        </div>
                        <Button className="w-full">
                          <Play className="h-4 w-4 mr-2" />
                          Continue Learning
                        </Button>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Labs Tab */}
        {activeTab === 'labs' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold">Available Labs</h2>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {labs.map((lab) => (
                <Card key={lab.id}>
                  <CardHeader>
                    <CardTitle className="text-lg">{lab.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-gray-600 mb-4">{lab.description}</p>
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-gray-500">
                        Created: {new Date(lab.created_at).toLocaleDateString()}
                      </span>
                      <Button size="sm">
                        <Play className="h-3 w-3 mr-1" />
                        Start Lab
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Browse Courses Tab */}
        {activeTab === 'browse' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold">Browse Available Courses</h2>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {availableCourses.map((course) => (
                <Card key={course.id}>
                  <CardHeader>
                    <CardTitle className="text-lg">{course.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-gray-600 mb-4">{course.description}</p>
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-gray-500">
                        Created: {new Date(course.created_at).toLocaleDateString()}
                      </span>
                      <Button 
                        size="sm"
                        onClick={() => handleEnrollInCourse(course.id)}
                      >
                        Enroll
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
