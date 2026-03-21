import { NextAuthOptions } from "next-auth"; 
import GoogleProvider from "next-auth/providers/google";
import CredentialProvider from "next-auth/providers/credentials"; 
import { PrismaAdapter } from '@next-auth/prisma-adapter';
import prisma from '../prisma/prisma-client';
import { env } from "process";

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  session: { strategy: "jwt" },
  secret: env.JWT_SECRET,

  callbacks: {
    async redirect({ url, baseUrl }) {
  // allow default behavior
  if (url.startsWith(baseUrl)) return url;
  return baseUrl;
},
    async session({ session, token }) {
      session.user = {
        ...session.user,
        id: token.sub!,
      };
      return session;
    },
  },

  providers: [
    CredentialProvider({
      name: "Email Login",
      credentials: {
        email: {
          label: "Email",
          type: "email",
        },
      },
async authorize(credentials) {
  if (!credentials?.email) return null;

  const email = credentials.email;

  // ✅ Always allow admin
  if (email === "landsat@gmail.com") {
    let user = await prisma.user.findUnique({
      where: { email },
    });

    // auto-create admin
    if (!user) {
      user = await prisma.user.create({
        data: {
          email,
          name: "Admin",
        },
      });
    }

    return {
      id: user.id,
      email: user.email,
      name: user.name,
    };
  }

  // ✅ Allow only existing users
  const existingUser = await prisma.user.findUnique({
    where: { email },
  });

  if (!existingUser) {
    throw new Error("Not authorized. Contact admin.");
  }

  return {
    id: existingUser.id,
    email: existingUser.email,
    name: existingUser.name,
  };
}
    }),

    GoogleProvider({
      clientId: process.env.GOOGLE_ID ?? "",
      clientSecret: process.env.GOOGLE_SECRET ?? "",
    }),
  ],

  pages: {
    signIn: "/signin",
  },
};
