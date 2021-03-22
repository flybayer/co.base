import { resolver, AuthorizationError } from "blitz"
import db from "db"
import { CreateSite } from "../validations"

export default resolver.pipe(resolver.zod(CreateSite), async ({ name }, c: any) => {
  if (!c.session.userId) throw new AuthorizationError()

  const created = await db.site.create({
    data: { name, owner: { connect: { id: c.session.userId } } },
    select: { id: true },
  })

  return created
})
