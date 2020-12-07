import { getMaxBlockRefCount } from './maxBlockRefCount';

export default function bindCommitDeepBlock(commitBlock) {
  async function commitDeepBlock(blockData) {
    if (blockData === null || typeof blockData !== 'object') {
      return { value: blockData, refs: [] };
    }
    if (blockData.type === 'BlockReference') {
      if (blockData.value) {
        const { value: referenceValue, refs } = await commitDeepBlock(
          blockData.value,
        );
        const { id } = await commitBlock(referenceValue, refs);
        return { value: { id, type: 'BlockReference' }, refs: [id] };
      } else if (!blockData.id) {
        throw new Error(
          `This block includes a {type: 'BlockReference'}, without a value or an id!`,
        );
      }
    }
    let outputValue = {};
    let outputRefs = new Set();
    if (blockData instanceof Array) {
      outputValue = await Promise.all(
        blockData.map(async innerBlock => {
          const { value, refs } = await commitDeepBlock(innerBlock);
          refs.forEach(ref => outputRefs.add(ref));
          return value;
        }),
      );
    } else {
      await Promise.all(
        Object.keys(blockData).map(async blockDataKey => {
          const innerBlock = blockData[blockDataKey];
          const { value, refs } = await commitDeepBlock(innerBlock);
          refs.forEach(ref => outputRefs.add(ref));
          outputValue[blockDataKey] = value;
        }),
      );
    }
    if (outputRefs.size > getMaxBlockRefCount()) {
      throw new Error(
        `This block has too many BlockReferences, you should paginate or compress instead. You can defer this error with setMaxBlockRefCount`,
      );
    }

    return { value: outputValue, refs: [...outputRefs] };
  }
  return commitDeepBlock;
}
