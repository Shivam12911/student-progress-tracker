import React, { useState, useEffect } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ResponsiveContainer,
} from "recharts";

const StudentProgressTracker = () => {
  const [role, setRole] = useState(null);
  const [teacherCode, setTeacherCode] = useState("");
  const [authenticated, setAuthenticated] = useState(false);

  const [currentClass, setCurrentClass] = useState("9");
  const [currentSubject, setCurrentSubject] = useState("Maths");
  const [selectedTest, setSelectedTest] = useState(null);
  const [students, setStudents] = useState([]);
  const [tests, setTests] = useState([]);
  const [studentName, setStudentName] = useState("");
  const [testTitle, setTestTitle] = useState("");
  const [maxMarks, setMaxMarks] = useState("");
  const [queryRollNo, setQueryRollNo] = useState("");
  const [queriedStudent, setQueriedStudent] = useState(null);

  const getStorageKey = () => `${currentSubject}_students_${currentClass}`;
  const getTestStorageKey = () => `${currentSubject}_tests_${currentClass}`;

  useEffect(() => {
    if (authenticated || role === "student") {
      const s = JSON.parse(localStorage.getItem(getStorageKey()) || "[]");
      const t = JSON.parse(localStorage.getItem(getTestStorageKey()) || "[]");
      setStudents(s);
      setTests(t);
      setSelectedTest(null);

      if (role === "student") {
        const student = s.find(s => s.roll === queryRollNo);
        setQueriedStudent(student || null);
      }
    }
  }, [authenticated, role, currentClass, currentSubject, queryRollNo]);

  useEffect(() => {
    if (authenticated && role === "teacher") {
      localStorage.setItem(getStorageKey(), JSON.stringify(students));
      localStorage.setItem(getTestStorageKey(), JSON.stringify(tests));
    }
  }, [students, tests]);

  const generateRollNo = () => {
    const prefix = `${currentClass}-${currentSubject[0].toUpperCase()}`;
    const count = students.length + 1;
    return `${prefix}-${String(count).padStart(2, "0")}`;
  };

  const addStudent = () => {
    if (studentName.trim()) {
      const roll = generateRollNo();
      setStudents([...students, { name: studentName, roll, marks: {} }]);
      setStudentName("");
    }
  };

  const addTest = () => {
    if (testTitle.trim() && !isNaN(maxMarks)) {
      if (!tests.some(t => t.title === testTitle)) {
        setTests([...tests, { title: testTitle, maxMarks: parseFloat(maxMarks) }]);
        setSelectedTest(testTitle);
        setTestTitle("");
        setMaxMarks("");
      }
    }
  };

  const deleteTest = title => {
    setTests(tests.filter(t => t.title !== title));
    setStudents(
      students.map(s => {
        const updatedMarks = { ...s.marks };
        delete updatedMarks[title];
        return { ...s, marks: updatedMarks };
      })
    );
    if (selectedTest === title) setSelectedTest(null);
  };

  const deleteStudent = index => {
    setStudents(students.filter((_, i) => i !== index));
  };

  const updateMark = (index, title, value) => {
    const updated = [...students];
    updated[index].marks[title] = parseFloat(value);
    setStudents(updated);
  };

  const getStudentRank = (roll) => {
    const rankList = students.map(student => {
      let total = 0;
      let maxTotal = 0;
      tests.forEach(test => {
        if (!isNaN(student.marks[test.title])) {
          total += student.marks[test.title];
          maxTotal += test.maxMarks;
        }
      });
      return { ...student, total, maxTotal };
    });

    rankList.sort((a, b) => b.total - a.total);
    return rankList.findIndex(r => r.roll === roll) + 1;
  };

  const renderStudentProgress = () => {
    if (!queriedStudent) return <p>No student found.</p>;

    const data = tests.map(test => ({
      name: test.title,
      Marks: queriedStudent.marks[test.title] ?? 0,
      Max: test.maxMarks
    }));

    const total = data.reduce((sum, d) => sum + d.Marks, 0);
    const maxTotal = data.reduce((sum, d) => sum + d.Max, 0);
    const percentage = maxTotal ? ((total / maxTotal) * 100).toFixed(2) : "0.00";
    const pass = percentage >= 33;
    const rank = getStudentRank(queriedStudent.roll);

    return (
      <div>
        <h2>Welcome, {queriedStudent.name}</h2>
        <p>Total Marks: {total}</p>
        <p>Maximum Marks: {maxTotal}</p>
        <p>Percentage: {percentage}%</p>
        <p>Status: {pass ? "Pass" : "Fail"}</p>
        <p>Your Rank: {rank}</p>

        <h3>Progress Graph</h3>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={data}>
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip />
            <CartesianGrid stroke="#eee" strokeDasharray="5 5" />
            <Line type="monotone" dataKey="Marks" stroke="#8884d8" />
          </LineChart>
        </ResponsiveContainer>

        <h3>Marks Table</h3>
        <table border="1" cellPadding="5">
          <thead>
            <tr>
              <th>Test</th>
              <th>Marks</th>
              <th>Max Marks</th>
            </tr>
          </thead>
          <tbody>
            {data.map((d, i) => (
              <tr key={i}>
                <td>{d.name}</td>
                <td>{d.Marks}</td>
                <td>{d.Max}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  if (!role) {
    return (
      <div style={{ padding: 20 }}>
        <h2>Welcome! Are you a teacher or a student?</h2>
        <button onClick={() => setRole("teacher")}>Teacher</button>
        <button onClick={() => setRole("student")}>Student</button>
      </div>
    );
  }

  if (role === "teacher" && !authenticated) {
    return (
      <div style={{ padding: 20 }}>
        <h2>Enter Teacher Code</h2>
        <input
          type="password"
          value={teacherCode}
          onChange={e => setTeacherCode(e.target.value)}
        />
        <button onClick={() => setAuthenticated(teacherCode === "p3")}>Submit</button>
        {teacherCode && teacherCode !== "p3" && <p style={{ color: "red" }}>Invalid code</p>}
      </div>
    );
  }

  if (role === "student" && !authenticated) {
    return (
      <div style={{ padding: 20 }}>
        <h2>Select Class and Subject</h2>
        <select value={currentClass} onChange={e => setCurrentClass(e.target.value)}>
          <option value="9">9</option>
          <option value="10">10</option>
          <option value="11">11</option>
          <option value="12">12</option>
        </select>
        <select value={currentSubject} onChange={e => setCurrentSubject(e.target.value)}>
          <option value="Maths">Maths</option>
          <option value="English">English</option>
        </select>
        <h3>Enter Roll No</h3>
        <input
          type="text"
          value={queryRollNo}
          onChange={e => setQueryRollNo(e.target.value)}
        />
        <button onClick={() => setAuthenticated(true)}>
          Submit
        </button>
      </div>
    );
  }

  const renderRankTable = (student, index) => {
    const total = tests.reduce((sum, test) => {
      return sum + (student.marks[test.title] || 0);
    }, 0);
    const maxTotal = tests.reduce((sum, test) => sum + test.maxMarks, 0);
    const percentage = maxTotal ? ((total / maxTotal) * 100).toFixed(2) : "0.00";
  
    return (
      <tr key={student.roll}>
        <td>{index + 1}</td>
        <td>{student.roll}</td>
        <td>{student.name}</td>
        <td>{total}</td>
        <td>{maxTotal}</td>
        <td>{percentage}</td>
      </tr>
    );
  };
  

  return (
    <div style={{ padding: "20px", fontFamily: "Arial" }}>
      <h1>Student Progress Tracker</h1>

      {role === "teacher" ? (
        <>
          <h2>Manage Students and Tests</h2>

          <div>
            <label>Class: </label>
            <select value={currentClass} onChange={e => setCurrentClass(e.target.value)}>
              <option value="9">9</option>
              <option value="10">10</option>
              <option value="11">11</option>
              <option value="12">12</option>
            </select>
            <label> Subject: </label>
            <select value={currentSubject} onChange={e => setCurrentSubject(e.target.value)}>
              <option value="Maths">Maths</option>
              <option value="English">English</option>
            </select>
          </div>

          <h3>Add Student</h3>
          <input
            type="text"
            placeholder="Student Name"
            value={studentName}
            onChange={e => setStudentName(e.target.value)}
          />
          <button onClick={addStudent}>Add</button>

          <h3>Add Test</h3>
          <input
            type="text"
            placeholder="Test Title"
            value={testTitle}
            onChange={e => setTestTitle(e.target.value)}
          />
          <input
            type="number"
            placeholder="Max Marks"
            value={maxMarks}
            onChange={e => setMaxMarks(e.target.value)}
          />
          <button onClick={addTest}>Add Test</button>

          <h3>All Tests</h3>
          {tests.map(test => (
            <div key={test.title} style={{ marginBottom: 10 }}>
              <strong>{test.title}</strong> - Max: {test.maxMarks}
              <button onClick={() => deleteTest(test.title)} style={{ marginLeft: 10 }}>
                Delete
              </button>
            </div>
          ))}

          <h3>Student List</h3>
          <table border="1" cellPadding="5">
            <thead>
              <tr>
                <th>Name</th>
                <th>Roll No</th>
                {tests.map(test => (
                  <th key={test.title}>{test.title}</th>
                ))}
                <th>Delete</th>
              </tr>
            </thead>
            <tbody>
              {students.map((s, i) => (
                <tr key={s.roll}>
                  <td>{s.name}</td>
                  <td>{s.roll}</td>
                  {tests.map(test => (
                    <td key={test.title}>
                      <input
                        type="number"
                        value={s.marks[test.title] ?? ""}
                        onChange={e => updateMark(i, test.title, e.target.value)}
                        style={{ width: "60px" }}
                      />
                    </td>
                  ))}
                  <td>
                    <button onClick={() => deleteStudent(i)}>Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <h3>Overall Ranking</h3>
          <table border="1" cellPadding="5">
            <thead>
              <tr>
                <th>Rank</th>
                <th>Roll No</th>
                <th>Name</th>
                <th>Total</th>
                <th>Max</th>
                <th>%</th>
              </tr>
            </thead>
            <tbody>{students.map(renderRankTable)}</tbody>
          </table>
        </>
      ) : (
        <>{renderStudentProgress()}</>
      )}
    </div>
  );
};

export default StudentProgressTracker;
