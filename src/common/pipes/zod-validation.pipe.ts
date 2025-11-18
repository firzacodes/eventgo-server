import {
  ArgumentMetadata,
  BadRequestException,
  PipeTransform,
} from '@nestjs/common';
import { ZodSchema } from 'zod';

export class ZodValidationPipe implements PipeTransform {
  constructor(private schema: ZodSchema) {}

  transform(value: any, metadata: ArgumentMetadata) {
    const result: any = this.schema.parse(value);

    if (!result.success) {
      const message = result.error.errors.map((e) => `${e.path}: ${e.message}`);
      throw new BadRequestException(message);
    }

    return result.data;
  }
}
