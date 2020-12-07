const getSqlType = columnType => {
  switch (columnType) {
    case 'shortstring':
      // shortstring , lowercase alphanum, start with letter, dashes ok, not too long
      return 'TEXT';
    case 'json':
      return 'JSON';
    case 'binary':
      return 'BYTEA';
    case 'int':
      return 'INTEGER';
    case 'enum':
      return 'TEXT';
    case 'boolean':
      return 'BOOLEAN';
  }
};
const DBSchema = ({ tables }) => ({ tables });
const TableSchema = ({ columns, primary }) => ({
  type: 'table',
  columns,
  primary,
});
const ColumnSchema = (type, { options, doc } = {}) => ({
  type: 'column',
  columnType: type,
  options,
  doc,
});

const schema = DBSchema({
  tables: {
    domains: TableSchema({
      columns: {
        name: ColumnSchema('shortstring'),
      },
      primary: ['name'],
    }),
    blocks: TableSchema({
      columns: {
        id: ColumnSchema('shortstring'),
        size: ColumnSchema('int'),
        json: ColumnSchema('json'),
        binary: ColumnSchema('binary'),
      },
      primary: ['id'],
    }),
    docs: TableSchema({
      columns: {
        id: ColumnSchema('shortstring'),
        domain: ColumnSchema('shortstring', {
          doc: {
            _table: 'domains',
            domain: 'name',
          },
        }),
        is_public: ColumnSchema('boolean'),
        owner: ColumnSchema('shortstring', {
          doc: {
            _table: 'docs',
            owner: 'id',
            domain: 'domain',
          },
        }),
        active_block: ColumnSchema('shortstring', {
          doc: {
            _table: 'blocks',
            active_block: 'id',
          },
        }),
      },
      primary: ['domain', 'id'],
    }),
    permissions: TableSchema({
      columns: {
        owner: ColumnSchema('shortstring', {
          doc: {
            _table: 'docs',
            _cascadeDelete: true,
            owner: 'id',
            domain: 'domain',
          },
        }),
        doc: ColumnSchema('shortstring', {
          doc: {
            _table: 'docs',
            _cascadeDelete: true,
            doc: 'id',
            domain: 'domain',
          },
        }),
        domain: ColumnSchema('shortstring', {
          doc: {
            _table: 'domains',
            _cascadeDelete: true,
            domain: 'name',
          },
        }),
        permission: ColumnSchema('enum', {
          options: ['read', 'write', 'force', 'admin'],
        }),
      },
      primary: ['doc', 'permission', 'owner', 'domain'],
    }),
    block_docs: TableSchema({
      columns: {
        doc: ColumnSchema('shortstring', {
          doc: {
            _table: 'docs',
            _cascadeDelete: true,
            doc: 'id',
            domain: 'domain',
          },
        }),
        domain: ColumnSchema('shortstring', {
          doc: {
            _table: 'domains',
            _cascadeDelete: true,
            domain: 'name',
          },
        }),
        block: ColumnSchema('shortstring', {
          doc: {
            _table: 'blocks',
            _cascadeDelete: true,
            block: 'id',
          },
        }),
      },
      primary: ['doc', 'block'],
    }),
  },
});

module.exports = { getSqlType, schema, DBSchema, TableSchema, ColumnSchema };
