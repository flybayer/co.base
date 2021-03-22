import { ContentLayout } from "app/core/components/ContentLayout"
import { SiteLayout } from "app/core/layouts/SiteLayout"

function SitePage() {
  return <ContentLayout title="Site:"></ContentLayout>
}

SitePage.getLayout = (page) => (
  <SiteLayout title="Sites" active="data">
    {page}
  </SiteLayout>
)

export default SitePage
