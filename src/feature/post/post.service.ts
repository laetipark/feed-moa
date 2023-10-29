import { HttpException, Injectable } from '@nestjs/common';
import { Post } from 'src/entity/post.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ExternalResponse } from '../util/externalResponse';
import { PostType } from 'src/enum/postType.enum';
import { HttpStatusCode } from 'src/enum/httpStatusCode.enum';
import { ErrorMessage } from 'src/error/error.enum';

@Injectable()
export class PostService {
  constructor(
    @InjectRepository(Post) private readonly postRepository: Repository<Post>,
  ) {}

  getPostWithHasgtagById(id: number): Promise<Post> {
    return this.postRepository
      .createQueryBuilder('posts')
      .leftJoinAndSelect('posts.hashtags', 'hashtags')
      .where('posts.id = :id', { id })
      .getOne();
  }

  async getPostAndAddViewCountById(post: Post): Promise<Post> {
    const addViewCountByPost = await this.postRepository.save({
      ...post,
      viewCount: post.viewCount + 1,
    });
    return addViewCountByPost;
  }

  async updatePostShareCountById(
    id: number,
    type: PostType,
    post: Post,
  ): Promise<void> {
    const getSnsUrl = (type: PostType) => {
      switch (type) {
        case PostType.INSTAGRAM:
          return `https://www.instagram.com/share/${id}`;
        case PostType.FACEBOOK:
          return `https://www.facebook.com/share/${id}`;
        case PostType.TWITTER:
          return `https://www.twitter.com/share/${id}`;
        case PostType.THREADS:
          return `https://www.threads.net/share/${id}`;
      }
    };

    const responseResult = ExternalResponse.responseResult(getSnsUrl(type));
    if (responseResult != HttpStatusCode.ok) {
      throw new HttpException(
        ErrorMessage.externalSnsFailResponse,
        HttpStatusCode.internalServerError,
      );
    }

    await this.postRepository.save({
      ...post,
      shareCount: post.shareCount + 1,
    });
  }
}
