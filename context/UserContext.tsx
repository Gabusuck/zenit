
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
    gamesOrganized: number;
    attendance: string;
    punctuality: string;
    position: string;
    foot: string;
    age: string;
    birthYear?: string;
    featuredBadgeId?: string;
    featuredBadgeIds?: string[];
    createdAt?: string;
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
    refreshProfile: () => Promise<void>;
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
                checkPastGames(session.user.id);
            } else {
                setUser(null);
                setIsLoading(false);
            }
        });

        return () => subscription.unsubscribe();
    }, []);

    const checkPastGames = async (userId: string) => {
        try {
            // Find games where user is 'confirmed'
            const { data: participations, error } = await supabase
                .from('game_players')
                .select('game_id, games(date, time)')
                .eq('user_id', userId)
                .eq('status', 'confirmed');

            if (error || !participations) return;

            const now = new Date();
            const pastGameIds: string[] = [];

            participations.forEach((p: any) => {
                if (p.games?.date && p.games?.time) {
                    try {
                        const [day, month, year] = p.games.date.split('/').map(Number);
                        const [hours, minutes] = p.games.time.split(':').map(Number);
                        const gameDate = new Date(year, month - 1, day, hours, minutes);

                        // Add buffer (e.g., game duration ~90 mins) or strict end time
                        // Using strict start time for simplicity as requested "mal o jogo aconteca"
                        if (gameDate < now) {
                            pastGameIds.push(p.game_id);
                        }
                    } catch (e) {
                        console.error("Date parse error", e);
                    }
                }
            });

            if (pastGameIds.length > 0) {
                console.log("Auto-confirming past games:", pastGameIds.length);
                const { error: updateError } = await supabase
                    .from('game_players')
                    .update({ status: 'attended' })
                    .eq('user_id', userId)
                    .in('game_id', pastGameIds);

                if (!updateError) {
                    // Refresh profile stats after update
                    fetchProfile(userId, session?.user?.email!);
                }
            }

        } catch (error) {
            console.error("Error checking past games:", error);
        }
    };

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

            // 2. Fetch Games Organized Count
            const { count: organizedCount, error: organizedError } = await supabase
                .from('games')
                .select('*', { count: 'exact', head: true })
                .eq('created_by', userId);

            if (organizedError) console.error('Error fetching organized count:', organizedError);

            // 3. Fetch Games Played Count (Live)
            const { count: playedCount, error: playedError } = await supabase
                .from('game_players')
                .select('*', { count: 'exact', head: true })
                .eq('user_id', userId)
                .eq('status', 'attended');

            if (playedError) console.error('Error fetching games played count:', playedError);

            if (data) {
                // Calculate Punctuality/Attendance
                let attendanceValue = data.attendance || '-';
                try {
                    const { data: attendanceData, error: attendanceError } = await supabase
                        .from('game_players')
                        .select('status')
                        .eq('user_id', userId)
                        .in('status', ['attended', 'no_show']);

                    if (!attendanceError && attendanceData && attendanceData.length > 0) {
                        const total = attendanceData.length;
                        const attended = attendanceData.filter((p: any) => p.status === 'attended').length;
                        const percentage = Math.round((attended / total) * 100);
                        attendanceValue = `${percentage}%`;

                        // Optional: Persist back to profile if different (fire and forget)
                        if (data.attendance !== attendanceValue) {
                            supabase.from('profiles').update({ attendance: attendanceValue }).eq('id', userId).then();
                        }
                    } else if (!attendanceData || attendanceData.length === 0) {
                        attendanceValue = '100%';
                    }
                } catch (e) {
                    console.error('Error calculating attendance:', e);
                }

                // Handle Badge Ids (Array or Single)
                let badgeIds: string[] = [];
                if (data.featured_badge_ids && Array.isArray(data.featured_badge_ids)) {
                    badgeIds = data.featured_badge_ids;
                } else if (data.featured_badge_id) {
                    badgeIds = [data.featured_badge_id];
                }

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
                    gamesPlayed: playedCount || 0,
                    gamesOrganized: organizedCount || 0,
                    attendance: attendanceValue,
                    punctuality: data.punctuality || '-',
                    position: data.position || '-',
                    foot: data.foot || '-',
                    age: data.age || '-',
                    birthYear: data.birth_year,
                    featuredBadgeId: data.featured_badge_id,
                    featuredBadgeIds: badgeIds,
                    createdAt: data.created_at,
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

        // 1.5. Check if email is already taken using secure RPC function
        // Ensure email is lowercase for comparison
        const emailToCheck = email.toLowerCase().trim();
        const { data: emailExists, error: emailCheckError } = await supabase
            .rpc('check_email_exists', { email_to_check: emailToCheck });

        if (emailCheckError) {
            console.error("Error checking email:", emailCheckError);
            return { error: { message: `Erro ao verificar email: ${emailCheckError.message}` } };
        }

        if (emailExists) {
            return { error: { message: 'Este email já está associado a uma conta.' } };
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

        // 3. Force Profile Update & Sign Out (to require manual login)
        if (data.user && !error) {
            // Force update profile to ensure name/username are set correctly
            // (Handling race condition where trigger might be slow or fail)
            const { error: profileError } = await supabase
                .from('profiles')
                .update({ name, username })
                .eq('id', data.user.id);

            if (profileError) {
                console.error("Error updating profile after registration:", profileError);
            }

            // Sign out immediately so user has to log in manually
            await supabase.auth.signOut();
        }

        return { error, data };
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
            featured_badge_id: data.featuredBadgeId,
            featured_badge_ids: data.featuredBadgeIds,
            updated_at: new Date(),
        };

        const { error } = await supabase
            .from('profiles')
            .update(updates)
            .eq('id', user.id);

        if (error) {
            console.error('Error updating profile:', JSON.stringify(error, null, 2));
            alert('Erro ao atualizar perfil: ' + (error.message || 'Erro desconhecido'));
        }
    }

    const refreshProfile = async () => {
        if (session?.user) {
            await fetchProfile(session.user.id, session.user.email!);
        }
    };

    return (
        <UserContext.Provider value={{
            user,
            session,
            isLoading,
            login,
            register,
            logout,
            updateAvatar,
            updateProfile,
            refreshProfile
        }}>
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
