import { AuthLayout } from "@/components/layout/AuthLayout";
import { LoginForm } from "@/components/auth/LoginForm";
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Login - Nutrition Navigator',
  description: 'Log in to your Nutrition Navigator account.',
};

export default function LoginPage() {
  return (
    <AuthLayout title="Welcome Back!" description="Log in to continue your nutritional journey.">
      <LoginForm />
    </AuthLayout>
  );
}
