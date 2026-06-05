const fs = require('fs');
let code = fs.readFileSync('src/core/auth/auth-middleware.ts', 'utf8');
code = code.replace(
  'const cookie = request.cookies.get(\'accessToken\');',
  `const cookie = request.cookies.get('accessToken');
    console.log("=== AUTH DEBUG ===");
    console.log("Headers:", Object.fromEntries(request.headers.entries()));
    console.log("Cookies:", request.cookies.getAll());
    console.log("Token from cookie:", cookie?.value ? "present" : "missing");`
);
fs.writeFileSync('src/core/auth/auth-middleware.ts', code);
