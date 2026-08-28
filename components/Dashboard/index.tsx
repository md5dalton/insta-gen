"use client"
import React, { useState } from "react"
import Header from "./Header"
import Logo from "./Logo"
import Navigation from "./Navigation"

interface LayoutProps {
    children: React.ReactNode
}

export default ({
    children
}: LayoutProps) => {
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

    return (
        <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col antialiased">
            {/* Top Application Bar */}
            <Header>
                <Logo
                    menuHandler={() => setMobileMenuOpen(!mobileMenuOpen)}
                    isOpen={mobileMenuOpen}
                />
            </Header>

            <div className="flex-1 flex overflow-hidden">
                {/* Left Sidebar Navigation */}
                <Navigation
                    closeMenu={() => setMobileMenuOpen(false)}
                    isOpen={mobileMenuOpen}
                />
              
                {/* Main Content Area */}
                <main className="flex-1 overflow-y-auto bg-slate-900">
                    <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">{children}</div>
                </main>
            </div>
        </div>
    )
}
