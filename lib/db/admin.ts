import "server-only";
import { createDatabase } from "./query";

export const adminDb = createDatabase("admin");
