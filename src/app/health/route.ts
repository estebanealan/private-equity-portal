import { apiSuccess } from "@/lib/api-response";

export async function GET() {
  return apiSuccess({
    service: "private-equity-portal",
    status: "ok",
  });
}
