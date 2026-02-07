const prisma = require('../database/client');

async function getUserRoles(userId) {
  if (!userId) {
    // Возвращаем гостевую роль
    return [await prisma.role.findUnique({ where: { order: 0 } })];
  }

  const userRoles = await prisma.userRole.findMany({
    where: { userId },
    include: { role: true },
    orderBy: { role: { order: 'desc' } },
  });

  return userRoles.map(ur => ur.role);
}

async function checkPermission(userId, requiredPermission) {
  const roles = await getUserRoles(userId);
  
  // Сортируем роли по order (от высшего к низшему)
  roles.sort((a, b) => b.order - a.order);

  let hasPermission = false;

  for (const role of roles) {
    const bans = role.bans || [];
    const permissions = role.permissions || [];

    // Проверяем баны
    if (bans.includes('*') || bans.includes(requiredPermission)) {
      return false;
    }

    // Проверяем разрешения
    if (permissions.includes('*') || permissions.includes(requiredPermission)) {
      hasPermission = true;
    }
  }

  return hasPermission;
}

module.exports = {
  getUserRoles,
  checkPermission,
};