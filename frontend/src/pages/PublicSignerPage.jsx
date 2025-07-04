// /pages/PublicSignerPage.jsx
import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import { Input } from "../components/ui/input";
import { Button } from "../components/ui/button";
import { toast } from "sonner";


const PublicSignerPage = () => {
  const { token } = useParams();
  const navigate = useNavigate();

  const [documentUrl, setDocumentUrl] = useState("");
  const [action, setAction] = useState(""); // "sign" or "reject"
  const [name, setName] = useState("");
  const [reason, setReason] = useState("");

  useEffect(() => {
    setDocumentUrl(`https://document-signature-app.onrender.com/api/signatures/public/${token}`);
  }, [token]);

  const handleSubmit = async () => {
    if (!name) {
      toast.error("Name required to sign/reject");
      return;
    }

    if (action === "reject" && !reason) {
      toast.error("Reason required for rejection");
      return;
    }

    try {
      await axios.post("https://document-signature-app.onrender.com/api/signatures/finalize-public", {
        token,
        action,
        name,
        reason,
      });

      toast.success(
        action === "sign" ? "Document Signed Successfully" : "Document Rejected"
      );

      // ✅ Redirect to dashboard after success
      navigate("/dashboard");
    } catch (err) {
      toast.error("Failed to submit response", {
        description: err.response?.data?.error || err.message,
      });
    }
  };

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Review & Sign Document</h1>

      <div className="border rounded mb-6 overflow-hidden shadow">
        <iframe
          src={documentUrl}
          className="w-full"
          height="600"
          title="Document Preview"
        />
      </div>

      <div className="grid gap-4">
        <Input
          placeholder="Your Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />

        <div className="flex gap-4">
          <Button
            variant={action === "sign" ? "default" : "outline"}
            onClick={() => setAction("sign")}
          >
            Sign
          </Button>
          <Button
            variant={action === "reject" ? "destructive" : "outline"}
            onClick={() => setAction("reject")}
          >
            Reject
          </Button>
        </div>

        {action === "reject" && (
          <Input
            placeholder="Reason for rejection"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
          />
        )}

        <Button
          onClick={handleSubmit}
          disabled={!action || !name || (action === "reject" && !reason)}
        >
          Submit
        </Button>
      </div>
    </div>
  );
};

export default PublicSignerPage;
