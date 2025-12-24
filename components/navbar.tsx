"use client"

import Image from "next/image"
import { Button } from "@/components/ui/button"
import { ExternalLink } from "lucide-react"

export function Navbar() {
  return (
    <nav className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <div className="flex items-center">
            <Image
              src="/logo.png"
              alt="Roots Logo"
              width={120}
              height={40}
              className="h-8 w-auto object-contain"
              priority
            />
          </div>

          {/* Navigation Actions */}
          <div className="flex items-center gap-4">
            <Button
              variant="default"
              size="default"
              onClick={() => window.open("https://roots-jo.co/", "_blank")}
              className="gap-2"
            >
              <span>Go to Website</span>
              <ExternalLink className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </nav>
  )
}

