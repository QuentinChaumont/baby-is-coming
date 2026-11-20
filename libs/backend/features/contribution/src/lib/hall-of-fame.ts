import { Body, Controller, Delete, Get, HttpCode, Injectable, Param, Post } from '@nestjs/common';
import { InjectModel, Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { NotFoundError, Roles } from '@org/backend-core';
import type { HallOfFameEntry, JoinHallOfFameRequest } from '@org/shared-contracts';
import { IsOptional, IsString, MaxLength, MinLength } from 'class-validator';
import { HydratedDocument, Model, isValidObjectId } from 'mongoose';

/** A name in the hall of fame of Kiki's notebook: « Prénom N. » only. */
@Schema({ timestamps: true, collection: 'hall_of_fame' })
export class HallOfFame {
  @Prop({ type: String, default: 'main', index: true })
  listId!: string;

  @Prop({ type: String, required: true })
  name!: string;

  createdAt!: Date;
  updatedAt!: Date;
}
export type HallOfFameDocument = HydratedDocument<HallOfFame>;
export const HallOfFameSchema = SchemaFactory.createForClass(HallOfFame);

export class JoinHallOfFameDto implements JoinHallOfFameRequest {
  @IsString()
  @MinLength(1)
  @MaxLength(60)
  firstName!: string;

  @IsString()
  @MinLength(1)
  @MaxLength(60)
  lastName!: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  website?: string;
}

/** « Paul M. » — the full last name is never kept. */
export function fameName(firstName: string, lastName: string): string {
  const first = firstName.trim();
  const initial = lastName.trim().charAt(0).toLocaleUpperCase('fr-FR');
  return initial ? `${first} ${initial}.` : first;
}

const MAIN_LIST = 'main';

/** Everyone who found all of Kiki's secrets, first finders first. */
@Injectable()
export class HallOfFameService {
  constructor(@InjectModel(HallOfFame.name) private readonly model: Model<HallOfFame>) {}

  async list(): Promise<HallOfFameEntry[]> {
    const docs = await this.model.find({ listId: MAIN_LIST }).sort({ createdAt: 1 }).exec();
    return docs.map((d) => ({ id: d._id.toString(), name: d.name, createdAt: d.createdAt.toISOString() }));
  }

  /** Signing twice under the same name doesn't add a second line. */
  async join(request: JoinHallOfFameRequest): Promise<HallOfFameEntry[]> {
    const name = fameName(request.firstName, request.lastName);
    if (name && !(await this.model.exists({ listId: MAIN_LIST, name }))) {
      await this.model.create({ listId: MAIN_LIST, name });
    }
    return this.list();
  }

  /** The parents remove a name (a joke, a typo, a stranger). */
  async remove(id: string): Promise<void> {
    const deleted = isValidObjectId(id)
      ? await this.model.findOneAndDelete({ _id: id, listId: MAIN_LIST }).exec()
      : null;
    if (!deleted) throw new NotFoundError('HALL_OF_FAME_ENTRY_NOT_FOUND', 'Entry not found');
  }
}

/** Guests: read and sign the hall of fame (no account). */
@ApiTags('kitty')
@Controller('public/hall-of-fame')
export class PublicHallOfFameController {
  constructor(private readonly hallOfFame: HallOfFameService) {}

  @Get()
  list(): Promise<HallOfFameEntry[]> {
    return this.hallOfFame.list();
  }

  @Post()
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  join(@Body() body: JoinHallOfFameDto): Promise<HallOfFameEntry[]> {
    // Honeypot filled ⇒ a bot: answer as usual, store nothing.
    return body.website ? this.hallOfFame.list() : this.hallOfFame.join(body);
  }
}

/** Parents: moderate the hall of fame. Restricted by the global `RolesGuard`. */
@ApiTags('kitty')
@ApiBearerAuth()
@Roles('admin')
@Controller('admin/hall-of-fame')
export class AdminHallOfFameController {
  constructor(private readonly hallOfFame: HallOfFameService) {}

  @Get()
  list(): Promise<HallOfFameEntry[]> {
    return this.hallOfFame.list();
  }

  @Delete(':id')
  @HttpCode(204)
  remove(@Param('id') id: string): Promise<void> {
    return this.hallOfFame.remove(id);
  }
}
