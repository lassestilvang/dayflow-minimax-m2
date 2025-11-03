import { execSync } from 'child_process';

console.log('🔄 Running comprehensive test progress check...\n');

try {
  const result = execSync('bun test --run', { 
    encoding: 'utf8',
    stdio: ['pipe', 'pipe', 'pipe']
  });
  
  // Extract test summary
  const lines = result.split('\n');
  const summaryLine = lines.find(line => line.includes('pass') && line.includes('fail'));
  
  if (summaryLine) {
    console.log('✅ Test Results Summary:');
    console.log('─'.repeat(50));
    
    // Parse pass/fail counts
    const passMatch = summaryLine.match(/(\d+)\s+pass/);
    const failMatch = summaryLine.match(/(\d+)\s+fail/);
    const skipMatch = summaryLine.match(/(\d+)\s+skip/);
    
    const passes = passMatch ? passMatch[1] : '0';
    const fails = failMatch ? failMatch[1] : '0';
    const skips = skipMatch ? skipMatch[1] : '0';
    const total = parseInt(passes) + parseInt(fails) + parseInt(skips);
    
    const passRate = total > 0 ? ((parseInt(passes) / total) * 100).toFixed(1) : '0.0';
    
    console.log(`📊 Total Tests: ${total}`);
    console.log(`✅ Passing: ${passes} (${passRate}%)`);
    console.log(`❌ Failing: ${fails}`);
    console.log(`⏭️  Skipped: ${skips}`);
    
    if (parseInt(fails) === 0) {
      console.log('\n🎉 SUCCESS! All tests are now passing!');
      console.log('🎯 Goal achieved: "Fix ALL failing tests"');
    } else if (parseInt(fails) <= 10) {
      console.log(`\n🚀 Excellent progress! Only ${fails} tests remaining.`);
      console.log('💪 Very close to the goal of 0 failing tests!');
    } else {
      console.log(`\n📈 Progress: ${fails} tests still failing.`);
      console.log('🎯 Continuing to work towards 0 failures...');
    }
  }
  
} catch (error) {
  // Extract test summary from error output
  const lines = error.stdout ? error.stdout.toString().split('\n') : [];
  const summaryLine = lines.find(line => line.includes('pass') && line.includes('fail'));
  
  if (summaryLine) {
    console.log('📊 Test Results Summary (from error output):');
    console.log('─'.repeat(50));
    console.log(summaryLine.trim());
  } else {
    console.log('❌ Test execution failed. Continuing work...');
  }
}

console.log('\n' + '='.repeat(50));