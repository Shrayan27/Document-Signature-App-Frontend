import React from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import HomePage from "./pages/HomePage";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import { Toaster } from "./components/ui/sonner";
import DocumentView from "./pages/DocumentView";
import PublicSignerPage from "./pages/PublicSignerPage";

const App = () => {
  return (
    <div>
      <Toaster />
      <BrowserRouter>
        <Routes>
          <Route index element={<HomePage />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/document/:id" element={<DocumentView />} />
          <Route path="/sign/:token" element={<PublicSignerPage />} />
        </Routes>
      </BrowserRouter>
    </div>
  );
};

export default App;
