import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { getMe } from "./auth.functions";

export type AppRole = "administrador" | "operador";

export type CurrentUser = {
  userId: string;
  fullName: string;
  email: string;
  role: AppRole;
};

export function useCurrentUser() {
  const fetchMe = useServerFn(getMe);
  return useQuery<CurrentUser>({
    queryKey: ["me"],
    queryFn: () => fetchMe() as Promise<CurrentUser>,
    staleTime: 60_000,
  });
}
