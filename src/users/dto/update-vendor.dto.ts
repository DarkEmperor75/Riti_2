import { PartialType } from "@nestjs/swagger";
import { CreateVendorProfileDto } from "./create-vendor.dto";

export class UpdateVendorProfiletDto extends PartialType(CreateVendorProfileDto) {}