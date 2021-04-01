import { enhancePrisma } from "blitz"
import { PrismaClient } from "@prisma/client"
const EnhancedPrisma = enhancePrisma(PrismaClient)

export * from "@prisma/client"

// const db = new EnhancedPrisma()
// export default db

// and now the fun begins.

// the graph is made of Nodes, TypeLinks, and NameLinks

// a Node has a JSON value (or undefined)

// a node may be set to immutable=true, and the immutableChecksum must be set to the sha256 digest
// when immutable=true, the value should never change thereafter.
// also, the immutableChecksum is unique in the db, so if the checksum already exists in the db you must reference the existing node

//

export default new EnhancedPrisma()

// let graphClient : null | GraphClient = null;

// type ImmutableNode<Value extends JSONValue> = {
//   _c: "Node"
//   id: bigint
//   value: Value
//   checksum: string
// }

// type MutableNode<Value extends JSONValue> = {
//   _c: "MutableNode"
//   id: bigint
//   value?: Value
// }

// interface NodeRef {
//   _c: "Node" | "MutableNode"
//   id: bigint
// }

// type NodeReference = string

// const hashids = new Hashids()

// enum ID_TYPES {
//   NODE = 0,
//   MUTABLE_NODE = 1,
//   LINK = 2,
// }

// const STATIC_HASHID_SALT = process.env.STATIC_HASHID_SALT
//   ? Number(process.env.STATIC_HASHID_SALT)
//   : 47

// function getNodeReference(n: NodeRef): NodeReference {
//   return hashids.encode(STATIC_HASHID_SALT, ID_TYPES.NODE, n.id)
// }

// type Link = {
//   _c: "Link"
//   from: NodeRef
//   to: NodeRef
//   type: NodeRef
//   weight: bigint
//   id: bigint
// }

// async function defineNode<V extends JSONValue>(value: V): Promise<ImmutableNode<V>> {
//   const checksum = await getChecksum(value)
//   const returned = await db.node.upsert({
//     where: {
//       immutableChecksum: checksum,
//     },
//     create: {
//       value,
//       immutableChecksum: checksum,
//       mutable: false,
//     },
//     update: {},
//     select: {
//       id: true,
//     },
//   })
//   return {
//     _c: "Node",
//     checksum,
//     value,
//     id: returned.id,
//   }
// }

// type ListDef<Of extends ImmutableNode<any>> = { _t: "List"; of: NodeReference }
// type RecordDef<EntriesOf extends Record<string, ImmutableNode<any>>> = {
//   _t: "Record"
//   entries: Record<string, NodeReference>
// }

// async function createLink(
//   from: NodeRef,
//   type: NodeRef,
//   to: NodeRef,
//   weight?: bigint
// ): Promise<Link> {
//   const returned = await db.link.upsert({
//     where: {
//       fromId_typeId_toId: {
//         fromId: from.id,
//         toId: to.id,
//         typeId: type.id,
//       },
//     },
//     create: {
//       fromId: from.id,
//       toId: to.id,
//       typeId: type.id,
//       weight: weight === undefined ? new Date().getTime() : weight,
//     },
//     update: {},
//     select: {
//       id: true,
//       weight: true,
//     },
//   })
//   return {
//     _c: "Link",
//     type,
//     from,
//     to,
//     weight: returned.weight,
//     id: returned.id,
//   }
// }

// async function createMutableNode<V extends JSONValue>(value?: V): Promise<MutableNode<V>> {
//   const returned = await db.node.create({
//     data: {
//       value,
//       mutable: true,
//     },
//   })
//   return {
//     _c: "MutableNode",
//     value,
//     id: returned.id,
//   }
// }

// async function setup() {
//   // type statics
//   const staticNodes = {
//     isTypeOf: await defineNode("IS_TYPE_OF"),
//     typeDependsOn: await defineNode("TYPE_DEPENDS_ON"),
//     stringPrimitive: await defineNode("STRING_PRIMITIVE"),
//     numberPrimitive: await defineNode("NUMBER_PRIMITIVE"),
//     nullPrimitive: await defineNode("NULL_PRIMITIVE"),
//     booleanPrimitive: await defineNode("BOOLEAN_PRIMITIVE"),
//   } as const

//   async function defineListType<Of extends ImmutableNode<any>>(
//     of: Of
//   ): Promise<ImmutableNode<ListDef<Of>>> {
//     const listTypeNode = await defineNode({
//       _t: "List",
//       of: getNodeReference(of),
//     } as const)
//     await createLink(listTypeNode, staticNodes.typeDependsOn, of)
//     return listTypeNode
//   }

//   async function defineRecordType<EntriesOf extends Record<string, ImmutableNode<any>>>(
//     entries: EntriesOf
//   ): Promise<ImmutableNode<RecordDef<EntriesOf>>> {
//     const recordTypeNode = await defineNode({
//       _t: "Record",
//       entries: Object.fromEntries(
//         Object.entries(entries).map(([key, of]) => [key, getNodeReference(of)])
//       ),
//     } as const)
//     await Promise.all(
//       Object.values(entries).map(async (of) => {
//         await createLink(recordTypeNode, staticNodes.typeDependsOn, of)
//       })
//     )
//     return recordTypeNode
//   }

//   const publicSshKeys = await defineListType(staticNodes.stringPrimitive)
//   const adminUser = await defineRecordType({
//     name: staticNodes.stringPrimitive,
//     email: staticNodes.stringPrimitive,
//     phone: staticNodes.stringPrimitive,
//     publicSshKeys,
//   })
//   const sitesRoot = await defineNode("SITES_ROOT")

//   const managedHosts = await defineNode("MANAGED_HOSTS")

//   const mutableString = await createMutableNode("")

//   async function createMutableNodeOfType(type: ImmutableNode<any>) {
//     const emptyNode = await createMutableNode()
//     await createLink(emptyNode, staticNodes.isTypeOf, type)
//     return emptyNode
//   }

//   // await createNodeOfType()

//   await createLink(mutableString, staticNodes.isTypeOf, staticNodes.stringPrimitive)
//   return {
//     staticNodes,
//   }
// }
