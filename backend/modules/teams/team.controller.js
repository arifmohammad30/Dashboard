import prisma from '../../prisma.js';
import crypto from 'crypto';

// Ensure table exists and seeds 2 initial real records if empty
async function ensureTableAndSeed() {
  try {
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "TeamMember" (
        "id" TEXT PRIMARY KEY,
        "name" TEXT NOT NULL,
        "email" TEXT UNIQUE NOT NULL,
        "userType" TEXT NOT NULL DEFAULT 'Team Member',
        "status" TEXT NOT NULL DEFAULT 'Active',
        "joinedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "lastActive" DATETIME,
        "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
    `);

    const countResult = await prisma.$queryRawUnsafe('SELECT COUNT(*) as cnt FROM "TeamMember"');
    const count = Number(countResult[0]?.cnt || 0);

    if (count === 0) {
      const id1 = crypto.randomUUID();
      const id2 = crypto.randomUUID();
      await prisma.$executeRawUnsafe(`
        INSERT INTO "TeamMember" ("id", "name", "email", "userType", "status", "joinedAt", "lastActive")
        VALUES 
          ('${id1}', 'John B. Goodenough', 'john.goodenough@openev.io', 'Admin', 'Active', '2025-01-15 09:30:00', '2026-08-30 07:15:00'),
          ('${id2}', 'Sarah Connor', 'sarah.connor@openev.io', 'Operations Team', 'Active', '2025-03-22 11:45:00', '2026-08-30 06:50:00');
      `);
    }
  } catch (err) {
    console.error('Error ensuring TeamMember table in DB:', err);
  }
}

// Initial bootstrap
ensureTableAndSeed();

export const getFilters = async (req, res) => {
  try {
    await ensureTableAndSeed();
    const userTypesRows = await prisma.$queryRawUnsafe('SELECT DISTINCT "userType" FROM "TeamMember" WHERE "userType" IS NOT NULL');
    const statusesRows = await prisma.$queryRawUnsafe('SELECT DISTINCT "status" FROM "TeamMember" WHERE "status" IS NOT NULL');

    const userTypes = Array.from(new Set(userTypesRows.map(r => r.userType).filter(Boolean))).sort();
    const statuses = Array.from(new Set(statusesRows.map(r => r.status).filter(Boolean))).sort();

    return res.status(200).json({
      success: true,
      data: {
        userTypes: ['all', ...userTypes],
        statuses: ['all', ...statuses]
      }
    });
  } catch (error) {
    console.error('Error fetching team filters:', error);
    return res.status(500).json({ success: false, message: 'Failed to fetch team filters' });
  }
};

export const getTeamMembers = async (req, res) => {
  try {
    await ensureTableAndSeed();
    const { search, userType, status, page = 1, limit = 10 } = req.query;

    const conditions = [];
    if (search && search.trim()) {
      const q = search.trim().replace(/'/g, "''");
      conditions.push(`("name" LIKE '%${q}%' OR "email" LIKE '%${q}%')`);
    }

    if (userType && userType !== 'all') {
      const u = userType.trim().replace(/'/g, "''");
      conditions.push(`"userType" = '${u}'`);
    }

    if (status && status !== 'all') {
      const s = status.trim().replace(/'/g, "''");
      conditions.push(`"status" = '${s}'`);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const countResult = await prisma.$queryRawUnsafe(`SELECT COUNT(*) as cnt FROM "TeamMember" ${whereClause}`);
    const total = Number(countResult[0]?.cnt || 0);

    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.max(1, parseInt(limit, 10) || 10);
    const offset = (pageNum - 1) * limitNum;

    const members = await prisma.$queryRawUnsafe(`
      SELECT * FROM "TeamMember"
      ${whereClause}
      ORDER BY "createdAt" DESC
      LIMIT ${limitNum} OFFSET ${offset}
    `);

    return res.status(200).json({
      success: true,
      data: members,
      pagination: {
        total,
        page: pageNum,
        limit: limitNum,
        totalPages: Math.max(1, Math.ceil(total / limitNum))
      }
    });
  } catch (error) {
    console.error('Error fetching team members:', error);
    return res.status(500).json({ success: false, message: 'Failed to fetch team members' });
  }
};

export const getTeamMemberById = async (req, res) => {
  try {
    await ensureTableAndSeed();
    const { id } = req.params;
    const cleanId = id.replace(/'/g, "''");
    const members = await prisma.$queryRawUnsafe(`SELECT * FROM "TeamMember" WHERE "id" = '${cleanId}' LIMIT 1`);
    
    if (!members || members.length === 0) {
      return res.status(404).json({ success: false, message: 'Team member not found' });
    }
    return res.status(200).json({ success: true, data: members[0] });
  } catch (error) {
    console.error('Error fetching team member by ID:', error);
    return res.status(500).json({ success: false, message: 'Failed to fetch team member' });
  }
};

export const createTeamMember = async (req, res) => {
  try {
    await ensureTableAndSeed();
    const { name, email, userType } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ success: false, message: "Team member's name is required" });
    }

    if (!email || !email.trim()) {
      return res.status(400).json({ success: false, message: 'Email address is required' });
    }

    if (!userType || !userType.trim()) {
      return res.status(400).json({ success: false, message: 'User type is required' });
    }

    const cleanEmail = email.trim().toLowerCase().replace(/'/g, "''");
    const cleanName = name.trim().replace(/'/g, "''");
    const cleanUserType = userType.trim().replace(/'/g, "''");

    // Check unique email in DB
    const existing = await prisma.$queryRawUnsafe(`SELECT "id" FROM "TeamMember" WHERE LOWER("email") = '${cleanEmail}' LIMIT 1`);
    if (existing && existing.length > 0) {
      return res.status(409).json({ success: false, message: 'A team member with this email address already exists' });
    }

    const newId = crypto.randomUUID();
    const now = new Date().toISOString();

    await prisma.$executeRawUnsafe(`
      INSERT INTO "TeamMember" ("id", "name", "email", "userType", "status", "joinedAt", "lastActive", "createdAt", "updatedAt")
      VALUES ('${newId}', '${cleanName}', '${cleanEmail}', '${cleanUserType}', 'Active', '${now}', '${now}', '${now}', '${now}')
    `);

    const created = await prisma.$queryRawUnsafe(`SELECT * FROM "TeamMember" WHERE "id" = '${newId}' LIMIT 1`);

    return res.status(201).json({
      success: true,
      message: 'Team member added successfully',
      data: created[0]
    });
  } catch (error) {
    console.error('Error creating team member in DB:', error);
    return res.status(500).json({ success: false, message: 'Failed to create team member' });
  }
};

export const updateTeamMember = async (req, res) => {
  try {
    await ensureTableAndSeed();
    const { id } = req.params;
    const { name, email, userType, status } = req.body;
    const cleanId = id.replace(/'/g, "''");

    const existing = await prisma.$queryRawUnsafe(`SELECT * FROM "TeamMember" WHERE "id" = '${cleanId}' LIMIT 1`);
    if (!existing || existing.length === 0) {
      return res.status(404).json({ success: false, message: 'Team member not found' });
    }

    const updates = [];
    if (name) updates.push(`"name" = '${name.trim().replace(/'/g, "''")}'`);
    if (userType) updates.push(`"userType" = '${userType.trim().replace(/'/g, "''")}'`);
    if (status) updates.push(`"status" = '${status.trim().replace(/'/g, "''")}'`);
    
    if (email) {
      const cleanEmail = email.trim().toLowerCase().replace(/'/g, "''");
      const duplicate = await prisma.$queryRawUnsafe(`SELECT "id" FROM "TeamMember" WHERE LOWER("email") = '${cleanEmail}' AND "id" != '${cleanId}' LIMIT 1`);
      if (duplicate && duplicate.length > 0) {
        return res.status(409).json({ success: false, message: 'A team member with this email address already exists' });
      }
      updates.push(`"email" = '${cleanEmail}'`);
    }

    updates.push(`"updatedAt" = '${new Date().toISOString()}'`);

    if (updates.length > 0) {
      await prisma.$executeRawUnsafe(`UPDATE "TeamMember" SET ${updates.join(', ')} WHERE "id" = '${cleanId}'`);
    }

    const updated = await prisma.$queryRawUnsafe(`SELECT * FROM "TeamMember" WHERE "id" = '${cleanId}' LIMIT 1`);

    return res.status(200).json({
      success: true,
      message: 'Team member updated successfully',
      data: updated[0]
    });
  } catch (error) {
    console.error('Error updating team member in DB:', error);
    return res.status(500).json({ success: false, message: 'Failed to update team member' });
  }
};

export const deleteTeamMember = async (req, res) => {
  try {
    await ensureTableAndSeed();
    const { id } = req.params;
    const cleanId = id.replace(/'/g, "''");

    const existing = await prisma.$queryRawUnsafe(`SELECT "id" FROM "TeamMember" WHERE "id" = '${cleanId}' LIMIT 1`);
    if (!existing || existing.length === 0) {
      return res.status(404).json({ success: false, message: 'Team member not found' });
    }

    await prisma.$executeRawUnsafe(`DELETE FROM "TeamMember" WHERE "id" = '${cleanId}'`);

    return res.status(200).json({
      success: true,
      message: 'Team member deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting team member from DB:', error);
    return res.status(500).json({ success: false, message: 'Failed to delete team member' });
  }
};
