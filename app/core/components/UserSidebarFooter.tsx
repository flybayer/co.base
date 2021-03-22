import { Button } from "@chakra-ui/button"
import Link from "next/link"
import styled from "@emotion/styled"
import { useCurrentUser } from "../hooks/useCurrentUser"
import { useMutation } from "@blitzjs/core"
import logout from "app/auth/mutations/logout"

const SidebarFooter = styled.div`
  background: #eee;
`

export const UserInfo = () => {
  const currentUser = useCurrentUser()
  const [logoutMutation] = useMutation(logout)

  if (currentUser) {
    return (
      <>
        <Button
          onClick={async () => {
            await logoutMutation()
          }}
        >
          Logout
        </Button>
        <div>{currentUser.name || "Anon User"}</div>
      </>
    )
  } else {
    return (
      <>
        <Link href="/signup">
          <a className="button small">
            <strong>Sign Up</strong>
          </a>
        </Link>
        <Link href="/login">
          <a className="button small">
            <strong>Login</strong>
          </a>
        </Link>
      </>
    )
  }
}

export const UserSidebarFooter = () => {
  return (
    <SidebarFooter>
      <UserInfo />
    </SidebarFooter>
  )
}
