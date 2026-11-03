import { createContext, useContext, useState, useEffect } from 'react';
import { getUser, getUsers, createUser, updateUser } from '../services/api';

const UserContext = createContext();

export function UserProvider({ children }) {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('cogflow_active_user');
    return saved ? JSON.parse(saved) : { id: 'usr_default', name: 'Prathamesh', avatar: '🚀', grade_level: 'B.Tech Computer Science' };
  });
  const [allUsers, setAllUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  // Fetch live user and all profiles on mount
  useEffect(() => {
    let mounted = true;
    async function loadData() {
      try {
        const [u, usersList] = await Promise.all([
          getUser(user?.id || 'usr_default'),
          getUsers()
        ]);
        if (mounted) {
          if (u) {
            setUser(u);
            localStorage.setItem('cogflow_active_user', JSON.stringify(u));
          }
          if (usersList) setAllUsers(usersList);
        }
      } catch (err) {
        console.warn('Failed to load user data from backend:', err);
      } finally {
        if (mounted) setLoading(false);
      }
    }
    loadData();
    return () => { mounted = false; };
  }, [user?.id]);

  const switchUser = (selectedUser) => {
    setUser(selectedUser);
    localStorage.setItem('cogflow_active_user', JSON.stringify(selectedUser));
  };

  const handleCreateUser = async (newUserData) => {
    try {
      const created = await createUser(newUserData);
      setUser(created);
      localStorage.setItem('cogflow_active_user', JSON.stringify(created));
      setAllUsers(prev => [...prev.filter(u => u.id !== created.id), created]);
      return created;
    } catch (err) {
      console.error('Error creating user:', err);
      throw err;
    }
  };

  const handleUpdateProfile = async (updateData) => {
    try {
      const updated = await updateUser(user.id, updateData);
      setUser(updated);
      localStorage.setItem('cogflow_active_user', JSON.stringify(updated));
      setAllUsers(prev => prev.map(u => u.id === updated.id ? updated : u));
      return updated;
    } catch (err) {
      console.error('Error updating profile:', err);
      throw err;
    }
  };

  return (
    <UserContext.Provider value={{
      user,
      allUsers,
      loading,
      switchUser,
      createUser: handleCreateUser,
      updateProfile: handleUpdateProfile
    }}>
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
}
