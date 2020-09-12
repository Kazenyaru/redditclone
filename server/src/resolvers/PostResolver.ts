import { Resolver, Query, Ctx, Arg, Mutation } from "type-graphql";
import { MyContext } from "src/types";
import { PostEntity } from "../entities/PostEntity";

@Resolver()
export class PostResolver {
  @Query(() => [PostEntity])
  posts(@Ctx() { em }: MyContext): Promise<PostEntity[]> {
    return em.find(PostEntity, {});
  }

  @Query(() => PostEntity, { nullable: true })
  post(
    @Arg("id") id: number,
    @Ctx() { em }: MyContext
  ): Promise<PostEntity | null> {
    return em.findOne(PostEntity, { id });
  }

  @Mutation(() => PostEntity)
  async createPost(
    @Arg("title") title: string,
    @Ctx() { em }: MyContext
  ): Promise<PostEntity | null> {
    const post = em.create(PostEntity, { title });
    await em.persistAndFlush(post);
    return post;
  }

  @Mutation(() => PostEntity, { nullable: true })
  async updatePost(
    @Arg("id") id: number,
    @Arg("title", () => String, { nullable: true }) title: string,
    @Ctx() { em }: MyContext
  ): Promise<PostEntity | null> {
    const post = await em.findOne(PostEntity, { id });
    if (!post) {
      return null;
    }
    if (typeof title !== "undefined") {
      post.title = title;
      await em.persistAndFlush(post);
    }
    return post;
  }

  @Mutation(() => Boolean)
  async deletePost(
    @Arg("id") id: number,
    @Ctx() { em }: MyContext
  ): Promise<boolean> {
    await em.nativeDelete(PostEntity, { id });
    return true;
  }
}
