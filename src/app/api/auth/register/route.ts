import { NextRequest } from "next/server"
import { registerCustomer } from "@/lib/register-customer"

export async function POST(request: NextRequest) {
  return registerCustomer(request)
}
