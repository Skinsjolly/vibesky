export interface User {
  id: string
  username: string
  displayName: string
  email?: string
  avatarUrl: string | null
  bio?: string | null
  bannerUrl?: string | null
  verified: boolean
  isFollowing?: boolean
  isOwn?: boolean
  createdAt?: string
  _count?: {
    posts: number
    followers: number
    following: number
  }
}

export interface Post {
  id: string
  content: string
  imageUrl: string | null
  createdAt: string
  replyToId: string | null
  author: Pick<User, 'id' | 'username' | 'displayName' | 'avatarUrl' | 'verified'>
  _count: {
    likes: number
    comments: number
    reposts: number
    replies: number
  }
  liked: boolean
  reposted: boolean
}

export interface Comment {
  id: string
  content: string
  createdAt: string
  user: Pick<User, 'id' | 'username' | 'displayName' | 'avatarUrl' | 'verified'>
}

export interface Notification {
  id: string
  type: 'LIKE' | 'REPOST' | 'FOLLOW' | 'COMMENT' | 'REPLY'
  read: boolean
  createdAt: string
  actor: Pick<User, 'id' | 'username' | 'displayName' | 'avatarUrl' | 'verified'>
  post?: { id: string; content: string } | null
}
