import * as z from "zod"

export const CreateSite = z.object({
  name: z
    .string()
    .max(20)
    .min(5)
    .refine((v) => v.match(/^[a-z0-9]+(?:-[a-z0-9]+)*$/), {
      message: "Invalid characters",
      path: ["name"],
    }),
})
