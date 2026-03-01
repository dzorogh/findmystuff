import { z } from "zod";

const destinationTypeEnum = z.enum(["room", "place", "container", "furniture"]);

/** Схема тела POST /api/transitions. */
export const transitionBodySchema = z
  .object({
    item_id: z.union([z.number(), z.string()]).optional(),
    place_id: z.union([z.number(), z.string()]).optional(),
    container_id: z.union([z.number(), z.string()]).optional(),
    destination_type: destinationTypeEnum,
    destination_id: z.union([z.number(), z.string()]),
  })
  .refine(
    (data) =>
      data.item_id != null || data.place_id != null || data.container_id != null,
    { message: "Необходим хотя бы один из: item_id, place_id, container_id" }
  );

export type TransitionBody = z.infer<typeof transitionBodySchema>;
