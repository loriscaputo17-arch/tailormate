import nodemailer from "nodemailer";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT),
      secure: true,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });

    await transporter.sendMail({
      from: `"Atelier" <${process.env.SMTP_FROM}>`,
      to: body.to,
      subject: body.subject,
      text: body.text,
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("email error", err);
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}