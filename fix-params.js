const fs = require('fs');

const files = [
  'src/app/api/apps/[appId]/draft/route.ts',
  'src/app/api/apps/[appId]/versions/route.ts',
  'src/app/api/apps/[appId]/publish/route.ts',
  'src/app/api/apps/[appId]/seed-status/route.ts',
  'src/app/apps/[appId]/versions/page.tsx',
  'src/app/apps/[appId]/layout.tsx'
];

for (const file of files) {
  let content = fs.readFileSync(file, 'utf8');
  
  // Replace typing
  content = content.replace(/params: \{ appId: string( \})?\}/g, 'params: Promise<{ appId: string }>');
  
  // Replace usage
  content = content.replace(/const \{ appId \} = params;/g, 'const { appId } = await params;');
  
  fs.writeFileSync(file, content);
}
console.log('Fixed params types and usage.');
