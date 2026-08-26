import { NextResponse } from "next/server";
import { hashPassword, verifyPassword, generateToken, authenticateRequest } from "@/server/auth";
import { db } from "@/server/db";

export async function GET(request: Request) {
    // status
    const isConfigured = db.admin !== null;
    const user = authenticateRequest(request.headers.get("authorization") || undefined);
    return NextResponse.json({ isConfigured, isAuthenticated: user !== null, admin: user ? { id: user.id, email: user.email, name: user.name } : null });
}

export async function POST(request: Request) {
    const url = new URL(request.url);
    const action = url.pathname.split("/").pop();
    const body = await request.json().catch(() => ({}));

  if (action === "setup") {
    if (db.admin !== null) return NextResponse.json({ error: "System is already configured with an administrator." }, { status: 400 });
    const { name, email, password } = body;
    if (!email || !password || password.length < 8) return NextResponse.json({ error: "Valid email and a password of at least 8 characters are required." }, { status: 400 });
    const newAdmin = { id: `admin-${Date.now()}`, name: name || "Primary Administrator", email: email.trim().toLowerCase(), createdAt: new Date().toISOString() };
    db.admin = newAdmin; db.adminPasswordHash = hashPassword(password); const token = generateToken(); db.tokens.add(token);
    db.recentActivity.unshift({ id: `act-${Date.now()}`, type: "POLICY_CHANGE", title: "Initial Administrator setup completed", description: `Admin account registered for ${newAdmin.email}`, timestamp: new Date().toISOString() });
    return NextResponse.json({ token, admin: { id: newAdmin.id, email: newAdmin.email, name: newAdmin.name } }, { status: 201 });
  }

  if (action === "login") {
    if (!db.admin) return NextResponse.json({ error: "Administrator is not configured yet. Run setup first." }, { status: 400 });
    const { email, password } = body;
    if (!email || !password) return NextResponse.json({ error: "Email and password are required." }, { status: 400 });
    const currentHash = db.adminPasswordHash || "";
    if (email.trim().toLowerCase() !== db.admin.email.toLowerCase() || !verifyPassword(password, currentHash)) return NextResponse.json({ error: "Invalid administrator credentials." }, { status: 401 });
    const token = generateToken(); db.tokens.add(token);
    return NextResponse.json({ token, admin: { id: db.admin.id, email: db.admin.email, name: db.admin.name } });
  }

  if (action === "logout") {
    const authHeader = request.headers.get("authorization");
    if (authHeader) { const token = authHeader.replace(/^Bearer\s+/i, "").trim(); db.tokens.delete(token); }
    return NextResponse.json({ success: true, message: "Logged out successfully" });
  }

  return NextResponse.json({ error: "Unknown auth action" }, { status: 400 });
}

