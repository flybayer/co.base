import { Head } from "blitz"
import { ErrorPage } from "app/core/components/ErrorPage"

export default function Page500() {
  const statusCode = 500
  const title = "Oh no, we booped!"
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
