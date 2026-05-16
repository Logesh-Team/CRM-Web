import React from "react";
import { Routes, Route, Navigate, Outlet } from "react-router-dom";
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
import UsersListPage from "../pages/UsersListPage";
import UserFormPage from "../pages/UserFormPage";
import UserDetailPage from "../pages/UserDetailPage";
import AuditLogsPage from "../pages/AuditLogsPage";
import ProfilePage from "../pages/ProfilePage";
import { usePermission } from "../hooks/usePermission";
import SchedulerPage from "../pages/SchedulerPage";
import DemoDetail from "../pages/Demos/DemoDetail";
import QuotationList from "../pages/Quotations/QuotationList";
import CreateQuotation from "../pages/Quotations/CreateQuotation";
import QuotationDetail from "../pages/Quotations/QuotationDetail";
import VoiceCallsPage from "../pages/VoiceCallsPage";
import CallBatchCreatePage from "../pages/VoiceCalls/CallBatchCreatePage";
import CallBatchDetailPage from "../pages/VoiceCalls/CallBatchDetailPage";
import FollowUpPage from "../pages/FollowUpPage";
import SalesExecutiveDashboard from "../pages/Dashboard/SalesExecutiveDashboard";
import ManagerDashboard from "../pages/Dashboard/ManagerDashboard";
import LeadSummaryReport from "../pages/Reports/LeadSummaryReport";
import AICallBatchReport from "../pages/Reports/AICallBatchReport";
import FollowUpActivityReport from "../pages/Reports/FollowUpActivityReport";
import DemoPipelineReport from "../pages/Reports/DemoPipelineReport";
import QuotationStatusReport from "../pages/Reports/QuotationStatusReport";
import ConversionReport from "../pages/Reports/ConversionReport";
import OverdueFollowUpReport from "../pages/Reports/OverdueFollowUpReport";

function PermittedRoute({ permission }) {
  const { can } = usePermission();
  if (!can(permission)) return <Navigate to="/dashboard" replace />;
  return <Outlet />;
}

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
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/calls" element={<VoiceCallsPage />} />
          <Route path="/calls/new" element={<CallBatchCreatePage />} />
          <Route path="/calls/:id" element={<CallBatchDetailPage />} />
          <Route path="/follow-up" element={<FollowUpPage />} />
          <Route path="/demos" element={<SchedulerPage />} />
          <Route path="/demos/:id" element={<DemoDetail />} />

          <Route element={<PermittedRoute permission="USER_READ" />}>
            <Route path="/users" element={<UsersListPage />} />
            <Route path="/users/:id" element={<UserDetailPage />} />
          </Route>
          <Route element={<PermittedRoute permission="USER_CREATE" />}>
            <Route path="/users/new" element={<UserFormPage />} />
          </Route>
          <Route element={<PermittedRoute permission="USER_UPDATE" />}>
            <Route path="/users/:id/edit" element={<UserFormPage />} />
          </Route>
          <Route element={<PermittedRoute permission="AUDIT_VIEW" />}>
            <Route path="/users/audit-logs" element={<AuditLogsPage />} />
          </Route>

          <Route path="/quotations" element={<QuotationList />} />
          <Route path="/quotations/create" element={<CreateQuotation />} />
          <Route path="/quotations/:id" element={<QuotationDetail />} />
          <Route path="/quotations/:id/edit" element={<CreateQuotation />} />

          {/* Dashboards */}
          <Route element={<PermittedRoute permission="DASHBOARD_OWN" />}>
            <Route path="/dashboard/sales-executive" element={<SalesExecutiveDashboard />} />
          </Route>
          <Route element={<PermittedRoute permission="DASHBOARD_TEAM" />}>
            <Route path="/dashboard/manager" element={<ManagerDashboard />} />
          </Route>

          {/* Reports */}
          <Route element={<PermittedRoute permission="REPORT_OWN" />}>
            <Route path="/reports/lead-summary" element={<LeadSummaryReport />} />
            <Route path="/reports/followup-activity" element={<FollowUpActivityReport />} />
            <Route path="/reports/demo-pipeline" element={<DemoPipelineReport />} />
            <Route path="/reports/quotation-status" element={<QuotationStatusReport />} />
            <Route path="/reports/overdue-followup" element={<OverdueFollowUpReport />} />
            <Route path="/reports/conversion" element={<ConversionReport />} />
          </Route>
          <Route element={<PermittedRoute permission="REPORT_TEAM" />}>
            <Route path="/reports/ai-call-batch" element={<AICallBatchReport />} />
          </Route>
        </Route>
      </Route>

      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}
