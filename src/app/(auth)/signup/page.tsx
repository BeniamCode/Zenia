import { AuthLayout } from "@/components/layout/AuthLayout";
import { SignUpForm } from "@/components/auth/SignUpForm";
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Sign Up - Nutrition Navigator',
  description: 'Create your Nutrition Navigator account to start tracking your meals.',
};

export default function SignUpPage() {
  return (
    <AuthLayout title="Create Account" description="Join Nutrition Navigator and take control of your diet.">
      <SignUpForm />
    </AuthLayout>
  );
}
