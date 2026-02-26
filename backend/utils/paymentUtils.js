// utils/paymentUtils.js
// Implement provider-specific signature verification here.
function verifyProviderSignature(rawBody, signature) {
  // Example placeholder: compute HMAC with provider secret and compare.
  // Return true if valid, false otherwise.
  return true; // replace with real verification
}

module.exports = { verifyProviderSignature };