// Test script to verify win probability
async function testWinProbability() {
  const totalTests = 10000;
  let wins = 0;
  let losses = 0;
  
  // Simulate win probability
  const WIN_PROBABILITY = 1 / 500; // 0.002
  
  for (let i = 0; i < totalTests; i++) {
    const random = Math.random();
    if (random < WIN_PROBABILITY) {
      wins++;
    } else {
      losses++;
    }
  }
  
  const actualWinRate = (wins / totalTests) * 100;
  const expectedWinRate = WIN_PROBABILITY * 100;
  
  console.log(`=== Win Probability Test ===`);
  console.log(`Total tests: ${totalTests}`);
  console.log(`Wins: ${wins}`);
  console.log(`Losses: ${losses}`);
  console.log(`Actual win rate: ${actualWinRate.toFixed(2)}%`);
  console.log(`Expected win rate: ${expectedWinRate.toFixed(2)}%`);
  console.log(`Difference: ${(Math.abs(actualWinRate - expectedWinRate)).toFixed(2)}%`);
  
  // Confidence interval
  const marginError = 1.96 * Math.sqrt((WIN_PROBABILITY * (1 - WIN_PROBABILITY)) / totalTests) * 100;
  console.log(`95% Confidence interval: ±${marginError.toFixed(2)}%`);
}

testWinProbability();