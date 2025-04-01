import { BaseSortablePaginationParams } from '../../../../../core/dto/base.query-params.input-dto';
import { PostsSortBy } from './posts-sort-by.ts';

export class GetPostsQueryParams extends BaseSortablePaginationParams<PostsSortBy> {
  sortBy = PostsSortBy.CreatedAt;
  searchTitleTerm: string | null = null;
}
