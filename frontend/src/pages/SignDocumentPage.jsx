import React, { useState, useEffect, useRef, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import { Document, Page, pdfjs } from "react-pdf";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "../components/ui/card";
import { toast } from "sonner";
import { Textarea } from "../components/ui/textarea";

// Import the DraggableSignature component
import DraggableSignature from "../components/DraggableSignature";

// Set up worker for react-pdf. Ensure this path is correct relative to your public directory.
// If you face issues, consider using a CDN like:
// pdfjs.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.js`;
pdfjs.GlobalWorkerOptions.workerSrc = "/pdfjs-workers/pdf.worker.min.js";

const SignDocumentPage = () => {
  const { token } = useParams(); // Get the signature token from the URL
  const navigate = useNavigate();

  const [signatureRequest, setSignatureRequest] = useState(null);
  const [documentPdfUrl, setDocumentPdfUrl] = useState(null); // Renamed to avoid confusion
  const [numPages, setNumPages] = useState(null);
  const [pageNumber, setPageNumber] = useState(1); // Keep track of current view if you add single-page navigation
  const [signerName, setSignerName] = useState("");
  const [rejectionReason, setRejectionReason] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // State for draggable signature position and the page it's intended for
  const [signaturePosition, setSignaturePosition] = useState({ x: 0, y: 0 }); // Relative to the PDF page
  const [signaturePage, setSignaturePage] = useState(1); // Default to page 1 for placement

  const pdfContainerRef = useRef(null); // Ref for the div containing the PDF viewer to calculate width
  const [pdfContainerWidth, setPdfContainerWidth] = useState(null);

  // Effect to set PDF container width
  useEffect(() => {
    const handleResize = () => {
      if (pdfContainerRef.current) {
        // Set width dynamically, subtract some margin/padding from total width
        setPdfContainerWidth(
          Math.min(800, pdfContainerRef.current.offsetWidth - 32)
        ); // 32px for p-4 (16px * 2)
      }
    };

    handleResize(); // Set initial width
    window.addEventListener("resize", handleResize); // Update on resize

    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    const fetchSignatureRequestDetails = async () => {
      try {
        // Fetch signature request details (metadata)
        const detailsRes = await axios.get(
          `http://localhost:3000/api/signatures/details/${token}`
        );
        setSignatureRequest(detailsRes.data.signature);

        // Set the PDF URL to the public endpoint that serves the actual PDF file
        // This assumes the /api/signatures/public/:token endpoint returns the PDF binary data
        setDocumentPdfUrl(
          `http://localhost:3000/api/signatures/public/${token}`
        );

        // Set initial signature position if available from the request (e.g., from request.x, request.y)
        // If your backend stores the desired signature placement from the creator:
        if (detailsRes.data.signature.x && detailsRes.data.signature.y) {
          setSignaturePosition({
            x: detailsRes.data.signature.x,
            y: detailsRes.data.signature.y,
          });
        }
        if (detailsRes.data.signature.page) {
          setSignaturePage(detailsRes.data.signature.page);
        }
      } catch (err) {
        console.error(
          "Error fetching signature request or document:",
          err.response?.data || err.message
        );
        const errorMessage =
          err.response?.data?.error ||
          "Could not load document or signature request. It might be invalid or expired.";
        setError(errorMessage);
        toast.error("Error", {
          description: errorMessage,
        });
      } finally {
        setLoading(false);
      }
    };
    fetchSignatureRequestDetails();
  }, [token]);

  const onDocumentLoadSuccess = useCallback(({ numPages }) => {
    setNumPages(numPages);
  }, []);

  const handleFinalizePublic = async (action) => {
    if (action === "sign" && !signerName) {
      toast.error("Signer Name Required", {
        description: "Please enter your name to sign the document.",
      });
      return;
    }
    if (action === "reject" && !rejectionReason) {
      toast.error("Rejection Reason Required", {
        description: "Please provide a reason for rejecting the document.",
      });
      return;
    }

    try {
      await axios.post("http://localhost:3000/api/signatures/finalize-public", {
        token,
        action,
        name: signerName,
        reason: rejectionReason,
        // Include signature position and page when signing
        ...(action === "sign" && {
          x: signaturePosition.x,
          y: signaturePosition.y,
          page: signaturePage,
        }),
      });

      toast.success(
        `Document ${action === "sign" ? "signed" : "rejected"} successfully!`,
        {
          description: `The document status has been updated to ${action}.`,
        }
      );

      // Update local state to reflect the change
      setSignatureRequest((prev) => ({ ...prev, status: action }));

      // Optionally, redirect after a short delay
      setTimeout(() => navigate("/"), 2000); // Redirect to homepage or a confirmation page
    } catch (err) {
      console.error(
        "Error finalizing public signature:",
        err.response?.data || err.message
      );
      toast.error("Operation Failed", {
        description: err.response?.data?.error || "An error occurred.",
      });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <p className="text-lg text-gray-700">Loading signature request...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen text-red-600 text-xl bg-gray-50">
        {error}
      </div>
    );
  }

  if (!signatureRequest) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <p className="text-lg text-gray-700">
          Signature request not found or invalid.
        </p>
      </div>
    );
  }

  const isPending = signatureRequest.status === "pending";
  const isSigned = signatureRequest.status === "signed";
  const isRejected = signatureRequest.status === "rejected";

  return (
    <div className="flex flex-col items-center p-8 bg-gray-50 min-h-screen">
      <h1 className="text-3xl font-bold mb-6 text-gray-800">
        Document Signature Request
      </h1>
      <p className="text-lg text-gray-600 mb-4">
        Document:{" "}
        {signatureRequest.documentId?.originalName ||
          signatureRequest.documentId?.originalname ||
          "N/A"}
      </p>
      <p className="text-lg text-gray-600 mb-6">
        Status:{" "}
        <span
          className={`font-semibold
            ${isPending ? "text-yellow-600" : ""}
            ${isSigned ? "text-green-600" : ""}
            ${isRejected ? "text-red-600" : ""}
          `}
        >
          {signatureRequest.status.charAt(0).toUpperCase() +
            signatureRequest.status.slice(1)}
        </span>
      </p>

      <div className="flex flex-col md:flex-row w-full max-w-6xl bg-white shadow-lg rounded-lg overflow-hidden mb-6">
        {/* PDF Viewer Section */}
        <div className="flex-1 p-4 relative" ref={pdfContainerRef}>
          {documentPdfUrl && pdfContainerWidth ? (
            <Document
              file={documentPdfUrl}
              onLoadSuccess={onDocumentLoadSuccess}
              className="border border-gray-300 w-full"
            >
              {Array.from(new Array(numPages), (el, index) => (
                <div
                  key={`page_container_${index + 1}`}
                  className="relative my-4 border border-dashed border-gray-200"
                >
                  <Page
                    pageNumber={index + 1}
                    width={pdfContainerWidth} // Use the dynamically calculated width
                    renderAnnotationLayer={false}
                    renderTextLayer={false}
                  />
                  {/* Draggable signature component only on the target signature page and if pending */}
                  {isPending && signaturePage === index + 1 && (
                    <DraggableSignature
                      signatureText={signerName || "Sign Here"}
                      position={signaturePosition}
                      onDrag={(_, data) =>
                        setSignaturePosition({ x: data.x, y: data.y })
                      }
                      // For a truly persistent drag relative to the page,
                      // you might need to adjust `position` based on page offsets.
                      // For simplicity, this example treats it as an overlay on the specified page.
                    />
                  )}
                </div>
              ))}
            </Document>
          ) : (
            <div className="flex justify-center items-center h-96">
              Loading PDF...
            </div>
          )}
        </div>

        {/* Action Controls Section */}
        <Card className="w-full md:w-80 flex-shrink-0 border-t md:border-t-0 md:border-l rounded-none">
          <CardHeader>
            <CardTitle>Action</CardTitle>
            <CardDescription>Sign or Reject this document.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4">
            {isPending ? (
              <>
                <div className="grid gap-2">
                  <Label htmlFor="signerName">Your Name (for signing)</Label>
                  <Input
                    id="signerName"
                    type="text"
                    placeholder="e.g., Jane Doe"
                    value={signerName}
                    onChange={(e) => setSignerName(e.target.value)}
                  />
                </div>
                {/* Optional: Input for signature page if not fixed */}
                <div className="grid gap-2">
                  <Label htmlFor="signaturePage">Signature Page</Label>
                  <Input
                    id="signaturePage"
                    type="number"
                    min="1"
                    max={numPages || 1}
                    value={signaturePage}
                    onChange={(e) =>
                      setSignaturePage(
                        Math.max(
                          1,
                          Math.min(numPages, parseInt(e.target.value) || 1)
                        )
                      )
                    }
                  />
                </div>
                <Button
                  onClick={() => handleFinalizePublic("sign")}
                  disabled={!signerName}
                >
                  Sign Document
                </Button>

                <div className="grid gap-2 mt-4">
                  <Label htmlFor="rejectionReason">Reason for Rejection</Label>
                  <Textarea
                    id="rejectionReason"
                    placeholder="Optional: Why are you rejecting?"
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                  />
                </div>
                <Button
                  variant="outline"
                  onClick={() => handleFinalizePublic("reject")}
                >
                  Reject Document
                </Button>
              </>
            ) : (
              <div className="text-center text-lg font-medium text-gray-700">
                This document has already been{" "}
                <span className="font-bold">{signatureRequest.status}.</span>
                {signatureRequest.signedBy && (
                  <p className="text-sm mt-2">
                    Signed By: {signatureRequest.signedBy}
                  </p>
                )}
                {signatureRequest.rejectionReason && (
                  <p className="text-sm mt-2">
                    Reason: {signatureRequest.rejectionReason}
                  </p>
                )}
              </div>
            )}
            <Button variant="outline" onClick={() => navigate("/")}>
              Back to Homepage
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default SignDocumentPage;
