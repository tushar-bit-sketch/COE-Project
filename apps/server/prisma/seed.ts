import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('⚡ Initializing SENTINEL-X Core Database Seeding...');

  // 1. Seed Operators
  const passwordHash = await bcrypt.hash('sentinel2025', 10);

  const adminUser = await prisma.user.upsert({
    where: { username: 'admin' },
    update: {},
    create: {
      username: 'admin',
      passwordHash,
      role: 'ADMIN',
      clearance: 'ALPHA-7',
    },
  });
  console.log(`✓ Seeded Operator: ${adminUser.username} [${adminUser.clearance}]`);

  const operatorUser = await prisma.user.upsert({
    where: { username: 'operator' },
    update: {},
    create: {
      username: 'operator',
      passwordHash,
      role: 'OPERATOR',
      clearance: 'LEVEL-4',
    },
  });
  console.log(`✓ Seeded Operator: ${operatorUser.username} [${operatorUser.clearance}]`);

  // 2. Seed Camera Sources
  const simSource = await prisma.cameraSource.upsert({
    where: { id: 'src-simulation-alpha' },
    update: {},
    create: {
      id: 'src-simulation-alpha',
      name: 'Simulation Alpha · Synthetic Multi-Target',
      type: 'SIMULATION',
      url: 'internal://simulation/alpha',
      status: 'ONLINE',
      enabled: true,
      resolution: '1280x720',
      fps: 30,
    },
  });
  console.log(`✓ Seeded Source: ${simSource.name}`);

  const webcamSource = await prisma.cameraSource.upsert({
    where: { id: 'src-webcam-local' },
    update: {},
    create: {
      id: 'src-webcam-local',
      name: 'Local Optical Feed · Browser MediaStream',
      type: 'WEBCAM',
      url: 'device://webcam/0',
      status: 'ONLINE',
      enabled: true,
      resolution: '1280x720',
      fps: 30,
    },
  });
  console.log(`✓ Seeded Source: ${webcamSource.name}`);

  const mjpegSource = await prisma.cameraSource.upsert({
    where: { id: 'src-mjpeg-perimeter' },
    update: {},
    create: {
      id: 'src-mjpeg-perimeter',
      name: 'Perimeter Sector B · MJPEG Stream',
      type: 'MJPEG',
      url: 'http://192.168.1.100:8080/video',
      status: 'OFFLINE',
      enabled: false,
      resolution: '1280x720',
      fps: 25,
    },
  });
  console.log(`✓ Seeded Source: ${mjpegSource.name}`);

  // 3. Seed Initial Tracking Session
  const session = await prisma.trackingSession.create({
    data: {
      sourceId: simSource.id,
      status: 'ACTIVE',
    },
  });

  // 4. Seed Audit System Events
  await prisma.systemEvent.createMany({
    data: [
      {
        type: 'SYSTEM',
        message: 'SENTINEL-X v5.0 Autonomous Surveillance Platform boot sequence completed',
        severity: 'OK',
        source: 'CORE_KERNEL',
      },
      {
        type: 'AUTH',
        message: 'Security subsystem online: Clearance enforcement armed [ALPHA-7]',
        severity: 'OK',
        source: 'AUTH_SERVICE',
      },
      {
        type: 'SYSTEM',
        message: 'Kalman-6D State Estimator and IoU tracking pipeline online',
        severity: 'INFO',
        source: 'TRACKING_ENGINE',
      },
    ],
  });
  console.log('✓ Seeded System Audit Log');

  console.log('🎯 SENTINEL-X Database Seeding Completed Successfully.');
}

main()
  .catch((e) => {
    console.error('Database seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
