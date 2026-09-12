import PageMeta from "../../components/common/PageMeta";
import AuthLayout from "./AuthPageLayout";
import SignInForm from "../../components/auth/SignInForm";

export default function SignIn() {
  return (
    <>
      <PageMeta
        title="Masuk | Klinik Sepatu"
        description="Halaman masuk dashboard Klinik Sepatu."
      />
      <AuthLayout>
        <SignInForm />
      </AuthLayout>
    </>
  );
}
