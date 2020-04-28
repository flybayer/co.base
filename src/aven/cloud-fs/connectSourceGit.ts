import spawn from '@expo/spawn-async';

export default async function connectSourceGit(
  source: any,
  domain: string,
  docName: string,
  gitFolder: string,
) {
  const prevVal = await source.dispatch({
    type: 'GetDocValue',
    domain,
    name: docName,
  });
  const gitStatus = await spawn('git', ['status'], { cwd: gitFolder });
  const currentBranch = gitStatus.stdout.match(/On branch (.*)\n/)?.[1];
  const hasUnstagedChanges = !!gitStatus.stdout.match(
    'Changes not staged for commit:\n',
  );
  if (hasUnstagedChanges) {
    console.log('Cannot connect to git with unstaged changes!')
  }
  console.log('connecting to git.. ', {
    hasUnstagedChanges,
    prevVal,
    gitFolder,
    status: gitStatus.stdout,
    currentBranch,
  });
}
