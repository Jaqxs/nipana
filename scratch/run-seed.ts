import { seedService } from "../backend/services/seed-service";

async function main() {
  console.log("Starting administrative user seeding...");
  try {
    await seedService.seed();
    console.log("SUCCESS: Administrative accounts created.");
  } catch (e) {
    console.error("SEED ERROR:", e);
  }
}

main();
