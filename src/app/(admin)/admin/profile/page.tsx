import { notFound } from "next/navigation";
import { requireLogin } from "@/lib/auth/current-user";
import { prisma } from "@/lib/prisma";
import { ProfileSettings } from "@/components/profile/ProfileSettings";

export default async function ProfilePage() {
  const currentUser = await requireLogin();
  const user = await prisma.sysUser.findUnique({
    where: { id: currentUser.id },
    include: {
      dept: true,
      roles: {
        include: {
          role: true,
        },
      },
    },
  });

  if (!user) {
    notFound();
  }

  return (
    <ProfileSettings
      profile={{
        username: user.username,
        nickname: user.nickname,
        email: user.email,
        mobile: user.mobile,
        deptName: user.dept?.name ?? null,
        roleNames: user.roles.map((item) => item.role.name),
        remark: user.remark,
      }}
    />
  );
}
