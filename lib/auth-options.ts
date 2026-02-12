import { NextAuthOptions } from "next-auth"; 
import GoogleProvider from "next-auth/providers/google";
import CredentialProvider from "next-auth/providers/credentials"; 
import { PrismaAdapter } from '@next-auth/prisma-adapter';
import prisma from '../prisma/prisma-client';
import { env } from "process";

export const authOptions: NextAuthOptions = {
  callbacks: {
  async redirect({ baseUrl }) {
    return `${baseUrl}/trip`;
  },
  async session({ session, token }) {
    session.user = {
      ...session.user,
      // @ts-ignore
      id: token.sub,
    };
    return session;
  },
},
  session: {
    strategy: 'jwt',
  },
  secret: env.JWT_SECRET,
  // Configure one or more authentication providers 
  adapter: PrismaAdapter(prisma),
  providers: [
    CredentialProvider({
      credentials: {
        email: {
          label: "email",
          type: "email",
          placeholder: "landsat@gmail.com",
        },
      },
      async authorize(credentials, req) {
        const user = { id: "5", name: "Test User", email: credentials?.email };
        // if credentials?.email not equal to landsat@gmail.com then return null
        if (credentials?.email !== "landsat@gmail.com") {
          return null;
        }
        if (user) {
          // Any object returned will be saved in `user` property of the JWT
          await prisma.user.upsert({
            where: {
              email: user.email,
            },
            update: {
              email: user.email,
              name: user.name, 
              passwordHash: "landsat",
            },
            create: {
              email: user.email as string,
              name: user.name,
              passwordHash: "landsat",
            },
          });
          return user;
        } else {
          // If you return null then an error will be displayed advising the user to check their details.
          return null;

          // You can also Reject this callback with an Error thus the user will be sent to the error page with the error message as a query parameter
        }
      },
    }),
    GoogleProvider({
      clientId: process.env.GOOGLE_ID ?? "",
      clientSecret: process.env.GOOGLE_SECRET ?? "",
    })
  ],
  pages: {
    signIn: "/signin",  
  },
};
