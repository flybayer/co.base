import { BlitzPage } from "blitz"
import { Text, Title, UnorderedList } from "app/core/components/Common"
import { HomeLayout } from "app/core/layouts/HomeLayout"

const WhyCobase: BlitzPage = () => {
  return (
    <>
      <img src="/cobase-logo-latest.svg" />
      <Title>cobase.dev</Title>
      <Text>
        <i>The problem:</i> Your non-technical team needs <b>direct access</b> to the{" "}
        <b>content and settings</b> of your website/app. But you have <b>no time</b> to build an{" "}
        <b>internal control panel</b> for them.
      </Text>
      <Text>
        <i>The solution:</i> <b>cobase</b> is your new favorite <b>content and settings database</b>
        , because it:
      </Text>
      <UnorderedList>
        <li>
          Features a <b>beautiful dashboard</b>, with <b>strict validation</b> of all data
        </li>
        <li>
          Creates a <b>type-safe client</b> for your <b>TypeScript+React</b> app
        </li>
        <li>
          Is entirely <b>Open Source</b> under the liberal Apache2 License
        </li>
        <li>
          Offers a <b>hosted</b> service, but you can <b>self-host</b> if you prefer
        </li>
      </UnorderedList>
    </>
  )
}

WhyCobase.suppressFirstRenderFlicker = true
WhyCobase.getLayout = (page) => <HomeLayout title="cobase.dev">{page}</HomeLayout>

export default WhyCobase
