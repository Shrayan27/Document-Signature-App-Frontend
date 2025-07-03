import React, { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "./ui/card";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Button } from "./ui/button";
import { toast } from "sonner"; // Assuming toast is available globally or passed down

const UploadDocumentCard = ({ onCreateSignatureRequest }) => {
  const [selectedFile, setSelectedFile] = useState(null);
  const [signerEmail, setSignerEmail] = useState("");

  const handleFileChange = (event) => {
    setSelectedFile(event.target.files[0]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedFile) {
      toast.error("No file selected", {
        description: "Please choose a PDF file to upload.",
      });
      return;
    }
    if (!signerEmail) {
      toast.error("Signer Email Required", {
        description: "Please enter the email of the person who needs to sign.",
      });
      return;
    }

    // Call the parent handler for actual API call
    await onCreateSignatureRequest(selectedFile, signerEmail);

    // Reset form after successful submission (handled by parent's refresh and state clear)
    setSelectedFile(null);
    setSignerEmail("");
    // Clear file input manually
    if (e.target.elements.pdfFile) {
      e.target.elements.pdfFile.value = '';
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Upload Document & Request Signature</CardTitle>
        <CardDescription>
          Select a PDF file and specify the signer's email.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="grid gap-4">
          <div className="grid gap-2">
            <Label htmlFor="pdfFile">PDF File</Label>
            <Input
              id="pdfFile"
              type="file"
              accept="application/pdf"
              onChange={handleFileChange}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="signerEmail">Signer Email</Label>
            <Input
              id="signerEmail"
              type="email"
              placeholder="signer@example.com"
              required
              value={signerEmail}
              onChange={(e) => setSignerEmail(e.target.value)}
            />
          </div>
          <Button type="submit" disabled={!selectedFile || !signerEmail}>
            Upload & Send Request
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};

export default UploadDocumentCard;