import React from 'react'
import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { TbCircleLetterZFilled } from "react-icons/tb";

const HomePage = () => {
  return (
    <div className="mt-30 w-screen flex justify-center items-center">
      <Card className="pt-5 px-10 pb-8">
        <CardContent className="flex flex-col items-center text-center">
          {/* Logo */}
         <TbCircleLetterZFilled className="text-purple-600 mb-4" size={80} />

          {/* Title */}
          <h1 className="text-2xl font-bold mb-2">Welcome to Zignature</h1>

          {/* App Description */}
          <p className="text-gray-600 mb-6 max-w-sm">
            Zignature is a secure digital signature app that lets you sign, send, and manage documents effortlessly. Streamline your workflow and eliminate paperwork.
          </p>

          {/* Buttons */}
          <div className="flex gap-6">
            <Button>
              <Link to="/login">Login</Link>
            </Button>
            <Button>
              <Link to="/register">Register</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default HomePage


