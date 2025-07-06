import { createFileRoute, Link, Navigate } from "@tanstack/react-router";
import { useIsAuthenticated } from "~/stores/auth";
import { Button } from "~/components/ui/Button";
import { Shield, FileText, Users, BarChart3 } from "lucide-react";

export const Route = createFileRoute("/")({
  component: Home,
});

function Home() {
  const isAuthenticated = useIsAuthenticated();

  if (isAuthenticated) {
    return <Navigate to="/dashboard" />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center">
              <h1 className="text-2xl font-bold text-blue-600">VaultSpace</h1>
            </div>
            <div className="flex items-center space-x-4">
              <Link to="/auth/login">
                <Button variant="outline">Sign In</Button>
              </Link>
              <Link to="/auth/register">
                <Button className="bg-blue-600 hover:bg-blue-700">Get Started</Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
          <div className="text-center">
            <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6">
              Secure Virtual
              <span className="text-blue-600"> Data Room</span>
            </h1>
            <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
              Share sensitive documents securely during M&A, fundraising, and due diligence processes. 
              Enterprise-grade security with comprehensive audit trails and user management.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/auth/register">
                <Button size="lg" className="bg-blue-600 hover:bg-blue-700">
                  Start Free Trial
                </Button>
              </Link>
              <Button size="lg" variant="outline">
                Watch Demo
              </Button>
            </div>
          </div>
        </div>

        {/* Features Section */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Everything you need for secure document sharing
            </h2>
            <p className="text-xl text-gray-600">
              Built for investment banks, law firms, and corporate teams
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="bg-white rounded-lg shadow-lg p-6">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
                <Shield className="h-6 w-6 text-blue-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Enterprise Security</h3>
              <p className="text-gray-600">
                End-to-end encryption, dynamic watermarks, and granular access controls
              </p>
            </div>

            <div className="bg-white rounded-lg shadow-lg p-6">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-4">
                <FileText className="h-6 w-6 text-green-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Document Management</h3>
              <p className="text-gray-600">
                Organize files with folders, version control, and full-text search
              </p>
            </div>

            <div className="bg-white rounded-lg shadow-lg p-6">
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-4">
                <Users className="h-6 w-6 text-purple-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">User Management</h3>
              <p className="text-gray-600">
                Role-based permissions, bulk invitations, and SSO integration
              </p>
            </div>

            <div className="bg-white rounded-lg shadow-lg p-6">
              <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center mb-4">
                <BarChart3 className="h-6 w-6 text-orange-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Analytics & Reporting</h3>
              <p className="text-gray-600">
                Detailed activity logs, user engagement metrics, and audit reports
              </p>
            </div>
          </div>
        </div>

        {/* CTA Section */}
        <div className="bg-blue-600">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
            <div className="text-center">
              <h2 className="text-3xl font-bold text-white mb-4">
                Ready to secure your documents?
              </h2>
              <p className="text-xl text-blue-100 mb-8">
                Join thousands of professionals who trust VaultSpace
              </p>
              <Link to="/auth/register">
                <Button size="lg" className="bg-white text-blue-600 hover:bg-gray-100">
                  Get Started Today
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="text-center">
            <h3 className="text-white text-lg font-semibold mb-4">VaultSpace</h3>
            <p className="text-gray-400">
              © 2024 VaultSpace. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
