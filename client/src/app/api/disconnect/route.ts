// client/src/app/api/disconnect/route.ts

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { PrismaClient } from "@prisma/client";
import { authOptions } from "@/app/api/auth/[...nextauth]/route"; // Adjust path as needed

const prisma = new PrismaClient();

export async function POST(request: NextRequest) {
  console.log("POST /api/disconnect: Received request");

  // 1. Authenticate Session
  const session = await getServerSession(authOptions);
  if (!session || !session.user?.id) {
    console.error("POST /api/disconnect: Not authenticated");
    return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  }
  const userId = session.user.id;

  // 2. Parse and Validate Body
  let requestBody;
  try {
    requestBody = await request.json();
  } catch (error) {
    console.error("POST /api/disconnect: Invalid JSON body", error);
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const { provider } = requestBody;
  if (provider !== 'spotify' && provider !== 'google') {
    console.error("POST /api/disconnect: Invalid provider specified", { provider });
    return NextResponse.json({ error: "Invalid provider specified. Must be 'spotify' or 'google'." }, { status: 400 });
  }

  console.log(`POST /api/disconnect: User ${userId} attempting to disconnect provider ${provider}`);

  // 3. Perform Database Operation (Update tokens to null)
  try {
    const updateResult = await prisma.account.updateMany({
      where: {
        userId: userId,
        provider: provider,
      },
      data: {
        access_token: null,
        refresh_token: null, // Also clear refresh token if you store it
        expires_at: null,
        id_token: null, // Clear ID token if applicable
        scope: null, // Clear scope if applicable
        session_state: null, // Clear session state if applicable
        token_type: null // Clear token type if applicable
        // Add any other provider-specific token fields you might store
      },
    });

    console.log(`POST /api/disconnect: Update result for user ${userId}, provider ${provider}:`, updateResult);

    if (updateResult.count === 0) {
      // This could happen if the user wasn't actually connected to this provider
      console.warn(`POST /api/disconnect: No account found for user ${userId} and provider ${provider} to update.`);
      // Still return success as the desired state (disconnected) is achieved
    }

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error(`POST /api/disconnect: Database error for user ${userId}, provider ${provider}`, error);
    return NextResponse.json({ error: "An internal server error occurred." }, { status: 500 });
  }
} 