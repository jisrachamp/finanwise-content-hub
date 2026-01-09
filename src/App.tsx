import { Routes, Route, Navigate } from "react-router-dom";
import { RequireAuth } from "@/routes/RequireAuth";
import { RequireAdmin } from "@/routes/RequireAdmin";

import { DashboardLayout } from "@/components/DashboardLayout";

import Login from "@/pages/Login";
import Forbidden from "@/pages/Forbidden";

import Dashboard from "@/pages/Dashboard";
import Content from "@/pages/Content/Content";
import Analisis from "@/pages/Analisis/Analisis";
import Settings from "@/pages/Settings";
import Users from "@/pages/Users/Users";
import NotFound from "@/pages/NotFound";
import Questions from "@/pages/Questions";
import Exams from "@/pages/Exams";



export default function App() {
  return (
    <Routes>
      {/* Públicas */}
      <Route path="/login" element={<Login />} />
      <Route path="/forbidden" element={<Forbidden />} />

      {/* Redirección raíz */}
      <Route path="/" element={<Navigate to="/dashboard" replace />} />

      {/* Protegidas */}
      <Route element={<RequireAuth />}>
        <Route element={<RequireAdmin />}>
          <Route element={<DashboardLayout />}>
            <Route path="/admin/questions" element={<Questions />} />
            <Route path="/admin/exams" element={<Exams />} />
            <Route path="/content" element={<Content />} />
            <Route path="/analisis" element={<Analisis />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="/users" element={<Users />} />
          </Route>
        </Route>
      </Route>

      {/* 404 */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}
