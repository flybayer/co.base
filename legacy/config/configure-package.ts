import { writeFile, readFile, copy } from "fs-extra";

export default async function configurePackage(packageName: string): Promise<void> {
  const tsConfigData = await readFile("tsconfig.server.json", { encoding: "utf8" });
  const tsConfig = JSON.parse(tsConfigData);

  const pkgData = await readFile(`package.json`, { encoding: "utf8" });
  const pkg = JSON.parse(pkgData);

  const subPkgData = await readFile(`packages/${packageName}/subpackage.json`, { encoding: "utf8" });
  const subPkg = JSON.parse(subPkgData);

  await copy(".vscode", `packages/${packageName}/.vscode`);
  await writeFile(
    `packages/${packageName}/tsconfig.json`,
    JSON.stringify(
      {
        ...tsConfig,
        exclude: ["node_modules"],
        include: ["src/**/*.ts"],
        rootDir: "../..",
      },
      null,
      2,
    ),
  );
  const pkgDeps = pkg.dependencies || {};
  const pkgDevDeps = pkg.devDependencies || {};
  const pkgOptDeps = pkg.optionalDependencies || {};
  function getDep(depName: string) {
    const depVersion = pkgDeps[depName] || pkgDevDeps[depName] || pkgOptDeps[depName];
    if (!depVersion) {
      throw new Error(
        `Cannot prepare sub-package, because "${depName}" is not in any of the root package.json dependencies`,
      );
    }
    return depVersion;
  }
  const isPrivate = subPkg.private == null ? false : !!subPkg.private;
  const scripts: Record<string, string> = {
    dev: "ts-node src/shell.ts",
    build: "tsc",
    prepublishOnly: "yarn build",
    add: "echo 'To a package to a sub-repo, '",
    yarn: "yarn",
    "npm-publish": isPrivate ? "yarn publish" : "yarn publish --access public",
  };
  for (const subScript in subPkg.scripts) {
    scripts[subScript] = subPkg.scripts[subScript];
  }
  const subDeps = subPkg.dependencies || [];
  const subDevDeps = subPkg.devDependencies || [];
  await writeFile(
    `packages/${packageName}/package.json`,
    JSON.stringify(
      {
        name: subPkg.name,
        private: isPrivate,
        version: subPkg.version,
        main: `dist/packages/${packageName}/src/${subPkg.libMain}.js`,
        types: `dist/packages/${packageName}/src/${subPkg.libMain}.d.js`,
        bin: subPkg.bin,
        files: [...(subPkg.files || []), "dist"],
        dependencies: Object.fromEntries(subDeps.map((depName: string) => [depName, getDep(depName)])),
        devDependencies: Object.fromEntries(subDevDeps.map((depName: string) => [depName, getDep(depName)])),
        scripts,
      },
      null,
      2,
    ),
  );
  // await spawnAsync("yarn", [], { cwd: `packages/${packageName}` });
}

if (require.main === module) {
  const packageName = process.argv[2];
  configurePackage(packageName)
    .then(() => {
      console.log(`${packageName} readied.`);
    })
    .catch((e) => {
      console.error("failed", e);
    });
}
