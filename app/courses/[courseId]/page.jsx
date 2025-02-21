"use client";

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';

function CourseAttendancePage() {
  const { courseId } = useParams();
  const router = useRouter();
  const [attendanceRecords, setAttendanceRecords] = useState([]);
  const [students, setStudents] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Authentication check
  useEffect(() => {
    if (localStorage.getItem('isLoggedIn') !== 'true') {
      router.push('/');
    }
  }, [router]);

  // Fetch attendance records for the given courseId
  useEffect(() => {
    const fetchAttendance = async () => {
      try {
        const response = await fetch(`https://ams-sz8c.onrender.com/api/Attendance/course/${courseId}`);
        if (!response.ok) {
          throw new Error(`Error fetching attendance: ${response.status}`);
        }
        const data = await response.json();
        setAttendanceRecords(data["$values"] || []);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchAttendance();
  }, [courseId]);

  // Once attendance records are loaded, fetch the corresponding student info
  useEffect(() => {
    if (attendanceRecords.length > 0) {
      const uniqueStudentIds = [...new Set(attendanceRecords.map(record => record.studentId))];
      Promise.all(
        uniqueStudentIds.map(studentId =>
          fetch(`https://ams-sz8c.onrender.com/api/student/${studentId}`)
            .then(res => {
              if (!res.ok) {
                throw new Error(`Error fetching student ${studentId}: ${res.status}`);
              }
              return res.json();
            })
        )
      )
        .then(studentDataArray => {
          const studentMapping = {};
          studentDataArray.forEach(student => {
            studentMapping[student.id] = student;
          });
          setStudents(studentMapping);
        })
        .catch(err => {
          console.error("Error fetching student data:", err);
        });
    }
  }, [attendanceRecords]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-xl">Loading attendance records...</p>
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

  // Group attendance records by date (ignoring time)
  const groupedAttendance = attendanceRecords.reduce((groups, record) => {
    const dateKey = new Date(record.date).toLocaleDateString();
    if (!groups[dateKey]) {
      groups[dateKey] = [];
    }
    groups[dateKey].push(record);
    return groups;
  }, {});

  // Total unique dates loaded
  const totalDates = Object.keys(groupedAttendance).length;

  // Compute each student's attendance count (unique days where they were present)
  const studentAttendanceCount = {};
  Object.entries(groupedAttendance).forEach(([date, records]) => {
    // Use a Set to avoid duplicate counts if a student appears more than once per date
    const presentStudents = new Set(
      records.filter(record => record.isPresent).map(record => record.studentId)
    );
    presentStudents.forEach(studentId => {
      studentAttendanceCount[studentId] = (studentAttendanceCount[studentId] || 0) + 1;
    });
  });

  // Transform into an array of student stats
  const studentStats = Object.entries(studentAttendanceCount).map(([studentId, presentDays]) => {
    const student = students[studentId];
    const fullName = student ? `${student.firstName} ${student.lastName}` : "Unknown";
    const percentage = totalDates > 0 ? ((presentDays / totalDates) * 100).toFixed(0) : 0;
    return { studentId, fullName, presentDays, totalDates, percentage };
  });

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="container mx-auto">
        <h1 className="text-3xl font-bold text-center mb-6">
          Attendance for Course {courseId}
        </h1>
        {Object.entries(groupedAttendance).map(([date, records]) => {
          // Filter only records where the student was present
          const presentRecords = records.filter(record => record.isPresent);
          return (
            <div key={date} className="mb-8">
              <h2 className="text-2xl font-semibold mb-2">{date}</h2>
              {presentRecords.length > 0 ? (
                <table className="min-w-full bg-white shadow rounded-lg mb-4">
                  <thead>
                    <tr>
                      <th className="py-3 px-5 bg-gray-200 text-left">Student Name</th>
                      <th className="py-3 px-5 bg-gray-200 text-left">Time</th>
                    </tr>
                  </thead>
                  <tbody>
                    {presentRecords.map(record => {
                      const student = students[record.studentId];
                      return (
                        <tr key={record.id} className="border-b border-gray-200">
                          <td className="py-3 px-5">
                            {student ? `${student.firstName} ${student.lastName}` : 'Loading...'}
                          </td>
                          <td className="py-3 px-5">
                            {new Date(record.date).toLocaleTimeString()}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              ) : (
                <p className="italic">No students present on this day.</p>
              )}
            </div>
          );
        })}
        {/* Student Attendance Summary */}
        <div className="mt-8">
          <h2 className="text-2xl font-bold mb-4">Attendance Summary</h2>
          <ul>
            {studentStats.map((stat) => (
              <li key={stat.studentId} className="mb-4 p-4 bg-white rounded-lg shadow">
                <div className="flex justify-between items-center mb-2">
                  <span className="font-semibold">{stat.fullName}</span>
                  <span>{stat.percentage}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-4">
                  <div
                    className="bg-blue-500 h-4 rounded-full"
                    style={{ width: `${stat.percentage}%` }}
                  ></div>
                </div>
              </li>
            ))}
          </ul>
        </div>
        {/* Optionally, a chat component can be added here in the future */}
      </div>
    </div>
  );
}

export default CourseAttendancePage;
