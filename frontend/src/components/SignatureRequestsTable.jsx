import React, { useState, useMemo, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "./ui/card";
import { Input } from "./ui/input";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "./ui/table";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "./ui/tabs";
import { Button } from "./ui/button";
import SignatureRequestRow from "./SignatureRequestRow"; // Import the new row component

const SignatureRequestsTable = ({ requests, currentUser, onDeleteDocument }) => {
  const [filterStatus, setFilterStatus] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5; // You can adjust this number

  // Filter requests based on status and search term

  const filteredAndSearchedRequests = useMemo(() => {
    let filtered = requests;

    if (filterStatus !== "all") {
      filtered = filtered.filter((request) => request.status === filterStatus);
    }

    if (searchTerm) {
      const lowerCaseSearchTerm = searchTerm.toLowerCase();

      filtered = filtered.filter((request) => {
        const doc = request.documentId || {};

        const docName = (
          doc.originalName ||
          doc.originalname ||
          ""
        ).toLowerCase();

        return (
          docName.includes(lowerCaseSearchTerm) ||
          request.signerEmail.toLowerCase().includes(lowerCaseSearchTerm) ||
          request.status.toLowerCase().includes(lowerCaseSearchTerm)
        );
      });
    }

    return filtered;
  }, [requests, filterStatus, searchTerm]);

  // Pagination logic
  const totalPages = Math.ceil(
    filteredAndSearchedRequests.length / itemsPerPage
  );
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedRequests = filteredAndSearchedRequests.slice(
    startIndex,
    endIndex
  );

  const handleNextPage = () => {
    setCurrentPage((prev) => Math.min(prev + 1, totalPages));
  };

  const handlePreviousPage = () => {
    setCurrentPage((prev) => Math.max(prev - 1, 1));
  };

  // Reset page to 1 whenever filters or search term changes
  // This useEffect ensures pagination restarts when content changes
  useEffect(() => {
    setCurrentPage(1);
  }, [filterStatus, searchTerm]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Your Signature Requests</CardTitle>
        <CardDescription>
          Manage documents you've sent or need to sign.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {/* Search Input */}
        <div className="mb-4">
          <Input
            placeholder="Search documents or signer email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full"
          />
        </div>

        {/* Status Tabs */}
        <Tabs
          defaultValue="all"
          className="w-full mb-4"
          onValueChange={setFilterStatus}
        >
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="pending">Pending</TabsTrigger>
            <TabsTrigger value="signed">Signed</TabsTrigger>
            <TabsTrigger value="rejected">Rejected</TabsTrigger>
          </TabsList>
          {/* TabsContent here is purely for styling the container, actual filtering handled by state */}
          <TabsContent value={filterStatus} className="mt-4">
            {paginatedRequests.length === 0 ? (
              <p className="text-center text-gray-500 py-4">
                {searchTerm || filterStatus !== "all"
                  ? "No matching signature requests found."
                  : "No signature requests found."}
              </p>
            ) : (
              <>
                <Table>
                  <TableCaption>
                    A list of your signature requests.
                  </TableCaption>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Document</TableHead>
                      <TableHead>Signer Email</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Requested At</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                     {/* ⭐ ADD/UPDATE THE FOLLOWING CODE HERE ⭐ */}
                    {paginatedRequests.map((request) => (
                      <SignatureRequestRow
                        key={request._id} // <-- KEY HERE
                        request={request}
                        currentUser={currentUser}
                        onDeleteDocument={onDeleteDocument} // Make sure onDeleteDocument is passed
                      />
                    ))}
                  </TableBody>
                </Table>

                {/* Pagination Controls */}
                {totalPages > 1 && (
                  <div className="flex justify-end items-center space-x-2 mt-4">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handlePreviousPage}
                      disabled={currentPage === 1}
                    >
                      Previous
                    </Button>
                    <span className="text-sm">
                      Page {currentPage} of {totalPages}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleNextPage}
                      disabled={currentPage === totalPages}
                    >
                      Next
                    </Button>
                  </div>
                )}
              </>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default SignatureRequestsTable;
