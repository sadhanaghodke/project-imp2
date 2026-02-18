const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seed...');

  try {
    // Create admin user
    const adminPassword = await bcrypt.hash('admin123', 12);
    const admin = await prisma.user.upsert({
      where: { email: 'admin@mycleancity.com' },
      update: {},
      create: {
        email: 'admin@mycleancity.com',
        password: adminPassword,
        name: 'System Administrator',
        phone: '+1234567890',
        role: 'ADMIN',
        points: 0
      }
    });
    console.log('✅ Admin user created:', admin.email);

    // Create sample workers
    const workerPassword = await bcrypt.hash('worker123', 12);
    const workers = [];
    
    for (let i = 1; i <= 3; i++) {
      const worker = await prisma.user.upsert({
        where: { email: `worker${i}@mycleancity.com` },
        update: {},
        create: {
          email: `worker${i}@mycleancity.com`,
          password: workerPassword,
          name: `Cleanliness Worker ${i}`,
          phone: `+123456789${i}`,
          role: 'WORKER',
          points: 0
        }
      });
      workers.push(worker);
    }
    console.log(`✅ Created ${workers.length} worker accounts`);

    // Create sample citizens
    const citizenPassword = await bcrypt.hash('citizen123', 12);
    const citizens = [];
    
    const citizenNames = [
      'John Smith',
      'Sarah Johnson',
      'Mike Davis',
      'Emily Brown',
      'David Wilson'
    ];

    for (let i = 0; i < citizenNames.length; i++) {
      const citizen = await prisma.user.upsert({
        where: { email: `citizen${i + 1}@example.com` },
        update: {},
        create: {
          email: `citizen${i + 1}@example.com`,
          password: citizenPassword,
          name: citizenNames[i],
          phone: `+987654321${i}`,
          role: 'CITIZEN',
          points: Math.floor(Math.random() * 100) + 50
        }
      });
      citizens.push(citizen);
    }
    console.log(`✅ Created ${citizens.length} citizen accounts`);

    // Create sample complaints
    const complaintData = [
      {
        title: 'Overflowing trash bin at Central Park',
        description: 'The trash bin near the playground is overflowing with garbage. It needs immediate attention.',
        latitude: 40.7829,
        longitude: -73.9654,
        address: 'Central Park, New York, NY',
        status: 'PENDING'
      },
      {
        title: 'Litter scattered on Main Street',
        description: 'Food wrappers and plastic bottles scattered along the sidewalk.',
        latitude: 40.7580,
        longitude: -73.9855,
        address: 'Main Street, New York, NY',
        status: 'ASSIGNED'
      },
      {
        title: 'Illegal dumping behind shopping center',
        description: 'Large pile of construction debris dumped illegally.',
        latitude: 40.7505,
        longitude: -73.9934,
        address: 'Shopping Center, Brooklyn, NY',
        status: 'IN_PROGRESS'
      },
      {
        title: 'Cigarette butts near bus stop',
        description: 'Accumulation of cigarette butts around the bus stop area.',
        latitude: 40.7614,
        longitude: -73.9776,
        address: 'Bus Stop, Queens, NY',
        status: 'RESOLVED'
      },
      {
        title: 'Broken glass on sidewalk',
        description: 'Shattered glass from a broken bottle creating safety hazard.',
        latitude: 40.7282,
        longitude: -73.7949,
        address: 'Oak Avenue, Brooklyn, NY',
        status: 'REJECTED'
      }
    ];

    const complaints = [];
    for (let i = 0; i < complaintData.length; i++) {
      const data = complaintData[i];
      const citizen = citizens[i % citizens.length];
      
      // Generate mock image hash
      const imageHash = `mock_hash_${Date.now()}_${i}`;
      
      const complaint = await prisma.complaint.create({
        data: {
          ...data,
          imageUrl: `/uploads/complaints/sample_${i + 1}.jpg`,
          imageHash,
          citizenId: citizen.id,
          priority: Math.floor(Math.random() * 3) + 1
        }
      });
      complaints.push(complaint);
    }
    console.log(`✅ Created ${complaints.length} sample complaints`);

    // Create worker assignments for assigned/in-progress complaints
    const assignedComplaints = complaints.filter(c => 
      c.status === 'ASSIGNED' || c.status === 'IN_PROGRESS' || c.status === 'RESOLVED'
    );

    for (let i = 0; i < assignedComplaints.length; i++) {
      const complaint = assignedComplaints[i];
      const worker = workers[i % workers.length];
      
      const assignment = await prisma.workerAssignment.create({
        data: {
          complaintId: complaint.id,
          workerId: worker.id,
          assignedAt: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000),
          ...(complaint.status === 'IN_PROGRESS' && {
            startedAt: new Date(Date.now() - Math.random() * 3 * 24 * 60 * 60 * 1000)
          }),
          ...(complaint.status === 'RESOLVED' && {
            startedAt: new Date(Date.now() - Math.random() * 5 * 24 * 60 * 60 * 1000),
            completedAt: new Date(Date.now() - Math.random() * 2 * 24 * 60 * 60 * 1000)
          })
        }
      });

      // Create admin action for assignment
      await prisma.adminAction.create({
        data: {
          complaintId: complaint.id,
          adminId: admin.id,
          action: 'assigned',
          notes: `Assigned to ${worker.name}`
        }
      });
    }
    console.log(`✅ Created worker assignments for ${assignedComplaints.length} complaints`);

    // Create sample feedback for resolved complaints
    const resolvedComplaints = complaints.filter(c => c.status === 'RESOLVED');
    for (const complaint of resolvedComplaints) {
      await prisma.feedback.create({
        data: {
          complaintId: complaint.id,
          citizenId: complaint.citizenId,
          rating: Math.floor(Math.random() * 2) + 4, // 4-5 stars
          comment: 'Great work! The area is much cleaner now.'
        }
      });
    }
    console.log(`✅ Created feedback for ${resolvedComplaints.length} resolved complaints`);

    // Create reward history for citizens
    for (const citizen of citizens) {
      const citizenComplaints = complaints.filter(c => c.citizenId === citizen.id);
      
      for (const complaint of citizenComplaints) {
        // Submission reward
        await prisma.rewardHistory.create({
          data: {
            userId: citizen.id,
            complaintId: complaint.id,
            points: 10,
            reason: 'Complaint submission'
          }
        });

        // Resolution bonus for resolved complaints
        if (complaint.status === 'RESOLVED') {
          await prisma.rewardHistory.create({
            data: {
              userId: citizen.id,
              complaintId: complaint.id,
              points: 20,
              reason: 'Complaint resolved'
            }
          });
        }
      }
    }
    console.log('✅ Created reward history records');

    console.log('🎉 Database seeded successfully!');
    console.log('\n📋 Test Accounts:');
    console.log('Admin: admin@mycleancity.com / admin123');
    console.log('Worker: worker1@mycleancity.com / worker123');
    console.log('Citizen: citizen1@example.com / citizen123');

  } catch (error) {
    console.error('❌ Seed failed:', error);
    throw error;
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });