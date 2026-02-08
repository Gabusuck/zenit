
import { Session } from '@supabase/supabase-js';
import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

type User = {
    id: string;
    name: string;
    username: string;
    email: string;
    isAuthenticated: boolean;
    // Profile Data
    avatar: string | null;
    level: number;
    rating: number;
    ratingCount: number;
    gamesPlayed: number;
    attendance: string;
    punctuality: string;
    position: string;
    foot: string;
    age: string;
    birthYear?: string;
};

type UserContextType = {
    user: User | null;
    session: Session | null;
    isLoading: boolean;
    login: (emailOrUsername: string, password: string) => Promise<{ error: any }>;
    register: (name: string, username: string, email: string, password: string) => Promise<{ error: any }>;
    logout: () => Promise<void>;
    updateAvatar: (uri: string) => Promise<void>;
    updateProfile: (data: Partial<User>) => Promise<void>;
};

const UserContext = createContext<UserContextType | undefined>(undefined);

export const UserProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);
    const [session, setSession] = useState<Session | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        // 1. Get initial session
        supabase.auth.getSession().then(({ data: { session } }) => {
            setSession(session);
            if (session) {
                fetchProfile(session.user.id, session.user.email!);
            } else {
                setIsLoading(false);
            }
        });

        // 2. Listen for auth changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            setSession(session);
            if (session) {
                fetchProfile(session.user.id, session.user.email!);
            } else {
                setUser(null);
                setIsLoading(false);
            }
        });

        return () => subscription.unsubscribe();
    }, []);

    const fetchProfile = async (userId: string, email: string) => {
        try {
            const { data, error } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', userId)
                .single();

            if (error) {
                console.error('Error fetching profile:', error);
            }

            if (data) {
                setUser({
                    id: userId,
                    email: email,
                    isAuthenticated: true,
                    name: data.name || 'Utilizador',
                    username: data.username || '@user',
                    avatar: data.avatar_url,
                    level: data.level || 1,
                    rating: data.rating || 0,
                    ratingCount: data.rating_count || 0,
                    gamesPlayed: data.games_played || 0,
                    attendance: data.attendance || '-',
                    punctuality: data.punctuality || '-',
                    position: data.position || '-',
                    foot: data.foot || '-',
                    age: data.age || '-',
                    birthYear: data.birth_year,
                });
            }
        } catch (error) {
            console.error('Unexpected error fetching profile:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const login = async (emailOrUsername: string, password: string) => {
        let emailToUse = emailOrUsername;

        // Check if input looks like an email
        if (!emailOrUsername.includes('@')) {
            // It's a username, find the email
            // Note: This requires the 'email' column to be accessible in the 'profiles' table
            const { data, error } = await supabase
                .from('profiles')
                .select('email')
                .eq('username', emailOrUsername)
                .single();

            if (error || !data) {
                return { error: { message: 'Utilizador não encontrado.' } };
            }
            emailToUse = data.email;
        }

        const { error } = await supabase.auth.signInWithPassword({
            email: emailToUse,
            password,
        });
        return { error };
    };

    const register = async (name: string, username: string, email: string, password: string) => {
        // 1. Check if username is already taken
        const { data: existingUser } = await supabase
            .from('profiles')
            .select('username')
            .eq('username', username)
            .single();

        if (existingUser) {
            return { error: { message: 'Este nome de utilizador já existe.' } };
        }

        // 2. Sign up
        const { error, data } = await supabase.auth.signUp({
            email,
            password,
            options: {
                data: {
                    name,
                    username, // Will be used by trigger to populate profiles
                    avatar_url: null,
                }
            }
        });

        return { error };
    };

    const logout = async () => {
        await supabase.auth.signOut();
    };

    const updateAvatar = async (uri: string) => {
        if (!user || !session) return;

        try {
            console.log("Starting upload for:", uri);

            // 1. Fetch the file
            const response = await fetch(uri);
            const arrayBuffer = await response.arrayBuffer();

            console.log("File size (bytes):", arrayBuffer.byteLength);

            if (arrayBuffer.byteLength === 0) {
                console.error("Error: File is empty!");
                alert("Erro: A imagem selecionada parece estar vazia.");
                return;
            }

            const fileExt = uri.split('.').pop()?.toLowerCase() || 'jpeg';
            const fileName = `${user.id}/${Date.now()}.${fileExt}`;
            const filePath = `${fileName}`;
            const contentType = `image/${fileExt === 'jpg' ? 'jpeg' : fileExt}`;

            // 2. Upload to Supabase Storage
            const { data, error: uploadError } = await supabase.storage
                .from('avatars')
                .upload(filePath, arrayBuffer, {
                    contentType: contentType,
                    upsert: true,
                });

            if (uploadError) {
                console.error("Supabase Upload Error:", uploadError);
                throw uploadError;
            }

            // 3. Get Public URL
            const { data: { publicUrl } } = supabase.storage
                .from('avatars')
                .getPublicUrl(filePath);

            console.log("New Avatar URL:", publicUrl);

            // Force cache busting by appending timestamp
            const publicUrlWithTimestamp = `${publicUrl}?t=${Date.now()}`;

            // 4. Update Profile in DB and State
            setUser(prev => prev ? { ...prev, avatar: publicUrlWithTimestamp } : null);

            const { error: updateError } = await supabase
                .from('profiles')
                .update({ avatar_url: publicUrl })
                .eq('id', user.id);

            if (updateError) {
                console.error("Profile Update Error:", updateError);
                throw updateError;
            }

        } catch (error) {
            console.error('Final Upload Error:', error);
            alert('Falha ao enviar imagem. Verifique os logs.');
        }
    };

    const updateProfile = async (data: Partial<User>) => {
        if (!user || !session) return;

        // Optimistic update
        setUser(prev => prev ? { ...prev, ...data } : null);

        // Map frontend fields to DB columns
        const updates = {
            name: data.name,
            username: data.username,
            level: data.level,
            position: data.position,
            foot: data.foot,
            age: data.age,
            birth_year: data.birthYear,
            updated_at: new Date(),
        };

        const { error } = await supabase
            .from('profiles')
            .update(updates)
            .eq('id', user.id);

        if (error) console.error('Error updating profile:', error);
    }

    return (
        <UserContext.Provider value={{ user, session, isLoading, login, register, logout, updateAvatar, updateProfile }}>
            {children}
        </UserContext.Provider>
    );
};

export const useUser = () => {
    const context = useContext(UserContext);
    if (context === undefined) {
        throw new Error('useUser must be used within a UserProvider');
    }
    return context;
};
