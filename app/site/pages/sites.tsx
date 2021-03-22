import { useMutation, useQuery } from "@blitzjs/core"
import { ContentLayout } from "app/core/components/ContentLayout"
import LabeledTextField from "app/core/components/LabeledTextField"
import { LinkList } from "app/core/components/LinkList"
import { ButtonModalForm } from "app/core/components/ModalForm"
import { MainLayout } from "app/core/layouts/MainLayout"
import getUserSites from "app/site/queries/getUserSites"
import createSite from "../mutations/createSite"
import { CreateSite } from "../validations"

function SitePage() {
  const [sites, { setQueryData }] = useQuery(getUserSites, null)
  const [submit] = useMutation(createSite)
  return (
    <ContentLayout title="My Sites">
      <LinkList
        items={sites}
        getKey={(item) => item.name}
        getLabel={(item) => item.name}
        getHref={(item) => `/s/${item.name}`}
      />
      <ButtonModalForm
        submitText="Create Site"
        buttonText="New Site"
        schema={CreateSite}
        initialValues={{ name: "" }}
        title="Start a new Site"
        handleSubmit={submit}
        onComplete={(values, resp) => {
          setQueryData((mySites) => {
            const newSite = { ...values, ...resp }
            return mySites ? [...mySites, newSite] : [newSite]
          })
        }}
      >
        <LabeledTextField name="name" label="Site Name" />
      </ButtonModalForm>
    </ContentLayout>
  )
}

SitePage.getLayout = (page) => (
  <MainLayout title="Sites" active="sites">
    {page}
  </MainLayout>
)

export default SitePage
