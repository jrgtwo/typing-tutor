-- Seed content_items with a few prose passages and code snippets.
-- Safe to re-run: titles are unique only by row, so this just adds.

insert into public.content_items (type, title, body, language, source, difficulty) values
  ('prose', 'Sea-Fever',
   'I must go down to the seas again, to the lonely sea and the sky, and all I ask is a tall ship and a star to steer her by.',
   null, 'John Masefield', 2),
  ('prose', 'On Conviction',
   'The trouble with the world is that the stupid are cocksure and the intelligent are full of doubt.',
   null, 'Bertrand Russell', 2),
  ('prose', 'Workshop',
   'A craftsman who blames his tools is one who has not yet found tools that fit his hands. The bench remembers; the wood does not.',
   null, 'original', 3),
  ('code', 'fizzbuzz.js',
   'for (let i = 1; i <= 100; i++) {\n  if (i % 15 === 0) console.log("FizzBuzz");\n  else if (i % 3 === 0) console.log("Fizz");\n  else if (i % 5 === 0) console.log("Buzz");\n  else console.log(i);\n}\n',
   'javascript', 'classic', 2),
  ('code', 'fib.py',
   'def fib(n: int) -> int:\n    if n < 2:\n        return n\n    a, b = 0, 1\n    for _ in range(n - 1):\n        a, b = b, a + b\n    return b\n',
   'python', 'classic', 2),
  ('code', 'http_handler.go',
   'func handler(w http.ResponseWriter, r *http.Request) {\n    if r.Method != http.MethodGet {\n        http.Error(w, "method not allowed", http.StatusMethodNotAllowed)\n        return\n    }\n    fmt.Fprintln(w, "ok")\n}\n',
   'go', 'original', 3);
