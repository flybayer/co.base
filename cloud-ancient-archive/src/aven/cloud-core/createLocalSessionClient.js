import createCloud from './createCloud';
import { error } from '@aven/logger';

export default function createLocalSessionClient({
  onReport,
  localSource,
  rehydrateIgnoreList,
  ...clientOpts
}) {
  function handleAsyncStorageFailure(err, ctx) {
    error('LocalStorageError', {
      err,
      errorString: String(err),
      ctx,
    });
  }

  function clientReport(reportName, report) {
    const { id, name, domain, value, isRemoteOnly, isEphemeral } = report;
    if (isRemoteOnly || !localSource || isEphemeral) {
      return;
    }
    if (reportName === 'PutDocValue') {
      localSource
        .dispatch({
          type: 'PutDocValue',
          domain,
          name,
          id,
          value,
        })
        .catch(err => handleAsyncStorageFailure(err, { reportName, report }));
    } else if (reportName === 'PutDoc') {
      localSource.dispatch({ type: 'PutDoc', domain, name, id }).catch(err => {
        if (err.name === 'UnknownBlock') {
          clientOpts.source
            .dispatch({
              type: 'GetBlock',
              domain,
              name,
              id,
            })
            .then(blockData => {})
            .catch(err => {
              handleAsyncStorageFailure(err, { reportName, report });
            });
          return;
        }
        handleAsyncStorageFailure(err, { reportName, report });
      });
    } else if (reportName === 'PutBlock') {
      localSource
        .dispatch({ type: 'PutBlock', domain, name, id, value })
        .catch(err => handleAsyncStorageFailure(err, { reportName, report }));
    }
    onReport && onReport(reportName, report);
  }

  const sessionCloud = createCloud({
    ...clientOpts,
    onReport: clientReport,
    onInitialLoad: async (blockOrDoc, domain, name, blockId) => {
      if (!localSource) return;
      if (
        rehydrateIgnoreList &&
        rehydrateIgnoreList[domain] &&
        rehydrateIgnoreList[domain][name]
      ) {
        return;
      }
      if (blockOrDoc === 'Doc') {
        const result = await localSource.dispatch({
          type: 'GetDocValue',
          domain,
          name,
        });
        return result;
      }
      if (blockOrDoc === 'Block') {
        const result = await localSource.dispatch({
          type: 'GetBlock',
          domain,
          name,
          id: blockId,
        });

        return result;
      }

      return null;
    },
  });

  return sessionCloud;
}
