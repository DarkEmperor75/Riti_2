import { PartialType } from "@nestjs/swagger";
import { CreateHostProfileDto } from "./create-host.dto";

export class UpdateHosProfiletDto extends PartialType(CreateHostProfileDto) {}