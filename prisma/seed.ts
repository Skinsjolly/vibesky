// prisma/seed.ts
import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  const passwordHash = await bcrypt.hash('password123', 12)

  const users = await Promise.all([
    prisma.user.upsert({
      where: { username: 'aurora_dev' },
      update: {},
      create: {
        email: 'aurora@vibesky.app',
        username: 'aurora_dev',
        displayName: 'Aurora Chen',
        bio: 'Building the future one commit at a time 🚀 | Open source enthusiast',
        avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=aurora',
        passwordHash,
        verified: true,
      },
    }),
    prisma.user.upsert({
      where: { username: 'nova_writes' },
      update: {},
      create: {
        email: 'nova@vibesky.app',
        username: 'nova_writes',
        displayName: 'Nova Patel',
        bio: 'Writer, dreamer, coffee addict ☕ | Words are my universe',
        avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=nova',
        passwordHash,
      },
    }),
    prisma.user.upsert({
      where: { username: 'cosmo_art' },
      update: {},
      create: {
        email: 'cosmo@vibesky.app',
        username: 'cosmo_art',
        displayName: 'Cosmo Rivera',
        bio: 'Digital artist & visual storyteller 🎨 | Creating vibes daily',
        avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=cosmo',
        passwordHash,
        verified: true,
      },
    }),
  ])

  const [aurora, nova, cosmo] = users

  // Create posts
  const posts = await Promise.all([
    prisma.post.create({
      data: {
        content: 'Just shipped a new feature for VibeSky! The infinite scroll is finally buttery smooth 🧈 Sometimes the simplest interactions make the biggest difference in UX.',
        authorId: aurora.id,
      },
    }),
    prisma.post.create({
      data: {
        content: 'There\'s something magical about the blue hour — that fleeting moment between day and night when everything glows indigo. Makes you want to write something meaningful.',
        authorId: nova.id,
      },
    }),
    prisma.post.create({
      data: {
        content: 'Working on a new series exploring the intersection of technology and nature. What if our devices could breathe? 🌿 Concepts dropping this week.',
        authorId: cosmo.id,
      },
    }),
    prisma.post.create({
      data: {
        content: 'Hot take: dark mode isn\'t just a preference, it\'s a lifestyle. Fight me. (but gently, I\'m sensitive)',
        authorId: aurora.id,
      },
    }),
    prisma.post.create({
      data: {
        content: 'Reading "The Midnight Library" for the third time. Each read reveals something new. Books are different when you\'re different.',
        authorId: nova.id,
      },
    }),
  ])

  // Create follows
  await Promise.all([
    prisma.follow.createMany({
      data: [
        { followerId: aurora.id, followingId: nova.id },
        { followerId: aurora.id, followingId: cosmo.id },
        { followerId: nova.id, followingId: aurora.id },
        { followerId: cosmo.id, followingId: aurora.id },
        { followerId: cosmo.id, followingId: nova.id },
      ],
      skipDuplicates: true,
    }),
  ])

  // Create likes
  await prisma.like.createMany({
    data: [
      { userId: nova.id, postId: posts[0].id },
      { userId: cosmo.id, postId: posts[0].id },
      { userId: aurora.id, postId: posts[1].id },
      { userId: cosmo.id, postId: posts[1].id },
      { userId: aurora.id, postId: posts[2].id },
      { userId: nova.id, postId: posts[3].id },
    ],
    skipDuplicates: true,
  })

  console.log('✅ Seed complete')
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
