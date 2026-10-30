import { cache } from "react";
import { headers } from "next/headers";
import { getAuth } from "@/lib/auth";

export const getSession = cache(async () => {
  try {
    const h = await headers();
    return await getAuth().api.getSession({ headers: h });
  } catch {
    return null;
  }
});
