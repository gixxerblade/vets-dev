import { renderVerify } from "./src/templates/verify.js";

// Test case 1: Verified user
const verifiedUser = {
  githubUsername: "testuser",
  avatarUrl: "https://example.com/avatar.png",
  verifiedVeteran: true,
  verifiedAt: new Date("2024-01-15"),
  pendingVerification: false,
};

console.log("=== TEST 1: Verified User ===");
const html1 = renderVerify(verifiedUser);
const section1 = html1.match(/<section[^>]*data-on-load[^>]*>/)?.[0];
console.log("Section with SSE:", section1?.slice(0, 100) + "...");
const dataSignals1 = html1.match(/data-signals="[^"]+"/)?.[0];
console.log("Data signals:", dataSignals1);
const verified1 = html1.match(/data-show="\$verified"/);
console.log("Has data-show='$verified':", !!verified1);
console.log("");

// Test case 2: Pending user
const pendingUser = {
  githubUsername: "testuser",
  avatarUrl: null,
  verifiedVeteran: false,
  verifiedAt: null,
  pendingVerification: true,
};

console.log("=== TEST 2: Pending User ===");
const html2 = renderVerify(pendingUser);
const dataSignals2 = html2.match(/data-signals="[^"]+"/)?.[0];
console.log("Data signals:", dataSignals2);
const pending2 = html2.match(/data-show="\$pending && !\$verified"/);
console.log("Has data-show='$pending && !$verified':", !!pending2);
console.log("");

// Test case 3: Not verified user
const notVerifiedUser = {
  githubUsername: "testuser",
  avatarUrl: null,
  verifiedVeteran: false,
  verifiedAt: null,
  pendingVerification: false,
};

console.log("=== TEST 3: Not Verified User ===");
const html3 = renderVerify(notVerifiedUser);
const dataSignals3 = html3.match(/data-signals="[^"]+"/)?.[0];
console.log("Data signals:", dataSignals3);
const notVerified3 = html3.match(/data-show="!\$verified && !\$pending"/);
console.log("Has data-show='!$verified && !$pending':", !!notVerified3);
