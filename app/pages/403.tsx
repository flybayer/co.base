import { Head } from "blitz"
import { ErrorPage } from "app/core/components/ErrorPage"

export default function Page403() {
  const statusCode = 403
  const title = "Can't touch this"
  return (
    <>
      <Head>
        <title>
          {statusCode}: {title}
        </title>
      </Head>
      <ErrorPage statusCode={statusCode} title={title} />
    </>
  )
}
