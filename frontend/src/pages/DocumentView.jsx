// src/pages/DocumentView.jsx
import React, { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import { Document, Page, pdfjs } from "react-pdf";
import DraggableSignature from "../components/DraggableSignature";
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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "../components/ui/alert-dialog";

import workerSrc from "pdfjs-dist/build/pdf.worker.min.mjs?url";

pdfjs.GlobalWorkerOptions.workerSrc = workerSrc;

const DocumentView = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [existingSigPages, setExistingSigPages] = useState([]);

  const [documentUrl, setDocumentUrl] = useState(null);
  const [documentData, setDocumentData] = useState(null);
  const [numPages, setNumPages] = useState(null);
  const [signatureText, setSignatureText] = useState("");
  const [fontSize, setFontSize] = useState(16); // default font size
  const [fontFamily, setFontFamily] = useState("Arial");
  const [color, setColor] = useState("#1E40AF"); // Tailwind blue-800 default
  const [isBold, setIsBold] = useState(false);
  const [isUnderline, setIsUnderline] = useState(false);
  const [signaturePosition, setSignaturePosition] = useState({ x: 0, y: 0 });
  const [initialSignatureId, setInitialSignatureId] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentUserEmail, setCurrentUserEmail] = useState("");
  const [signaturePage, setSignaturePage] = useState(1);

  useEffect(() => {
    const fetchDocumentAndUser = async () => {
      try {
        const userRes = await axios.get(
          "https://document-signature-app.onrender.com/api/auth/get-user",
          {
            withCredentials: true,
          }
        );
        setCurrentUserEmail(userRes.data.user.email);

        const docRes = await axios.get(`https://document-signature-app.onrender.com/api/docs/${id}`, {
          withCredentials: true,
        });

        setDocumentData(docRes.data);
        const constructedUrl = `https://document-signature-app.onrender.com/${docRes.data.path.replace(
          /\\/g,
          "/"
        )}`;
        setDocumentUrl(constructedUrl);

        const signaturesRes = await axios.get(
          `https://document-signature-app.onrender.com/api/signatures/my-requests`,
          { withCredentials: true }
        );

        const existingSig = signaturesRes.data.find(
          (sig) =>
            sig.documentId?._id === id && sig.userId === userRes.data.user._id
        );

        if (existingSig) {
          setInitialSignatureId(existingSig._id);
          // Assuming existingSig.pages is an array of objects like { page, x, y, signatureText, fontSize }
          setExistingSigPages(existingSig.pages || []);

          // Find the signature data for the current page (default to page 1)
          const match = (existingSig.pages || []).find((p) => p.page === 1);
          if (match) {
            setSignatureText(match.signatureText || "");
            setSignaturePage(match.page);
            setFontSize(match.fontSize || 16);
            setSignaturePosition({ x: match.x, y: match.y });
          } else {
            // If no signature on page 1, set defaults
            setSignatureText("");
            setFontSize(16);
            setSignaturePosition({ x: 100, y: 100 });
          }
        }
      } catch (err) {
        setError(err.response?.data?.message || "Failed to load data");
        toast.error("Error loading document", {
          description: err.message,
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchDocumentAndUser();
  }, [id]);

  useEffect(() => {
    const match = existingSigPages.find((p) => p.page === signaturePage);
    if (match) {
      setSignatureText(match.signatureText || "");
      setFontSize(match.fontSize || 16);
      setSignaturePosition({ x: match.x, y: match.y });
    } else {
      // Clear for new page if no existing signature
      setSignatureText("");
      setFontSize(16);
      setSignaturePosition({ x: 100, y: 100 });
    }
  }, [signaturePage, existingSigPages]);

  const onDocumentLoadSuccess = useCallback(({ numPages }) => {
    setNumPages(numPages);
    console.log("PDF Document Load Success! Number of pages:", numPages); // Keep this log
  }, []);

  const createSignatureRequest = async () => {
    if (!documentData || !currentUserEmail) {
      toast.error("Document or user email not loaded.");
      return;
    }

    try {
      const res = await axios.post(
        "https://document-signature-app.onrender.com/api/signatures",
        {
          documentId: documentData._id,
          x: signaturePosition.x,
          y: signaturePosition.y,
          page: signaturePage,
          signerEmail: currentUserEmail,
        },
        { withCredentials: true }
      );
      setInitialSignatureId(res.data._id);
      toast.success("Signature area placed successfully!");
    } catch (err) {
      toast.error("Error placing signature", {
        description:
          err.response?.data?.error || "Failed to create signature request.",
      });
    }
  };

  const finalizeSignature = async () => {
    if (!initialSignatureId || !signatureText) {
      toast.error("Please enter signature text and place the signature.");
      return;
    }

    try {
      await axios.post(
        "https://document-signature-app.onrender.com/api/signatures/finalize",
        {
          signatureId: initialSignatureId,
          signatureText,
          x: signaturePosition.x,
          y: signaturePosition.y,
          page: signaturePage,
          fontSize,
          fontFamily,
          color,
          isBold,
          isUnderline,
        },
        { withCredentials: true }
      );

      toast.success("Signature finalized and embedded!");
      navigate("/dashboard");
    } catch (err) {
      toast.error("Finalize Failed", {
        description:
          err.response?.data?.error || "Could not finalize signature.",
      });
    }
  };

  const handleDrag = (newPos) => {
    setSignaturePosition(newPos);
  };

  // Handlers for page navigation
  const goToPreviousPage = () => {
    setSignaturePage((prevPage) => Math.max(1, prevPage - 1));
  };

  const goToNextPage = () => {
    setSignaturePage((prevPage) => Math.min(numPages, prevPage + 1));
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <p className="text-lg text-gray-700">Loading document...</p>
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

  if (!documentUrl) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <p className="text-lg text-gray-700">Document not found.</p>
      </div>
    );
  }

  console.log("initialsignatureid ", initialSignatureId);
  console.log("existingSigPages ", existingSigPages);
  console.log("signaturepage ", signaturePage);

  return (
    <div className="flex flex-col items-center p-8 bg-gray-50 min-h-screen">
      <h1 className="text-3xl font-bold mb-6 text-gray-800">
        Sign Document:{" "}
        {documentData?.originalName ||
          documentData?.originalname ||
          "Loading..."}
      </h1>

      <div className="flex w-full max-w-6xl bg-white shadow-lg rounded-lg overflow-hidden mb-6 flex-col md:flex-row">
        {/* PDF Viewer Section */}
        <div className="flex-1 p-4 relative min-h-[400px] md:min-h-0">
          <Document
            file={documentUrl}
            onLoadSuccess={onDocumentLoadSuccess}
            onLoadError={(err) => {
              console.error("PDF Load Error in Document component:", err);
              toast.error("PDF failed to load. Check console for details.");
            }}
          >
            {numPages !== null && numPages > 0 ? (
              <div
                key={`page_${signaturePage}`}
                className="relative my-4 border border-dashed border-gray-200"
                style={{ width: "fit-content", margin: "auto" }}
              >
                <Page
                  pageNumber={signaturePage}
                  width={800} // Consider making this responsive, e.g., use a ref and adjust width based on container
                  renderAnnotationLayer={false}
                  renderTextLayer={false}
                />
                {initialSignatureId && (
                  <div className="absolute top-0 left-0 w-full h-full z-50">
                    <DraggableSignature
                      signatureText={signatureText || "Drag and Type Here"}
                      position={signaturePosition}
                      onDrag={handleDrag}
                      fontSize={fontSize}
                      fontFamily={fontFamily}
                      color={color}
                      isBold={isBold}
                      isUnderline={isUnderline}
                    />
                  </div>
                )}
              </div>
            ) : (
              <div className="flex justify-center items-center h-96">
                Loading PDF pages...
              </div>
            )}
          </Document>
        </div>

        {/* Signature Controls Section */}
        <Card className="w-full w-80 flex-shrink-0 border-t md:border-t-0 md:border-l rounded-none p-4">
          {/* Added p-4 for internal padding */}
          <CardHeader className="px-0 pt-0 pb-4">
            {" "}
            {/* Adjusted CardHeader padding */}
            <CardTitle>Signature Controls</CardTitle>
            <CardDescription>
              Customize and finalize your signature.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 px-0">
            {" "}
            {/* Adjusted CardContent padding */}
            {/* Signature Text */}
            <div className="space-y-1">
              <Label htmlFor="signatureText">Type Your Signature</Label>
              <Input
                id="signatureText"
                type="text"
                placeholder="e.g., John Doe"
                value={signatureText}
                onChange={(e) => setSignatureText(e.target.value)}
              />
            </div>
            {/* Font Size and Family */}
            <div className="space-y-1">
              <Label>Font Size & Family</Label>
              <div className="flex items-center gap-2">
                <Input
                  id="fontSize"
                  type="number"
                  min="8"
                  max="72"
                  value={fontSize}
                  onChange={(e) => setFontSize(Number(e.target.value))}
                  className="w-20"
                />
                <select
                  value={fontFamily}
                  onChange={(e) => setFontFamily(e.target.value)}
                  className="border rounded px-2 py-1 text-sm flex-1 min-w-0" // Use flex-1 and min-w-0
                >
                  <option value="Arial">Arial</option>
                  <option value="Times New Roman">Times New Roman</option>
                  <option value="Courier New">Courier New</option>
                  <option value="Georgia">Georgia</option>
                  <option value="Verdana">Verdana</option>
                  <option value="monospace">Monospace</option>
                  <option value="Dancing Script">
                    Dancing Script
                  </option>
                  <option value="'Pacifico', cursive">Pacifico</option>
                  <option value="'Great Vibes', cursive">Great Vibes</option>
                </select>
              </div>
            </div>
            {/* Text Styling */}
            <div className="space-y-1">
              <Label>Text Styling</Label>
              <div className="flex items-center gap-2 flex-wrap">
                {" "}
                {/* Added flex-wrap */}
                <Button
                  type="button"
                  variant={isBold ? "default" : "outline"}
                  onClick={() => setIsBold(!isBold)}
                  size="sm"
                >
                  <strong>B</strong>
                </Button>
                <Button
                  type="button"
                  variant={isUnderline ? "default" : "outline"}
                  onClick={() => setIsUnderline(!isUnderline)}
                  size="sm"
                >
                  <span className="underline">U</span>
                </Button>
                <input
                  type="color"
                  value={color}
                  onChange={(e) => setColor(e.target.value)}
                  title="Text Color"
                  className="h-8 w-8 p-0 border rounded cursor-pointer"
                />
              </div>
            </div>
            {/* Page Controls */}
            <div className="space-y-1">
              <Label htmlFor="signaturePage">Page Number</Label>
              <div className="flex items-center gap-2">
                <Button
                  onClick={goToPreviousPage}
                  disabled={signaturePage === 1}
                  variant="outline"
                  size="sm"
                >
                  Previous
                </Button>
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
                        Math.min(numPages || 1, Number(e.target.value))
                      )
                    )
                  }
                  className="w-16 text-center"
                />
                <Button
                  onClick={goToNextPage}
                  disabled={signaturePage === numPages}
                  variant="outline"
                  size="sm"
                >
                  Next
                </Button>
              </div>
              <p className="text-sm text-gray-500 text-center">
                Page {signaturePage} of {numPages || 1}
              </p>
            </div>
            {/* Signature Action */}
            {!initialSignatureId ? (
              <Button
                onClick={createSignatureRequest}
                disabled={!documentUrl || !currentUserEmail}
                className="w-full"
              >
                Place Signature Area
              </Button>
            ) : (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button disabled={!signatureText} className="w-full">
                    Finalize Signature
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This will embed your signature permanently. You won’t be
                      able to change it later.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={finalizeSignature}>
                      Confirm Finalize
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}
            <Button
              variant="outline"
              onClick={() => navigate("/dashboard")}
              className="w-full"
            >
              Back to Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default DocumentView;
