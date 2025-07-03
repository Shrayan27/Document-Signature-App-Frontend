import React from "react";
import { TableCell, TableRow } from "./ui/table";
import { Button } from "./ui/button";
import { Link } from "react-router-dom";
import { Trash2 } from 'lucide-react';

const SignatureRequestRow = ({ request, currentUser, onDeleteDocument }) => {
  const isCreator = request.userId === currentUser?._id;
  const isSigner = request.signerEmail === currentUser?.email;

const handleInnerDeleteClick = () => {
    if (typeof onDeleteDocument === 'function' && isCreator && request.documentId) {
      onDeleteDocument(request.documentId._id, request.documentId.originalName);
    } else {
        console.warn("Delete conditions not met or onDeleteDocument is not a function", {
            onDeleteDocument: typeof onDeleteDocument,
            isCreator,
            hasDocumentId: !!request.documentId
        });
    }
  };

  return (
    <TableRow>
      <TableCell className="font-medium">
        {request.documentId?.originalName || request.documentId?.originalname
          ? request.documentId.originalName || request.documentId?.originalname
          : `Document #${request.documentId?._id || "N/A"}`}
      </TableCell>
      <TableCell>{request.signerEmail}</TableCell>
      <TableCell>
        <span
          className={`px-2 py-1 rounded-full text-xs font-semibold
            ${
              request.status === "pending"
                ? "bg-yellow-100 text-yellow-800"
                : ""
            }
            ${request.status === "signed" ? "bg-green-100 text-green-800" : ""}
            ${request.status === "rejected" ? "bg-red-100 text-red-800" : ""}
          `}
        >
          {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
        </span>
      </TableCell>
      <TableCell>{new Date(request.createdAt).toLocaleDateString()}</TableCell>
      <TableCell className="text-right flex items-center justify-end space-x-2">
        {/* Link for the creator to view/manage the signature placement */}
        {isCreator && request.documentId?._id && (
          <Link to={`/document/${request.documentId._id}`}>
            <Button variant="outline" size="sm" className="mr-2">
              View Details
            </Button>
          </Link>
        )}

        {/* Link for the actual signer to sign/reject (if they are the current user and it's pending) */}
        {isSigner && request.status === "pending" && (
          <Link to={`/sign/${request.token}`}>
            <Button size="sm">Sign/Reject</Button>
          </Link>
        )}
        {/* If signed/rejected, allow viewing the public link (for anyone) */}
        {(request.status === "signed" || request.status === "rejected") && (
          <a
            href={`http://localhost:3000/api/signatures/public/${request.token}`}
            target="_blank"
            rel="noopener noreferrer"
          >
            <Button variant="secondary" size="sm">
              View Doc
            </Button>
          </a>
        )}

         {isCreator && (
          <Button
            variant="destructive"
            size="sm"
            onClick={handleInnerDeleteClick}
            className="ml-2"
          >
            <Trash2 className="h-4 w-4 mr-1" /> Delete Document
          </Button>
        )}

      </TableCell>
      
    </TableRow>
  );
};

export default SignatureRequestRow;
