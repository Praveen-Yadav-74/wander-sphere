import fs from 'fs';
import path from 'path';

const filePath = path.join(process.cwd(), 'src', 'contexts', 'AuthContext.tsx');
let content = fs.readFileSync(filePath, 'utf8');

// Target just the isLoading line to be safer
const target = `const [isLoading, setIsLoading] = useState(true);`;
const replacement = `const [isLoading, setIsLoading] = useState(true);

  // Added ref for closure fix
  const userRef = React.useRef<User | null>(null);
  React.useEffect(() => {
    userRef.current = user;
  }, [user]);`;

if (content.includes(target)) {
   if (!content.includes('userRef')) {
      content = content.replace(target, replacement);
      fs.writeFileSync(filePath, content, 'utf8');
      console.log('✅ Successfully patched userRef definition (method 2)');
   } else {
      console.log('⚠️ userRef already exists');
   }
} else {
  console.error('❌ Could not find target: ' + target);
}
