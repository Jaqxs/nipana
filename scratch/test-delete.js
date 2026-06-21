const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function runTest() {
  console.log("Starting test...");
  
  // 1. Clean up any existing test records if they exist
  await prisma.user.deleteMany({
    where: { email: "delete-test-user@nipana.tz" }
  });
  await prisma.invitation.deleteMany({
    where: { email: "delete-test-invite@nipana.tz" }
  });

  // 2. Create a dummy user
  const dummyUser = await prisma.user.create({
    data: {
      email: "delete-test-user@nipana.tz",
      name: "Delete Test User",
      role: "sales_ops",
      status: "active"
    }
  });
  console.log("Created dummy user ID:", dummyUser.id);

  // 3. Create a dummy invitation
  const dummyInvite = await prisma.invitation.create({
    data: {
      email: "delete-test-invite@nipana.tz",
      role: "sales_ops",
      token: "test-token-12345",
      expiresAt: new Date(Date.now() + 3600000)
    }
  });
  console.log("Created dummy invitation ID:", dummyInvite.id);

  // 4. Make HTTP DELETE request to delete user
  console.log("Deleting user via API...");
  const userDeleteRes = await fetch(`http://localhost:3004/api/users/${dummyUser.id}`, {
    method: "DELETE"
  });
  const userDeleteJson = await userDeleteRes.json();
  console.log("API response for user delete:", userDeleteJson);

  // 5. Make HTTP DELETE request to delete invitation
  console.log("Deleting invitation via API...");
  const inviteDeleteRes = await fetch(`http://localhost:3004/api/users/pending-${dummyInvite.id}`, {
    method: "DELETE"
  });
  const inviteDeleteJson = await inviteDeleteRes.json();
  console.log("API response for invitation delete:", inviteDeleteJson);

  // 6. Verify they are gone from the database
  const userCheck = await prisma.user.findUnique({ where: { id: dummyUser.id } });
  const inviteCheck = await prisma.invitation.findUnique({ where: { id: dummyInvite.id } });

  console.log("User in DB check (should be null):", userCheck);
  console.log("Invitation in DB check (should be null):", inviteCheck);

  if (userCheck === null && inviteCheck === null) {
    console.log("TEST SUCCESSFUL!");
    process.exit(0);
  } else {
    console.error("TEST FAILED!");
    process.exit(1);
  }
}

runTest().catch(err => {
  console.error("Error running test:", err);
  process.exit(1);
});
