import { AuthorizationError, Ctx } from "blitz"
import db from "db"

export default async function getUserSites(_input: null, { session }: Ctx) {
  if (!session.userId) throw new AuthorizationError()

  return await db.site.findMany({
    where: { owner: { id: session.userId } },
    select: { name: true },
  })
}
