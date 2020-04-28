import { startFSStorageSource } from '@aven/cloud-fs';
import { createCloud } from '@aven/cloud-core';

require('dotenv').config();
const fetch = require('node-fetch');

async function doV2get(query) {
  const res = await fetch(`https://api.digitalocean.com/v2/${query}`, {
    headers: {
      Authorization: `Bearer ${process.env.DIGITALOCEAN_API_KEY}`,
    },
  });
  const resJSON = await res.json();
  return resJSON;
}
const PAGE_SIZE = 50;
async function doV2QueryAll(query, getPageData) {
  const all = [];
  let total = null;
  let page = 1;
  while (total === null || total !== all.length) {
    const result = await doV2get(`${query}page=${page}&per_page=${PAGE_SIZE}`);
    const pageData = getPageData(result);
    total = result?.meta?.total || pageData.length;
    pageData.forEach(item => all.push(item));
    if (pageData.length < PAGE_SIZE && all.length !== total) {
      throw new Error('Error finding all items!');
    }
    page += 1;
  }
  return all;
}
const droplets = {
  get: () => doV2QueryAll('droplets?', res => res.droplets),
};
const regions = {
  get: () => doV2QueryAll('regions?', res => res.regions),
};
const images = {
  get: () => doV2QueryAll('images?type=distribution', res => res.images),
};
const databases = {
  get: () => doV2QueryAll('databases?', res => res.databases),
};
const domains = {
  get: () => doV2QueryAll('domains?', res => res.domains),
};

const sshKeys = {
  get: () => doV2QueryAll('account/keys?', res => res.ssh_keys),
};

export default async function main() {
  const storageSource = await startFSStorageSource({
    domain: 'stageca.st',
    dataDir: 'cloud.data',
  });
  const cloud = createCloud({
    source: storageSource,
    domain: 'stageca.st',
  });
  const res = {
    droplets: await droplets.get(),
    databases: await databases.get(),
    domains: await domains.get(),
    sshKeys: await sshKeys.get(),
    regions: await regions.get(),
    images: await images.get(),
  };
  console.log(
    (await images.get()).map(a => a.name).filter(f => f.match('ebian')),
  );
}

main()
  .then(() => {
    console.log('Done');
  })
  .catch(e => {
    console.error('Error');
    console.error(e);
  });
