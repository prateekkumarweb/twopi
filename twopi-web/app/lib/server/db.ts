import { User } from "better-auth";
import { drizzle } from "drizzle-orm/libsql/node";

function getDbName(user: User) {
  return Buffer.from(user.id).toString("base64");
}

export function getDbClient(user: User) {
  const url = `file:./database/${getDbName(user)}.db`;
  return drizzle({
    connection: {
      url,
    },
  });
}
