import { createFileRoute, Link, Navigate } from "@tanstack/react-router";
import { LoginForm } from "~/components/auth/LoginForm";
import { useIsAuthenticated } from "~/stores/auth";

export const Route = createFileRoute("/auth/login/")({
  component: LoginPage,
});

function LoginPage() {
  const isAuthenticated = useIsAuthenticated();

  if (isAuthenticated) {
    return <Navigate to="/dashboard" />;
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-blue-600 mb-2">VaultSpace</h1>
          <p className="text-gray-600">Secure Virtual Data Room</p>
        </div>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <LoginForm />
        
        <div className="mt-6 text-center">
          <p className="text-sm text-gray-600">
            Don't have an account?{" "}
            <Link
              to="/auth/register"
              className="font-medium text-blue-600 hover:text-blue-500"
            >
              Sign up here
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
