import fs from 'fs';
import path from 'path';

const filePath = path.join(process.cwd(), 'src', 'contexts', 'AuthContext.tsx');
let content = fs.readFileSync(filePath, 'utf8');

// 1. Add useRef to imports if missing, or just use React.useRef (already confirmed React is imported)
// But to be cleaner, let's just use React.useRef since React is default imported.

// 2. Insert the Ref definition
const stateDef = `  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);`;

const stateDefReplacement = `  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Keep ref of user to avoid stale closures in onAuthStateChange
  const userRef = React.useRef<User | null>(null);
  React.useEffect(() => {
    userRef.current = user;
  }, [user]);`;

if (content.includes(stateDef) && !content.includes('userRef')) {
  content = content.replace(stateDef, stateDefReplacement);
  console.log('✅ Added userRef definition');
} else if (content.includes('userRef')) {
  console.log('⚠️ userRef already present, skipping definition');
} else {
  console.error('❌ Could not find state definition to insert ref');
}

// 3. Patch the stale closure check in onAuthStateChange
// We need to match the block carefully.
const staleBlock = `          // ✅ SKIP PROFILE FETCH IF USER ALREADY IN STATE - Prevents reload on tab switch
          if (user && user.id === session.user.id) {
            console.log('✅ User already in state, skipping profile fetch');
            return; // Don't refetch if we already have this user's profile
          }
          
          // Only set loading if we don't already have a user (first time login only)
          if (!user) {`;

const fixedBlock = `          // ✅ SKIP PROFILE FETCH IF USER ALREADY IN STATE - Prevents reload on tab switch
          // Check ref instead of stale closure user
          const currentUser = userRef.current;
          if (currentUser && currentUser.id === session.user.id) {
            console.log('✅ User already in state (verified via ref), skipping profile fetch');
            return; // Don't refetch if we already have this user's profile
          }
          
          // Only set loading if we don't already have a user (first time login only)
          if (!currentUser) {`;

if (content.includes(staleBlock)) {
  content = content.replace(staleBlock, fixedBlock);
  console.log('✅ Patched stale closure check in onAuthStateChange');
} else {
  // Be looser with whitespace if needed, but let's try exact match first
  // Try matching just the inner part if full block fails
  const innerTarget = `if (user && user.id === session.user.id) {`;
  const innerReplacement = `const currentUser = userRef.current;\n          if (currentUser && currentUser.id === session.user.id) {`;
  
  if (content.includes(innerTarget)) {
      console.log('⚠️ Exact block match failed, patching via inner target...');
      content = content.replace(innerTarget, innerReplacement);
      
      // Also update the !user check later
      content = content.replace('if (!user) {', 'if (!currentUser) {');
  } else {
      console.error('❌ Could not find logic block to patch');
  }
}

fs.writeFileSync(filePath, content, 'utf8');
