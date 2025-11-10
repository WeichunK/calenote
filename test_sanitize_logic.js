// Test the sanitizeValue logic to verify it works correctly

const sanitizeValue = (value) => {
  if (typeof value === 'string' && value.trim() === '') {
    return undefined;
  }
  return value;
};

console.log('Testing sanitizeValue logic:');
console.log('====================================');
console.log('');

// Test cases
const testCases = [
  { input: '', expected: undefined, description: 'Empty string' },
  { input: '   ', expected: undefined, description: 'Whitespace only' },
  { input: '🎯', expected: '🎯', description: 'Valid emoji' },
  { input: '#3b82f6', expected: '#3b82f6', description: 'Valid color' },
  { input: 'test', expected: 'test', description: 'Normal string' },
  { input: undefined, expected: undefined, description: 'Already undefined' },
  { input: null, expected: null, description: 'Null value' },
  { input: 0, expected: 0, description: 'Number zero' },
];

let allPassed = true;

testCases.forEach(({ input, expected, description }) => {
  const result = sanitizeValue(input);
  const passed = result === expected;
  const icon = passed ? '✅' : '❌';

  console.log(`${icon} ${description}`);
  console.log(`   Input: ${JSON.stringify(input)}`);
  console.log(`   Expected: ${JSON.stringify(expected)}`);
  console.log(`   Result: ${JSON.stringify(result)}`);
  console.log('');

  if (!passed) allPassed = false;
});

console.log('====================================');
console.log(allPassed ? '✅ All tests passed!' : '❌ Some tests failed!');
console.log('');

// Simulate the actual data flow from TaskDialog
console.log('Simulating TaskDialog data flow:');
console.log('====================================');
console.log('');

const currentData = {
  title: 'task1',
  description: '',
  color: '',
  icon: '🎯',
  due_date: undefined,
};

const createTaskDTO = {
  calendar_id: '24cb508f-9585-4205-9824-742af56e04ab',
  title: currentData.title.trim(),
  description: sanitizeValue(currentData.description),
  due_date: currentData.due_date,
  color: sanitizeValue(currentData.color),
  icon: sanitizeValue(currentData.icon),
};

console.log('Input (currentData):');
console.log(JSON.stringify(currentData, null, 2));
console.log('');

console.log('Output (CreateTaskDTO after sanitization):');
console.log(JSON.stringify(createTaskDTO, null, 2));
console.log('');

// Check what gets sent in JSON.stringify (undefined fields are omitted)
const jsonPayload = JSON.stringify(createTaskDTO);
console.log('JSON payload that would be sent to API:');
console.log(jsonPayload);
console.log('');

console.log('✅ Notice: description and color are omitted from JSON (undefined values)');
console.log('✅ This matches the backend expectation!');
