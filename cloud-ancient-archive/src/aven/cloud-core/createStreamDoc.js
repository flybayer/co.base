import createChildrenCache from './createChildrenCache';

export default function createStreamDoc(
  idAndValueStream,
  domain,
  onGetName,
  onCreateChild,
) {
  const value = idAndValueStream
    .map(idAndValue => idAndValue.value)
    .filter(v => v !== undefined, 'StreamDocValueFilterUndefined');
  return {
    type: 'StreamDoc',
    value,
    idAndValue: idAndValueStream,
    children: createChildrenCache(onCreateChild),
    getReference: () => ({
      type: 'StreamDoc',
      name: onGetName(),
      crumb: idAndValueStream.crumb,
    }),
    putValue: () => {
      throw new Error('Cannot PutValue of a stream doc');
    },
    export: async () => {
      const idAndValue = await idAndValueStream.load();

      if (!idAndValue) {
        return {
          type: 'Doc',
          domain,
          name: onGetName(),
        };
      }
      return {
        type: 'Doc',
        domain,
        name: onGetName(),
        id: idAndValue.id,
        value: idAndValue.value,
      };
    },

    isDestroyed: () => false,
    putTransactionValue: () => {
      throw new Error(`Cannot putTransactionValue on "${onGetName()}"`);
    },
    getId: () => {
      throw new Error(
        'Cannot getId of a stream doc. Instead, go load doc.idAndValue',
      );
    },
  };
}
