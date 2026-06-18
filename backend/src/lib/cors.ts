import { NextResponse } from "next/server"

export function corsHeaders() {
  return {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET,POST,PATCH,DELETE,OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type,Authorization",
  }
}

export function optionsResponse() {
  return new NextResponse(null, { status: 204, headers: corsHeaders() })
}
