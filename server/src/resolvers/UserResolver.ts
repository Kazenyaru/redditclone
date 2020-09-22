import {
  Resolver,
  Mutation,
  Arg,
  InputType,
  Field,
  Ctx,
  ObjectType,
  Query,
} from "type-graphql";
import { MyContext } from "src/types";
import { UserEntity } from "../entities/UserEntity";
import argon2 from "argon2";
import { EntityManager } from "@mikro-orm/postgresql";
import { COOKIE_NAME } from "../constants";

@InputType()
class UsernamePasswordInput {
  @Field()
  username: string;
  @Field()
  password: string;
}

@ObjectType()
class FieldError {
  @Field()
  field: string;
  @Field()
  message: string;
}

@ObjectType()
class UserResponse {
  @Field(() => [FieldError], { nullable: true })
  errors?: FieldError[];

  @Field(() => UserEntity, { nullable: true })
  user?: UserEntity;
}

@Resolver()
export class UserResolver {
  @Query(() => UserEntity, { nullable: true })
  async me(@Ctx() { em, req }: MyContext) {
    console.log(req.session!.userId);
    if (!req.session!.userId) {
      return null;
    }

    const user = await em.findOne(UserEntity, { id: req.session!.userId });
    return user;
  }

  @Query(() => [UserEntity], { nullable: true })
  async users(@Ctx() { em }: MyContext): Promise<UserEntity[]> {
    return em.find(UserEntity, {});
  }

  @Mutation(() => UserResponse)
  async register(
    @Arg("option") option: UsernamePasswordInput,
    @Ctx() { em, req }: MyContext
  ): Promise<UserResponse> {
    if (option.username.length <= 2) {
      return {
        errors: [
          {
            field: "username",
            message: "username length must be greater  than 2",
          },
        ],
      };
    }

    if (option.password.length <= 2) {
      return {
        errors: [
          {
            field: "password",
            message: "password length must be greater than 2",
          },
        ],
      };
    }

    const hashedPassword = await argon2.hash(option.password);
    let user;
    try {
      const result = await (em as EntityManager)
        .createQueryBuilder(UserEntity)
        .getKnexQuery()
        .insert({
          username: option.username,
          password: hashedPassword,
          created_at: new Date(),
          updated_at: new Date(),
        })
        .returning("*");
      user = result[0];
    } catch (error) {
      console.log(error);
      if (error.code === "23505") {
        return {
          errors: [
            {
              field: "username",
              message: "username already exists",
            },
          ],
        };
      }
    }

    req.session!.userId = user.id;
    console.log(req.session!.userid + "" + user.id);

    return { user };
  }

  @Mutation(() => UserResponse)
  async login(
    @Arg("option") option: UsernamePasswordInput,
    @Ctx() { em, req }: MyContext
  ): Promise<UserResponse> {
    const user = await em.findOne(UserEntity, { username: option.username });
    if (!user) {
      return {
        errors: [
          {
            field: "username",
            message: "username doesn't exist",
          },
        ],
      };
    }
    const valid = await argon2.verify(user?.password, option.password);
    if (!valid) {
      return {
        errors: [
          {
            field: "password",
            message: "incorrect password",
          },
        ],
      };
    }

    req.session!.userId = user.id;
    console.log(req.session!.userid + "" + user.id);

    return {
      user,
    };
  }

  @Mutation(() => Boolean)
  logout(@Ctx() { req, res }: MyContext) {
    return new Promise((resolve) =>
      req.session?.destroy((err) => {
        res.clearCookie(COOKIE_NAME);
        if (err) {
          console.log(err);
          resolve(false);
          return;
        }
        resolve(true);
      })
    );
  }
}
