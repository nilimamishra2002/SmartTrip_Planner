import { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import CredentialsProvider from "next-auth/providers/credentials";

export const authOptions: NextAuthOptions = {
  session: { strategy: "jwt" },
  secret: process.env.NEXTAUTH_SECRET,

  callbacks: {
    async redirect({ url, baseUrl }) {
      if (url.startsWith(baseUrl)) return url;
      return baseUrl;
    },

    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.sub!;
      }
      return session;
    },
  },

  providers: [
    CredentialsProvider({
      name: "Admin Login",
      credentials: {
        email: { label: "Email", type: "email" },
      },

      async authorize(credentials) {
        // ✅ ONLY ALLOW THIS USER
        if (
          credentials?.email === "landsat@gmail.com" 
        ) {
          return {
            id: "1",
            name: "Admin",
            email: "landsat@gmail.com",
          };
        }

        return null;
      },
    }),

    // OPTIONAL: keep Google only if needed
    GoogleProvider({
      clientId: process.env.GOOGLE_ID ?? "",
      clientSecret: process.env.GOOGLE_SECRET ?? "",
    }),
  ],

  pages: {
    signIn: "/signin",
  },
};