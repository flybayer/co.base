import spawnAsync from "@expo/spawn-async";

let hasInitialized = false;

async function writeTFTmp() {
  console.log("writeTFTemp", __dirname);
  // await mkdirp('')
}

export async function init() {
  if (hasInitialized) {
    return;
  }
  console.log("INIT TERRAFORM");
  await writeTFTmp();
  const res = await spawnAsync("yarn", ["terraform", "init", "tf-tmp"]);
  console.log("INIT TERRAFORM DONE", res);
  hasInitialized = true;
}

type SiteState = {
  hostname: string;
  externalHostname?: string;
};

type TerraformState = string;

export async function applySite(siteKey: string, siteState: SiteState, tfState: TerraformState) {
  init();
  console.log("will apply site.", siteKey, siteState, tfState);
  // yarn terraform apply -auto-approve -var-file="tf-tmp/var.tfvars.json" tf-tmp
  return {
    response: "sth..",
    tfState: "uhhnew!?, from output, ok.",
  };
}

export async function destroySite(siteKey: string, siteState: SiteState) {
  //   yarn terraform destroy -auto-approve -var-file="tf-tmp/var.tfvars.json" tf-tmp

  init();

  console.log("will destroy site!@?!");
}
