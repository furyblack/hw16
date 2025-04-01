import { IsString, Length } from 'class-validator';
import { Trim } from '../../../../core/decorators/transform/trim';
import { BlogIsExist } from '../../blogs/decorators/blog-is-existing';

export class CreatePostForBlogInputDto {
  @IsString()
  @Length(3, 30)
  @Trim()
  title: string;

  @IsString()
  @Length(3, 100)
  @Trim()
  shortDescription: string;

  @IsString()
  @Length(3, 1000)
  @Trim()
  content: string;
}

export class CreatePostInputDto extends CreatePostForBlogInputDto {
  @IsString()
  @BlogIsExist()
  @Trim()
  blogId: string;
}

export class CreatePostDto {
  title: string;
  shortDescription: string;
  content: string;
  blogId: string;
}
export class UpdatePostDto {
  @IsString()
  @Length(3, 30)
  @Trim()
  title: string;

  @IsString()
  @Length(3, 100)
  @Trim()
  shortDescription: string;

  @IsString()
  @Length(3, 1000)
  @Trim()
  content: string;

  @BlogIsExist()
  @IsString()
  blogId: string;
}
export class UpdatePostForMethod {
  title: string;
  shortDescription: string;
  content: string;
  blogId: string;
}
