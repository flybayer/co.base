import { enhancePrisma } from "blitz"
import { PrismaClient } from "@prisma/client"

const EnhancedPrisma = enhancePrisma(PrismaClient)

console.log("YES, executing app/db/index.ts")

export * from "@prisma/client"
export default new EnhancedPrisma()
