import { __prod__ } from "./constants";
import { PostEntity } from "./entities/PostEntity";
import { MikroORM } from "@mikro-orm/core";
import path from "path";
import { UserEntity } from "./entities/UserEntity";

export default {
  migrations: {
    path: path.join(__dirname, "./migrations"),
    pattern: /^[\w-]+\d+\.[tj]s$/,
  },
  entities: [PostEntity, UserEntity],
  dbName: "redditclone",
  type: "postgresql",
  debug: !__prod__,
} as Parameters<typeof MikroORM.init>[0];
