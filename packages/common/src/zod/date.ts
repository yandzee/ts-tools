import { z } from 'zod';
import { isValidDate } from '~/misc/utils';

export const date = z.iso
  .datetime()
  .or(z.string())
  .or(z.int())
  .transform((d, ctx) => {
    const p = new Date(d);
    if (!isValidDate(p)) {
      ctx.issues.push({
        code: 'custom',
        message: 'Not a valid date',
        input: d,
      });

      return z.NEVER;
    }

    return p;
  });
