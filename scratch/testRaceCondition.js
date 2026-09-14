// Test script to simulate race conditions in async search fetching
import assert from 'assert';

console.log('Testing Dual-Layer Race-Condition Protection...');

let activeRequestId = 0;
let finalState = null;

async function simulateFetch(searchQuery, delayMs) {
  const currentReqId = ++activeRequestId;
  console.log(`[Dispatched] Query: "${searchQuery}" (ReqId: ${currentReqId}, Delay: ${delayMs}ms)`);

  return new Promise((resolve) => {
    setTimeout(() => {
      // Race Condition Guard
      if (currentReqId !== activeRequestId) {
        console.log(`[Discarded Stale Response] Query: "${searchQuery}" (ReqId: ${currentReqId} vs Active: ${activeRequestId})`);
        return resolve(null);
      }
      
      console.log(`[Applied Valid Response] Query: "${searchQuery}" (ReqId: ${currentReqId})`);
      finalState = `Data for "${searchQuery}"`;
      resolve(finalState);
    }, delayMs);
  });
}

// Simulate fast user typing:
// Query 1: "Lo" (Dispatched first, but takes 300ms to arrive)
// Query 2: "Lonavala" (Dispatched 50ms later, but takes 100ms to arrive)
async function runTest() {
  const p1 = simulateFetch("Lo", 300);
  await new Promise(r => setTimeout(r, 50));
  const p2 = simulateFetch("Lonavala", 100);

  await Promise.all([p1, p2]);

  console.log('Final State after all promises resolved:', finalState);
  assert.strictEqual(finalState, 'Data for "Lonavala"', 'State must hold the latest query data!');
  console.log('✅ Race-condition test PASSED!');
}

runTest();
