import React from "react";
import { Button } from "./ui/button";

const DashboardHeader = ({ user, onLogout }) => {
  return (
    <div className="flex justify-between items-center mb-8">
      <h1 className="text-3xl font-bold text-gray-800">
        Welcome, {user.username}!
      </h1>
      <Button onClick={onLogout} variant="destructive">
        Logout
      </Button>
    </div>
  );
};

export default DashboardHeader;
