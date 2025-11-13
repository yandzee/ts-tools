import { z } from 'zod';

const jsonKey = z.union([z.string(), z.number(), z.symbol()]);

const literalSchema = z.union([
  z.string(),
  z.number(),
  z.boolean(),
  z.null(),
  z.undefined(),
]);

export type Literal = z.infer<typeof literalSchema>;
export type Json = Literal | { [key: string]: Json } | Json[];

const jsonSchema: z.ZodType<Json> = z.lazy(() =>
  z.union([
    literalSchema,
    z.array(jsonSchema),
    z.record(jsonKey, jsonSchema),
  ])
);

export type JsonSchema = z.infer<typeof jsonSchema>;

export const jsonObject = z.record(z.string(), jsonSchema);
export type JsonObject = z.infer<typeof jsonObject>;

export const zz = { json: jsonSchema, jsonObject };
