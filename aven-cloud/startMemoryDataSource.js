import { BehaviorSubject } from 'rxjs-compat';
import createDispatcher from '../aven-cloud-utils/createDispatcher';
import {
  getListRefName,
  getListObjectsName,
} from '../aven-cloud-utils/RefNaming';
import uuid from 'uuid/v1';
const crypto = require('crypto');
const stringify = require('json-stable-stringify');

function getTerms(name) {
  return name.split('/');
}

function isRefNameValid(name) {
  return getTerms(name).reduce((prev, now, i) => {
    return prev && (now !== '_refs' && now !== '_objects');
  }, true);
}

function getRefsListName(name) {
  const terms = getTerms(name);
  const parentTerms = terms.slice(0, terms.length - 1);
  const refsListName =
    parentTerms.length === 0 ? '_refs' : parentTerms.join('/') + '/_refs';
  return refsListName;
}

function getMainTerm(name) {
  const terms = getTerms(name);
  return terms[terms.length - 1];
}

function _renderRef({ id }) {
  // this strips out hidden features of the ref and snapshots the referenced values
  return {
    id: id || null,
  };
}

const startMemoryDataSource = (opts = {}) => {
  const id = uuid();
  const dataSourceDomain = opts.domain;
  let _objects = {};
  let _objectsSize = {};
  let _refs = {};

  function _getRef(name) {
    const r = _refs[name] || (_refs[name] = {});
    r.objects = r.objects || {};
    return r;
  }

  const isConnected = new BehaviorSubject(true);

  if (dataSourceDomain == null) {
    throw new Error(`Empty domain passed to startMemoryDataSource`);
  }

  async function PutRef({ domain, name, id }) {
    if (!isRefNameValid(name)) {
      throw new Error(`Invalid Ref name "${name}"`);
    }
    if (domain === undefined || name === undefined) {
      throw new Error('Invalid use. ', { domain, name, id });
    }
    if (domain !== dataSourceDomain) {
      throw new Error(
        `Invalid domain "${domain}", must use "${dataSourceDomain}" with this memory data source`
      );
    }
    const r = _getRef(name);
    if (r.id === id) {
      return; // avoid calling behavior.next if the ID hasn't changed
    }
    r.objects[id] = true;
    r.id = id;
    if (r.behavior) {
      r.behavior.next(_renderRef(r));
    } else {
      r.behavior = new BehaviorSubject(_renderRef(r));
    }

    const listR = _getRef(getRefsListName(name));
    if (listR.behavior) {
      const last = listR.behavior.value;
      listR.behavior.next({
        ...(last || {}),
        value: [...((last && last.value) || []), getMainTerm(name)],
      });
    }
  }

  async function DestroyRef({ domain, name }) {
    if (domain === undefined || name === undefined) {
      throw new Error('Invalid use. ', { domain, name, id });
    }
    if (domain !== dataSourceDomain) {
      throw new Error(
        `Invalid domain "${domain}", must use "${dataSourceDomain}" with this memory data source`
      );
    }
    Object.keys(_refs)
      .filter(refName => {
        const m = refName.match(RegExp(`^${name}/?(.*)`));
        return !!m;
      })
      .forEach(refName => {
        const r = _getRef(refName);
        r.objects = {};
        r.id = null;
        if (r.behavior) {
          r.behavior.next(_renderRef(r));
        } else {
          r.behavior = new BehaviorSubject(_renderRef(r));
        }
        delete _refs[name];
      });

    const listR = _getRef(getRefsListName(name));
    if (listR.behavior) {
      const mainName = getMainTerm(name);
      const last = listR.behavior.value;
      if (!last.value) {
        return;
      }
      listR.behavior.next({
        ...last,
        value: last.value.filter(v => v !== mainName),
      });
    }
  }

  async function GetObject({ domain, name, id }) {
    if (domain !== dataSourceDomain) {
      throw new Error(
        `Invalid domain "${domain}", must use "${dataSourceDomain}" with this memory data source`
      );
    }
    const r = _getRef(name);

    if (r.objects[id] && _objects[id] !== undefined) {
      return {
        id,
        value: _objects[id],
      };
    }
    return {
      id,
      value: undefined,
    };
  }
  function _isValidName(name) {
    return typeof name === 'string' && name.length > 0;
  }

  async function PutObject({ value, name, domain }) {
    if (domain !== dataSourceDomain) {
      throw new Error(
        `Invalid domain "${domain}", must use "${dataSourceDomain}" with this memory data source`
      );
    }
    if (!_isValidName(name)) {
      throw new Error(
        `Invalid ref name "${name}", must be provided with PutObject`
      );
    }
    const objData = stringify(value);
    const size = objData.length;
    const sha = crypto.createHash('sha1');
    sha.update(objData);
    const id = sha.digest('hex');
    if (_objects == null) {
      throw new Error(`Memory source "${id}" has been closed!`);
    }
    if (_objects[id] === undefined) {
      _objects[id] = value;
    }
    if (_objectsSize[id] === undefined) {
      _objectsSize[id] = size;
    }
    const r = _getRef(name);
    r.objects[id] = true;
    return { id };
  }

  async function GetRef({ domain, name }) {
    if (domain !== dataSourceDomain) {
      return null;
    }
    const r = _refs[name];
    return _renderRef(r || {});
  }

  async function ListRefObjects({ domain, parentName }) {
    if (domain !== dataSourceDomain) {
      return [];
    }
    if (parentName == null || parentName === '') {
      return Object.keys(_objects);
    }
    const out = new Set();
    Object.keys(_refs)
      .filter(r => {
        return r.slice(0, parentName.length) === parentName;
      })
      .forEach(refName => {
        const r = _getRef(refName);
        Object.keys(r.objects).forEach(objId => out.add(objId));
      });
    return Array.from(out);
  }

  async function ListRefs({ domain, parentName }) {
    if (domain !== dataSourceDomain) {
      return [];
    }
    if (parentName == null || parentName === '') {
      return Object.keys(_refs)
        .filter(refName => !refName.match(/\//))
        .filter(n => n !== '_refs' && n !== '_objects' && n !== '_auth');
    }
    return Object.keys(_refs)
      .map(refName => {
        const m = refName.match(RegExp(`^${parentName}/(.*)`));
        if (!m || m[1] === '') {
          return null;
        }
        return m[1];
      })
      .filter(name => {
        return !!name && !name.match(/\//);
      })
      .filter(n => n !== '_refs' && n !== '_objects' && n !== '_auth');
  }

  async function ListDomains() {
    return [dataSourceDomain];
  }

  async function CollectGarbage() {
    // create list of all objects
    // for each ref
    //   remove all of Object.keys(r.objects) from list of objects
    // delete each object in the list
  }

  const GetStatus = () => ({
    ready: true,
    connected: true,
    migrated: true,
  });

  const close = () => {
    if (_objects === null) {
      throw new Error(
        `Cannot close memory source "${id}" because it is already closed!`
      );
    }
    console.log('Closing memory source ' + id);
    _objects = null;
    _objectsSize = null;
    _refs = null;
  };
  const observeRef = async (domain, name) => {
    if (domain !== dataSourceDomain) {
      throw new Error(
        `Invalid domain "${domain}", must use "${dataSourceDomain}" with this memory data source`
      );
    }
    const r = _getRef(name);
    if (r.behavior) {
      return r.behavior;
    } else {
      const listRefName = getListRefName(name);
      if (listRefName) {
        r.behavior = new BehaviorSubject({ value: undefined });
        ListRefs({ domain, parentName: listRefName })
          .then(refList => {
            r.behavior.next({ value: refList });
          })
          .catch(e => {
            console.error(e);
          });
        return r.behavior;
      }
      return (r.behavior = new BehaviorSubject(_renderRef(r)));
    }
  };

  async function GetRefValue({ domain, name }) {
    if (domain !== dataSourceDomain) {
      throw new Error(
        `Invalid domain "${domain}", must use "${dataSourceDomain}" with this memory data source`
      );
    }
    const listRefName = getListRefName(name);
    if (typeof listRefName === 'string') {
      const refs = await ListRefs({ domain, parentName: listRefName });
      return { id: undefined, value: refs };
    }
    const listObjectsRefName = getListObjectsName(name);
    if (typeof listObjectsRefName === 'string') {
      const objs = await ListRefObjects({
        domain,
        parentName: listObjectsRefName,
      });
      return {
        id: undefined,
        value: objs,
      };
    }
    const r = _getRef(name);

    if (r.objects[r.id] && _objects[r.id] !== undefined) {
      return {
        id: r.id,
        value: _objects[r.id],
      };
    }
    return {
      id: r.id,
      value: null,
    };
  }

  return {
    isConnected,
    close,
    observeRef,
    dispatch: createDispatcher({
      PutRef,
      PutObject,
      GetObject,
      GetRef,
      GetRefValue,
      GetStatus,
      ListDomains,
      ListRefs,
      DestroyRef,
      CollectGarbage,
      ListRefObjects,
    }),
    id,
  };
};

export default startMemoryDataSource;
