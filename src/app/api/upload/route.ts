import { NextResponse } from "next/server";
import path from "path";
import fs from "fs/promises";

export async function POST(req: Request) {
  const formData = await req.formData();
  const file = formData.get("file") as File;

  if (!file) {
    return NextResponse.json({ error: "no file" }, { status: 400 });
  }

  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);

  const filename = `${Date.now()}-${file.name}`;
  const uploadPath = path.join(process.cwd(), "public/uploads", filename);

  await fs.writeFile(uploadPath, buffer);

  return NextResponse.json({
    src: `/uploads/${filename}`,
  });
}