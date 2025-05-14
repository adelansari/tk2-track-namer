// Choose the correct table based on the suggestion type
const numericId = parseInt(id, 10);
const idParam = !isNaN(numericId) ? numericId : id;

console.log(`Using ID parameter for deletion: ${idParam} (${typeof idParam})`);

if (type === 'track') {
  console.log(`Executing: DELETE FROM track_suggestions WHERE id = ${idParam}`);
  // Try with explicit casting if needed
  const result = await query('DELETE FROM track_suggestions WHERE id = $1 RETURNING id', [idParam]);
  console.log(`Deletion result for track suggestion: ${JSON.stringify(result)}`);
} else {
  console.log(`Executing: DELETE FROM arena_suggestions WHERE id = ${idParam}`);
  const result = await query('DELETE FROM arena_suggestions WHERE id = $1 RETURNING id', [idParam]);
  console.log(`Deletion result for arena suggestion: ${JSON.stringify(result)}`);
}
