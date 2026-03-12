import os

file_path = 'src/components/Dashboard/AdminDashboard.tsx'
with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# Replace imports
old_import = "import { auth, logout } from '../../firebase';"
new_import = "import { useAuth } from '../../context/AuthContext';"
content = content.replace(old_import, new_import)

# Replace state
old_cu = "const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);"
new_cu = "const { profile: currentUser, logout } = useAuth();"
content = content.replace(old_cu, new_cu)

# Clean up settings update
content = content.replace("const { settings, updateSettings } = useSiteSettings();", "const { settings } = useSiteSettings();")

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)

print("Successfully updated AdminDashboard.tsx")
