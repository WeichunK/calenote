// Test to understand React Query's setQueriesData behavior

// According to React Query v5 docs:
// setQueriesData({ queryKey: ['tasks', 'list'] }, updater)
// Will match ALL queries that start with ['tasks', 'list']
// Including:
// - ['tasks', 'list']
// - ['tasks', 'list', { calendar_id: 'abc' }]
// - ['tasks', 'list', { calendar_id: 'abc', status: 'active' }]

// This is because React Query uses "partial matching" with queryKey filters
// A partial queryKey will match any query key that starts with it

const queryKeys = [
  ['tasks', 'list', { calendar_id: 'abc123' }],
  ['tasks', 'list', { calendar_id: 'abc123', status: 'active' }],
  ['tasks', 'list', { calendar_id: 'xyz789' }],
  ['tasks', 'detail', '123'],
];

const filter = { queryKey: ['tasks', 'list'] };

console.log('Filter:', JSON.stringify(filter.queryKey));
console.log('\nWould match:');
queryKeys.forEach(key => {
  const matches = key[0] === filter.queryKey[0] && key[1] === filter.queryKey[1];
  console.log(`  ${matches ? '✓' : '✗'} ${JSON.stringify(key)}`);
});

console.log('\n=== ANALYSIS ===');
console.log('The optimistic update uses: { queryKey: ["tasks", "list"] }');
console.log('This SHOULD match the TaskBoard query: ["tasks", "list", { calendar_id: "..." }]');
console.log('\nBUT there might be another issue...');
console.log('Let me check if the updater function handles undefined correctly.');
