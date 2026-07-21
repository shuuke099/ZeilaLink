/* Read-only aggregate check. Never prints email addresses or password hashes. */
const path = require("path");
const dotenv = require("dotenv");
const bcrypt = require("bcryptjs");
const { PrismaClient } = require("@prisma/client");

dotenv.config({ path: path.resolve(process.cwd(), ".env") });

const prisma = new PrismaClient();
const targetBcryptCost = 12;
const compromisedLegacyPasswords = [
  "admin123",
  "worker123",
  "employee123",
  "employer123",
  "provider123",
];

async function main() {
  const users = await prisma.user.findMany({
    select: { passwordHash: true },
  });
  const hashFormats = {};
  let knownLegacyPasswordMatches = 0;
  let belowTargetCostHashes = 0;

  for (const user of users) {
    const match = user.passwordHash.match(/^\$2[aby]\$(\d{2})\$/);
    const format = match ? `bcrypt-cost-${match[1]}` : "unknown";
    hashFormats[format] = (hashFormats[format] || 0) + 1;
    if (match && Number(match[1]) < targetBcryptCost) belowTargetCostHashes += 1;

    const results = await Promise.all(
      compromisedLegacyPasswords.map((password) =>
        bcrypt.compare(password, user.passwordHash),
      ),
    );
    if (results.some(Boolean)) knownLegacyPasswordMatches += 1;
  }

  console.log(
    JSON.stringify({
      userCount: users.length,
      hashFormats,
      targetBcryptCost,
      belowTargetCostHashes,
      knownLegacyPasswordMatches,
    }),
  );

  if (hashFormats.unknown || belowTargetCostHashes > 0 || knownLegacyPasswordMatches > 0) {
    process.exitCode = 2;
  }
}

main()
  .catch(() => {
    console.error(JSON.stringify({ error: "password_security_check_failed" }));
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
