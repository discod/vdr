import { createFileRoute, Link, Navigate } from "@tanstack/react-router";
import { RegisterForm } from "~/components/auth/RegisterForm";
import { useIsAuthenticated } from "~/stores/auth";

export const Route = createFileRoute("/auth/register/")({
  component: RegisterPage,
});

function RegisterPage() {
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
        <RegisterForm />
        
        <div className="mt-6 text-center">
          <p className="text-sm text-gray-600">
            Already have an account?{" "}
            <Link
              to="/auth/login"
              className="font-medium text-blue-600 hover:text-blue-500"
            >
              Sign in here
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
