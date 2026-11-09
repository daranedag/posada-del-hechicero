import "server-only";
import { createDatabase } from "./query";

export const publicDb = createDatabase("public");
