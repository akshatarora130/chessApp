import NextAuth from "next-auth"
import GithubProvider from "next-auth/providers/github"
import GoogleProvider from "next-auth/providers/google"
import { PrismaAdapter } from '@next-auth/prisma-adapter';
import { prisma } from "@repo/database";
import { GITHUB_ID, GITHUB_SECRET, GOOGLE_ID, GOOGLE_SECRET, NEXTAUTH_SECRET } from "@repo/common";

type SessionProps = {
  session: any;
  user: any;
};

export const authOptions = {
  adapter: PrismaAdapter(prisma),

  providers: [
    GithubProvider({
      clientId: GITHUB_ID ?? "",
      clientSecret: GITHUB_SECRET ?? "",
    }),
    GoogleProvider({
      clientId: GOOGLE_ID ?? "",
      clientSecret: GOOGLE_SECRET ?? ""
    })
  ],

  secret: NEXTAUTH_SECRET,

  callbacks: {
    async session({ session, user }: SessionProps) {
      session.user.id = user.id;
      return session;
    },
  },
}

export const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
