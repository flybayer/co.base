import cuid from 'cuid';
import { getIdOfValue, Err } from '@aven/utils';
import createStreamDoc from './createStreamDoc';
import createDoc from './createDoc';
import { createProducerStream } from '@aven/stream';

function hasDepth(name) {
  return name.match(/\//);
}

function parentChildName(parent, child) {
  if (parent) {
    return `${parent}/${child}`;
  }
  return child;
}

export default function createDocSet({
  domain,
  auth,
  source,
  onGetName,
  nameChangeNotifiers,
  onReport,
  onInitialLoad,
}) {
  let childDocs = {};
  let notifyChildDocsChange = null;

  const childDocMovers = new WeakMap();

  function _createChildDoc(name) {
    if (childDocs[name]) {
      return childDocs[name];
    }
    let currentDocName = name;
    let currentDocFullName = parentChildName(onGetName(), currentDocName);
    const childNameChangeNotifiers = new Set();

    function handleParentRename(newParentName) {
      currentDocFullName = parentChildName(newParentName, currentDocName);
      childNameChangeNotifiers.forEach(notifier =>
        notifier(currentDocFullName),
      );
    }

    function handleRename(newLocalName) {
      const prevName = currentDocName;
      onReport &&
        onReport('DocRename', {
          name: prevName,
          newName: currentDocFullName,
        });
      const childDoc = childDocs[currentDocName];
      currentDocName = newLocalName;
      currentDocFullName = parentChildName(onGetName(), currentDocName);
      const nextChildDocs = {
        ...childDocs,
        [newLocalName]: childDoc,
      };
      delete nextChildDocs[prevName];
      childDocs = nextChildDocs;
      notifyChildDocsChange && notifyChildDocsChange();
    }

    nameChangeNotifiers && nameChangeNotifiers.add(handleParentRename);

    const newDoc = createDoc({
      source,
      domain,
      auth,
      nameChangeNotifiers: childNameChangeNotifiers,
      onCreateDocSet: createDocSet,
      onGetName: () => currentDocFullName,
      onDidRename: newLocalName => {
        handleRename(newLocalName);
      },
      onDidDestroy: () => {
        nameChangeNotifiers && nameChangeNotifiers.delete(handleParentRename);
        childNameChangeNotifiers.clear(); // this probably won't be needed because the whole thing should be GC'd
        const nextChildDocs = {
          ...childDocs,
        };
        delete nextChildDocs[currentDocName];
        childDocs = nextChildDocs;
      },
      onReport: (reportType, report) => {
        onReport &&
          onReport(reportType, {
            ...report,
            name: report.name
              ? `${currentDocName}/${report.name}`
              : currentDocName,
          });
      },
      onInitialLoad,
    });
    childDocs = { ...childDocs, [name]: newDoc };
    childDocMovers.set(newDoc, handleRename);
    notifyChildDocsChange && notifyChildDocsChange();
    return newDoc;
  }

  function get(name) {
    if (typeof name !== 'string') {
      throw new Err(
        `Expected a string to be passed to DocSet.get(). Instead got "${name}"`,
      );
    }
    const localName = name.split('/')[0];
    if (!localName) {
      throw new Err('Invalid name to get');
    }
    let returningCloudValue = null;

    let restOfName = null;
    if (localName.length < name.length - 1) {
      restOfName = name.slice(localName.length + 1);
    }
    if (childDocs[localName]) {
      returningCloudValue = childDocs[localName];
    }
    if (!returningCloudValue) {
      const newDoc = _createChildDoc(localName);
      returningCloudValue = newDoc;
    }
    if (restOfName) {
      if (!returningCloudValue.children) {
        throw new Error(`Cannot get "${restOfName}" within "${name}"`);
      }
      returningCloudValue = returningCloudValue.children.get(restOfName);
    }
    return returningCloudValue;
  }

  function post() {
    const localName = cuid();
    const postedDoc = _createChildDoc(localName);
    return postedDoc;
  }

  function shamefullyDestroyAll() {
    childDocs = {};
    notifyChildDocsChange && notifyChildDocsChange();
  }

  function setOverride(name, doc) {
    childDocs = {
      ...childDocs,
      [name]: doc,
    };
    notifyChildDocsChange && notifyChildDocsChange();
    return doc;
  }
  function setOverrideStream(name, stream) {
    const streamDoc = createStreamDoc(stream, domain, () => name);
    return setOverride(name, streamDoc);
  }

  async function move(fromName, toName) {
    if (hasDepth(fromName)) {
      throw new Error(
        `Cannot move from "${fromName}" because it has a slash. Deep moves are not supported yet.`,
      );
    }
    if (hasDepth(toName)) {
      throw new Error(
        `Cannot move to "${toName}" because it has a slash. Deep moves are not supported yet.`,
      );
    }
    const docToMove = childDocs[fromName];
    const mover = childDocMovers.get(docToMove);
    if (!mover) {
      throw new Error(
        'Cannot move this doc because we misplaced the ability to do so',
      );
    }
    mover(toName);

    try {
      await source.dispatch({
        type: 'MoveDoc',
        domain,
        from: fromName,
        to: toName,
        auth,
      });
    } catch (e) {
      mover(fromName);
      throw e;
    }
  }

  function setOverrideValueStream(name, stream, context) {
    return setOverrideStream(
      name,
      stream
        .map(value => {
          return { value, id: getIdOfValue(value).id };
        })
        .dropRepeats((a, b) => a.id === b.id, 'DropRepeatedIds'),
      context,
    );
  }
  const allProducer = {
    crumb: `${onGetName()}.all`,
    start: notify => {
      let notificationTimeout = null;
      notifyChildDocsChange = () => {
        clearTimeout(notificationTimeout);
        notificationTimeout = setTimeout(() => {
          notify.next(childDocs);
        }, 1);
      };
      notifyChildDocsChange();
      source
        .dispatch({
          type: 'ListDocs',
          domain,
          auth,
          parentName: onGetName(),
        })
        .then(resp => {
          if (resp && resp.docs) {
            resp.docs.forEach(docName => {
              _createChildDoc(docName);
            });
          }
        })
        .catch(e => {
          console.error('ListDocError', e);
          notify.error(e);
        });
    },
    stop: () => {
      notifyChildDocsChange = null;
    },
  };
  const all = createProducerStream(allProducer);

  const cloudDocSet = {
    all,
    get,
    post,
    move,
    setOverride,
    setOverrideStream,
    setOverrideValueStream,
    shamefullyDestroyAll,
  };

  return cloudDocSet;
}
