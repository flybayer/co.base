import { Head } from "blitz"
import { ErrorPage } from "app/core/components/ErrorPage"

export default function Page404() {
  const statusCode = 404
  const title = "This page could not be found"
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
