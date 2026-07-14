import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Layout } from "./components/Layout";
import { ToastContainer, ToastProvider } from "./components/Toast";
import { CreateJobPage } from "./pages/CreateJobPage";
import { DashboardPage } from "./pages/DashboardPage";
import { DevUiPage } from "./pages/DevUiPage";
import { EditJobPage } from "./pages/EditJobPage";
import { JobDetailPage } from "./pages/JobDetailPage";
import { JobTemplatesPage } from "./pages/JobTemplatesPage";
import { JobsListPage } from "./pages/JobsListPage";
import "./index.css";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <BrowserRouter>
      <ToastProvider>
        <Routes>
          <Route element={<Layout />}>
            <Route index element={<DashboardPage />} />
            <Route path="jobs" element={<JobsListPage />} />
            <Route path="jobs/templates" element={<JobTemplatesPage />} />
            <Route path="jobs/new" element={<CreateJobPage />} />
            <Route path="jobs/:jobId/edit" element={<EditJobPage />} />
            <Route path="jobs/:jobId" element={<JobDetailPage />} />
            <Route path="dev/ui" element={<DevUiPage />} />
          </Route>
        </Routes>
        <ToastContainer />
      </ToastProvider>
    </BrowserRouter>
  </StrictMode>,
);