console.log('Hello from my semantic search plugin!');

document.addEventListener('DOMContentLoaded', () => {
  const input = document.querySelector('input[name="s"], input[type="search"]');
  console.log('Search box found:', input);
  if (input) {
    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        // e.preventDefault();
        console.log('You searched:', input.value);
      }
    });
  }
});