import { IsString, IsUrl, Length } from 'class-validator';
import { Trim } from '../../../../../core/decorators/transform/trim';

export class UpdateBlogInputDto {
  @IsString()
  @Length(3, 15)
  @Trim()
  name: string;

  @IsString()
  @Length(10, 500)
  description: string;

  @IsUrl()
  websiteUrl: string;
}
