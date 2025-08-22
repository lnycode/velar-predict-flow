import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signOut: () => Promise<void>;
  updateProfile: (updates: any) => Promise<void>;
  subscription: {
    tier: string;
    active: boolean;
    endDate: string | null;
  };
  refreshSubscription: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [subscription, setSubscription] = useState({
    tier: 'free',
    active: false,
    endDate: null as string | null,
  });
  const navigate = useNavigate();

  const refreshSubscription = async () => {
    if (!session) return;
    
    try {
      const { data } = await supabase.functions.invoke('check-subscription', {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });
      
      setSubscription({
        tier: data.tier || 'free',
        active: data.subscribed || false,
        endDate: data.current_period_end || null,
      });
    } catch (error) {
      console.error('Error refreshing subscription:', error);
    }
  };

  const updateProfile = async (updates: any) => {
    if (!user) throw new Error('Not authenticated');
    
    const { error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('user_id', user.id);
      
    if (error) throw error;
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
    navigate('/auth');
  };

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
      
      // Refresh subscription data if user is logged in
      if (session) {
        refreshSubscription();
      }
    });

    // Listen for auth changes
    const { data: { subscription: authSubscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);

        if (event === 'SIGNED_IN' && session) {
          // Delay to allow profile creation trigger to complete
          setTimeout(() => {
            refreshSubscription();
          }, 1000);
        } else if (event === 'SIGNED_OUT') {
          setSubscription({ tier: 'free', active: false, endDate: null });
        }
      }
    );

    return () => authSubscription.unsubscribe();
  }, []);

  const value = {
    user,
    session,
    loading,
    signOut,
    updateProfile,
    subscription,
    refreshSubscription,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};