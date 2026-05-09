import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { Box, Typography, Button } from "@mui/material";
import { useNavigate } from "react-router-dom";

import PrivateRoute from "./PrivateRoute";
import AppLayout from "../components/layout/AppLayout";
import LoginPage from "../pages/LoginPage";
import DashboardPage from "../pages/DashboardPage";
import LeadsListPage from "../pages/LeadsListPage";
import LeadDetailPage from "../pages/LeadDetailPage";
import LeadFormPage from "../pages/LeadFormPage";
import PipelinePage from "../pages/PipelinePage";
import AiSearchPage from "../pages/AiSearchPage";

function NotFoundPage() {
  const navigate = useNavigate();
  return (
    <Box
      sx={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        background: "#F7F6F3",
        gap: 2,
      }}
    >
      <Typography
        sx={{
          fontSize: 72,
          fontWeight: 300,
          fontFamily: "DM Mono",
          color: "#E3E1DA",
        }}
      >
        404
      </Typography>
      <Typography sx={{ fontSize: 18, fontWeight: 700, color: "#1A1A18" }}>
        Page not found
      </Typography>
      <Typography sx={{ fontSize: 13, color: "#5A5A56" }}>
        The page you're looking for doesn't exist.
      </Typography>
      <Button variant="contained" onClick={() => navigate("/dashboard")}>
        Back to Dashboard
      </Button>
    </Box>
  );
}

export default function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/" element={<Navigate to="/dashboard" replace />} />

      <Route element={<PrivateRoute />}>
        <Route element={<AppLayout />}>
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/leads" element={<LeadsListPage />} />
          <Route path="/leads/new" element={<LeadFormPage />} />
          <Route path="/leads/:id" element={<LeadDetailPage />} />
          <Route path="/leads/:id/edit" element={<LeadFormPage />} />
          <Route path="/pipeline" element={<PipelinePage />} />
          <Route path="/ai-search" element={<AiSearchPage />} />
        </Route>
      </Route>

      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}
