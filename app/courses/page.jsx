"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

function CoursesPage() {
  const router = useRouter();
  const [courses, setCourses] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Authentication check (simple client-side check)
  useEffect(() => {
    if (localStorage.getItem('isLoggedIn') !== 'true') {
      router.push('/');
    }
  }, []);

  useEffect(() => {
    const fetchCourses = async () => {
      try {
        const response = await fetch('https://ams-sz8c.onrender.com/api/course');
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        setCourses(data["$values"] || []);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchCourses();
  }, []);

  const handleCourseClick = (course) => {
    router.push(`/courses/${course.id}`);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-xl">Loading courses...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-xl text-red-500">Error: {error}</p>
      </div>
    );
  }

  // Filter courses based on the search term
  const filteredCourses = courses.filter((course) =>
    course.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    course.code.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gray-100 p-4">
      <div className="container mx-auto">
        <h1 className="text-3xl font-bold text-center mb-8">Courses</h1>
        {/* Search Bar */}
        <div className="flex justify-center mb-6">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search courses..."
            className="w-full max-w-md px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white shadow-md rounded-lg">
            <thead>
              <tr>
                <th className="py-3 px-5 bg-gray-200 text-left">Course Name</th>
                <th className="py-3 px-5 bg-gray-200 text-left">Code</th>
              </tr>
            </thead>
            <tbody>
              {filteredCourses.map((course) => (
                <tr
                  key={course.id}
                  className="cursor-pointer hover:bg-gray-100"
                  onClick={() => handleCourseClick(course)}
                >
                  <td className="py-3 px-5 border-b border-gray-200">{course.name}</td>
                  <td className="py-3 px-5 border-b border-gray-200">{course.code}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {filteredCourses.length === 0 && (
            <p className="text-center text-gray-500 mt-4">No courses match your search.</p>
          )}
        </div>
      </div>
    </div>
  );
}

export default CoursesPage;
