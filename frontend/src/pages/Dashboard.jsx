import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { toast } from "sonner";

// Import new components
import DashboardHeader from "../components/DashboardHeader";
import UploadDocumentCard from "../components/UploadDocumentCard";
import SignatureRequestsTable from "../components/SignatureRequestsTable";

const Dashboard = () => {
  const [user, setUser] = useState(null);
  const [signatureRequests, setSignatureRequests] = useState([]);
  const navigate = useNavigate();

  // Function to fetch user data and signature requests
  const fetchUserDataAndRequests = useCallback(async () => {
    try {
      const userRes = await axios.get(
        "https://document-signature-app.onrender.com/api/auth/get-user",
        {
          withCredentials: include,
        }
      );
      setUser(userRes.data.user);

      const requestsRes = await axios.get(
        "https://document-signature-app.onrender.com/api/signatures/my-requests",
        {
          withCredentials: true,
        }
      );
      setSignatureRequests(requestsRes.data);
    } catch (error) {
      console.error(
        "Failed to fetch user or signature requests:",
        error.response?.data || error.message
      );
      toast.error("Session Expired or Unauthorized", {
        description: "Please log in again.",
      });
      navigate("/login");
    }
  }, [navigate]); // useCallback to prevent unnecessary re-creation

  useEffect(() => {
    fetchUserDataAndRequests();
  }, [fetchUserDataAndRequests]); // Dependency array includes the stable callback

  const handleCreateSignatureRequest = async (selectedFile, signerEmail) => {
    const formData = new FormData();
    formData.append("pdf", selectedFile);

    try {
      // First, upload the document
      const uploadRes = await axios.post(
        "https://document-signature-app.onrender.com/api/docs/upload",
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
          withCredentials: true,
        }
      );
      const documentId = uploadRes.data.document._id;

      // Then, create the signature request for the uploaded document
      await axios.post(
        "https://document-signature-app.onrender.com/api/signatures",
        {
          documentId,
          x: 50, // Default X position for initial request
          y: 50, // Default Y position for initial request
          page: 1, // Default page for initial request
          signerEmail,
        },
        {
          withCredentials: true,
        }
      );

      toast.success("Document Uploaded & Signature Request Sent", {
        description: `A request has been sent to ${signerEmail}.`,
      });

      // Refresh requests list after successful creation
      fetchUserDataAndRequests();
    } catch (error) {
      console.error(
        "Upload or Request creation error:",
        error.response?.data || error.message
      );
      toast.error("Operation Failed", {
        description:
          error.response?.data?.message ||
          "An error occurred during upload or request creation.",
      });
    }
  };

  const handleLogout = async () => {
    try {
      await axios.post(
        "https://document-signature-app.onrender.com/api/auth/logout",
        {},
        { withCredentials: true }
      );
      toast.info("Logged Out", {
        description: "You have been successfully logged out.",
      });
      navigate("/login");
    } catch (error) {
      console.error("Logout error:", error.response?.data || error.message);
      toast.error("Logout Failed", {
        description: "Could not log out. Please try again.",
      });
    }
  };


  const handleDeleteDocument = async (documentId, documentName) => {
    if (!window.confirm(`Are you sure you want to delete "${documentName}" and all its associated signature requests? This action cannot be undone.`)) {
      return; // User cancelled
    }
    try {
      await axios.delete(`https://document-signature-app.onrender.com/api/docs/${documentId}`, { //
        withCredentials: true,
      });
      toast.success("Document Deleted", {
        description: `"${documentName}" and its requests have been removed.`,
      });
      fetchUserDataAndRequests(); // Refresh the list
    } catch (error) {
      console.error("Deletion error:", error.response?.data || error.message);
      toast.error("Deletion Failed", {
        description: error.response?.data?.message || "An error occurred during deletion.",
      });
    }
  };


  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100">
        <p className="text-lg text-gray-700">Loading dashboard...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <DashboardHeader user={user} onLogout={handleLogout} />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <UploadDocumentCard
          onCreateSignatureRequest={handleCreateSignatureRequest}
        />
        <SignatureRequestsTable
          requests={signatureRequests}
          currentUser={user}
          onDeleteDocument={handleDeleteDocument} 
        />
      </div>
    </div>
  );
};

export default Dashboard;
