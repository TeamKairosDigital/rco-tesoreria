import { NextAuthOptions } from 'next-auth';
import GoogleProvider from 'next-auth/providers/google';
import { db } from './firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';

declare module 'next-auth' {
  interface User {
    id?: string;
  }
  
  interface Session {
    user: User & {
      id?: string;
    };
  }
}

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],
  callbacks: {
    async signIn({ user }) {
      if (!user.email) return false;

      const userRef = doc(db, 'users', user.email);
      const userDoc = await getDoc(userRef);

      if (!userDoc.exists()) {
        await setDoc(userRef, {
          email: user.email,
          name: user.name,
          image: user.image,
          createdAt: new Date().toISOString(),
        });
      }

      return true;
    },
    async session({ session }) {
      if (session.user?.email) {
        const userRef = doc(db, 'users', session.user.email);
        const userDoc = await getDoc(userRef);
        
        if (userDoc.exists()) {
          session.user.id = userDoc.id;
        }
      }
      return session;
    },
  },
  pages: {
    signIn: '/auth/signin',
  },
}; 