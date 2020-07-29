import '../styles/globals.css'
import Head from 'next/head'

import React from 'react'
import {MDXProvider} from '@mdx-js/react'

const mdComponents = {
    h1: props => <h1 style={{color: 'tomato'}} {...props} />
}

function Page({children, meta}) {
	return <>
	      <Head>
        <title>{meta?.title || 'Aven'}</title>
        <link rel="icon" href="/favicon.ico" />
      </Head>
	 	{children}
	 	</>
}

export default ({Component, pageProps}) => {
	if (Component.renderStandalone) {
		return <Component {...pageProps} />
	}
	return 	<Page meta={Component.meta}>
	<MDXProvider components={mdComponents}>
        <Component {...pageProps} />
    </MDXProvider>
    </Page>
}
