import fs from 'fs';
import path from 'path';

const filePath = path.join(process.cwd(), 'src', 'contexts', 'AuthContext.tsx');
let content = fs.readFileSync(filePath, 'utf8');

const target = `  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);`;

const replacement = `  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Added ref for closure fix
  const userRef = React.useRef<User | null>(null);
  React.useEffect(() => {
    userRef.current = user;
  }, [user]);`;

if (content.includes(target)) {
  content = content.replace(target, replacement);
  fs.writeFileSync(filePath, content, 'utf8');
  console.log('✅ Successfully patched userRef definition');
} else {
  console.error('❌ Could not find target definition');
  console.log('Current content nearby:', content.slice(content.indexOf('AuthProvider'), content.indexOf('isAuthenticated')));
}
