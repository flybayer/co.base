import { useRouter, BlitzPage } from "blitz"
import { SignupForm } from "app/auth/components/SignupForm"
import { MainLayout } from "app/core/layouts/MainLayout"

const SignupPage: BlitzPage = () => {
  const router = useRouter()

  return (
    <div>
      <SignupForm onSuccess={() => router.push("/")} />
    </div>
  )
}

SignupPage.redirectAuthenticatedTo = "/"
SignupPage.getLayout = (page) => <MainLayout title="Sign Up">{page}</MainLayout>

export default SignupPage
