import { CommentsSortBy } from './comments-sort-by';
import { BaseSortablePaginationParams } from '../../../../core/dto/base.query-params.input-dto';

export class GetCommentsQueryParams extends BaseSortablePaginationParams<CommentsSortBy> {
  sortBy = CommentsSortBy.CreatedAt;
  searchTitleTerm: string | null = null;
}
