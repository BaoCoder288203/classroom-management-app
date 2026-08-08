import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import { AuthProvider } from "./context/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";
import Login from "./pages/Login";
import SetupAccount from "./pages/SetupAccount";
import InstructorLayout from "./pages/instructor/InstructorLayout";
import ManageStudents from "./pages/instructor/ManageStudents";
import ManageLessons from "./pages/instructor/ManageLessons";
import InstructorMessages from "./pages/instructor/InstructorMessages";
import StudentLayout from "./pages/student/StudentLayout";
import StudentLessons from "./pages/student/StudentLessons";
import StudentMessages from "./pages/student/StudentMessages";
import StudentProfile from "./pages/student/StudentProfile";

function App() {
  return (
    <AuthProvider>
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 20000,
          style: {
            fontFamily: "inherit",
            fontSize: "14px",
          },
        }}
      />
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/setup-account" element={<SetupAccount />} />

          <Route
            path="/instructor"
            element={
              <ProtectedRoute role="instructor">
                <InstructorLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Navigate to="students" replace />} />
            <Route path="students" element={<ManageStudents />} />
            <Route path="lessons" element={<ManageLessons />} />
            <Route path="messages" element={<InstructorMessages />} />
          </Route>

          <Route
            path="/student"
            element={
              <ProtectedRoute role="student">
                <StudentLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Navigate to="lessons" replace />} />
            <Route path="lessons" element={<StudentLessons />} />
            <Route path="messages" element={<StudentMessages />} />
            <Route path="profile" element={<StudentProfile />} />
          </Route>

          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
