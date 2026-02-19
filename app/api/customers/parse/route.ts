import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const { files } = await req.json(); // 👈 FIX

  const res = await fetch(
    `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/customers-parse`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ files }),
    }
  );

  if (!res.ok) {
    const text = await res.text();
    console.error(text);
    return NextResponse.json(
      { error: "AI processing failed" },
      { status: 500 }
    );
  }

  return NextResponse.json(await res.json());
}
