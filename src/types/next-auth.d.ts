import "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      name: string;
      email?: string | null;
      role: string;
      memberId: string;
      username: string;
    };
  }

  interface User {
    role: string;
    memberId: string;
    username: string;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    role: string;
    memberId: string;
    username: string;
    userId: string;
  }
}
