console.log('Hello from my semantic search plugin!');

const input = document.querySelector('input[name="s"], input[type="search"]');
if (input) {
  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') console.log('You searched:', input.value);
  });
}