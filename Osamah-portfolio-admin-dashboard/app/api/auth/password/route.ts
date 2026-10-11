import { handleAccountSettingsPatch } from "@/lib/api/account-settings-route";

export function PATCH(request: Request) {
  return handleAccountSettingsPatch(request, "/api/auth/password", true);
}
