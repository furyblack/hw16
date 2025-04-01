import { PostDocument } from '../../domain/post';
import { LikeStatusType } from '../../likes/like-model';

export enum MyStatus {
  None = 'None',
  Like = 'Like',
  Dislike = 'Dislike',
}

export class PostsViewDto {
  id: string;
  title: string;
  shortDescription: string;
  content: string;
  blogId: string;
  blogName: string;
  createdAt: Date;
  extendedLikesInfo: {
    likesCount: number;
    dislikesCount: number;
    myStatus: LikeStatusType; // Используем LikeStatusType
    newestLikes: {
      addedAt: Date;
      userId: string;
      login: string;
    }[];
  };

  static mapToView(post: PostDocument, myStatus: LikeStatusType): PostsViewDto {
    return {
      id: post._id.toString(), // Используем post._id, так как Mongoose хранит ID в _id
      title: post.title,
      shortDescription: post.shortDescription,
      content: post.content,
      blogId: post.blogId,
      blogName: post.blogName,
      createdAt: post.createdAt,
      extendedLikesInfo: {
        likesCount: post.likesCount,
        dislikesCount: post.dislikesCount,
        myStatus, // Используем переданный myStatus
        newestLikes: post.newestLikes.map((like) => ({
          addedAt: new Date(like.addedAt),
          userId: like.userId,
          login: like.login,
        })),
      },
    };
  }
}
